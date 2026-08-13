#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_DIR="$(cd "$SCRIPT_DIR/../../deepseek-harness" && pwd)"

if [[ ! -x "$HARNESS_DIR/node_modules/.bin/tsx" ]]; then
  echo "DeepSeek Harness dependencies are missing. Run 'pnpm install' in $HARNESS_DIR first." >&2
  exit 1
fi

cd "$HARNESS_DIR"
pnpm exec tsx "$SCRIPT_DIR/inspect-session-replay.ts" "$@"
