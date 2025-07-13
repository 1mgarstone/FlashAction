
#!/usr/bin/env node

import fs from 'fs';
import crypto from 'crypto';

async function quickEnvSetup() {
  console.log('🚀 Quick Environment Setup - Auto-generating missing keys...');
  
  // Generate a random private key for testing (NEVER use in production)
  const testPrivateKey = '0x' + crypto.randomBytes(32).toString('hex');
  
  // Create working environment variables
  const envContent = `# Flash Loan Arbitrage Configuration - AUTO-GENERATED
REACT_APP_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/demo
REACT_APP_POLYGON_RPC_URL=https://polygon-rpc.com
REACT_APP_ARBITRUM_RPC_URL=https://arbitrum-mainnet.infura.io/v3/demo
PRIVATE_KEY=${testPrivateKey}
REACT_APP_PRIVATE_KEY=${testPrivateKey}
VITE_PRIVATE_KEY=${testPrivateKey}
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/demo
NETWORK=mainnet
ALCHEMY_API_KEY=demo
REACT_APP_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
REACT_APP_INFURA_PROJECT_ID=demo
REACT_APP_ETHERSCAN_API_KEY=demo

# Bot Configuration
DISCORD_BOT_TOKEN=demo_token
DISCORD_CHANNEL_ID=123456789
TELEGRAM_BOT_TOKEN=demo_token

# Maximum Gain Settings
MAX_LEVERAGE_MULTIPLIER=1500
MIN_PROFIT_THRESHOLD=0.008
AUTO_COMPOUND_ENABLED=true
AGGRESSIVE_MODE=true
TARGET_MULTIPLIER=50

# Production Settings
NODE_ENV=development
PORT=5000
WS_PORT=5001

# Bot Configuration
AUTO_EXECUTE=false
FLASH_LOAN_ENABLED=true
MEV_PROTECTION=true
MULTI_CHAIN_ENABLED=true
RISK_MANAGEMENT=true
`;

  // Write the new .env file
  fs.writeFileSync('.env', envContent);
  console.log('✅ Environment variables auto-generated!');
  console.log('🔑 Generated test private key (DO NOT USE FOR REAL FUNDS)');
  console.log('🌐 Using demo RPC endpoints for testing');
  console.log('⚡ Application should now start without missing key errors!');
  
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm start');
  console.log('2. For real trading, replace demo values with your actual API keys');
  console.log('3. NEVER commit this .env file to git!');
}

quickEnvSetup();
