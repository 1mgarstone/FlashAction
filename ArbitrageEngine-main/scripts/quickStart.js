
#!/usr/bin/env node

import { UltimateBot } from './ultimateBot.js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function quickStart() {
  console.log('🚀 FLASH LOAN ARBITRAGE BOT - QUICK START');
  console.log('==========================================');

  // Check required environment variables
  const requiredVars = [
    'PRIVATE_KEY',
    'REACT_APP_ETHEREUM_RPC_URL',
    'REACT_APP_INFURA_PROJECT_ID'
  ];

  const missing = requiredVars.filter(var_ => !process.env[var_] || process.env[var_].includes('YOUR_'));
  
  if (missing.length > 0) {
    console.log('❌ Missing required configuration:');
    missing.forEach(var_ => console.log(`   - ${var_}`));
    console.log('\n📝 Please update your .env file with:');
    console.log('   1. Your wallet PRIVATE_KEY');
    console.log('   2. Your Infura PROJECT_ID');
    console.log('   3. Replace YOUR_INFURA_PROJECT_ID in RPC URLs');
    return;
  }

  try {
    // Validate wallet
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    console.log('✅ Wallet loaded:', wallet.address);

    // Check balance
    const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_ETHEREUM_RPC_URL);
    const balance = await provider.getBalance(wallet.address);
    const ethBalance = ethers.utils.formatEther(balance);
    
    console.log('💰 Wallet balance:', ethBalance, 'ETH');
    
    if (parseFloat(ethBalance) < 0.1) {
      console.log('⚠️  Low balance! You need at least 0.1 ETH for gas fees');
      return;
    }

    // Initialize and start bot
    console.log('🤖 Initializing Ultimate Flash Loan Bot...');
    const bot = new UltimateBot();
    await bot.initialize(process.env.PRIVATE_KEY);
    
    console.log('🎯 Bot initialized successfully!');
    console.log('🔄 Starting automatic arbitrage trading...');
    
    await bot.startAutoTrading();
    
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
  }
}

quickStart();
