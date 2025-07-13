
const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const WS_PORT = process.env.WS_PORT || 5001;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Environment variables check
const requiredEnvVars = [
  'REACT_APP_ETHEREUM_RPC_URL',
  'REACT_APP_PRIVATE_KEY',
  'DISCORD_BOT_TOKEN',
  'TELEGRAM_BOT_TOKEN'
];

const envStatus = {};
requiredEnvVars.forEach(varName => {
  envStatus[varName] = process.env[varName] ? '✅ Set' : '❌ Missing';
});

// Trading simulation data
let tradingStats = {
  totalProfit: 0,
  successfulTrades: 0,
  failedTrades: 0,
  isRunning: false,
  currentOpportunities: []
};

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  // Send current stats
  ws.send(JSON.stringify({
    type: 'stats',
    data: tradingStats
  }));
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    environment: envStatus,
    tradingStats,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/start-trading', (req, res) => {
  tradingStats.isRunning = true;
  broadcast({ type: 'status', data: { isRunning: true } });
  
  // Simulate trading activity
  const tradingInterval = setInterval(() => {
    if (!tradingStats.isRunning) {
      clearInterval(tradingInterval);
      return;
    }
    
    // Simulate finding opportunities
    const profit = Math.random() * 100 - 20; // -20 to 80
    const isSuccess = profit > 0;
    
    if (isSuccess) {
      tradingStats.successfulTrades++;
      tradingStats.totalProfit += profit;
    } else {
      tradingStats.failedTrades++;
    }
    
    broadcast({ 
      type: 'trade', 
      data: { 
        profit: profit.toFixed(2), 
        isSuccess, 
        timestamp: new Date().toISOString() 
      }
    });
    
    broadcast({ type: 'stats', data: tradingStats });
  }, 5000);
  
  res.json({ success: true, message: 'Trading started' });
});

app.post('/api/stop-trading', (req, res) => {
  tradingStats.isRunning = false;
  broadcast({ type: 'status', data: { isRunning: false } });
  res.json({ success: true, message: 'Trading stopped' });
});

// Main dashboard route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LullaByte Trading Dashboard</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); 
                color: #fff; 
                min-height: 100vh;
            }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { 
                font-size: 2.5rem; 
                background: linear-gradient(45deg, #00ff88, #0088ff); 
                -webkit-background-clip: text; 
                -webkit-text-fill-color: transparent;
                margin-bottom: 10px;
            }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .card { 
                background: rgba(255, 255, 255, 0.1); 
                border-radius: 15px; 
                padding: 20px; 
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: transform 0.3s ease;
            }
            .card:hover { transform: translateY(-5px); }
            .card h3 { 
                color: #00ff88; 
                margin-bottom: 15px; 
                font-size: 1.3rem;
            }
            .status-item { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 10px; 
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .btn { 
                background: linear-gradient(45deg, #00ff88, #0088ff); 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 25px; 
                cursor: pointer; 
                font-size: 1rem;
                margin: 5px;
                transition: all 0.3s ease;
            }
            .btn:hover { 
                transform: scale(1.05); 
                box-shadow: 0 10px 20px rgba(0, 255, 136, 0.3);
            }
            .btn:disabled { 
                background: #666; 
                cursor: not-allowed; 
                transform: none;
            }
            .profit { color: #00ff88; font-weight: bold; font-size: 1.2rem; }
            .loss { color: #ff4444; font-weight: bold; font-size: 1.2rem; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            .stat-box { 
                background: rgba(0, 255, 136, 0.1); 
                padding: 15px; 
                border-radius: 10px; 
                text-align: center;
            }
            .stat-value { 
                font-size: 1.5rem; 
                font-weight: bold; 
                color: #00ff88; 
            }
            .trade-log { 
                max-height: 300px; 
                overflow-y: auto; 
                background: rgba(0, 0, 0, 0.3); 
                padding: 15px; 
                border-radius: 10px;
                margin-top: 15px;
            }
            .trade-entry { 
                padding: 8px; 
                margin-bottom: 8px; 
                border-radius: 5px; 
                background: rgba(255, 255, 255, 0.05);
            }
            .status-indicator { 
                width: 12px; 
                height: 12px; 
                border-radius: 50%; 
                display: inline-block; 
                margin-right: 8px;
            }
            .running { background: #00ff88; }
            .stopped { background: #ff4444; }
            .pulse { 
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 LullaByte Trading Dashboard</h1>
                <p>Real-time Flash Loan Arbitrage System</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>🔧 System Status</h3>
                    <div id="env-status">
                        ${Object.entries(envStatus).map(([key, value]) => `
                            <div class="status-item">
                                <span>${key}:</span>
                                <span>${value}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="status-item">
                        <span>Trading Engine:</span>
                        <span>
                            <span class="status-indicator stopped" id="status-indicator"></span>
                            <span id="engine-status">Stopped</span>
                        </span>
                    </div>
                </div>
                
                <div class="card">
                    <h3>📊 Trading Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-box">
                            <div class="stat-value" id="total-profit">$0.00</div>
                            <div>Total Profit</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value" id="successful-trades">0</div>
                            <div>Successful</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value" id="failed-trades">0</div>
                            <div>Failed</div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>🎮 Trading Controls</h3>
                    <button class="btn" id="start-btn" onclick="startTrading()">
                        🚀 Start Trading
                    </button>
                    <button class="btn" id="stop-btn" onclick="stopTrading()" disabled>
                        ⏹️ Stop Trading
                    </button>
                    <button class="btn" onclick="refreshStatus()">
                        🔄 Refresh Status
                    </button>
                </div>
            </div>
            
            <div class="card" style="margin-top: 20px;">
                <h3>📈 Live Trade Log</h3>
                <div class="trade-log" id="trade-log">
                    <div class="trade-entry">🔄 System ready for trading...</div>
                </div>
            </div>
        </div>

        <script>
            let ws;
            let isConnected = false;
            
            function connectWebSocket() {
                const wsUrl = window.location.protocol === 'https:' ? 
                    'wss://' + window.location.host + ':${WS_PORT}' : 
                    'ws://' + window.location.hostname + ':${WS_PORT}';
                
                ws = new WebSocket(wsUrl);
                
                ws.onopen = function() {
                    isConnected = true;
                    console.log('Connected to WebSocket');
                    addToLog('🔗 Connected to real-time updates');
                };
                
                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    handleWebSocketMessage(data);
                };
                
                ws.onclose = function() {
                    isConnected = false;
                    console.log('Disconnected from WebSocket');
                    setTimeout(connectWebSocket, 3000);
                };
                
                ws.onerror = function(error) {
                    console.error('WebSocket error:', error);
                };
            }
            
            function handleWebSocketMessage(data) {
                switch(data.type) {
                    case 'stats':
                        updateStats(data.data);
                        break;
                    case 'trade':
                        addTradeToLog(data.data);
                        break;
                    case 'status':
                        updateEngineStatus(data.data.isRunning);
                        break;
                }
            }
            
            function updateStats(stats) {
                document.getElementById('total-profit').textContent = '$' + stats.totalProfit.toFixed(2);
                document.getElementById('successful-trades').textContent = stats.successfulTrades;
                document.getElementById('failed-trades').textContent = stats.failedTrades;
                
                const profitEl = document.getElementById('total-profit');
                profitEl.className = stats.totalProfit >= 0 ? 'stat-value profit' : 'stat-value loss';
            }
            
            function updateEngineStatus(isRunning) {
                const indicator = document.getElementById('status-indicator');
                const status = document.getElementById('engine-status');
                const startBtn = document.getElementById('start-btn');
                const stopBtn = document.getElementById('stop-btn');
                
                if (isRunning) {
                    indicator.className = 'status-indicator running pulse';
                    status.textContent = 'Running';
                    startBtn.disabled = true;
                    stopBtn.disabled = false;
                } else {
                    indicator.className = 'status-indicator stopped';
                    status.textContent = 'Stopped';
                    startBtn.disabled = false;
                    stopBtn.disabled = true;
                }
            }
            
            function addToLog(message) {
                const log = document.getElementById('trade-log');
                const entry = document.createElement('div');
                entry.className = 'trade-entry';
                entry.innerHTML = new Date().toLocaleTimeString() + ' - ' + message;
                log.appendChild(entry);
                log.scrollTop = log.scrollHeight;
            }
            
            function addTradeToLog(trade) {
                const profitClass = trade.isSuccess ? 'profit' : 'loss';
                const icon = trade.isSuccess ? '✅' : '❌';
                addToLog(icon + ' Trade ' + (trade.isSuccess ? 'SUCCESS' : 'FAILED') + 
                        ' - <span class="' + profitClass + '">$' + trade.profit + '</span>');
            }
            
            async function startTrading() {
                try {
                    const response = await fetch('/api/start-trading', { method: 'POST' });
                    const data = await response.json();
                    addToLog('🚀 Trading engine started');
                } catch (error) {
                    addToLog('❌ Error starting trading: ' + error.message);
                }
            }
            
            async function stopTrading() {
                try {
                    const response = await fetch('/api/stop-trading', { method: 'POST' });
                    const data = await response.json();
                    addToLog('⏹️ Trading engine stopped');
                } catch (error) {
                    addToLog('❌ Error stopping trading: ' + error.message);
                }
            }
            
            async function refreshStatus() {
                try {
                    const response = await fetch('/api/status');
                    const data = await response.json();
                    addToLog('🔄 Status refreshed');
                } catch (error) {
                    addToLog('❌ Error refreshing status: ' + error.message);
                }
            }
            
            // Initialize
            connectWebSocket();
            refreshStatus();
        </script>
    </body>
    </html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎯 LullaByte Dashboard running on port ${PORT}`);
  console.log(`🔗 WebSocket server running on port ${WS_PORT}`);
  console.log('🌐 Dashboard: http://localhost:' + PORT);
  console.log('\n📊 Environment Status:');
  Object.entries(envStatus).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
});
