
import { ethers } from 'ethers';
import axios from 'axios';

export interface TokenBalance {
  symbol: string;
  balance: string;
  value: number;
  icon: string;
}

export class WalletService {
  private provider: ethers.JsonRpcProvider;
  private etherscanApiKey = 'YourApiKeyToken'; // Replace with actual API key

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID' // Replace with actual Infura ID
    );
  }

  async getEthBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get ETH balance:', error);
      return '0';
    }
  }

  async getTokenBalances(address: string): Promise<TokenBalance[]> {
    try {
      // Mock token balances - in real implementation, you'd query token contracts
      const mockBalances: TokenBalance[] = [
        {
          symbol: 'USDC',
          balance: '1234.567890',
          value: 1234.56,
          icon: 'currency-usd-circle',
        },
        {
          symbol: 'USDT',
          balance: '567.890123',
          value: 567.89,
          icon: 'currency-usd',
        },
        {
          symbol: 'DAI',
          balance: '890.123456',
          value: 890.12,
          icon: 'alpha-d-circle',
        },
        {
          symbol: 'WBTC',
          balance: '0.123456',
          value: 5432.10,
          icon: 'bitcoin',
        },
        {
          symbol: 'LINK',
          balance: '45.678901',
          value: 678.90,
          icon: 'link',
        },
      ];

      return mockBalances;
    } catch (error) {
      console.error('Failed to get token balances:', error);
      return [];
    }
  }

  async getTotalValue(address: string): Promise<number> {
    try {
      const ethBalance = await this.getEthBalance(address);
      const tokenBalances = await this.getTokenBalances(address);
      
      // Get ETH price
      const ethPrice = await this.getEthPrice();
      const ethValue = parseFloat(ethBalance) * ethPrice;
      
      // Sum token values
      const tokenValue = tokenBalances.reduce((sum, token) => sum + token.value, 0);
      
      return ethValue + tokenValue;
    } catch (error) {
      console.error('Failed to get total value:', error);
      return 0;
    }
  }

  async getEthPrice(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      return response.data.ethereum?.usd || 0;
    } catch (error) {
      console.error('Failed to get ETH price:', error);
      return 2000; // Default fallback price
    }
  }

  async getTransactionHistory(address: string): Promise<any[]> {
    try {
      const response = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'account',
          action: 'txlist',
          address: address,
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 10,
          sort: 'desc',
          apikey: this.etherscanApiKey,
        },
      });

      return response.data.result || [];
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  async sendTransaction(
    to: string,
    amount: string,
    signer: ethers.JsonRpcSigner
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const tx = await signer.sendTransaction({
        to: to,
        value: ethers.parseEther(amount),
      });

      await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error) {
      console.error('Failed to send transaction:', error);
      return {
        success: false,
        error: 'Transaction failed',
      };
    }
  }
}
export interface TokenBalance {
  symbol: string;
  balance: string;
  value: number;
  icon: string;
}

export class WalletService {
  async getEthBalance(address: string): Promise<string> {
    try {
      // Simulate ETH balance - replace with actual API call
      return "1.234";
    } catch (error) {
      console.error('Error getting ETH balance:', error);
      return "0";
    }
  }

  async getTokenBalances(address: string): Promise<TokenBalance[]> {
    try {
      // Simulate token balances - replace with actual API calls
      return [
        {
          symbol: "USDC",
          balance: "1500.50",
          value: 1500.50,
          icon: "currency-usd"
        },
        {
          symbol: "USDT",
          balance: "800.25",
          value: 800.25,
          icon: "currency-usd"
        },
        {
          symbol: "DAI",
          balance: "300.75",
          value: 300.75,
          icon: "currency-usd"
        }
      ];
    } catch (error) {
      console.error('Error getting token balances:', error);
      return [];
    }
  }

  async getTotalValue(address: string): Promise<number> {
    try {
      const tokenBalances = await this.getTokenBalances(address);
      const ethBalance = await this.getEthBalance(address);
      
      const tokenValue = tokenBalances.reduce((sum, token) => sum + token.value, 0);
      const ethValue = parseFloat(ethBalance) * 2000; // Assume ETH price $2000
      
      return tokenValue + ethValue;
    } catch (error) {
      console.error('Error calculating total value:', error);
      return 0;
    }
  }
}
