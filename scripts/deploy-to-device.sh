
#!/bin/bash

echo "🚀 Deploying APK to your Android device via SSH"
echo "=============================================="

APK_FILE="arbitrage-trading-mobile.apk"
DEVICE_DOWNLOADS="/storage/emulated/0/Download"
PACKAGE_NAME="com.arbitragetrading"

# Check if APK exists in root directory
if [ ! -f "$APK_FILE" ]; then
    echo "❌ APK not found in root directory"
    echo "🔨 Building APK first..."
    ./scripts/build-and-copy-apk.sh
    
    if [ ! -f "$APK_FILE" ]; then
        echo "❌ APK build failed"
        exit 1
    fi
fi

echo "📱 APK file: $APK_FILE"
echo "📏 APK size: $(du -h "$APK_FILE" | cut -f1)"

# Get SSH connection details from Replit (you'll need to replace this with your actual SSH endpoint)
# This assumes you have SSH access set up to your Termux device
SSH_TARGET="runner@your-termux-device"  # Replace with your actual SSH connection

echo "📤 Transferring APK to device Downloads folder..."
if scp -o ConnectTimeout=30 "$APK_FILE" "$SSH_TARGET:$DEVICE_DOWNLOADS/"; then
    echo "✅ APK transferred successfully!"
else
    echo "❌ Failed to transfer APK via SSH"
    echo "📋 Manual transfer required:"
    echo "   1. Download $APK_FILE from the root directory"
    echo "   2. Transfer to your device's Downloads folder"
    exit 1
fi

echo "📲 Installing APK on device..."
ssh "$SSH_TARGET" << 'EOF'
cd /storage/emulated/0/Download
APK_FILE="arbitrage-trading-mobile.apk"

echo "📁 Files in Downloads:"
ls -la *.apk 2>/dev/null || echo "No APK files found"

if [ -f "$APK_FILE" ]; then
    echo "✅ APK found: $APK_FILE"
    echo "📱 Attempting installation..."
    
    # Try to install via package manager if available
    if command -v pm &> /dev/null; then
        echo "🔧 Installing via package manager..."
        pm install "$APK_FILE"
        echo "✅ Installation completed!"
    else
        echo "📲 Manual installation required:"
        echo "   1. Open file manager on your device"
        echo "   2. Navigate to Downloads folder"
        echo "   3. Tap on $APK_FILE"
        echo "   4. Allow installation from unknown sources if prompted"
        echo "   5. Tap Install"
        
        # Try to open the APK for manual installation
        if command -v am &> /dev/null; then
            echo "🚀 Opening APK for installation..."
            am start -a android.intent.action.VIEW -d "file:///storage/emulated/0/Download/$APK_FILE" -t application/vnd.android.package-archive
        fi
    fi
else
    echo "❌ APK file not found in Downloads folder"
fi
EOF

echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo "========================"
echo "✅ APK is available in root directory: $APK_FILE"
echo "📱 APK transferred to device Downloads folder"
echo "📲 Installation initiated on device"
echo ""
echo "📋 If manual installation is needed:"
echo "   1. Open file manager on your Android device"
echo "   2. Navigate to Downloads folder"
echo "   3. Tap on $APK_FILE"
echo "   4. Allow installation from unknown sources if prompted"
echo "   5. Install the app"
