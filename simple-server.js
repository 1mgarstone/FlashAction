const express = require('express');
const path = require('path');
const TradingAgent = require('./agent/agent.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize trading agent
const tradingAgent = new TradingAgent();

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// API endpoints for trading data
app.get('/api/status', async (req, res) => {
  try {
    const status = await tradingAgent.getAgentStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/opportunities', async (req, res) => {
  try {
    const opportunities = await tradingAgent.scanOpportunities();
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/portfolio', async (req, res) => {
  try {
    const portfolio = await tradingAgent.getPortfolioStatus();
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/execute', async (req, res) => {
  try {
    const { strategy, amount } = req.body;
    const result = await tradingAgent.executeTrade(strategy, amount, []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/start', async (req, res) => {
  try {
    await tradingAgent.startAgent();
    res.json({ success: true, message: 'Agent started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stop', async (req, res) => {
  try {
    await tradingAgent.stopAgent();
    res.json({ success: true, message: 'Agent stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple HTML dashboard
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>LullaByte Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }
            .card { background: #2d2d2d; padding: 20px; margin: 10px 0; border-radius: 8px; }
            .status { color: #00ff00; }
            .error { color: #ff0000; }
            button { background: #007bff; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .profit { color: #00ff88; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>🎯 Trading Dashboard</h1>

        <div class="card">
            <h3>Agent Status</h3>
            <div id="status">Loading...</div>
            <button onclick="startAgent()">Start Agent</button>
            <button onclick="stopAgent()">Stop Agent</button>

            <div style="margin-top: 15px; padding: 10px; background: #333; border-radius: 5px;">
                <h4>📡 Network Monitor</h4>
                <p id="heartbeat-status">Monitoring: Off</p>
                <button id="heartbeat-toggle" onclick="toggleHeartbeat()">Start Monitor</button>
                <div style="margin-top: 10px; font-size: 12px; color: #888;">
                    • Tick every 3 seconds = Scanning active<br>
                    • Ping = Opportunity found<br>
                    • Alert = Attention needed
                </div>
            </div>
        </div>

        <div class="card">
            <h3>Current Opportunities</h3>
            <div id="opportunities">Loading...</div>
            <button onclick="refreshOpportunities()">Refresh</button>
        </div>

        <div class="card">
            <h3>Portfolio</h3>
            <div id="portfolio">Loading...</div>
        </div>

        <div class="card">
            <h3>Trading Metrics</h3>
            <div>
                <strong>🚀 Leverage:</strong> 1400x (Sweet Spot)<br>
                <strong>⚡ Active Trades:</strong> <span id="activeTrades">0</span><br>
                <strong>🎯 Genetic Success Rate:</strong> <span id="successRate">0%</span><br>
                <strong>💰 Sustainable Profit:</strong> <span id="avgProfit">$0</span><br>
                <strong>🧬 Pattern Recognition:</strong> <span style="color: #4ade80;">Learning</span>
            </div>
        </div>

        <script>
            let isAgentRunning = false;
            let isHeartbeatActive = false;
            let heartbeatInterval = null;

            // Create audio contexts for gentle sounds
            const createBeep = (freq, duration, volume = 0.1) => {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                oscillator.frequency.value = freq;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + duration);
            };

            const playHeartbeat = () => createBeep(220, 0.1, 0.05); // Gentle low tone
            const playPing = () => createBeep(800, 0.2, 0.1); // Happy success
            const playError = () => createBeep(150, 0.3, 0.08); // Soft warning

            function toggleHeartbeat() {
                const button = document.getElementById('heartbeat-toggle');
                const status = document.getElementById('heartbeat-status');

                if (!isHeartbeatActive) {
                    isHeartbeatActive = true;
                    button.textContent = 'Stop Heartbeat';
                    status.textContent = 'Monitoring: 💓 Active';

                    heartbeatInterval = setInterval(() => {
                        playHeartbeat();
                        console.log('📡 Network monitor - scanning active');
                    }, 3000);

                    console.log('📡 Network monitor started');
                } else {
                    isHeartbeatActive = false;
                    button.textContent = 'Start Heartbeat';
                    status.textContent = 'Monitoring: Off';

                    if (heartbeatInterval) {
                        clearInterval(heartbeatInterval);
                        heartbeatInterval = null;
                    }

                    console.log('📡 Network monitor stopped');
                }
            }

            async function fetchStatus() {
                try {
                    const response = await fetch('/api/status');
                    const data = await response.json();
                    document.getElementById('status').innerHTML = 
                        '<span class="' + (data.isRunning ? 'status' : 'error') + '">' +
                        (data.isRunning ? '🟢 Active' : '🔴 Stopped') + '</span>';
                } catch (error) {
                    document.getElementById('status').innerHTML = '<span class="error">Error: ' + error.message + '</span>';
                }
            }

            async function refreshOpportunities() {
                try {
                    const response = await fetch('/api/opportunities');
                    const data = await response.json();
                    let html = '';
                    if (data.length === 0) {
                        html = 'No opportunities found';
                    } else {
                    const opportunities = await response.json();

                    // Play ping if new profitable opportunities found
                    if (opportunities.length > 0 && isHeartbeatActive) {
                        playPing();
                        console.log('📡 Network found opportunities!');
                    }

                    document.getElementById('opportunities').innerHTML = 
                        opportunities.map(op => 
                            '<div>💰 ' + op.pairs.join('/') + ' - $' + op.profit + ' profit (' + Math.round(op.confidence * 100) + '% confidence)</div>'
                        ).join('');
                }
                } catch (error) {
                    document.getElementById('opportunities').innerHTML = '<span class="error">Error: ' + error.message + '</span>';
                }
            }

            async function startAgent() {
                try {
                    await fetch('/api/start', { method: 'POST' });
                    fetchStatus();
                } catch (error) {
                    alert('Error starting agent: ' + error.message);
                }
            }

            async function stopAgent() {
                try {
                    await fetch('/api/stop', { method: 'POST' });
                    fetchStatus();
                } catch (error) {
                    alert('Error stopping agent: ' + error.message);
                }
            }

            // Auto-refresh every 10 seconds
            setInterval(() => {
                fetchStatus();
                refreshOpportunities();
            }, 10000);

            // Initial load
            fetchStatus();
            refreshOpportunities();
        </script>
    </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎯 Trading Dashboard running on port ${PORT}`);
  console.log(`💻 Access at: http://localhost:${PORT}`);
});