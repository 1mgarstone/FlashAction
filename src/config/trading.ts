
export const TRADING_CONFIG = {
  // Standardized leverage multiplier across all platforms
  LEVERAGE_MULTIPLIER: 1400, // 1400% leverage
  
  // Flash loan configuration
  FLASH_LOAN: {
    DEFAULT_ALLOCATION_PERCENTAGE: 80, // 80% of wallet balance
    MAX_LEVERAGE: 1400,
    MIN_LEVERAGE: 100,
    
    // Provider priorities (ordered by preference)
    PROVIDER_PRIORITY: ['balancer', 'dydx', 'aave'],
    
    // Fee thresholds
    MAX_ACCEPTABLE_FEE: 0.1, // 0.1% max fee
  },
  
  // Risk management
  RISK: {
    MAX_POSITION_SIZE: 0.8, // 80% max position size
    MIN_PROFIT_THRESHOLD: 0.5, // 0.5% minimum profit
    GAS_BUFFER_MULTIPLIER: 1.2, // 20% gas buffer
  },
  
  // Network configurations
  NETWORKS: {
    ETHEREUM: {
      CHAIN_ID: 1,
      LEVERAGE_MULTIPLIER: 1400,
      MIN_TRADE_SIZE: 0.1, // ETH
    },
    POLYGON: {
      CHAIN_ID: 137,
      LEVERAGE_MULTIPLIER: 1400,
      MIN_TRADE_SIZE: 100, // MATIC
    },
    BSC: {
      CHAIN_ID: 56,
      LEVERAGE_MULTIPLIER: 1400,
      MIN_TRADE_SIZE: 0.1, // BNB
    },
    ARBITRUM: {
      CHAIN_ID: 42161,
      LEVERAGE_MULTIPLIER: 1400,
      MIN_TRADE_SIZE: 0.1, // ETH
    },
    AVALANCHE: {
      CHAIN_ID: 43114,
      LEVERAGE_MULTIPLIER: 1400,
      MIN_TRADE_SIZE: 1, // AVAX
    }
  }
};

// Helper function to get network-specific leverage
export const getNetworkLeverage = (chainId: number): number => {
  const network = Object.values(TRADING_CONFIG.NETWORKS).find(n => n.CHAIN_ID === chainId);
  return network?.LEVERAGE_MULTIPLIER || TRADING_CONFIG.LEVERAGE_MULTIPLIER;
};

// Helper function to calculate standardized flash loan amount
export const calculateStandardFlashLoanAmount = (
  balance: number, 
  chainId?: number
): number => {
  const leverage = chainId ? getNetworkLeverage(chainId) : TRADING_CONFIG.LEVERAGE_MULTIPLIER;
  return balance * (TRADING_CONFIG.FLASH_LOAN.DEFAULT_ALLOCATION_PERCENTAGE / 100) * leverage;
};
