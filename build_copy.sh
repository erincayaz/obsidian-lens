#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🔑 Loading environment variables..."
if [ -f .env ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ ! "$line" =~ ^# && ! -z "$line" ]]; then
            clean_line=$(echo "$line" | sed 's/\r//g')
            eval "export $clean_line"
        fi
    done < .env
else
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Verify the variable was loaded
if [ -z "$DEST_DIR" ]; then
    echo "❌ Error: DEST_DIR is not defined in your .env file."
    exit 1
fi

echo "🚀 Running npm run build..."
npm run build
echo "✅ Build completed successfully!"

echo "📂 Copying files to $DEST_DIR..."
if [ -f  "main.js" ]; then
    cp "main.js" "$DEST_DIR"
    cp "manifest.json" "$DEST_DIR"
    echo "📂 main.js and manifest.json copied to $DEST_DIR"
else
    echo "❌ main.js not found. Please check the build output."
    exit 1
fi