#!/usr/bin/env bash

# Tries to install the APKs and OBBs from an XAPK file
#
# requires an adb device connected
# usage:
#   ./xapk-install.sh /path/to/file.xapk

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 /path/to/app.xapk"
  exit 1
fi

XAPK_FILE="$1"

TEMP_DIR="$(mktemp -d)"
echo "[INFO] Using temp directory: $TEMP_DIR"

cp "$XAPK_FILE" "$TEMP_DIR/package.zip"

unzip -q "$TEMP_DIR/package.zip" -d "$TEMP_DIR/extracted"

APK_FILES=$(find "$TEMP_DIR/extracted" -type f -name "*.apk")
if [ -z "$APK_FILES" ]; then
  echo "[ERROR] No .apk files found after unzipping. Exiting."
  rm -rf "$TEMP_DIR"
  exit 1
fi

OBB_FOLDERS=$(find "$TEMP_DIR/extracted/Android/obb" -type d 2>/dev/null || true)
if [ -n "$OBB_FOLDERS" ]; then
  echo "[INFO] Found OBB directories. Pushing OBB files to device..."
  while IFS= read -r OBB_DIR; do
    REL_PATH="${OBB_DIR#"$TEMP_DIR/extracted/Android/obb/"}"
    if [ -n "$REL_PATH" ] && [ "$REL_PATH" != "$OBB_DIR" ]; then
      ADB_OBB_PATH="/sdcard/Android/obb/$REL_PATH"
      adb shell "mkdir -p '$ADB_OBB_PATH'"
      OBB_FILES=$(find "$OBB_DIR" -type f -name "*.obb")
      for OFILE in $OBB_FILES; do
        echo "[INFO] Pushing $(basename "$OFILE") to $ADB_OBB_PATH"
        adb push "$OFILE" "$ADB_OBB_PATH"
      done
    fi
  done <<< "$OBB_FOLDERS"
fi

NUM_APKS=$(echo "$APK_FILES" | wc -l | xargs)
if [ "$NUM_APKS" -eq 1 ]; then
  echo "[INFO] Installing single APK file..."
  adb install $(echo "$APK_FILES")
else
  echo "[INFO] Installing multiple APK files (split APK)..."
  adb install-multiple $APK_FILES
fi

echo "[INFO] Cleaning up temp files..."
rm -rf "$TEMP_DIR"

echo "[INFO] Done."
