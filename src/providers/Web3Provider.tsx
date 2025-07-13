import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface Web3ContextType {
  isConnected: boolean;
  account: string | null;
  chainId: number | null;
  balance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  signer: ethers.Signer | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

const NETWORKS = {
  1: { name: 'Ethereum', rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID' },
  137: { name: 'Polygon', rpcUrl: 'https://polygon-rpc.com' },
  56: { name: 'BSC', rpcUrl: 'https://bsc-dataseed.binance.org' },
  43114: { name: 'Avalanche', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc' },
  42161: { name: 'Arbitrum', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
};

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState('0');
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const connect = async () => {
    try {
      // Simulate wallet connection
      const mockAccount = '0x742d35Cc6634C0532925a3b8D4f8b48F5F8b3456';
      const mockChainId = 1;

      setAccount(mockAccount);
      setChainId(mockChainId);
      setIsConnected(true);
      setBalance('1.5');

      // Create mock signer
      const provider = new ethers.JsonRpcProvider(NETWORKS[mockChainId].rpcUrl);
      const mockSigner = new ethers.Wallet(
        '0x0123456789012345678901234567890123456789012345678901234567890123',
        provider
      );
      setSigner(mockSigner);

      console.log('Wallet connected:', mockAccount);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setChainId(null);
    setBalance('0');
    setSigner(null);
    console.log('Wallet disconnected');
  };

  const switchNetwork = async (targetChainId: number) => {
    try {
      if (!NETWORKS[targetChainId]) {
        throw new Error('Unsupported network');
      }

      // Simulate network switch
      setChainId(targetChainId);

      // Update signer for new network
      const provider = new ethers.JsonRpcProvider(NETWORKS[targetChainId].rpcUrl);
      const mockSigner = new ethers.Wallet(
        '0x0123456789012345678901234567890123456789012345678901234567890123',
        provider
      );
      setSigner(mockSigner);

      console.log(`Switched to ${NETWORKS[targetChainId].name}`);
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Auto-connect if previously connected
    const savedAccount = localStorage.getItem('connected_account');
    if (savedAccount) {
      connect();
    }
  }, []);

  const value: Web3ContextType = {
    isConnected,
    account,
    chainId,
    balance,
    connect,
    disconnect,
    switchNetwork,
    signer,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}