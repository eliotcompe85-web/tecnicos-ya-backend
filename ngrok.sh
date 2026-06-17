#!/usr/bin/env bash
#
# ngrok.sh — Expone el backend local con ngrok
# Uso:   ./ngrok.sh [puerto] [dominio]
#        ./ngrok.sh 8000                   # túnel básico
#        ./ngrok.sh 8000 midominio.ngrok.io # dominio fijo (plan Pro)
#
set -euo pipefail

PORT="${1:-8000}"
DOMAIN="${2:-}"

NGROK="ngrok"
command -v "$NGROK" &>/dev/null || NGROK="$HOME/ngrok/ngrok"
command -v "$NGROK" &>/dev/null || {
    echo "[ERROR] ngrok no instalado."
    echo "  Linux:   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc"
    echo "           echo 'deb https://ngrok-agent.s3.amazonaws.com buster main' | sudo tee /etc/apt/sources.list.d/ngrok.list"
    echo "           sudo apt update && sudo apt install ngrok"
    echo "  macOS:   brew install ngrok"
    echo "  Manual:  https://ngrok.com/download"
    exit 1
}

echo "═══════════════════════════════════════════════════════════════"
echo "  Técnicos Ya — Túnel ngrok"
echo "═══════════════════════════════════════════════════════════════"
echo "  Local:  http://localhost:${PORT}"
echo "  Token:  configurado"
[ -n "$DOMAIN" ] && echo "  Domain: $DOMAIN"
echo "  Presiona Ctrl+C para cerrar el túnel"
echo "═══════════════════════════════════════════════════════════════"

ARGS=("http" "http://localhost:${PORT}" "--log=stdout")
[ -n "$DOMAIN" ] && ARGS+=("--domain=${DOMAIN}")

exec "$NGROK" "${ARGS[@]}"
