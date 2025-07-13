
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showMessage } from 'react-native-flash-message';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    initializeWeb3();
  }, []);

  const initializeWeb3 = async () => {
    try {
      // Check if wallet was previously connected
      const savedAccount = await AsyncStorage.getItem('wallet_account');
      if (savedAccount) {
        await connectWallet();
      }
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();

        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0]);
        setChainId(Number(network.chainId));
        setIsConnected(true);

        // Save connection state
        await AsyncStorage.setItem('wallet_account', accounts[0]);

        showMessage({
          message: 'Wallet Connected',
          description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
          type: 'success',
        });
      } else {
        showMessage({
          message: 'MetaMask Not Found',
          description: 'Please install MetaMask to connect your wallet',
          type: 'warning',
        });
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      showMessage({
        message: 'Connection Failed',
        description: 'Failed to connect wallet',
        type: 'danger',
      });
    }
  };

  const disconnectWallet = async () => {
    try {
      setProvider(null);
      setSigner(null);
      setAccount(null);
      setChainId(null);
      setIsConnected(false);

      await AsyncStorage.removeItem('wallet_account');

      showMessage({
        message: 'Wallet Disconnected',
        description: 'Successfully disconnected from wallet',
        type: 'info',
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const switchNetwork = async (targetChainId: number) => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      showMessage({
        message: 'Network Switch Failed',
        description: 'Failed to switch network',
        type: 'danger',
      });
    }
  };

  const value: Web3ContextType = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
