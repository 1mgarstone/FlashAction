
const { ethers } = require('ethers');
const https = require('https');
const http = require('http');

class ConnectionTester {
  constructor() {
    this.tests = [];
  }

  log(status, message) {
    const symbol = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${symbol} ${message}`);
    this.tests.push({ status, message });
  }

  async testBasicConnectivity() {
    console.log('🔍 TESTING BASIC CONNECTIVITY');
    console.log('============================');

    // Test Node.js environment
    try {
      this.log('pass', `Node.js version: ${process.version}`);
    } catch (error) {
      this.log('fail', 'Node.js not available');
    }

    // Test internet connectivity
    try {
      await this.testHttpConnection('https://google.com');
      this.log('pass', 'Internet connectivity working');
    } catch (error) {
      this.log('fail', 'No internet connectivity');
    }

    // Test Ethereum RPC connectivity
    await this.testEthereumRPC();

    // Test local server capability
    await this.testLocalServer();
  }

  async testHttpConnection(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const request = client.get(url, (response) => {
        if (response.statusCode === 200 || response.statusCode === 301 || response.statusCode === 302) {
          resolve(response.statusCode);
        } else {
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      });
      
      request.on('error', reject);
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Timeout'));
      });
    });
  }

  async testEthereumRPC() {
    const rpcUrls = [
      'https://eth-mainnet.g.alchemy.com/v2/demo',
      'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://ethereum-rpc.publicnode.com'
    ];

    for (const rpcUrl of rpcUrls) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const blockNumber = await provider.getBlockNumber();
        this.log('pass', `Ethereum RPC working - Block: ${blockNumber} (${rpcUrl.split('/')[2]})`);
        return;
      } catch (error) {
        this.log('warn', `RPC failed: ${rpcUrl.split('/')[2]} - ${error.message}`);
      }
    }
    this.log('fail', 'All Ethereum RPC endpoints failed');
  }

  async testLocalServer() {
    try {
      const server = http.createServer((req, res) => {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Connection test successful!');
      });

      await new Promise((resolve, reject) => {
        server.listen(8080, '0.0.0.0', () => {
          this.log('pass', 'Local server can bind to port 8080');
          server.close(resolve);
        });
        server.on('error', reject);
      });
    } catch (error) {
      this.log('fail', `Local server test failed: ${error.message}`);
    }
  }

  async testArbitrageComponents() {
    console.log('\n🔧 TESTING ARBITRAGE COMPONENTS');
    console.log('===============================');

    // Test if key files exist
    const fs = require('fs');
    const keyFiles = [
      'package.json',
      'ArbitrageEngine-main/package.json',
      'agent/package.json',
      'src/App.tsx'
    ];

    for (const file of keyFiles) {
      if (fs.existsSync(file)) {
        this.log('pass', `${file} exists`);
      } else {
        this.log('warn', `${file} missing`);
      }
    }

    // Test if node_modules exist
    if (fs.existsSync('node_modules')) {
      this.log('pass', 'Dependencies installed');
    } else {
      this.log('warn', 'Dependencies may need installation');
    }
  }

  async runAllTests() {
    console.log('🚀 ARBITRAGE TRADING CONNECTION TEST');
    console.log('===================================\n');

    await this.testBasicConnectivity();
    await this.testArbitrageComponents();

    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    const passed = this.tests.filter(t => t.status === 'pass').length;
    const failed = this.tests.filter(t => t.status === 'fail').length;
    const warnings = this.tests.filter(t => t.status === 'warn').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);

    if (failed === 0) {
      console.log('\n🎉 CONNECTION TEST SUCCESSFUL!');
      console.log('Your system is ready for arbitrage trading.');
    } else {
      console.log('\n⚠️  Some issues detected. Check failed tests above.');
    }
  }
}

// Run the test
const tester = new ConnectionTester();
tester.runAllTests().catch(console.error);
