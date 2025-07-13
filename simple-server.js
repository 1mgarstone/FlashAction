
const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;

// Serve static files
app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web-dashboard.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dashboard server running at http://0.0.0.0:${PORT}`);
    console.log('📱 You can now test the wallet connection and dashboard!');
    console.log('💡 Open the URL above to see your arbitrage trading interface');
});
</app.use>

module.exports = app;
