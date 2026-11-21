param(
    [switch]$Stop,
    [switch]$SkipBuild,
    [switch]$IncludeAuth,
    [string[]]$Services = @()
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$ServiceProcesses = @{}
$AllBackendPorts = @(8761, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090, 8091)

function Stop-BackendProcesses {
    # Match absolute workspace JAR paths, including JVMs that have not bound a port.
    $backendPrefix = [System.IO.Path]::GetFullPath((Join-Path $Root 'backend')) + '\'
    $workspaceProcesses = @(Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction Stop)
    foreach ($candidate in $workspaceProcesses) {
        if ($candidate.CommandLine -match '(?i)(?:^|\s)-jar\s+(?:"([^"]+)"|(\S+))') {
            $jarArgument = if ($Matches[1]) { $Matches[1] } else { $Matches[2] }
            if ([System.IO.Path]::IsPathRooted($jarArgument)) {
                $jarPath = [System.IO.Path]::GetFullPath($jarArgument)
                if ($jarPath.StartsWith($backendPrefix, [System.StringComparison]::OrdinalIgnoreCase) -and $jarPath.EndsWith('.jar', [System.StringComparison]::OrdinalIgnoreCase)) {
                    Stop-Process -Id $candidate.ProcessId -Force -ErrorAction SilentlyContinue
                    Write-Host "Stopped backend JVM (PID $($candidate.ProcessId))"
                }
            }
        }
    }
    $conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $AllBackendPorts -contains $_.LocalPort }
    if ($conns) {
        $pidsToKill = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pidToKill in $pidsToKill) {
            $p = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
            if ($p -and $p.ProcessName -eq 'java') {
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                Write-Host "Stopped java process on port (PID $pidToKill)"
            }
        }
    }
}

if ($Stop) {
    Stop-BackendProcesses
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

$ports = @{
    'discovery-server'     = 8761
    'api-gateway'          = 8080
    'auth-service'         = 8081
    'room-service'         = 8082
    'tenant-service'       = 8083
    'contract-service'     = 8084
    'meter-service'        = 8085
    'billing-service'      = 8086
    'payment-service'      = 8087
    'maintenance-service'  = 8088
    'notification-service' = 8089
    'report-service'       = 8090
    'ai-service'           = 8091
}

$jvmOpts = @("-Dfile.encoding=UTF-8", "-Xms32m", "-Xmx128m", "-XX:MaxMetaspaceSize=128m", "-XX:+UseSerialGC", "-XX:ActiveProcessorCount=2")

function Start-ServiceJar([string]$Name, [string]$ModuleDir) {
    $targetDir = Join-Path $Root "$ModuleDir\target"
    $jar = Get-ChildItem $targetDir -Filter "*.jar" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notlike "*-plain.jar" -and $_.Name -notlike "original-*" } |
        Select-Object -First 1
    if (-not $jar) {
        throw "Khong tim thay JAR cho $Name trong $targetDir"
    }
    $svcPort = $ports[$Name]
    $argList = $jvmOpts + @('-jar', "`"$($jar.FullName)`"")
    $proc = Start-Process -FilePath 'java' -ArgumentList $argList -WorkingDirectory $Root -NoNewWindow -PassThru
    $script:ServiceProcesses[$Name] = $proc
    Write-Host ("  [+] Started {0,-22} (Port {1}, PID={2}, log truc tiep tai terminal)" -f $Name, $svcPort, $proc.Id)
}

try {
Write-Host "==> Khoi dong discovery-server (8761)..." -ForegroundColor Cyan
Start-ServiceJar "discovery-server" "backend\discovery-server"

$waited = 0
while (-not (Test-PortOpen "127.0.0.1" 8761) -and $waited -lt 45) {
    $ServiceProcesses['discovery-server'].Refresh()
    if ($ServiceProcesses['discovery-server'].HasExited) {
        throw "discovery-server da dung dot ngot (exit code $($ServiceProcesses['discovery-server'].ExitCode)). Hay kiem tra terminal cua service."
    }
    Start-Sleep -Seconds 1
    $waited++
}
if (-not (Test-PortOpen "127.0.0.1" 8761)) {
    throw "discovery-server khong khoi dong. Hay kiem tra terminal cua service."
}

Write-Host "==> Khoi dong api-gateway (8080)..." -ForegroundColor Cyan
Start-ServiceJar "api-gateway" "backend\api-gateway"

Write-Host "==> Khoi dong cac microservices (log truc tiep tai terminal nay)..." -ForegroundColor Cyan
foreach ($svc in $selectedServices) {
    Start-ServiceJar $svc "backend\services\$svc"
}

# Launching java does not mean that Spring Boot is ready to accept requests.
$pending = @('api-gateway') + @($selectedServices)
$deadline = (Get-Date).AddSeconds(300)
Write-Host "==> Cho Spring Boot khoi dong (co the mat 2-3 phut)..." -ForegroundColor Cyan
while ($pending.Count -gt 0 -and (Get-Date) -lt $deadline) {
    $pending = @($pending | Where-Object { -not (Test-PortOpen '127.0.0.1' $ports[$_]) })
    foreach ($svcName in $ServiceProcesses.Keys) {
        $ServiceProcesses[$svcName].Refresh()
        if ($ServiceProcesses[$svcName].HasExited) {
            throw "$svcName da dung dot ngot (exit code $($ServiceProcesses[$svcName].ExitCode)). Hay kiem tra terminal cua service."
        }
    }
    if ($pending.Count -gt 0) { Start-Sleep -Seconds 2 }
}
if ($pending.Count -gt 0) { throw "Cac service chua san sang: $($pending -join ', '). Hay kiem tra cua so PowerShell cua service do." }

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
if ($missing.Count -gt 0) { throw "Gateway chua nhan cac service: $($missing -join ', '). Hay kiem tra terminal cua api-gateway." }

Write-Host ""
Write-Host "Hoan tat! Eureka: http://localhost:8761 | Gateway: http://localhost:8080" -ForegroundColor Green
Write-Host "De dung toan bo BE: .\start-be.ps1 -Stop  (hoac npm run be:stop)" -ForegroundColor Yellow
Write-Host "Log hien truc tiep tai terminal nay. Nhan Ctrl+C de dung cac service." -ForegroundColor Yellow
while ($true) {
    foreach ($svcName in $ServiceProcesses.Keys) {
        $ServiceProcesses[$svcName].Refresh()
        if ($ServiceProcesses[$svcName].HasExited) {
            throw "$svcName da dung (exit code $($ServiceProcesses[$svcName].ExitCode)). Xem log tren terminal."
        }
    }
    Start-Sleep -Seconds 1
}
} finally {
    # Clean up only the JVMs launched by this invocation on Ctrl+C or startup failure.
    foreach ($serviceProcess in $ServiceProcesses.Values) {
        $serviceProcess.Refresh()
        if (-not $serviceProcess.HasExited) {
            Stop-Process -Id $serviceProcess.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

