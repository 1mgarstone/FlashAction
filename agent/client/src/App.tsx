import React from "react";
import MultiNetworkStatus from "./components/MultiNetworkStatus";
import BotLogic from "./components/BotLogic";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Web3Provider from "./components/Web3Provider";

export default function App() {
  return (
    <Web3Provider>
      <div style={{
        minHeight: "100vh",
        background: "#111",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "18px 44px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 24,
              color: "#a3e635",
              marginRight: 4,
              display: "flex",
              alignItems: "center",
              textShadow: "0 0 12px #a3e635, 0 0 24px #a3e63588"
            }}>
              🔒
            </span>
            <ConnectButton
              showBalance
              chainStatus="none"
            />
          </div>
        </div>
        <MultiNetworkStatus />
        <BotLogic />
      </div>
    </Web3Provider>
  );
}
