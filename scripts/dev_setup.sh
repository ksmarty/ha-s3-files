#!/usr/bin/env bash
# Development environment setup for S3 Files.
#
# Creates a virtualenv with the Python test dependencies.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

.venv/bin/pip install --upgrade pip
.venv/bin/pip install pytest homeassistant boto3 moto hassil pyflakes

cat <<'EOF'

Development environment ready.
  Run the tests:    .venv/bin/python -m pytest
  Lint:             .venv/bin/python -m pyflakes custom_components/s3_files tests

Note: on Python 3.12 pip resolves an older Home Assistant that has no LLM tool
helpers, so tests/test_llm_tools.py skips. Use Python 3.13+ to exercise the LLM
path locally.
EOF
