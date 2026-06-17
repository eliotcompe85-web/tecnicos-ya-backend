#!/usr/bin/env pwsh

# Monitor EAS Build status
$projectDir = "C:\Users\jimmy\Desktop\ULTIMO PROYECTO\tecnicos-ya-backend\frontend"
Set-Location $projectDir

Write-Host "Monitoring EAS Build..." -ForegroundColor Cyan

# Try to get builds periodically
$attempts = 0
$maxAttempts = 120  # Try for up to 2 hours (120 * 60 sec)

while ($attempts -lt $maxAttempts) {
    try {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking build status..." -ForegroundColor Yellow
        
        # Get the latest build
        $output = npx eas build:list -p android --limit 1 2>&1
        
        if ($output -match "FINISHED" -or $output -match "ERRORED") {
            Write-Host "Build completed!" -ForegroundColor Green
            Write-Host $output
            break
        }
        
        if ($output -match "IN_PROGRESS") {
            Write-Host "Build still in progress..." -ForegroundColor Yellow
        }
        
        Write-Host $output
    }
    catch {
        Write-Host "Error checking status: $_" -ForegroundColor Red
    }
    
    $attempts++
    if ($attempts -lt $maxAttempts) {
        Write-Host "Waiting 60 seconds before next check..." -ForegroundColor Gray
        Start-Sleep -Seconds 60
    }
}

if ($attempts -eq $maxAttempts) {
    Write-Host "Timeout: Build check timed out after 2 hours" -ForegroundColor Red
}
