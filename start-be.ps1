param(
    [switch]$Stop,
    [switch]$SkipBuild,
    [switch]$IncludeAuth,
    [string[]]$Services = @()
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$LogDir = Join-Path $Root ".logs"
$PidFile = Join-Path $LogDir "be-pids.txt"
$AllBackendPorts = @(8761, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090, 8091)

function Stop-PortProcesses {
    $conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $AllBackendPorts -contains $_.LocalPort }
    if ($conns) {
        $pidsToKill = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pidToKill in $pidsToKill) {
            $p = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
            if ($p -and $p.ProcessName -eq 'java') {
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                Write-Host "Stopped process on port (PID $pidToKill)"
            }
        }
    }
}

if ($Stop) {
    if (Test-Path $PidFile) {
        Get-Content $PidFile | ForEach-Object {
            if ($_ -match '^(\S+)\s+(\d+)$') {
                $name = $Matches[1]
                $procId = [int]$Matches[2]
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                    Write-Host "Stopped $name (PID $procId)"
                }
            }
        }
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }
    Stop-PortProcesses
    Write-Host "Da dung toan bo Backend." -ForegroundColor Green
    exit 0
}

function Find-Maven {
    $cmd = Get-Command mvn -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $wrapper = Get-ChildItem "$env:USERPROFILE\.m2\wrapper\dists" -Filter "mvn.cmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($wrapper) { return $wrapper }
    $fallback = "D:\Apache NetBeans\java\maven\bin\mvn.cmd"
    if (Test-Path $fallback) { return $fallback }
    throw "Khong tim thay mvn hoac mvn.cmd."
}

function Test-PortOpen([string]$TargetHost, [int]$Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect($TargetHost, $Port, $null, $null)
        if ($async.AsyncWaitHandle.WaitOne(500, $false) -and $client.Connected) {
            return $true
        }
        return $false
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

# Stop old processes if still running
& $PSCommandPath -Stop | Out-Null

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

# Check MySQL & RabbitMQ ports (warn only)
if (-not (Test-PortOpen "127.0.0.1" 3306)) {
    Write-Warning "Cong MySQL 3306 chua mo. Hay dam bao MySQL dang chay."
}
if (-not (Test-PortOpen "127.0.0.1" 5672)) {
    Write-Warning "Cong RabbitMQ 5672 chua mo. Neu can event RabbitMQ, hay chay: docker compose up -d rabbitmq"
}

$mvn = Find-Maven

if (-not $SkipBuild) {
    Write-Host "==> Dang dong goi backend (mvn package -DskipTests)..." -ForegroundColor Cyan
    Push-Location $Root
    & $mvn -f "backend/pom.xml" "-Dmaven.repo.local=$env:USERPROFILE/.m2/repository" package "-DskipTests" -q
    $exitCode = $LASTEXITCODE
    Pop-Location
    if ($exitCode -ne 0) {
        throw "Build backend that bai (exit code $exitCode)."
    }
}

$defaultServices = @(
    "auth-service",
    "room-service",
    "tenant-service",
    "contract-service",
    "meter-service",
    "billing-service",
    "payment-service",
    "maintenance-service",
    "notification-service",
    "report-service",
    "ai-service"
)
# IncludeAuth is retained for compatibility; a normal startup includes authentication.
$selectedServices = if ($Services.Count -gt 0) { $Services } else { $defaultServices }

$jvmOpts = @("-Xms32m", "-Xmx128m", "-XX:MaxMetaspaceSize=128m", "-XX:+UseSerialGC", "-XX:ActiveProcessorCount=2")

function Start-ServiceJar([string]$Name, [string]$ModuleDir) {
    $targetDir = Join-Path $Root "$ModuleDir\target"
    $jar = Get-ChildItem $targetDir -Filter "*.jar" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notlike "*-plain.jar" -and $_.Name -notlike "original-*" } |
        Select-Object -First 1
    if (-not $jar) {
        throw "Khong tim thay JAR cho $Name trong $targetDir"
    }
    $outLog = Join-Path $LogDir "$Name.out.log"
    $errLog = Join-Path $LogDir "$Name.err.log"
    $argList = $jvmOpts + @("-jar", $jar.FullName)
    $proc = Start-Process -FilePath "java" -ArgumentList $argList -WorkingDirectory $Root `
        -RedirectStandardOutput $outLog -RedirectStandardError $errLog -WindowStyle Hidden -PassThru
    Add-Content -Path $PidFile -Value "$Name $($proc.Id)"
    Write-Host ("  [+] Started {0,-22} PID={1} (log: .logs/{0}.out.log)" -f $Name, $proc.Id)
}

Write-Host "==> Khoi dong discovery-server (8761)..." -ForegroundColor Cyan
Start-ServiceJar "discovery-server" "backend\discovery-server"

$waited = 0
while (-not (Test-PortOpen "127.0.0.1" 8761) -and $waited -lt 30) {
    Start-Sleep -Seconds 1
    $waited++
}
if (-not (Test-PortOpen "127.0.0.1" 8761)) {
    throw "discovery-server khong khoi dong. Xem .logs/discovery-server.out.log va .err.log."
}

Write-Host "==> Khoi dong api-gateway (8080)..." -ForegroundColor Cyan
Start-ServiceJar "api-gateway" "backend\api-gateway"

Write-Host "==> Khoi dong cac microservices..." -ForegroundColor Cyan
foreach ($svc in $selectedServices) {
    Start-ServiceJar $svc "backend\services\$svc"
}

# Launching java does not mean that Spring Boot is ready to accept requests.
$ports = @{ 'api-gateway'=8080; 'auth-service'=8081; 'room-service'=8082; 'tenant-service'=8083; 'contract-service'=8084; 'meter-service'=8085; 'billing-service'=8086; 'payment-service'=8087; 'maintenance-service'=8088; 'notification-service'=8089; 'report-service'=8090; 'ai-service'=8091 }
$pending = @('api-gateway') + @($selectedServices)
$deadline = (Get-Date).AddSeconds(300)
Write-Host "==> Cho Spring Boot khoi dong (co the mat 2-3 phut)..." -ForegroundColor Cyan
while ($pending.Count -gt 0 -and (Get-Date) -lt $deadline) {
    $pending = @($pending | Where-Object { -not (Test-PortOpen '127.0.0.1' $ports[$_]) })
    foreach ($entry in Get-Content $PidFile) {
        if ($entry -match '^(\S+)\s+(\d+)$' -and -not (Get-Process -Id ([int]$Matches[2]) -ErrorAction SilentlyContinue)) {
            throw "$($Matches[1]) da dung dot ngot. Xem .logs/$($Matches[1]).out.log va .err.log."
        }
    }
    if ($pending.Count -gt 0) { Start-Sleep -Seconds 2 }
}
if ($pending.Count -gt 0) { throw "Cac service chua san sang: $($pending -join ', '). Xem .logs/." }

# Gateway refreshes its Eureka registry after services open their ports.
Write-Host "==> Cho Gateway nhan du danh sach service tu Eureka..." -ForegroundColor Cyan
$deadline = (Get-Date).AddSeconds(90)
$missing = @($selectedServices)
while ($missing.Count -gt 0 -and (Get-Date) -lt $deadline) {
    try {
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/actuator/health' -TimeoutSec 5
        $registered = @($health.components.discoveryComposite.components.discoveryClient.details.services)
        $missing = @($selectedServices | Where-Object { $_ -notin $registered })
    } catch { }
    if ($missing.Count -gt 0) { Start-Sleep -Seconds 2 }
}
if ($missing.Count -gt 0) { throw "Gateway chua nhan cac service: $($missing -join ', '). Xem .logs/api-gateway.out.log." }

Write-Host ""
Write-Host "Hoan tat! Eureka: http://localhost:8761 | Gateway: http://localhost:8080" -ForegroundColor Green
Write-Host "De dung toan bo BE: .\start-be.ps1 -Stop  (hoac npm run be:stop)" -ForegroundColor Yellow

