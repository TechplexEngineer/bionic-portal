#!/usr/bin/env bash
set -euo pipefail

SUPERSET_WORKSPACE_NAME="$(superset workspaces get --field name)"


HASH="$(printf '%s' "$SUPERSET_WORKSPACE_NAME" | cksum | awk '{print $1}')"
PORT=$((10000 + HASH % 10000))
WORKSPACE_ID="${SUPERSET_WORKSPACE_ID:?SUPERSET_WORKSPACE_ID must be set}"

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

APP_URL="http://localhost:$PORT"

cat > .superset/workspace.env <<EOF
PORT=$PORT
APP_URL=$APP_URL
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

echo "Waiting for the dev server to become available..."
until curl --silent --output /dev/null "$APP_URL"; do
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "The dev server exited before becoming available." >&2
    exit 1
  fi
  sleep 1
done

echo "Opening application in a new Superset browser tab..."
if ! superset browser open \
  --workspace "$WORKSPACE_ID" \
  --url "$APP_URL" \
  --target new-tab; then
  echo "Unable to open the application in the Superset browser." >&2
fi

wait "$DEV_PID"
