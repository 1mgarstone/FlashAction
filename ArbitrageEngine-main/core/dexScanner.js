// DEX Scanner - Real-time spread detection across multiple DEXs
const { ethers } = require('ethers');

class DEXScanner {
  constructor() {
    this.dexes = {
      uniswapV2: {
        name: 'Uniswap V2',
        router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
        fee: 0.003 // 0.3%
      },
      uniswapV3: {
        name: 'Uniswap V3',
        router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        fees: [0.0005, 0.003, 0.01] // 0.05%, 0.3%, 1%
      },
      sushiswap: {
        name: 'SushiSwap',
        router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
        factory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
        fee: 0.003 // 0.3%
      },
      pancakeswap: {
        name: 'PancakeSwap',
        router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
        factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
        fee: 0.0025 // 0.25%
      },
      curve: {
        name: 'Curve',
        registry: '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5',
        fee: 0.0004 // 0.04% average
      },
      balancer: {
        name: 'Balancer',
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        fee: 0.001 // Variable, 0.1% average
      },
      oneinch: {
        name: '1inch',
        aggregator: '0x1111111254EEB25477B68fb85Ed929f73A960582',
        apiUrl: 'https://api.1inch.io/v5.0/1'
      }
    };

    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.cache = new Map();
    this.cacheDuration = 10000; // 10 seconds cache for prices
  }

  // Get spread between DEXs for a token pair
  async getSpread(tokenPair, amount = ethers.utils.parseEther('1')) {
    const cacheKey = `spread-${tokenPair}-${amount.toString()}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.spread;
      }
    }

    try {
      const [tokenA, tokenB] = tokenPair.split('/');
      const prices = await this.getAllPrices(tokenA, tokenB, amount);
      
      if (prices.length < 2) {
        return 0; // Need at least 2 prices to calculate spread
      }

      // Sort prices to find highest and lowest
      const sortedPrices = prices.sort((a, b) => b.price - a.price);
      const highest = sortedPrices[0];
      const lowest = sortedPrices[sortedPrices.length - 1];

      // Calculate spread percentage
      const spread = ((highest.price - lowest.price) / lowest.price) * 100;

      // Cache result
      this.cache.set(cacheKey, {
        spread,
        highest,
        lowest,
        allPrices: prices,
        timestamp: Date.now()
      });

      return spread;
    } catch (error) {
      console.error('Error calculating spread:', error.message);
      return 0;
    }
  }

  // Get prices from all DEXs
  async getAllPrices(tokenA, tokenB, amount) {
    const pricePromises = [
      this.getUniswapV2Price(tokenA, tokenB, amount),
      this.getUniswapV3Price(tokenA, tokenB, amount),
      this.getSushiSwapPrice(tokenA, tokenB, amount),
      this.getBalancerPrice(tokenA, tokenB, amount),
      this.get1inchPrice(tokenA, tokenB, amount)
    ];

    const results = await Promise.allSettled(pricePromises);
    
    return results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value);
  }

  // Get Uniswap V2 price
  async getUniswapV2Price(tokenA, tokenB, amount) {
    try {
      const routerABI = [
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
      ];

      const router = new ethers.Contract(this.dexes.uniswapV2.router, routerABI, this.provider);
      const path = [this.getTokenAddress(tokenA), this.getTokenAddress(tokenB)];
      
      const amounts = await router.getAmountsOut(amount, path);
      const outputAmount = amounts[amounts.length - 1];
      const price = parseFloat(ethers.utils.formatEther(outputAmount));

      return {
        dex: 'Uniswap V2',
        price,
        outputAmount,
        fee: this.dexes.uniswapV2.fee
      };
    } catch (error) {
      console.error('Uniswap V2 price error:', error.message);
      return null;
    }
  }

  // Get Uniswap V3 price
  async getUniswapV3Price(tokenA, tokenB, amount) {
    try {
      const quoterABI = [
        'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)'
      ];

      const quoter = new ethers.Contract('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6', quoterABI, this.provider);
      
      // Try different fee tiers
      const fees = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
      let bestPrice = 0;
      let bestOutput = ethers.BigNumber.from(0);

      for (const fee of fees) {
        try {
          const outputAmount = await quoter.callStatic.quoteExactInputSingle(
            this.getTokenAddress(tokenA),
            this.getTokenAddress(tokenB),
            fee,
            amount,
            0
          );

          const price = parseFloat(ethers.utils.formatEther(outputAmount));
          if (price > bestPrice) {
            bestPrice = price;
            bestOutput = outputAmount;
          }
        } catch (feeError) {
          // Fee tier might not exist, continue
        }
      }

      if (bestPrice > 0) {
        return {
          dex: 'Uniswap V3',
          price: bestPrice,
          outputAmount: bestOutput,
          fee: 0.003 // Average fee
        };
      }

      return null;
    } catch (error) {
      console.error('Uniswap V3 price error:', error.message);
      return null;
    }
  }

  // Get SushiSwap price
  async getSushiSwapPrice(tokenA, tokenB, amount) {
    try {
      const routerABI = [
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
      ];

      const router = new ethers.Contract(this.dexes.sushiswap.router, routerABI, this.provider);
      const path = [this.getTokenAddress(tokenA), this.getTokenAddress(tokenB)];
      
      const amounts = await router.getAmountsOut(amount, path);
      const outputAmount = amounts[amounts.length - 1];
      const price = parseFloat(ethers.utils.formatEther(outputAmount));

      return {
        dex: 'SushiSwap',
        price,
        outputAmount,
        fee: this.dexes.sushiswap.fee
      };
    } catch (error) {
      console.error('SushiSwap price error:', error.message);
      return null;
    }
  }

  // Get Balancer price
  async getBalancerPrice(tokenA, tokenB, amount) {
    try {
      // Simplified Balancer price fetching
      // In practice, this would involve more complex pool queries
      const vaultABI = [
        'function getPoolTokens(bytes32 poolId) external view returns (address[] memory tokens, uint256[] memory balances, uint256 lastChangeBlock)'
      ];

      // This is a simplified implementation
      // Real implementation would need to find the appropriate pool and calculate price
      return {
        dex: 'Balancer',
        price: 0, // Placeholder
        outputAmount: ethers.BigNumber.from(0),
        fee: this.dexes.balancer.fee
      };
    } catch (error) {
      console.error('Balancer price error:', error.message);
      return null;
    }
  }

  // Get 1inch aggregated price
  async get1inchPrice(tokenA, tokenB, amount) {
    try {
      const tokenAAddress = this.getTokenAddress(tokenA);
      const tokenBAddress = this.getTokenAddress(tokenB);
      
      const url = `${this.dexes.oneinch.apiUrl}/quote?fromTokenAddress=${tokenAAddress}&toTokenAddress=${tokenBAddress}&amount=${amount.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`1inch API error: ${response.status}`);
      }

      const data = await response.json();
      const price = parseFloat(ethers.utils.formatEther(data.toTokenAmount));

      return {
        dex: '1inch',
        price,
        outputAmount: ethers.BigNumber.from(data.toTokenAmount),
        fee: 0.001 // Estimated average fee
      };
    } catch (error) {
      console.error('1inch price error:', error.message);
      return null;
    }
  }

  // Get token address from symbol
  getTokenAddress(symbol) {
    const tokenAddresses = {
      'ETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'USDC': '0xA0b86a33E6417c4c4c4c4c4c4c4c4c4c4c4c4c4c', // Placeholder
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
    };

    return tokenAddresses[symbol.toUpperCase()] || symbol;
  }

  // Find best arbitrage opportunity
  async findBestArbitrageOpportunity(tokenPairs, minSpread = 0.5) {
    const opportunities = [];

    for (const pair of tokenPairs) {
      try {
        const spread = await this.getSpread(pair);
        
        if (spread >= minSpread) {
          const cacheKey = `spread-${pair}-${ethers.utils.parseEther('1').toString()}`;
          const cached = this.cache.get(cacheKey);
          
          opportunities.push({
            pair,
            spread,
            buyDex: cached?.lowest?.dex,
            sellDex: cached?.highest?.dex,
            buyPrice: cached?.lowest?.price,
            sellPrice: cached?.highest?.price,
            estimatedProfit: spread
          });
        }
      } catch (error) {
        console.error(`Error checking ${pair}:`, error.message);
      }
    }

    // Sort by spread (highest first)
    return opportunities.sort((a, b) => b.spread - a.spread);
  }

  // Monitor spreads continuously
  startSpreadMonitoring(tokenPairs, callback, interval = 15000) {
    const monitor = async () => {
      try {
        const opportunities = await this.findBestArbitrageOpportunity(tokenPairs, 0.1);
        callback(opportunities);
      } catch (error) {
        console.error('Spread monitoring error:', error.message);
      }
    };

    // Initial check
    monitor();

    // Set up interval
    const intervalId = setInterval(monitor, interval);

    // Return function to stop monitoring
    return () => clearInterval(intervalId);
  }

  // Get detailed price analysis
  async getPriceAnalysis(tokenPair, amount = ethers.utils.parseEther('1')) {
    const [tokenA, tokenB] = tokenPair.split('/');
    const prices = await this.getAllPrices(tokenA, tokenB, amount);

    if (prices.length === 0) {
      return null;
    }

    const sortedPrices = prices.sort((a, b) => b.price - a.price);
    const highest = sortedPrices[0];
    const lowest = sortedPrices[sortedPrices.length - 1];
    const average = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const spread = ((highest.price - lowest.price) / lowest.price) * 100;

    return {
      tokenPair,
      amount: ethers.utils.formatEther(amount),
      prices,
      analysis: {
        highest,
        lowest,
        average,
        spread: spread.toFixed(4) + '%',
        priceCount: prices.length,
        arbitrageViable: spread > 0.5
      }
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
const dexScanner = new DEXScanner();

// Export functions for backward compatibility
async function getSpread(tokenPair, amount) {
  return dexScanner.getSpread(tokenPair, amount);
}

async function findArbitrageOpportunities(tokenPairs, minSpread) {
  return dexScanner.findBestArbitrageOpportunity(tokenPairs, minSpread);
}

module.exports = {
  DEXScanner,
  dexScanner,
  getSpread,
  findArbitrageOpportunities
};