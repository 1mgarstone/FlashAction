
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load root environment
dotenv.config({ path: '../.env' });

async function syncEnvironment() {
  console.log('🔄 Syncing environment variables from root .env...');
  
  const rootEnvPath = '../.env';
  const localEnvPath = '.env';
  
  if (!fs.existsSync(rootEnvPath)) {
    console.log('❌ Root .env file not found');
    return;
  }

  // Read root .env
  const rootEnv = fs.readFileSync(rootEnvPath, 'utf8');
  const rootVars = {};
  
  rootEnv.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      rootVars[key.trim()] = value.trim();
    }
  });

  // Read current local .env
  let localEnv = fs.readFileSync(localEnvPath, 'utf8');
  
  // Replace placeholder values with real ones from root
  const replacements = {
    'your_private_key_here': rootVars.PRIVATE_KEY || 'your_private_key_here',
    'your_ethereum_rpc_url': rootVars.ETHEREUM_RPC_URL || 'your_ethereum_rpc_url',
    'your_discord_bot_token_here': rootVars.DISCORD_BOT_TOKEN || 'your_discord_bot_token_here',
    'your_channel_id_for_updates': rootVars.DISCORD_CHANNEL_ID || 'your_channel_id_for_updates',
    'your_telegram_bot_token_here': rootVars.TELEGRAM_BOT_TOKEN || 'your_telegram_bot_token_here'
  };

  // Apply replacements
  for (const [placeholder, realValue] of Object.entries(replacements)) {
    if (realValue && realValue !== placeholder) {
      localEnv = localEnv.replace(new RegExp(placeholder, 'g'), realValue);
      console.log(`✅ Updated ${placeholder}`);
    }
  }

  // Write updated .env
  fs.writeFileSync(localEnvPath, localEnv);
  console.log('🎯 Environment synchronized successfully!');
  
  // Validate setup
  const hasPrivateKey = localEnv.includes('PRIVATE_KEY=') && !localEnv.includes('your_private_key_here');
  const hasRpcUrl = localEnv.includes('ETHEREUM_RPC_URL=') && !localEnv.includes('your_ethereum_rpc_url');
  
  if (hasPrivateKey && hasRpcUrl) {
    console.log('✅ Bot ready for real trading!');
    console.log('🚀 Run: npm run start-real');
  } else {
    console.log('⚠️  Still missing some credentials. Check your root .env file.');
  }
}

syncEnvironment();
