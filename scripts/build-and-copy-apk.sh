
#!/bin/bash

echo "🚀 Building React Native APK"
echo "============================="

# Set variables
PROJECT_ROOT="$(pwd)"
APK_NAME="arbitrage-trading-mobile.apk"
KEYSTORE_PATH="android/app/release.keystore"
KEYSTORE_ALIAS="release-key"
KEYSTORE_PASSWORD="Kx9mP2vN8qL5wE3rT7yU4iO6"

# Create Android project structure if missing
echo "📁 Setting up Android project structure..."
mkdir -p android/app/src/main/java/com/arbitragetrading/mobile
mkdir -p android/app/src/main/res/values
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi

# Create AndroidManifest.xml
cat > android/app/src/main/AndroidManifest.xml << 'EOF'
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.arbitragetrading.mobile">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# Create strings.xml
cat > android/app/src/main/res/values/strings.xml << 'EOF'
<resources>
    <string name="app_name">Arbitrage Trading</string>
</resources>
EOF

# Create styles.xml
cat > android/app/src/main/res/values/styles.xml << 'EOF'
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <!-- Customize your theme here. -->
        <item name="android:textColor">#000000</item>
    </style>
</resources>
EOF

# Create MainActivity.java
cat > android/app/src/main/java/com/arbitragetrading/mobile/MainActivity.java << 'EOF'
package com.arbitragetrading.mobile;

import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {
    @Override
    protected String getMainComponentName() {
        return "ArbitrageTradingMobile";
    }
}
EOF

# Create MainApplication.java
cat > android/app/src/main/java/com/arbitragetrading/mobile/MainApplication.java << 'EOF'
package com.arbitragetrading.mobile;

import android.app.Application;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
          return BuildConfig.IS_HERMES_ENABLED;
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
EOF

# Create gradle.properties
cat > android/gradle.properties << 'EOF'
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
newArchEnabled=false
hermesEnabled=true
FLIPPER_VERSION=0.125.0
EOF

# Create keystore
echo "🔑 Creating keystore..."
if [ ! -f "$KEYSTORE_PATH" ]; then
    keytool -genkeypair -v -storetype PKCS12 -keystore "$KEYSTORE_PATH" -alias "$KEYSTORE_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 -storepass "$KEYSTORE_PASSWORD" -keypass "$KEYSTORE_PASSWORD" -dname "CN=Arbitrage Trading, OU=Mobile, O=ArbitrageTrading, L=City, ST=State, C=US"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the APK
echo "🔨 Building APK..."
cd android
./gradlew assembleRelease

# Check if APK was built successfully
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ APK built successfully!"
    
    # Copy APK to root directory
    echo "📱 Copying APK to root directory..."
    cp "app/build/outputs/apk/release/app-release.apk" "$PROJECT_ROOT/$APK_NAME"
    
    echo "✅ APK ready: $APK_NAME"
    echo "📱 File size: $(ls -lh "$PROJECT_ROOT/$APK_NAME" | awk '{print $5}')"
    echo ""
    echo "🎯 To download:"
    echo "   1. Look for '$APK_NAME' in the file explorer"
    echo "   2. Right-click and select 'Download'"
    echo ""
else
    echo "❌ APK build failed!"
    echo "Build output:"
    find . -name "*.apk" -type f 2>/dev/null || echo "No APK files found"
    exit 1
fi
