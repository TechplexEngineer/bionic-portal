#!/usr/bin/env bash
set -euo pipefail

npm ci

if [[ -f "$SUPERSET_ROOT_PATH/.env" ]]; then
  cp "$SUPERSET_ROOT_PATH/.env" .env
fi

superset terminals create --command ".superset/run.sh" --workspace $(superset workspaces get --field id)