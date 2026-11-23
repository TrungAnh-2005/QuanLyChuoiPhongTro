param(
    [switch]$Stop,
    [switch]$SkipBuild,
    [switch]$IncludeAuth,
    [switch]$SameWindow,
    [string[]]$Services = @()
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$LogDir = Join-Path $Root ".logs"
$PidFile = Join-Path $LogDir "be-pids.txt"
$ServiceProcesses = @{}
$AllBackendPorts = @(8761, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090, 8091)

function Stop-BackendProcesses {
    # Match absolute workspace JAR paths, including JVMs that have not bound a port.
    $backendPrefix = [System.IO.Path]::GetFullPath((Join-Path $Root 'backend')) + '\'
    $workspaceProcesses = @(Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction SilentlyContinue)
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
    # Close per-service PowerShell terminal windows opened by start-be.ps1
    if (Test-Path $PidFile) {
        Get-Content $PidFile | ForEach-Object {
            if ($_ -match '^(\S+)\s+(\d+)$') {
                $name = $Matches[1]
                $procId = [int]$Matches[2]
                $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $procId" -ErrorAction SilentlyContinue
                foreach ($child in $children) {
                    Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue
                }
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                    Write-Host "Closed $name terminal (PID $procId)"
                }
            }
        }
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $LogDir) {
        Get-ChildItem -Path $LogDir -Filter "*.exit" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    }
}

if ($Stop) {
    Stop-BackendProcesses
    Write-Host "Da dung toan bo Backend va dong cac cua so terminal service." -ForegroundColor Green
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

# Start infrastructure before interrupting any existing backend processes.
& node (Join-Path $Root 'scripts/start-infra.mjs')
if ($LASTEXITCODE -ne 0) { throw 'MySQL/RabbitMQ chua san sang. Backend chua duoc khoi dong lai.' }

# Stop old processes & close old terminal windows if still running
& $PSCommandPath -Stop | Out-Null

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

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
    $exitFile = Join-Path $LogDir "$Name.exit"
    Remove-Item $exitFile -Force -ErrorAction SilentlyContinue

    if ($SameWindow) {
        $argList = $jvmOpts + @('-jar', "`"$($jar.FullName)`"")
        $proc = Start-Process -FilePath 'java' -ArgumentList $argList -WorkingDirectory $Root -NoNewWindow -PassThru
        $script:ServiceProcesses[$Name] = $proc
        Write-Host ("  [+] Started {0,-22} (Port {1}, PID={2}, cung terminal)" -f $Name, $svcPort, $proc.Id)
        return
    }

    $runnerScript = Join-Path $LogDir "run-$Name.ps1"
    $jvmArgsLine = ($jvmOpts | ForEach-Object { "`"$_`"" }) -join " "
    $scriptContent = @"
`$Host.UI.RawUI.WindowTitle = "[$Name] - Port $svcPort"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location -LiteralPath "$Root"
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  SERVICE : $Name" -ForegroundColor Green
Write-Host "  PORT    : $svcPort" -ForegroundColor Yellow
Write-Host "  JAR     : $($jar.FullName)" -ForegroundColor DarkGray
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""
& java $jvmArgsLine -jar "$($jar.FullName)"
`$code = `$LASTEXITCODE
Set-Content -Path "$exitFile" -Value "`$code"
Write-Host ""
Write-Host "[!] Service $Name da dung (Exit Code: `$code). Cua so duoc giu lai de doc log." -ForegroundColor Red
"@
    Set-Content -Path $runnerScript -Value $scriptContent -Encoding UTF8

    $psArgs = @("-NoLogo", "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$runnerScript`"")
    $proc = Start-Process -FilePath "powershell.exe" -ArgumentList $psArgs -WorkingDirectory $Root -WindowStyle Normal -PassThru
    $script:ServiceProcesses[$Name] = $proc
    Add-Content -Path $PidFile -Value "$Name $($proc.Id)"
    Write-Host ("  [+] Opened terminal for {0,-22} (Port {1}, PID={2})" -f $Name, $svcPort, $proc.Id)
}

function Assert-ServiceAlive([string]$Name) {
    $proc = $script:ServiceProcesses[$Name]
    if (-not $proc) { return }
    $proc.Refresh()
    $exitMarker = Join-Path $LogDir "$Name.exit"
    if (Test-Path $exitMarker) {
        $code = Get-Content $exitMarker -Raw
        throw "$Name da dung dot ngot (exit code $($code.Trim())). Hay xem log truc tiep tren cua so PowerShell [$Name]."
    }
    if ($proc.HasExited) {
        throw "$Name da dung dot ngot (exit code $($proc.ExitCode)). Hay kiem tra terminal cua service."
    }
}

Write-Host "==> Khoi dong discovery-server (8761)..." -ForegroundColor Cyan
Start-ServiceJar "discovery-server" "backend\discovery-server"

$waited = 0
while (-not (Test-PortOpen "127.0.0.1" 8761) -and $waited -lt 45) {
    Assert-ServiceAlive 'discovery-server'
    Start-Sleep -Seconds 1
    $waited++
}
if (-not (Test-PortOpen "127.0.0.1" 8761)) {
    throw "discovery-server khong khoi dong. Hay kiem tra cua so terminal [discovery-server]."
}

Write-Host "==> Khoi dong api-gateway (8080)..." -ForegroundColor Cyan
Start-ServiceJar "api-gateway" "backend\api-gateway"

Write-Host "==> Khoi dong cac microservices (moi service 1 cua so terminal rieng)..." -ForegroundColor Cyan
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
        Assert-ServiceAlive $svcName
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
if ($missing.Count -gt 0) { throw "Gateway chua nhan cac service: $($missing -join ', '). Hay kiem tra cua so terminal [api-gateway]." }

Write-Host ""
Write-Host "Hoan tat! Eureka: http://localhost:8761 | Gateway: http://localhost:8080" -ForegroundColor Green
if ($SameWindow) {
    Write-Host "Log hien truc tiep tai terminal nay. Nhan Ctrl+C de dung cac service." -ForegroundColor Yellow
    try {
        while ($true) {
            foreach ($svcName in $ServiceProcesses.Keys) {
                Assert-ServiceAlive $svcName
            }
            Start-Sleep -Seconds 1
        }
    } finally {
        foreach ($serviceProcess in $ServiceProcesses.Values) {
            $serviceProcess.Refresh()
            if (-not $serviceProcess.HasExited) {
                Stop-Process -Id $serviceProcess.Id -Force -ErrorAction SilentlyContinue
            }
        }
    }
} else {
    Write-Host "Moi service dang chay trong 1 cua so PowerShell rieng biet." -ForegroundColor Cyan
    Write-Host "De dung toan bo BE va dong cac cua so: npm run be:stop  (hoac .\start-be.ps1 -Stop)" -ForegroundColor Yellow
}
