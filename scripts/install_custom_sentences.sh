#!/usr/bin/env bash
# Copy the Assist sentence templates into a Home Assistant config directory.
#
# HACS cannot install custom_sentences for you, so this does the one-time copy.
# Equivalent to calling the s3_files.install_sentences action from Home
# Assistant, which is easier when Home Assistant runs on another machine.
#
# Usage:
#   scripts/install_custom_sentences.sh /path/to/homeassistant/config
#   HA_CONFIG=/config scripts/install_custom_sentences.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

CONFIG_DIR="${1:-${HA_CONFIG:-}}"
LANGUAGE="${LANGUAGE:-en}"
SOURCE="$ROOT_DIR/custom_components/s3_files/custom_sentences/$LANGUAGE/s3_files.yaml"

if [ -z "$CONFIG_DIR" ]; then
  echo "error: pass the Home Assistant config directory as the first argument" >&2
  echo "       or set HA_CONFIG" >&2
  exit 1
fi

if [ ! -f "$SOURCE" ]; then
  echo "error: no packaged sentences at $SOURCE" >&2
  exit 1
fi

TARGET_DIR="$CONFIG_DIR/custom_sentences/$LANGUAGE"
TARGET="$TARGET_DIR/s3_files.yaml"

mkdir -p "$TARGET_DIR"

if [ -f "$TARGET" ] && ! cmp -s "$SOURCE" "$TARGET"; then
  cp "$TARGET" "$TARGET.bak"
  echo "Backed up the existing file to $TARGET.bak"
fi

cp "$SOURCE" "$TARGET"
echo "Installed $TARGET"
echo
echo "Now reload the conversation agent (Developer Tools -> Actions ->"
echo "conversation.reload), or restart Home Assistant."
