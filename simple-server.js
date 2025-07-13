
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
        <title>VelocityStrike Dashboard</title>
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
        <h1>🚀 VelocityStrike Trading Dashboard</h1>
        
        <div class="card">
            <h3>Agent Status</h3>
            <div id="status">Loading...</div>
            <button onclick="startAgent()">Start Agent</button>
            <button onclick="stopAgent()">Stop Agent</button>
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
        
        <script>
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
                        data.slice(0, 3).forEach(opp => {
                            html += '<div>💰 ' + opp.pairs.join('/') + ' - <span class="profit">$' + opp.profit.toFixed(2) + '</span></div>';
                        });
                    }
                    document.getElementById('opportunities').innerHTML = html;
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
  console.log(`🚀 VelocityStrike Dashboard running on port ${PORT}`);
  console.log(`💻 Access at: http://localhost:${PORT}`);
});
