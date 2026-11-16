#!/usr/bin/env bash
set -euo pipefail

STOP=false
SKIP_BUILD=false
INCLUDE_AUTH=false
SELECTED_SERVICES=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        -Stop|--stop)
            STOP=true
            shift
            ;;
        -SkipBuild|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -IncludeAuth|--include-auth)
            INCLUDE_AUTH=true
            shift
            ;;
        -Services|--services)
            shift
            while [[ $# -gt 0 && ! "$1" =~ ^- ]]; do
                IFS=',' read -ra ADDR <<< "$1"
                for svc in "${ADDR[@]}"; do
                    [[ -n "$svc" ]] && SELECTED_SERVICES+=("$svc")
                done
                shift
            done
            ;;
        *)
            shift
            ;;
    esac
done

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT/.logs"
PID_FILE="$LOG_DIR/be-pids.txt"
ALL_BACKEND_PORTS=(8761 8080 8081 8082 8083 8084 8085 8086 8087 8088 8089 8090 8091)

# Uu tien dung JDK 21 neu da cai tren may
if [[ -d "/usr/lib/jvm/java-21-openjdk" ]]; then
    export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
    export PATH="$JAVA_HOME/bin:$PATH"
fi

stop_port_processes() {
    for port in "${ALL_BACKEND_PORTS[@]}"; do
        if command -v lsof >/dev/null 2>&1; then
            local pids
            pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
            for pid in $pids; do
                local comm
                comm=$(ps -p "$pid" -o comm= 2>/dev/null || true)
                if [[ "$comm" == "java" ]]; then
                    kill -9 "$pid" 2>/dev/null || true
                    echo "Stopped process on port $port (PID $pid)"
                fi
            done
        fi
    done
}

stop_all() {
    if [[ -f "$PID_FILE" ]]; then
        while read -r name pid; do
            if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
                echo "Stopped $name (PID $pid)"
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    stop_port_processes
}

if [[ "$STOP" == true ]]; then
    stop_all
    echo -e "\033[32mDa dung toan bo Backend.\033[0m"
    exit 0
fi

test_port_open() {
    local host="$1"
    local port="$2"
    (echo >/dev/tcp/"$host"/"$port") >/dev/null 2>&1
}

find_maven() {
    if command -v mvn >/dev/null 2>&1; then
        command -v mvn
        return 0
    fi
    if [[ -d "$HOME/.m2/wrapper/dists" ]]; then
        local wrapper
        wrapper=$(find "$HOME/.m2/wrapper/dists" -name "mvn" -type f 2>/dev/null | head -n 1 || true)
        if [[ -n "$wrapper" ]]; then
            chmod +x "$wrapper" 2>/dev/null || true
            echo "$wrapper"
            return 0
        fi
    fi
    return 1
}

# Stop old processes if still running
stop_all >/dev/null 2>&1 || true

mkdir -p "$LOG_DIR"
: > "$PID_FILE"

# Check MySQL & RabbitMQ ports (warn only)
if ! test_port_open "127.0.0.1" 3306; then
    echo -e "\033[33m[WARN] Cong MySQL 3306 chua mo. Hay dam bao MySQL dang chay (sudo systemctl start mysqld).\033[0m"
fi
if ! test_port_open "127.0.0.1" 5672; then
    echo -e "\033[33m[WARN] Cong RabbitMQ 5672 chua mo. Neu can event RabbitMQ, hay chay: docker compose up -d rabbitmq\033[0m"
fi

if [[ "$SKIP_BUILD" == false ]]; then
    echo -e "\033[36m==> Dang dong goi backend (mvn package -DskipTests)...\033[0m"
    BUILD_OK=false
    if MVN_BIN=$(find_maven); then
        if (cd "$ROOT" && "$MVN_BIN" -f "backend/pom.xml" -Dmaven.repo.local="$HOME/.m2/repository" package -DskipTests -q); then
            BUILD_OK=true
        else
            echo -e "\033[33m[WARN] Build bang mvn tren may that bai (co the do phien ban JDK != 21), thu build qua Docker...\033[0m"
        fi
    fi
    if [[ "$BUILD_OK" == false ]] && command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        echo -e "\033[36m[INFO] Su dung Docker (maven:3.9.8-eclipse-temurin-21-alpine) de build backend...\033[0m"
        mkdir -p "$HOME/.m2/repository"
        if docker run --rm \
            -u "$(id -u):$(id -g)" \
            -v "$ROOT":/workspace:z \
            -v "$HOME/.m2":/var/maven/.m2:z \
            -e MAVEN_CONFIG=/var/maven/.m2 \
            -w /workspace \
            maven:3.9.8-eclipse-temurin-21-alpine \
            mvn -f backend/pom.xml -Duser.home=/var/maven package -DskipTests -q; then
            BUILD_OK=true
        fi
    fi
    if [[ "$BUILD_OK" == false ]]; then
        echo -e "\033[33m[WARN] Khong the build moi (chua cai mvn JDK 21 hoac Docker chua chay). Su dung cac file JAR da co san trong target/...\033[0m"
    fi
fi

DEFAULT_SERVICES=(
    "auth-service"
    "room-service"
    "tenant-service"
    "contract-service"
    "meter-service"
    "billing-service"
    "payment-service"
    "maintenance-service"
    "notification-service"
    "report-service"
    "ai-service"
)

if [[ ${#SELECTED_SERVICES[@]} -eq 0 ]]; then
    SELECTED_SERVICES=("${DEFAULT_SERVICES[@]}")
fi

JVM_OPTS=("-Xms32m" "-Xmx128m" "-XX:MaxMetaspaceSize=128m" "-XX:+UseSerialGC" "-XX:ActiveProcessorCount=2")

start_service_jar() {
    local name="$1"
    local module_dir="$2"
    local target_dir="$ROOT/$module_dir/target"
    local jar=""
    if [[ -d "$target_dir" ]]; then
        jar=$(find "$target_dir" -maxdepth 1 -name "*.jar" ! -name "*-plain.jar" ! -name "original-*" | head -n 1 || true)
    fi
    if [[ -z "$jar" ]]; then
        echo -e "\033[31mKhong tim thay JAR cho $name trong $target_dir\033[0m" >&2
        exit 1
    fi
    local out_log="$LOG_DIR/$name.out.log"
    local err_log="$LOG_DIR/$name.err.log"
    (
        cd "$ROOT"
        nohup java "${JVM_OPTS[@]}" -jar "$jar" </dev/null >"$out_log" 2>"$err_log" &
        local pid=$!
        echo "$name $pid" >> "$PID_FILE"
        printf "  [+] Started %-22s PID=%s (log: .logs/%s.out.log)\n" "$name" "$pid" "$name"
    )
}

echo -e "\033[36m==> Khoi dong discovery-server (8761)...\033[0m"
start_service_jar "discovery-server" "backend/discovery-server"

waited=0
while ! test_port_open "127.0.0.1" 8761 && [[ $waited -lt 30 ]]; do
    sleep 1
    waited=$((waited + 1))
done
if ! test_port_open "127.0.0.1" 8761; then
    echo -e "\033[31mdiscovery-server khong khoi dong. Xem .logs/discovery-server.out.log va .err.log.\033[0m" >&2
    exit 1
fi

echo -e "\033[36m==> Khoi dong api-gateway (8080)...\033[0m"
start_service_jar "api-gateway" "backend/api-gateway"

echo -e "\033[36m==> Khoi dong cac microservices...\033[0m"
for svc in "${SELECTED_SERVICES[@]}"; do
    start_service_jar "$svc" "backend/services/$svc"
done

declare -A PORTS=(
    ["api-gateway"]=8080
    ["auth-service"]=8081
    ["room-service"]=8082
    ["tenant-service"]=8083
    ["contract-service"]=8084
    ["meter-service"]=8085
    ["billing-service"]=8086
    ["payment-service"]=8087
    ["maintenance-service"]=8088
    ["notification-service"]=8089
    ["report-service"]=8090
    ["ai-service"]=8091
)

PENDING=("api-gateway" "${SELECTED_SERVICES[@]}")
DEADLINE=$(( $(date +%s) + 300 ))

echo -e "\033[36m==> Cho Spring Boot khoi dong (co the mat 2-3 phut)...\033[0m"
while [[ ${#PENDING[@]} -gt 0 && $(date +%s) -lt $DEADLINE ]]; do
    NEW_PENDING=()
    for svc in "${PENDING[@]}"; do
        port="${PORTS[$svc]}"
        if ! test_port_open "127.0.0.1" "$port"; then
            NEW_PENDING+=("$svc")
        fi
    done
    PENDING=("${NEW_PENDING[@]}")

    while read -r name pid; do
        if [[ -n "${pid:-}" ]] && ! kill -0 "$pid" 2>/dev/null; then
            echo -e "\033[31m$name da dung dot ngot. Xem .logs/$name.out.log va .err.log.\033[0m" >&2
            exit 1
        fi
    done < "$PID_FILE"

    if [[ ${#PENDING[@]} -gt 0 ]]; then
        sleep 2
    fi
done

if [[ ${#PENDING[@]} -gt 0 ]]; then
    echo -e "\033[31mCac service chua san sang: ${PENDING[*]}. Xem .logs/.\033[0m" >&2
    exit 1
fi

echo -e "\033[36m==> Cho Gateway nhan du danh sach service tu Eureka...\033[0m"
DEADLINE=$(( $(date +%s) + 90 ))
MISSING=("${SELECTED_SERVICES[@]}")

while [[ ${#MISSING[@]} -gt 0 && $(date +%s) -lt $DEADLINE ]]; do
    health_json=$(curl -s --max-time 5 "http://127.0.0.1:8080/actuator/health" || true)
    if [[ -n "$health_json" ]]; then
        NEW_MISSING=()
        for svc in "${MISSING[@]}"; do
            if ! grep -qi "\"$svc\"" <<< "$health_json"; then
                NEW_MISSING+=("$svc")
            fi
        done
        MISSING=("${NEW_MISSING[@]}")
    fi
    if [[ ${#MISSING[@]} -gt 0 ]]; then
        sleep 2
    fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
    echo -e "\033[31mGateway chua nhan cac service: ${MISSING[*]}. Xem .logs/api-gateway.out.log.\033[0m" >&2
    exit 1
fi

echo ""
echo -e "\033[32mHoan tat! Eureka: http://localhost:8761 | Gateway: http://localhost:8080\033[0m"
echo -e "\033[33mDe dung toan bo BE: ./start-be.sh -Stop  (hoac npm run be:stop)\033[0m"
