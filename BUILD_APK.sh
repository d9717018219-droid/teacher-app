#!/bin/bash

# 🚀 DoAble India App - Firebase Notifications APK Builder
# Ye script complete APK build karta hai

set -e  # Exit on error

echo "════════════════════════════════════════════════════"
echo "🚀 DoAble India App - APK Builder"
echo "════════════════════════════════════════════════════"
echo ""

# Check if Java is installed
echo "📝 Checking Java installation..."
if ! command -v java &> /dev/null; then
    echo "❌ Java not found!"
    echo ""
    echo "Install Java Development Kit (JDK 17 or higher):"
    echo "1. Visit: https://www.oracle.com/java/technologies/downloads/"
    echo "2. Download JDK 17 or latest"
    echo "3. Install and restart terminal"
    echo "4. Run this script again"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -1)
echo "✅ Java found: $JAVA_VERSION"
echo ""

# Check if Android SDK is installed
echo "📝 Checking Android SDK..."
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME not set"
    echo "Make sure Android SDK is installed at:"
    echo "  ~/Library/Android/sdk (macOS)"
    echo "  Alternatively, set: export ANDROID_HOME=<path_to_sdk>"
fi

# Build project
echo "🔨 Building Web Project..."
npm run build

echo "🔄 Syncing with Capacitor..."
npx cap copy android

echo "🔨 Building Android APK..."
echo "This may take 2-5 minutes..."
echo ""

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/android"

# Make gradlew executable
chmod +x ./gradlew

# Run build
./gradlew assembleRelease \
    --stacktrace \
    2>&1

echo ""
echo "════════════════════════════════════════════════════"
echo "✅ BUILD COMPLETE!"
echo "════════════════════════════════════════════════════"
echo ""

# Check if APK was generated
APK_PATH="app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "📦 APK Generated Successfully!"
    echo "   Path: $APK_PATH"
    echo "   Size: $APK_SIZE"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Copy APK to device"
    echo "   2. Install on Android phone"
    echo "   3. Open app and test notifications"
    echo ""
    echo "📤 Upload to Play Store:"
    echo "   - Go to Google Play Console"
    echo "   - Upload this APK to Internal Testing"
    echo "   - Or distribute to testers"
    echo ""
else
    echo "❌ APK not found at: $APK_PATH"
    echo "Build may have failed. Check errors above."
    exit 1
fi

echo "════════════════════════════════════════════════════"
echo "✨ All Done!"
echo "════════════════════════════════════════════════════"
