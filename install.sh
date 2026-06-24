#!/usr/bin/env bash
#
# Linux Odyssey — one-shot setup & run script.
# Usage:
#   ./install.sh          # install deps and start the dev server
#   ./install.sh build    # install deps and produce a production build in dist/
#   ./install.sh preview  # build, then serve the production build locally
#
set -euo pipefail

cd "$(dirname "$0")"

MODE="${1:-dev}"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed. Install Node.js 20+ from https://nodejs.org and re-run." >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Error: Node.js 20+ is required (found $(node -v))." >&2
  exit 1
fi

echo "==> Installing dependencies (npm ci)..."
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

case "$MODE" in
  dev)
    echo "==> Starting dev server at http://localhost:5173 ..."
    npm run dev
    ;;
  build)
    echo "==> Building production bundle into dist/ ..."
    npm run build
    echo "==> Done. Static files are in ./dist"
    ;;
  preview)
    echo "==> Building and serving production preview ..."
    npm run build
    npm run preview
    ;;
  *)
    echo "Unknown mode: $MODE (use: dev | build | preview)" >&2
    exit 1
    ;;
esac
