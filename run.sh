#!/usr/bin/env bash
#
# run.sh — Arranca backend + frontend con un solo comando
# Uso:   ./run.sh              (usa valores por defecto)
#        BACKEND_DIR=./custom-backend FRONTEND_DIR=./custom-frontend ./run.sh
#
set -euo pipefail

# ─── Configuración (ajustable vía entorno) ────────────────────────────────
BACKEND_DIR="${BACKEND_DIR:-tecnicos-ya-backend/backend}"
FRONTEND_DIR="${FRONTEND_DIR:-tecnicos-ya-app}"
VENV_DIR="${VENV_DIR:-tecnicos-ya-backend/.venv}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"

# ─── Colores para output ─────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; }

# ─── Helper: matar proceso en un puerto ──────────────────────────────────
kill_port() {
    local port="$1"
    local pid
    pid=$(lsof -ti "tcp:${port}" 2>/dev/null || ss -tlnp "sport = :${port}" 2>/dev/null | grep -oP 'pid=\K\d+') || true
    if [ -n "$pid" ]; then
        kill "$pid" 2>/dev/null || true
        sleep 0.5
    fi
}

# ─── Helper: verificar puerto libre ───────────────────────────────────────
check_port() {
    local port="$1" name="$2"
    if lsof -i "tcp:${port}" &>/dev/null || ss -tlnp "sport = :${port}" &>/dev/null 2>&1; then
        err "Puerto ${port} (${name}) está ocupado. Usa: kill_port ${port} o cambia ${name^^}_PORT"
        return 1
    fi
    ok "Puerto ${port} (${name}) libre"
}

# ─── Verificar dependencias ──────────────────────────────────────────────
check_deps() {
    local missing=0
    for cmd in python3 npm lsof; do
        if ! command -v "$cmd" &>/dev/null; then
            err "Dependencia faltante: $cmd"
            missing=1
        fi
    done
    return "$missing"
}

# ─── Limpieza al salir ───────────────────────────────────────────────────
cleanup() {
    echo
    info "Deteniendo servicios..."
    # Mata procesos hijos (backend y frontend) usando el group PID
    if [ -n "${BACKEND_PID:-}" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
        wait "$BACKEND_PID" 2>/dev/null || true
        ok "Backend detenido"
    fi
    if [ -n "${FRONTEND_PID:-}" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
        wait "$FRONTEND_PID" 2>/dev/null || true
        ok "Frontend detenido"
    fi
    info "Todos los servicios detenidos. ¡Hasta luego!"
    exit 0
}

# ──────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────
trap cleanup SIGINT SIGTERM SIGQUIT

echo "═══════════════════════════════════════════════════════════════"
echo "  Técnicos Ya — Inicio rápido"
echo "═══════════════════════════════════════════════════════════════"
echo "  Backend:  ${BACKEND_DIR}  →  http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "  Frontend: ${FRONTEND_DIR} →  http://localhost:${FRONTEND_PORT}"
echo "  Presiona Ctrl+C para detener ambos servicios"
echo "═══════════════════════════════════════════════════════════════"

# 1. Validar dependencias
check_deps || exit 1

# 2. Validar directorios
[ -d "$BACKEND_DIR" ] || { err "Backend dir no encontrado: $BACKEND_DIR"; exit 1; }
[ -d "$FRONTEND_DIR" ] || { err "Frontend dir no encontrado: $FRONTEND_DIR"; exit 1; }

# 3. Validar puertos libres
check_port "$BACKEND_PORT" "backend" || exit 1
check_port "$FRONTEND_PORT" "frontend" || exit 1

# 4. Activar venv y arrancar backend
info "Iniciando backend..."
VENV_PYTHON="${VENV_DIR}/bin/python3"
if [ ! -f "$VENV_PYTHON" ]; then
    VENV_PYTHON="${VENV_DIR}/Scripts/python"
fi

if [ -f "$VENV_PYTHON" ]; then
    cd "$BACKEND_DIR"
    "$VENV_PYTHON" -m uvicorn server:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" &
    BACKEND_PID=$!
    cd - > /dev/null
else
    warn "Venv no encontrado en ${VENV_DIR}, intentando python del sistema..."
    cd "$BACKEND_DIR"
    python3 -m uvicorn server:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" &
    BACKEND_PID=$!
    cd - > /dev/null
fi
sleep 2

# Verificar que el backend haya arrancado
if kill -0 "$BACKEND_PID" 2>/dev/null; then
    ok "Backend corriendo (PID ${BACKEND_PID}) → http://${BACKEND_HOST}:${BACKEND_PORT}"
else
    err "El backend falló al iniciar. Revisa los logs arriba."
    exit 1
fi

# 5. Arrancar frontend
info "Iniciando frontend..."
cd "$FRONTEND_DIR"
npx vite --port "$FRONTEND_PORT" &
FRONTEND_PID=$!
cd - > /dev/null
sleep 2

if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    ok "Frontend corriendo (PID ${FRONTEND_PID}) → http://localhost:${FRONTEND_PORT}"
else
    err "El frontend falló al iniciar."
    exit 1
fi

# 6. Esperar interrupción
echo
info "Ambos servicios están corriendo. Presiona Ctrl+C para detenerlos."
wait
