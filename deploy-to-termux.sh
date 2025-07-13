#!/bin/bash

echo "🚀 Direct APK Deployment to Termux"
echo "================================="

APK_FILE="arbitrage-trading-mobile.apk"

# Build APK if not present
if [ ! -f "$APK_FILE" ]; then
    echo "📱 Building APK..."
    chmod +x scripts/build-and-copy-apk.sh
    ./scripts/build-and-copy-apk.sh
fi

# Check if APK exists
if [ ! -f "$APK_FILE" ]; then
    echo "❌ APK build failed - checking for alternative locations..."
    find . -name "*.apk" -exec cp {} "./$APK_FILE" \; 2>/dev/null

    if [ ! -f "$APK_FILE" ]; then
        echo "❌ No APK found"
        exit 1
    fi
fi

echo "✅ APK ready: $APK_FILE ($(du -h "$APK_FILE" | cut -f1))"

# Auto-detect SSH from active processes
SSH_HOST=""
if command -v netstat &> /dev/null; then
    SSH_HOST=$(netstat -tnp 2>/dev/null | grep :22 | grep ssh | head -1 | awk '{print $5}' | grep -o '[a-zA-Z0-9-]*\.replit\.dev' || echo "")
fi

if [ -z "$SSH_HOST" ]; then
    echo "🔍 SSH auto-detection failed"
    echo "📋 Manual SSH setup required:"
    echo "   1. Open Replit SSH tab"
    echo "   2. Copy the SSH command"
    echo "   3. Run: ./deploy-to-termux.sh <ssh-host>"
    exit 1
fi

echo "🔗 SSH Target: $SSH_HOST"

# Deploy to Termux
echo "📤 Deploying to Termux..."
scp -o ConnectTimeout=30 "$APK_FILE" "$SSH_HOST:/storage/emulated/0/Download/" && echo "✅ APK deployed successfully!"

echo ""
echo "🎯 DEPLOYMENT COMPLETE!"
echo "📱 APK location: /storage/emulated/0/Download/$APK_FILE"
echo "📲 Ready for installation on your device"