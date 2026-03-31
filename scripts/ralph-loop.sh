#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_ID="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
JOB_PATH="${1:-${ROOT_DIR}/.ralph/jobs/examples/screenshot-studio.json}"

cat <<EOF
RALPH supervisor loop
root: ${ROOT_DIR}
run:  ${RUN_ID}

planned stages:
  1. observe
  2. infer
  3. canonicalize
  4. build
  5. prove
  6. compare
  7. harvest

This shell entrypoint is intentionally thin.
The real work happens in the typed Ralph job runner and persisted artifacts.
EOF

echo
echo "Running Ralph loop for job: ${JOB_PATH}"
pnpm --dir "${ROOT_DIR}" build >/dev/null
node "${ROOT_DIR}/packages/ralph-cli/dist/index.js" loop "${JOB_PATH}"
