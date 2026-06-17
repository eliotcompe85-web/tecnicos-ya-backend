<#
.SYNOPSIS
    Inicia un túnel ngrok hacia el backend de Técnicos Ya
.DESCRIPTION
    Abre un túnel público hacia http://localhost:8000 y muestra la URL.
    Presiona Ctrl+C para detener el túnel.
.PARAMETER Port
    Puerto local al que apuntar (default: 8000)
.PARAMETER Domain
    Dominio personalizado (requiere plan ngrok Pro)
#>

param(
    [int]$Port = 8000,
    [string]$Domain = ""
)

$ngrok = Join-Path $env:USERPROFILE "ngrok\ngrok.exe"
if (-not (Test-Path $ngrok)) {
    Write-Host "[ERROR] ngrok no encontrado en $ngrok" -ForegroundColor Red
    Write-Host "Descárgalo desde https://ngrok.com/download y extrae el .exe en $env:USERPROFILE\ngrok\" -ForegroundColor Yellow
    exit 1
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Técnicos Ya — Túnel ngrok" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Local:  http://localhost:$Port" -ForegroundColor Gray
Write-Host "  Token:  Configurado" -ForegroundColor Green
if ($Domain) {
    Write-Host "  Domain: $Domain" -ForegroundColor Yellow
}
Write-Host "  Presiona Ctrl+C para cerrar el túnel" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$argsList = @("http", "http://localhost:$Port", "--log=stdout")
if ($Domain) {
    $argsList += "--domain=$Domain"
}

try {
    & $ngrok $argsList
}
finally {
    Write-Host "`n[INFO] Túnel ngrok cerrado." -ForegroundColor Cyan
}
