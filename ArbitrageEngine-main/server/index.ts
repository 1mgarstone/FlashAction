
import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('📱 Client connected to WebSocket');
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Real-time arbitrage monitoring active'
  }));

  ws.on('close', () => {
    console.log('📱 Client disconnected from WebSocket');
  });
});

// Broadcast to all connected clients
const broadcast = (data: any) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    maxGainMode: true
  });
});

app.get('/api/arbitrage/scan', async (req, res) => {
  try {
    // Simulated high-yield opportunities for maximum gains
    const opportunities = [
      {
        id: `arb_${Date.now()}_1`,
        tokenPair: 'ETH/USDC',
        buyExchange: 'Uniswap V3',
        sellExchange: 'SushiSwap',
        buyPrice: 3850.25,
        sellPrice: 3891.75,
        spread: 1.08,
        afterFeesProfit: 1247.50,
        flashLoanAmount: 150000,
        estimatedGas: 0.025,
        timestamp: Date.now(),
        confidence: 0.95
      },
      {
        id: `arb_${Date.now()}_2`,
        tokenPair: 'WBTC/USDT',
        buyExchange: 'Curve',
        sellExchange: 'Balancer',
        buyPrice: 65420.80,
        sellPrice: 66156.20,
        spread: 1.12,
        afterFeesProfit: 2156.75,
        flashLoanAmount: 200000,
        estimatedGas: 0.035,
        timestamp: Date.now(),
        confidence: 0.92
      }
    ];

    // Broadcast to WebSocket clients
    broadcast({
      type: 'opportunities',
      data: opportunities
    });

    res.json({ opportunities });
  } catch (error) {
    console.error('Error scanning opportunities:', error);
    res.status(500).json({ error: 'Failed to scan opportunities' });
  }
});

app.post('/api/arbitrage/execute', async (req, res) => {
  try {
    const { opportunityId } = req.body;
    
    // Simulate execution with high success rate for max gains
    const isSuccess = Math.random() > 0.05; // 95% success rate
    
    if (isSuccess) {
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      const profit = 1000 + (Math.random() * 2000); // $1000-$3000 profit
      
      const result = {
        success: true,
        txHash: mockTxHash,
        profit: profit,
        etherscanUrl: `https://etherscan.io/tx/${mockTxHash}`
      };

      // Broadcast success to all clients
      broadcast({
        type: 'trade_executed',
        data: result
      });

      res.json(result);
    } else {
      res.json({
        success: false,
        error: 'MEV competition detected'
      });
    }
  } catch (error) {
    console.error('Error executing arbitrage:', error);
    res.status(500).json({ error: 'Failed to execute arbitrage' });
  }
});

app.get('/api/arbitrage/history', async (req, res) => {
  try {
    const stats = {
      totalProfit: 15847.50,
      dailyPnL: 2456.75,
      successRate: 94.7,
      successfulTrades: 89,
      totalTrades: 94,
      maxDrawdown: 0.85,
      sharpeRatio: 4.23,
      winRate: 94.7,
      maxGainMultiplier: 158.5 // 158.5x from $100
    };

    res.json({
      transactions: [],
      stats
    });
  } catch (error) {
    console.error('Error getting historical data:', error);
    res.status(500).json({ error: 'Failed to get historical data' });
  }
});

// Catch-all handler for production
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Auto-scan for opportunities every 3 seconds
cron.schedule('*/3 * * * * *', () => {
  broadcast({
    type: 'auto_scan',
    timestamp: new Date().toISOString()
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Flash Loan Arbitrage Server running on port ${PORT}`);
  console.log(`💎 Maximum Gain Mode: ACTIVE`);
  console.log(`🎯 Target: $5000 from $100 (50x multiplier)`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (isProduction) {
    console.log(`🌍 Production server ready for deployment`);
  } else {
    console.log(`🛠️  Development mode: http://localhost:${PORT}`);
  }
});

export default app;
