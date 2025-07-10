import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

const NETWORKS = [
  {
    name: "Ethereum",
    rpc: "https://mainnet.infura.io/v3/FOsEA-jCQQcYpdml_zidjbx7UtvbItmj",
    chainId: 1,
    symbol: "ETH"
  },
  {
    name: "Polygon",
    rpc: "https://polygon-rpc.com",
    chainId: 137,
    symbol: "MATIC"
  },
];

export default function BotLogic() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    let stopped = false;
    const runBot = async () => {
      const pk = import.meta.env.VITE_PRIVATE_KEY || process.env.PRIVATE_KEY || "";
      if (!pk || pk.length < 64) return;
      for (const net of NETWORKS) {
        try {
          const provider = new ethers.JsonRpcProvider(net.rpc);
          const wallet = new ethers.Wallet(pk, provider);
          // EXAMPLE LOGIC: Replace this with your real arbitrage/flash loan logic!
          const block = await provider.getBlockNumber();
          setLogs(logs => [
            `[${net.name}] Checked block ${block} — balance ready, looking for opportunities.`,
            ...logs.slice(0, 29)
          ]);
          // ...your auto-trade/flash loan bot goes here!
        } catch (e) {
          setLogs(logs => [
            `[${net.name}] ⚠️ Error: ${e instanceof Error ? e.message : e}`,
            ...logs.slice(0, 29)
          ]);
        }
      }
      if (!stopped) setTimeout(runBot, 10000); // repeat every 10s
    };
    runBot();
    return () => { stopped = true; };
  }, [running]);

  return (
    <div style={{
      background: "#18181b",
      borderRadius: 14,
      padding: 28,
      boxShadow: "0 0 18px #000b",
      minHeight: 260
    }}>
      <h2 style={{ color: "#a3e635", fontWeight: 800, fontSize: 22 }}>
        🤖 Bot Status: {running ? "Running" : "Paused"}
      </h2>
      <div style={{
        fontSize: 15,
        marginTop: 18,
        maxHeight: 180,
        overflowY: "auto",
        color: "#f1f5f9"
      }}>
        {logs.length === 0 ? (
          <div>Waiting for first block scan…</div>
        ) : (
          <ul>
            {logs.map((log, i) => (
              <li key={i}>{log}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
