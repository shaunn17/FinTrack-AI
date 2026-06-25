#!/usr/bin/env bash
# Start FinTrack backend (uvicorn) and frontend (Vite) in one terminal.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT=8000
FRONTEND_PORT=5173
FORCE=false

usage() {
  cat <<'EOF'
Usage: ./dev.sh [--force]

  Starts backend (http://127.0.0.1:8000) and frontend (http://127.0.0.1:5173).

Options:
  --force   Start even if ports 8000 or 5173 are already in use (may fail).
  -h, --help  Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
done

warn() {
  echo "warning: $*" >&2
}

die() {
  echo "error: $*" >&2
  exit 1
}

# Returns 0 if the port has a listening process. Prints "COMMAND PID" on stdout.
port_listener() {
  local port="$1"
  lsof -nP -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null | awk 'NR == 2 { print $1, $2; exit }'
}

check_ports() {
  local blocked=false
  local info

  info="$(port_listener "${BACKEND_PORT}")" || true
  if [[ -n "${info}" ]]; then
    warn "port ${BACKEND_PORT} is already in use (${info})"
    echo "       stop it with: kill ${info##* }   # or: lsof -ti :${BACKEND_PORT} | xargs kill" >&2
    blocked=true
  fi

  info="$(port_listener "${FRONTEND_PORT}")" || true
  if [[ -n "${info}" ]]; then
    warn "port ${FRONTEND_PORT} is already in use (${info})"
    echo "       stop it with: kill ${info##* }   # or: lsof -ti :${FRONTEND_PORT} | xargs kill" >&2
    blocked=true
  fi

  if [[ "${blocked}" == true && "${FORCE}" != true ]]; then
    echo >&2
    die "refusing to start duplicate servers. Free the ports above or re-run with: ./dev.sh --force"
  fi

  if [[ "${blocked}" == true && "${FORCE}" == true ]]; then
    warn "--force set; starting anyway (bind may fail if ports stay in use)"
  fi
}

check_env_files() {
  if [[ ! -f "${ROOT_DIR}/backend/.env" ]]; then
    warn "backend/.env is missing — copy backend/.env.example and fill in SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY"
  fi

  if [[ ! -f "${ROOT_DIR}/frontend/.env" ]]; then
    warn "frontend/.env is missing (optional) — copy frontend/.env.example; VITE_API_BASE_URL defaults via Vite proxy"
  fi
}

check_dependencies() {
  if [[ ! -d "${ROOT_DIR}/backend/.venv" ]]; then
    warn "backend/.venv not found — run: cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  fi

  if [[ ! -d "${ROOT_DIR}/frontend/node_modules" ]]; then
    warn "frontend/node_modules not found — run: cd frontend && npm install"
  fi
}

check_ports
check_env_files
check_dependencies

echo "Starting FinTrack dev servers..."
echo "  Backend:  http://127.0.0.1:${BACKEND_PORT}  (docs: http://127.0.0.1:${BACKEND_PORT}/docs)"
echo "  Frontend: http://127.0.0.1:${FRONTEND_PORT}"
echo

BACKEND_CMD="cd \"${ROOT_DIR}/backend\" && source .venv/bin/activate && uvicorn app.main:app --reload --host 127.0.0.1 --port ${BACKEND_PORT}"
FRONTEND_CMD="cd \"${ROOT_DIR}/frontend\" && npm run dev -- --host 127.0.0.1 --port ${FRONTEND_PORT}"

exec npx --yes concurrently@9 \
  --names "backend,frontend" \
  --prefix-colors "blue,green" \
  --handle-input \
  "${BACKEND_CMD}" \
  "${FRONTEND_CMD}"
