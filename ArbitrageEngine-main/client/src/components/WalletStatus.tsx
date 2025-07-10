import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const WalletStatus: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState<string>('0.00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const connectWallet = async () => {
      setLoading(true);
      try {
        const privateKey = import.meta.env.VITE_PRIVATE_KEY || (process.env.PRIVATE_KEY as string);
        const rpc = import.meta.env.VITE_RPC_URL || (process.env.RPC_URL as string) || "https://mainnet.infura.io/v3/FOsEA-jCQQcYpdml_zidjbx7UtvbItmj";
        if (!privateKey || privateKey.length < 64) {
          setConnected(false);
          setLoading(false);
          return;
        }
        const provider = new ethers.JsonRpcProvider(rpc);
        const wallet = new ethers.Wallet(privateKey, provider);

        const balanceWei = await wallet.getBalance();
        setBalance(ethers.formatEther(balanceWei));
        setConnected(true);
      } catch (err) {
        setConnected(false);
      }
      setLoading(false);
    };
    connectWallet();
  }, []);

  return (
    <div
      style={{
        background: '#18181b',
        color: '#fff',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 0 12px #000c',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 220,
        fontWeight: 600
      }}
    >
      <span style={{ fontSize: 32 }}>
        {loading ? '⏳' : connected ? '✅' : '❌'}
      </span>
      <div>
        <div>
          Wallet: {loading ? 'Checking...' : connected ? 'Connected' : 'Not Connected'}
        </div>
        <div style={{ fontSize: 16, color: '#a3e635', marginTop: 2 }}>
          Balance: Ξ {balance}
        </div>
      </div>
    </div>
  );
};

export default WalletStatus;
