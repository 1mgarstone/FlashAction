
#!/usr/bin/env node

import { UltimateBot } from './ultimateBot.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function startBotWithValidation() {
  console.log('🚀 Starting Ultimate Flash Loan Arbitrage Bot...');
  console.log('💰 Target: Maximum profit with $100+ capital');
  console.log('⚡ Features: Multi-chain, MEV protection, AI-powered');
  console.log('================================================');

  // Validate environment
  const privateKey = process.env.PRIVATE_KEY || process.env.REACT_APP_PRIVATE_KEY || process.env.VITE_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ PRIVATE_KEY not found in environment variables');
    console.log('💡 Please set your private key in the Secrets tab or .env file');
    console.log('🔑 Example: PRIVATE_KEY=0x1234567890abcdef...');
    process.exit(1);
  }

  // Validate private key format
  if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
    console.error('❌ Invalid private key format');
    console.log('🔑 Private key should be 64 hex characters starting with 0x');
    process.exit(1);
  }

  try {
    const bot = new UltimateBot();
    
    // Initialize the bot
    const result = await bot.initialize(privateKey);
    
    if (result.success) {
      console.log('✅ Bot initialized successfully');
      console.log('🤖 Starting automated trading...');
      
      // Start the ultimate bot
      await bot.startUltimateBot();
      
      // Graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down gracefully...');
        bot.stopBot();
        process.exit(0);
      });
      
    } else {
      console.error('❌ Bot initialization failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Start the bot
startBotWithValidation().catch(error => {
  console.error('❌ Startup failed:', error);
  process.exit(1);
});
