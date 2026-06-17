@echo off
:: ===========================================================================
:: run.bat — Arranca backend + frontend en ventanas separadas (Windows)
:: Uso:   run.bat
:: ===========================================================================
setlocal enabledelayedexpansion

:: ─── Configuración ─────────────────────────────────────────────────────────
set BACKEND_DIR=tecnicos-ya-backend\backend
set FRONTEND_DIR=tecnicos-ya-app
set VENV_DIR=tecnicos-ya-backend\.venv
set BACKEND_PORT=8000
set FRONTEND_PORT=5173

title Técnicos Ya — Inicio rápido

echo ═══════════════════════════════════════════════════════════════
echo   Técnicos Ya — Inicio rápido
echo ═══════════════════════════════════════════════════════════════
echo   Backend:  %BACKEND_DIR%  ^-^>  http://localhost:%BACKEND_PORT%
echo   Frontend: %FRONTEND_DIR% ^-^>  http://localhost:%FRONTEND_PORT%
echo.
echo   Se abriran 2 ventanas: Backend y Frontend.
echo   Ciérralas con Ctrl+C cuando termines.
echo ═══════════════════════════════════════════════════════════════

:: ─── 1. Validar directorios ──────────────────────────────────────────────
if not exist "%BACKEND_DIR%" (
    echo [ERROR] Backend no encontrado: %BACKEND_DIR%
    pause
    exit /b 1
)
if not exist "%FRONTEND_DIR%" (
    echo [ERROR] Frontend no encontrado: %FRONTEND_DIR%
    pause
    exit /b 1
)

:: ─── 2. Validar puertos libres ───────────────────────────────────────────
echo.
echo [INFO] Verificando puertos...

netstat -ano | findstr ":%BACKEND_PORT% " >nul 2>&1
if !errorlevel! equ 0 (
    echo [ERROR] Puerto %BACKEND_PORT% (backend) esta ocupado.
    echo         Usa: netstat -ano ^| findstr :%BACKEND_PORT%
    pause
    exit /b 1
) else (
    echo [OK]    Puerto %BACKEND_PORT% (backend) libre
)

netstat -ano | findstr ":%FRONTEND_PORT% " >nul 2>&1
if !errorlevel! equ 0 (
    echo [ERROR] Puerto %FRONTEND_PORT% (frontend) esta ocupado.
    pause
    exit /b 1
) else (
    echo [OK]    Puerto %FRONTEND_PORT% (frontend) libre
)

:: ─── 3. Arrancar backend en ventana separada ────────────────────────────
echo.
echo [INFO] Iniciando backend...

:: Verificar si existe el activador del venv
if exist "%VENV_DIR%\Scripts\activate.bat" (
    set VENV_CMD=%VENV_DIR%\Scripts\activate.bat
) else (
    :: Fallback: si no hay venv, usar Python del sistema
    set VENV_CMD=echo [WARN] Sin venv, usando python del sistema
)

start "Backend - Tecnicos Ya" cmd /k "cd /d %BACKEND_DIR% && if exist %VENV_CMD% (call %VENV_CMD%) && python -m uvicorn server:app --host 127.0.0.1 --port %BACKEND_PORT% --reload"
echo [OK]    Backend lanzado en ventana separada

:: ─── 4. Arrancar frontend en ventana separada ───────────────────────────
echo.
echo [INFO] Iniciando frontend...

start "Frontend - Tecnicos Ya" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"
echo [OK]    Frontend lanzado en ventana separada

:: ─── 5. Esperar ─────────────────────────────────────────────────────────
echo.
echo ═══════════════════════════════════════════════════════════════
echo   Ambos servicios iniciados.
echo   Revisa las ventanas abiertas para ver los logs.
echo   Presiona cualquier tecla para cerrar ambas ventanas...
echo ═══════════════════════════════════════════════════════════════

pause >nul

:: ─── 6. Limpieza al salir ───────────────────────────────────────────────
echo.
echo [INFO] Deteniendo servicios...

:: Cerrar las ventanas por título
taskkill /f /fi "WINDOWTITLE eq Backend - Tecnicos Ya" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Frontend - Tecnicos Ya" >nul 2>&1

:: Ademas matar procesos python y node que pudieran quedar huerfanos
for /f "tokens=2" %%p in ('tasklist /fi "IMAGENAME eq python.exe" /fo csv /nh 2^>nul ^| findstr /i "uvicorn"') do (
    taskkill /f /pid %%p >nul 2>&1
)

echo [OK]    Servicios detenidos.
echo [INFO] ¡Hasta luego!
pause
