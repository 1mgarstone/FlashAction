// Smart Gas Oracle - Pulls live Gwei values and optimizes gas costs
const { ethers } = require('ethers');

class GasOracle {
  constructor() {
    this.blocknativeApiKey = process.env.BLOCKNATIVE_API_KEY;
    this.alchemyApiKey = process.env.ALCHEMY_API_KEY;
    this.fallbackGasPrice = ethers.utils.parseUnits('50', 'gwei');
    this.cache = {
      gasPrice: null,
      timestamp: 0,
      cacheDuration: 30000 // 30 seconds
    };
  }

  // Get live gas prices from multiple sources
  async getLiveGasPrice() {
    // Check cache first
    if (this.cache.gasPrice && (Date.now() - this.cache.timestamp) < this.cache.cacheDuration) {
      return this.cache.gasPrice;
    }

    try {
      // Try Blocknative first
      const blocknativePrice = await this.getBlocknativeGasPrice();
      if (blocknativePrice) {
        this.updateCache(blocknativePrice);
        return blocknativePrice;
      }

      // Fallback to Alchemy
      const alchemyPrice = await this.getAlchemyGasPrice();
      if (alchemyPrice) {
        this.updateCache(alchemyPrice);
        return alchemyPrice;
      }

      // Fallback to network estimation
      const networkPrice = await this.getNetworkGasPrice();
      if (networkPrice) {
        this.updateCache(networkPrice);
        return networkPrice;
      }

      // Use fallback price
      console.warn('All gas oracles failed, using fallback price');
      return this.fallbackGasPrice;

    } catch (error) {
      console.error('Gas oracle error:', error.message);
      return this.fallbackGasPrice;
    }
  }

  // Blocknative Gas API
  async getBlocknativeGasPrice() {
    if (!this.blocknativeApiKey) {
      return null;
    }

    try {
      const response = await fetch('https://api.blocknative.com/gasprices/blockprices', {
        headers: {
          'Authorization': this.blocknativeApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Blocknative API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Use the "fast" gas price (usually confirmed within 1-2 blocks)
      const fastGasPrice = data.blockPrices[0]?.estimatedPrices?.find(p => p.confidence === 90);
      
      if (fastGasPrice) {
        return ethers.utils.parseUnits(fastGasPrice.price.toString(), 'gwei');
      }

      return null;
    } catch (error) {
      console.error('Blocknative gas price error:', error.message);
      return null;
    }
  }

  // Alchemy Gas API
  async getAlchemyGasPrice() {
    if (!this.alchemyApiKey) {
      return null;
    }

    try {
      const response = await fetch(`https://eth-mainnet.alchemyapi.io/v2/${this.alchemyApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1
        })
      });

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.result) {
        // Add 10% buffer to network gas price for faster confirmation
        const gasPrice = ethers.BigNumber.from(data.result);
        return gasPrice.mul(110).div(100);
      }

      return null;
    } catch (error) {
      console.error('Alchemy gas price error:', error.message);
      return null;
    }
  }

  // Network-based gas price estimation
  async getNetworkGasPrice() {
    try {
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
      const gasPrice = await provider.getGasPrice();
      
      // Add 20% buffer for faster confirmation
      return gasPrice.mul(120).div(100);
    } catch (error) {
      console.error('Network gas price error:', error.message);
      return null;
    }
  }

  // Update cache
  updateCache(gasPrice) {
    this.cache.gasPrice = gasPrice;
    this.cache.timestamp = Date.now();
  }

  // Calculate gas cost as percentage of trade value
  calculateGasCostPercent(gasPrice, estimatedGas, tradeValue) {
    const gasCost = gasPrice.mul(estimatedGas);
    const gasCostEth = parseFloat(ethers.utils.formatEther(gasCost));
    const tradeValueEth = parseFloat(ethers.utils.formatEther(tradeValue));
    
    if (tradeValueEth === 0) return 100; // Avoid division by zero
    
    return (gasCostEth / tradeValueEth) * 100;
  }

  // Get optimized gas parameters for EIP-1559
  async getOptimizedGasParams() {
    try {
      const gasPrice = await this.getLiveGasPrice();
      
      // For EIP-1559 transactions
      const maxFeePerGas = gasPrice;
      const maxPriorityFeePerGas = ethers.utils.parseUnits('2', 'gwei'); // 2 gwei tip
      
      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasPrice: gasPrice, // For legacy transactions
        type: 2 // EIP-1559 transaction type
      };
    } catch (error) {
      console.error('Gas optimization error:', error.message);
      return {
        gasPrice: this.fallbackGasPrice,
        type: 0 // Legacy transaction
      };
    }
  }

  // Estimate gas for arbitrage transaction
  async estimateArbitrageGas(tokenPair, amount) {
    // Base gas estimates for different operations
    const baseGas = {
      flashLoan: 100000,
      swap1: 150000,
      swap2: 150000,
      repayment: 50000,
      buffer: 50000
    };

    // Calculate total estimated gas
    const totalGas = Object.values(baseGas).reduce((sum, gas) => sum + gas, 0);
    
    return ethers.BigNumber.from(totalGas.toString());
  }

  // Check if gas price is acceptable for trading
  async isGasPriceAcceptable(maxGasPrice) {
    const currentGasPrice = await this.getLiveGasPrice();
    return currentGasPrice.lte(maxGasPrice);
  }

  // Get gas price trend (increasing/decreasing)
  async getGasPriceTrend() {
    // This would require historical data - simplified implementation
    const currentPrice = await this.getLiveGasPrice();
    
    // Wait 30 seconds and check again
    await new Promise(resolve => setTimeout(resolve, 30000));
    const newPrice = await this.getLiveGasPrice();
    
    if (newPrice.gt(currentPrice)) {
      return 'increasing';
    } else if (newPrice.lt(currentPrice)) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  // Get formatted gas price for display
  async getFormattedGasPrice() {
    const gasPrice = await this.getLiveGasPrice();
    const gwei = ethers.utils.formatUnits(gasPrice, 'gwei');
    
    return {
      wei: gasPrice.toString(),
      gwei: parseFloat(gwei).toFixed(1),
      formatted: `${parseFloat(gwei).toFixed(1)} gwei`
    };
  }

  // Monitor gas prices and alert on significant changes
  startGasMonitoring(callback, threshold = 10) {
    let lastPrice = null;
    
    const monitor = async () => {
      try {
        const currentPrice = await this.getLiveGasPrice();
        
        if (lastPrice) {
          const change = currentPrice.sub(lastPrice);
          const changePercent = change.mul(100).div(lastPrice).toNumber();
          
          if (Math.abs(changePercent) >= threshold) {
            callback({
              oldPrice: lastPrice,
              newPrice: currentPrice,
              change: change,
              changePercent: changePercent,
              direction: change.gt(0) ? 'increase' : 'decrease'
            });
          }
        }
        
        lastPrice = currentPrice;
      } catch (error) {
        console.error('Gas monitoring error:', error.message);
      }
    };

    // Monitor every 30 seconds
    const interval = setInterval(monitor, 30000);
    
    // Return function to stop monitoring
    return () => clearInterval(interval);
  }
}

module.exports = GasOracle;