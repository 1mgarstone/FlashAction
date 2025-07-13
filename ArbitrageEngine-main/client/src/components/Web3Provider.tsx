import React from "react";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { mainnet, polygon } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "ArbitrageEngine",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "033b97a193118dae919d9bf7cb5aeb13",
  chains: [mainnet, polygon],
  transports: {
    [mainnet.id]: http(import.meta.env.VITE_ALCHEMY_API_URL_MAINNET || "https://eth-mainnet.g.alchemy.com/v2/FOsEA-jCQQcYpdml_zidjbx7UtvbItmj"),
    [polygon.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
