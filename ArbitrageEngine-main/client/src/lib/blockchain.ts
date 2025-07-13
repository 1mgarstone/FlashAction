import * as ethers from 'ethers';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    const rpcUrl = import.meta.env.VITE_ALCHEMY_API_URL_MAINNET || 'https://eth-mainnet.g.alchemy.com/v2/FOsEA-jCQQcYpdml_zidjbx7UtvbItmj';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async connectWallet(privateKey: string): Promise<ethers.Wallet> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    this.signer = new ethers.Wallet(privateKey, this.provider);
    return this.signer;
  }

  async getBalance(address: string): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    const balance = await this.provider.getBalance(address);
    return parseFloat(ethers.utils.formatEther(balance));
  }

  async getGasPrice(): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    const gasPrice = await this.provider.getGasPrice();
    return parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei'));
  }

  async getBlockNumber(): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    return await this.provider.getBlockNumber();
  }

  async getTransactionReceipt(txHash: string) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    return await this.provider.getTransactionReceipt(txHash);
  }

  getSigner(): ethers.Wallet {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    return this.signer;
  }

  getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    return this.provider;
  }
}

export const blockchainService = new BlockchainService();
