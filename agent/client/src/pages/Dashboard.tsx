// src/pages/Dashboard.tsx

import React, { useState } from "react";

export default function Dashboard() {
  const [botRunning, setBotRunning] = useState(false);
  const [statusText, setStatusText] = useState("Stopped");

  // Example wallet/chain state (replace with your hooks!)
  const walletAddress = "0x9B...BdfB";
  const ethBalance = "0.00";
  const maticBalance = "0.00";
  // Show chain badge? You can map chainId to emoji or logo etc
  const chains = [
    { name: "Ethereum", emoji: "🟩", color: "#a3e635", balance: ethBalance, status: botRunning },
    { name: "Polygon", emoji: "🟪", color: "#38bdf8", balance: maticBalance, status: botRunning },
  ];

  function handleStart() {
    setBotRunning(true);
    setStatusText("Running");
    // TODO: Trigger backend/bot start here
  }
  function handleStop() {
    setBotRunning(false);
    setStatusText("Stopped");
    // TODO: Trigger backend/bot stop here
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#101013",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        padding: 0,
        margin: 0,
      }}
    >
      {/* Neon Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          padding: "24px 0 18px 0",
          background: "rgba(16,16,19,0.98)",
          borderBottom: "2px solid #222",
          boxShadow: "0 4px 40px #111c 0 1px 12px #a3e63522",
        }}
      >
        <span
          style={{
            fontSize: 27,
            color: "#a3e635",
            textShadow: "0 0 10px #a3e635, 0 0 18px #fff",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 25, marginRight: 4 }}>🔒</span>
          {walletAddress}
        </span>
        <button
          onClick={botRunning ? handleStop : handleStart}
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginLeft: 32,
            padding: "14px 46px",
            borderRadius: "999px",
            border: "none",
            background: botRunning
              ? "linear-gradient(90deg,#a3e635,#f87171)"
              : "linear-gradient(90deg,#38bdf8,#a3e635)",
            color: "#18181b",
            boxShadow: botRunning
              ? "0 0 28px #a3e63599,0 0 12px #f8717199"
              : "0 0 24px #38bdf899,0 0 12px #a3e63599",
            cursor: "pointer",
            transition: "all .2s",
            textShadow: "0 0 8px #fff9",
          }}
        >
          {botRunning ? "STOP" : "START"}
        </button>
      </div>

      {/* Chain Status */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 32,
          margin: "42px 0 24px 0",
        }}
      >
        {chains.map((chain) => (
          <div
            key={chain.name}
            style={{
              background: "#18181b",
              padding: 30,
              borderRadius: 18,
              boxShadow: `0 0 22px ${chain.color}88`,
              minWidth: 200,
              textAlign: "center",
              border: `2.5px solid ${chain.color}`,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: chain.color,
                textShadow: `0 0 8px #fff,0 0 18px ${chain.color}`,
                marginBottom: 10,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
              }}
            >
              {chain.status ? "✅" : "❌"} {chain.name}
            </div>
            <div
              style={{
                fontSize: 19,
                fontWeight: 600,
                letterSpacing: 1.1,
                color: "#fff",
                textShadow: `0 0 12px ${chain.color}66`,
              }}
            >
              Balance: {chain.balance} {chain.name === "Ethereum" ? "ETH" : "MATIC"}
            </div>
          </div>
        ))}
      </div>

      {/* Bot Status */}
      <div
        style={{
          margin: "40px auto 0 auto",
          background: "#1e293b",
          padding: 34,
          borderRadius: 26,
          color: "#fff",
          maxWidth: 420,
          textAlign: "center",
          fontSize: 24,
          boxShadow: "0 0 18px #a3e63555,0 0 32px #38bdf888",
          textShadow: "0 0 12px #a3e635, 0 0 20px #38bdf8",
        }}
      >
        <span style={{ fontSize: 30, marginRight: 6 }}>🤖</span>
        <b>Bot Status: {statusText}</b>
        <div style={{ marginTop: 10, fontSize: 18, textShadow: "0 0 10px #fff" }}>
          {botRunning ? "Running! Watching for profit..." : "Press START to activate the arbitrage bot."}
        </div>
      </div>
    </div>
  );
}

