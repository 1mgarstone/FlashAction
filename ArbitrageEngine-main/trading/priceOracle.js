
import { ethers } from 'ethers';

export class PriceOracle {
  constructor(provider) {
    this.provider = provider;
    this.chainlinkFeeds = {
      'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      'BTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
      'USDC/USD': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
      'DAI/USD': '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9'
    };
    this.priceCache = new Map();
    this.cacheExpiry = 30000; // 30 seconds
  }

  async getPrice(tokenPair) {
    const cacheKey = `${tokenPair}-${Math.floor(Date.now() / this.cacheExpiry)}`;
    
    if (this.priceCache.has(cacheKey)) {
      return this.priceCache.get(cacheKey);
    }

    const price = await this.fetchPriceFromMultipleSources(tokenPair);
    this.priceCache.set(cacheKey, price);
    
    return price;
  }

  async fetchPriceFromMultipleSources(tokenPair) {
    const sources = [
      () => this.getChainlinkPrice(tokenPair),
      () => this.getUniswapV3Price(tokenPair),
      () => this.getCoinGeckoPrice(tokenPair),
      () => this.getBinancePrice(tokenPair)
    ];

    const prices = [];
    
    for (const source of sources) {
      try {
        const price = await source();
        if (price && price > 0) {
          prices.push(price);
        }
      } catch (error) {
        console.log(`Price source failed: ${error.message}`);
      }
    }

    if (prices.length === 0) {
      throw new Error(`No price data available for ${tokenPair}`);
    }

    // Return median price to avoid outliers
    prices.sort((a, b) => a - b);
    const middle = Math.floor(prices.length / 2);
    
    return prices.length % 2 === 0 
      ? (prices[middle - 1] + prices[middle]) / 2 
      : prices[middle];
  }

  async getChainlinkPrice(tokenPair) {
    const feedAddress = this.chainlinkFeeds[tokenPair];
    if (!feedAddress) return null;

    const abi = [
      'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)'
    ];

    const feed = new ethers.Contract(feedAddress, abi, this.provider);
    const [, price] = await feed.latestRoundData();
    
    return parseFloat(ethers.utils.formatUnits(price, 8));
  }

  async getUniswapV3Price(tokenPair) {
    // Simplified Uniswap V3 TWAP price fetching
    const quoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
    const abi = [
      'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)'
    ];

    try {
      const quoter = new ethers.Contract(quoterAddress, abi, this.provider);
      // Implementation would depend on specific token addresses
      return null; // Placeholder
    } catch (error) {
      return null;
    }
  }

  async getCoinGeckoPrice(tokenPair) {
    try {
      const [base, quote] = tokenPair.split('/');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${base.toLowerCase()}&vs_currencies=${quote.toLowerCase()}`
      );
      
      const data = await response.json();
      return data[base.toLowerCase()]?.[quote.toLowerCase()];
    } catch (error) {
      return null;
    }
  }

  async getBinancePrice(tokenPair) {
    try {
      const symbol = tokenPair.replace('/', '').toUpperCase();
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      return null;
    }
  }

  async detectPriceAnomalies(tokenPair, currentPrice) {
    const historicalPrices = await this.getHistoricalPrices(tokenPair, 24); // 24 hours
    const average = historicalPrices.reduce((sum, price) => sum + price, 0) / historicalPrices.length;
    const deviation = Math.abs(currentPrice - average) / average;

    return {
      isAnomaly: deviation > 0.1, // 10% deviation threshold
      deviation,
      confidence: Math.min(deviation * 10, 1)
    };
  }

  async getHistoricalPrices(tokenPair, hours) {
    // Mock implementation - in production, use historical price APIs
    const currentPrice = await this.getPrice(tokenPair);
    const prices = [];
    
    for (let i = 0; i < hours; i++) {
      // Simulate price variation
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      prices.push(currentPrice * (1 + variation));
    }
    
    return prices;
  }
}
