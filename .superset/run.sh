#!/usr/bin/env bash
set -euo pipefail

HASH="$(printf '%s' "$SUPERSET_WORKSPACE_NAME" | cksum | awk '{print $1}')"
PORT=$((10000 + HASH % 10000))

port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE ":${1}$"
  elif command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
  else
    return 1
  fi
}

# Move upward if another workspace already owns that port.
while port_in_use "$PORT"; do
  PORT=$((PORT + 1))
done

cat > .superset/workspace.env <<EOF
PORT=$PORT
APP_URL=http://localhost:$PORT
EOF

echo "Workspace: $SUPERSET_WORKSPACE_NAME"
echo "Application port: $PORT"

npm run dev -- --host 0.0.0.0 --port "$PORT" &
DEV_PID=$!

cleanup() {
  kill "$DEV_PID" 2>/dev/null || true
  wait "$DEV_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

npm run db:migrate:local
wait "$DEV_PID"
