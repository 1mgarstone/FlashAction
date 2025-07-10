import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

const NETWORKS = [
  {
    name: "Ethereum",
    rpc: "https://mainnet.infura.io/v3/FOsEA-jCQQcYpdml_zidjbx7UtvbItmj",
    chainId: 1,
    symbol: "ETH",
    explorer: "https://etherscan.io/address/"
  },
  {
    name: "Polygon",
    rpc: "https://polygon-rpc.com",
    chainId: 137,
    symbol: "MATIC",
    explorer: "https://polygonscan.com/address/"
  },
];

export default function MultiNetworkStatus() {
  const [balances, setBalances] = useState<{[name: string]: string}>({});
  const [connected, setConnected] = useState<{[name: string]: boolean}>({});
  const [wallet, setWallet] = useState<string>("");

  useEffect(() => {
    const loadBalances = async () => {
      const pk = import.meta.env.VITE_PRIVATE_KEY || process.env.PRIVATE_KEY || "";
      if (!pk || pk.length < 64) return;
      setWallet("");
      const updates: {[name: string]: string} = {};
      const connects: {[name: string]: boolean} = {};
      let walletAddr = "";
      for (const net of NETWORKS) {
        try {
          const provider = new ethers.JsonRpcProvider(net.rpc);
          const w = new ethers.Wallet(pk, provider);
          if (!walletAddr) walletAddr = w.address;
          const bal = await w.getBalance();
          updates[net.name] = ethers.formatEther(bal);
          connects[net.name] = true;
        } catch {
          updates[net.name] = "0.00";
          connects[net.name] = false;
        }
      }
      setBalances(updates);
      setConnected(connects);
      setWallet(walletAddr);
    };
    loadBalances();
    // auto-refresh every minute
    const interval = setInterval(loadBalances, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      gap: 24,
      marginBottom: 36,
      background: "#18181b",
      padding: 24,
      borderRadius: 16,
      boxShadow: "0 0 24px #000b"
    }}>
      {NETWORKS.map(net => (
        <div key={net.name} style={{
          flex: 1,
          background: "#222",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 0 12px #0006",
          minWidth: 200
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
            {connected[net.name] ? "✅" : "❌"} {net.name}
          </div>
          <div style={{ color: "#a3e635", fontSize: 19, fontWeight: 600 }}>
            Balance: {balances[net.name] || "0.00"} {net.symbol}
          </div>
          {wallet && (
            <div style={{ fontSize: 13, marginTop: 8 }}>
              <a href={net.explorer + wallet} target="_blank" style={{ color: "#22d3ee" }}>
                {wallet.slice(0, 6)}...{wallet.slice(-4)}
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
