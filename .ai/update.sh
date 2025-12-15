#!/bin/bash

set -e

REPO_URL="https://github.com/conradkoh/next-convex-starter-app"
TEMP_DIR=$(mktemp -d)

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_DIR="$(dirname "$SCRIPT_DIR")"

if [ "$(basename "$SCRIPT_DIR")" = ".ai" ]; then
  AI_DIR="$SCRIPT_DIR"
fi

PROJECT_ROOT="$(dirname "$AI_DIR")"

echo "Cloning repository..."
git clone --depth 1 --filter=blob:none --sparse "$REPO_URL" "$TEMP_DIR"

cd "$TEMP_DIR"
git sparse-checkout set .ai

echo "Backing up current .ai folder..."
BACKUP_DIR="$PROJECT_ROOT/.ai.backup.$(date +%Y%m%d_%H%M%S)"
mv "$AI_DIR" "$BACKUP_DIR"

echo "Copying new .ai folder..."
cp -r "$TEMP_DIR/.ai" "$PROJECT_ROOT/"

echo ""
echo "Running apply script to distribute commands..."
cd "$PROJECT_ROOT"
bash "$PROJECT_ROOT/.ai/apply.sh"

echo ""
echo "Update complete!"
echo "Backup saved to: $BACKUP_DIR"
echo "You can remove the backup with: rm -rf $BACKUP_DIR"
