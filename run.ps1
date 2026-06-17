<#
.SYNOPSIS
    Arranca backend + frontend con manejo de Ctrl+C (Windows PowerShell)
.DESCRIPTION
    Usa trabajos (Start-Job) para lanzar ambos servicios y los detiene
    limpiamente al presionar Ctrl+C (try/finally). No abre ventanas adicionales.
#>

param(
    [string]$BackendDir   = "tecnicos-ya-backend\backend",
    [string]$FrontendDir  = "tecnicos-ya-app",
    [string]$VenvDir      = "tecnicos-ya-backend\.venv",
    [int]$BackendPort     = 8000,
    [int]$FrontendPort    = 5173,
    [string]$BackendHost  = "127.0.0.1",
    [switch]$Ngrok        = $false,
    [string]$NgrokDomain  = ""
)

# ─── Colores ───────────────────────────────────────────────────────────────
$Host.UI.RawUI.ForegroundColor = "Cyan"
Write-Host "═══════════════════════════════════════════════════════════════"
Write-Host "  Técnicos Ya — Inicio rápido (PowerShell)"
Write-Host "═══════════════════════════════════════════════════════════════"
$Host.UI.RawUI.ForegroundColor = "Gray"
Write-Host "  Backend:  $BackendDir  ->  http://${BackendHost}:${BackendPort}"
Write-Host "  Frontend: $FrontendDir ->  http://localhost:${FrontendPort}"
Write-Host "  Presiona Ctrl+C para detener ambos servicios"
Write-Host "═══════════════════════════════════════════════════════════════`n"

# ─── 1. Validar directorios ───────────────────────────────────────────────
if (-not (Test-Path $BackendDir)) {
    Write-Host "[ERROR] Backend no encontrado: $BackendDir" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $FrontendDir)) {
    Write-Host "[ERROR] Frontend no encontrado: $FrontendDir" -ForegroundColor Red
    exit 1
}

# ─── 2. Validar puertos libres ────────────────────────────────────────────
function Test-PortFree($port) {
    $inUse = (netstat -ano | Select-String ":$port\s").Count -gt 0
    return -not $inUse
}

if (-not (Test-PortFree $BackendPort)) {
    Write-Host "[ERROR] Puerto $BackendPort (backend) ocupado" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Puerto $BackendPort (backend) libre" -ForegroundColor Green

if (-not (Test-PortFree $FrontendPort)) {
    Write-Host "[ERROR] Puerto $FrontendPort (frontend) ocupado" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Puerto $FrontendPort (frontend) libre" -ForegroundColor Green

# ─── 3. Determinar path de Python ────────────────────────────────────────
$pythonExe = Join-Path $VenvDir "Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Host "[WARN] Venv no encontrado en $VenvDir, usando python del sistema" -ForegroundColor Yellow
    $pythonExe = "python"
} else {
    Write-Host "[INFO] Usando venv: $pythonExe" -ForegroundColor Cyan
}

# ─── 4. Iniciar servicios como trabajos (Start-Job) ──────────────────────
# Usamos Start-Job para que los procesos vivan en background y podamos
# matarlos desde el script padre al recibir Ctrl+C.

Write-Host "`n[INFO] Iniciando backend..." -ForegroundColor Cyan
$backendJob = Start-Job -Name "Backend" -ScriptBlock {
    param($dir, $python, $hostAddr, $port)
    Set-Location $dir
    & $python -m uvicorn server:app --host $hostAddr --port $port
} -ArgumentList $BackendDir, $pythonExe, $BackendHost, $BackendPort

Start-Sleep -Seconds 3

if ($backendJob.State -eq 'Running') {
    Write-Host "[OK] Backend corriendo -> http://${BackendHost}:${BackendPort}" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Backend falló al iniciar" -ForegroundColor Red
    Receive-Job $backendJob
    Remove-Job $backendJob -Force
    exit 1
}

Write-Host "[INFO] Iniciando frontend..." -ForegroundColor Cyan
$frontendJob = Start-Job -Name "Frontend" -ScriptBlock {
    param($dir, $port)
    Set-Location $dir
    & "npx" "vite" "--port" $port
} -ArgumentList $FrontendDir, $FrontendPort

Start-Sleep -Seconds 3

if ($frontendJob.State -eq 'Running') {
    Write-Host "[OK] Frontend corriendo -> http://localhost:${FrontendPort}" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Frontend falló al iniciar" -ForegroundColor Red
    Receive-Job $frontendJob
    Stop-Job $backendJob
    Remove-Job $backendJob, $frontendJob -Force
    exit 1
}

# ─── 5. Iniciar túnel ngrok (opcional) ────────────────────────────────────
$ngrokProcess = $null
if ($Ngrok) {
    $ngrokExe = Join-Path $env:USERPROFILE "ngrok\ngrok.exe"
    if (Test-Path $ngrokExe) {
        Write-Host "[INFO] Iniciando túnel ngrok..." -ForegroundColor Cyan
        $ngrokArgs = @("http", "http://${BackendHost}:${BackendPort}", "--log=stdout")
        if ($NgrokDomain) {
            $ngrokArgs += "--domain=$NgrokDomain"
        }
        $ngrokProcess = Start-Process -FilePath $ngrokExe -ArgumentList $ngrokArgs -NoNewWindow -PassThru
        Start-Sleep -Seconds 3
        Write-Host "[OK] Túnel ngrok iniciado (revisa http://127.0.0.1:4040 para la URL)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] ngrok no encontrado en $ngrokExe. Omite con -Ngrok:`$false" -ForegroundColor Yellow
    }
}

# ─── 6. Loop de espera con captura de Ctrl+C ─────────────────────────────
$host.UI.RawUI.ForegroundColor = "Cyan"
Write-Host "`n═══════════════════════════════════════════════════════════════"
Write-Host "  Todos los servicios corriendo. Presiona Ctrl+C para detener."
Write-Host "═══════════════════════════════════════════════════════════════`n"
$host.UI.RawUI.ForegroundColor = "Gray"

try {
    while ($true) {
        Start-Sleep -Seconds 1
        if ($backendJob.State -ne 'Running' -or $frontendJob.State -ne 'Running') {
            Write-Host "`n[WARN] Un servicio se detuvo inesperadamente" -ForegroundColor Yellow
            break
        }
    }
}
finally {
    # ─── 7. Limpieza (se ejecuta incluso con Ctrl+C) ─────────────────────
    Write-Host "`n[INFO] Deteniendo servicios..." -ForegroundColor Cyan

    if ($backendJob -and $backendJob.State -eq 'Running') {
        Stop-Job $backendJob -Force
        Remove-Job $backendJob -Force
        Write-Host "[OK] Backend detenido" -ForegroundColor Green
    }
    if ($frontendJob -and $frontendJob.State -eq 'Running') {
        Stop-Job $frontendJob -Force
        Remove-Job $frontendJob -Force
        Write-Host "[OK] Frontend detenido" -ForegroundColor Green
    }

    # Kill de respaldo por si quedan procesos huérfanos en los puertos
    netstat -ano | Select-String ":$BackendPort\s" | ForEach-Object {
        $pid = $_ -replace '.*\s+(\d+)$', '$1'
        if ($pid -and $pid -ne '0') { taskkill /f /pid $pid 2>$null }
    }
    netstat -ano | Select-String ":$FrontendPort\s" | ForEach-Object {
        $pid = $_ -replace '.*\s+(\d+)$', '$1'
        if ($pid -and $pid -ne '0') { taskkill /f /pid $pid 2>$null }
    }

    if ($ngrokProcess -and (Get-Process -Id $ngrokProcess.Id -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Túnel ngrok detenido" -ForegroundColor Green
    }

    Write-Host "[OK] Todos los servicios detenidos. ¡Hasta luego!" -ForegroundColor Cyan
}
