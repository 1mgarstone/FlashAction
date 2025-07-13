
# Arbitrage Trading Mobile - React Native App

This is a complete React Native application for cryptocurrency arbitrage trading.

## Setup Instructions for Termux

### Prerequisites
1. Install Termux from F-Droid or Google Play Store
2. Open Termux and give it storage permissions:
   ```
   termux-setup-storage
   ```

### Installation Steps

1. Extract this ZIP file to your desired location
2. Open Termux and navigate to the extracted folder:
   ```
   cd /sdcard/Download/arbitrage-trading-mobile
   ```
   
3. Make the setup script executable and run it:
   ```
   chmod +x termux_setup.sh
   ./termux_setup.sh
   ```

4. The script will:
   - Install Node.js, Java 17, Gradle, and other dependencies
   - Set up Android SDK
   - Install npm dependencies
   - Build the APK file

### Manual Build (if needed)

If the automated script fails, you can build manually:

```bash
# Install dependencies
npm install

# Build the APK
cd android
./gradlew assembleRelease
```

### Output

The built APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

### Installation

1. Copy the APK to your phone
2. Enable "Install from Unknown Sources" in Android settings
3. Tap the APK file to install

## Features

- **Dashboard**: View trading statistics and opportunities
- **Trading**: Execute arbitrage trades with auto-bot functionality
- **Wallet**: Connect MetaMask and view balances
- **Settings**: Configure trading parameters and app preferences

## Development

### Starting the Development Server
```bash
npm start
```

### Building for Android
```bash
npm run android
```

### Building Release APK
```bash
cd android
./gradlew assembleRelease
```

## Configuration

### Environment Variables
Create a `.env` file with your API keys:
```
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Network Settings
The app supports multiple networks:
- Ethereum Mainnet
- Polygon
- Binance Smart Chain
- Avalanche

## Security Notes

⚠️ **Important Security Considerations:**

1. **Private Keys**: Never hardcode private keys in the app
2. **API Keys**: Store sensitive keys securely using React Native Keychain
3. **Testing**: Always test with small amounts on testnets first
4. **Audit**: Have smart contracts audited before mainnet deployment

## Support

For issues and support:
1. Check the console logs in the app
2. Verify your internet connection
3. Ensure MetaMask is properly configured
4. Check that your wallet has sufficient funds for gas fees

## License

MIT License - see LICENSE file for details
