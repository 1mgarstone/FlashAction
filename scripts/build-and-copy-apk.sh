#!/bin/bash

echo "🚀 Building APK for Arbitrage Trading Mobile App"
echo "=============================================="

# Set variables
PROJECT_ROOT="$(pwd)"
KEYSTORE_PATH="$PROJECT_ROOT/android/app/my-release-key.keystore"
KEYSTORE_ALIAS="my-key-alias"
KEYSTORE_PASSWORD="123456"
APK_NAME="arbitrage-trading-mobile.apk"

# Create keystore if it doesn't exist
echo "🔑 Creating keystore..."
if [ ! -f "$KEYSTORE_PATH" ]; then
    keytool -genkeypair -v -storetype PKCS12 -keystore "$KEYSTORE_PATH" -alias "$KEYSTORE_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 -storepass "$KEYSTORE_PASSWORD" -keypass "$KEYSTORE_PASSWORD" -dname "CN=Arbitrage Trading, OU=Mobile, O=ArbitrageTrading, L=City, ST=State, C=US"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create Android build directory structure
echo "📁 Creating Android build structure..."
mkdir -p android/app/src/main/java/com/arbitragetrading/mobile
mkdir -p android/app/src/main/res/values

# Create required Android files
echo "📄 Creating Android manifest..."
cat > android/app/src/main/AndroidManifest.xml << 'EOF'
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
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
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# Create MainActivity
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

# Create MainApplication
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
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, false);
  }
}
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
    </style>
    <style name="LaunchTheme" parent="AppTheme">
    </style>
</resources>
EOF

# Build the APK
echo "🔨 Building APK..."
cd android
chmod +x gradlew
./gradlew clean
./gradlew assembleRelease

# Check if APK was built successfully
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ APK built successfully!"

    # Copy APK to root directory
    echo "📱 Copying APK to root directory..."
    cp "app/build/outputs/apk/release/app-release.apk" "$PROJECT_ROOT/$APK_NAME"

    echo "📱 APK copied to: $PROJECT_ROOT/$APK_NAME"
    echo "🎉 Build complete! You can now download: $APK_NAME"
else
    echo "❌ APK build failed - app-release.apk not found"
    exit 1
fi