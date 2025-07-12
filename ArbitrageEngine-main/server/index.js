
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist/public')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Blockchain connection check
app.get('/api/blockchain/status', async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_ETHEREUM_RPC_URL);
    const blockNumber = await provider.getBlockNumber();
    res.json({ 
      connected: true, 
      blockNumber,
      network: 'ethereum'
    });
  } catch (error) {
    res.status(500).json({ 
      connected: false, 
      error: error.message 
    });
  }
});

// Arbitrage opportunities endpoint
app.get('/api/arbitrage/opportunities', async (req, res) => {
  try {
    // Placeholder for real arbitrage logic
    const opportunities = [
      {
        id: 1,
        pair: 'ETH/USDC',
        dex1: 'Uniswap',
        dex2: 'SushiSwap',
        profit: '0.025',
        profitUSD: '50.00',
        multiplier: process.env.TARGET_MULTIPLIER || 50
      }
    ];
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start max gain optimization
app.post('/api/trading/start-maxgain', async (req, res) => {
  try {
    console.log('🚀 STARTING MAXIMUM GAIN OPTIMIZATION');
    console.log(`Target Multiplier: ${process.env.TARGET_MULTIPLIER}x`);
    console.log(`Max Leverage: ${process.env.MAX_LEVERAGE_MULTIPLIER}x`);
    
    res.json({ 
      started: true, 
      message: 'Maximum gain optimization started',
      targetMultiplier: process.env.TARGET_MULTIPLIER,
      maxLeverage: process.env.MAX_LEVERAGE_MULTIPLIER
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Flash Loan Arbitrage Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💰 Max Gain Mode: ${process.env.TARGET_MULTIPLIER}x multiplier`);
  console.log(`⚡ Max Leverage: ${process.env.MAX_LEVERAGE_MULTIPLIER}x`);
  console.log(`🔗 Server accessible at: http://0.0.0.0:${PORT}`);
});

module.exports = app;
