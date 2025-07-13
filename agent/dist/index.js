// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { z } from "zod";
import * as ethers3 from "ethers";

// server/services/blockchain.ts
import * as ethers from "ethers";
var BlockchainService = class {
  provider;
  polygonProvider;
  constructor() {
    const ethRpcUrl = process.env.ETHEREUM_RPC_URL || "https://mainnet.infura.io/v3/your-project-id";
    const polygonRpcUrl = process.env.POLYGON_RPC_URL || "https://polygon-mainnet.infura.io/v3/your-project-id";
    this.provider = new ethers.JsonRpcProvider(ethRpcUrl);
    this.polygonProvider = new ethers.JsonRpcProvider(polygonRpcUrl);
  }
  async getEthereumGasPrice() {
    try {
      const gasPrice = await this.provider.getGasPrice();
      return parseFloat(ethers.utils.formatUnits(gasPrice, "gwei"));
    } catch (error) {
      console.error("Error getting Ethereum gas price:", error);
      return 20;
    }
  }
  async getPolygonGasPrice() {
    try {
      const gasPrice = await this.polygonProvider.getGasPrice();
      return parseFloat(ethers.utils.formatUnits(gasPrice, "gwei"));
    } catch (error) {
      console.error("Error getting Polygon gas price:", error);
      return 30;
    }
  }
  async getEthereumBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error("Error getting Ethereum block number:", error);
      return 0;
    }
  }
  async getPolygonBlockNumber() {
    try {
      return await this.polygonProvider.getBlockNumber();
    } catch (error) {
      console.error("Error getting Polygon block number:", error);
      return 0;
    }
  }
  async getTokenPrice(tokenAddress, exchange) {
    const mockPrices = {
      "ETH": 2e3,
      "USDC": 1,
      "USDT": 1,
      "DAI": 1,
      "WETH": 2e3,
      "WBTC": 4e4
    };
    return mockPrices[tokenAddress] || Math.random() * 100;
  }
  async estimateGasCost(transaction) {
    try {
      const gasLimit = await this.provider.estimateGas(transaction);
      const gasPrice = await this.provider.getGasPrice();
      const gasCost = gasLimit.mul(gasPrice);
      return parseFloat(ethers.utils.formatEther(gasCost));
    } catch (error) {
      console.error("Error estimating gas cost:", error);
      return 0.01;
    }
  }
  async monitorTransaction(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (receipt) {
        return {
          status: receipt.status === 1 ? "success" : "failed",
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };
      }
      return { status: "pending" };
    } catch (error) {
      console.error("Error monitoring transaction:", error);
      return { status: "failed" };
    }
  }
};
var blockchainService = new BlockchainService();

// server/services/arbitrage.ts
var ArbitrageService = class {
  exchanges = [
    "Uniswap V2",
    "Uniswap V3",
    "SushiSwap",
    "Curve",
    "Balancer",
    "1inch",
    "PancakeSwap"
  ];
  tokenPairs = [
    "ETH/USDC",
    "ETH/USDT",
    "USDC/USDT",
    "DAI/USDC",
    "WETH/USDC",
    "WBTC/ETH",
    "LINK/ETH"
  ];
  async scanForOpportunities() {
    const opportunities = [];
    for (const pair of this.tokenPairs) {
      const [token0, token1] = pair.split("/");
      const exchangePrices = await this.getExchangePrices(token0, token1);
      const arbOps = this.findArbitrageOpportunities(pair, exchangePrices);
      opportunities.push(...arbOps);
    }
    return opportunities.filter((op) => op.afterFeesProfit > 20);
  }
  async getExchangePrices(token0, token1) {
    const prices = {};
    for (const exchange of this.exchanges) {
      try {
        const basePrice = await blockchainService.getTokenPrice(token0, exchange);
        const variation = (Math.random() - 0.5) * 0.02;
        prices[exchange] = basePrice * (1 + variation);
      } catch (error) {
        console.error(`Error getting price from ${exchange}:`, error);
      }
    }
    return prices;
  }
  findArbitrageOpportunities(tokenPair, exchangePrices) {
    const opportunities = [];
    const exchanges = Object.keys(exchangePrices);
    for (let i = 0; i < exchanges.length; i++) {
      for (let j = i + 1; j < exchanges.length; j++) {
        const exchange1 = exchanges[i];
        const exchange2 = exchanges[j];
        const price1 = exchangePrices[exchange1];
        const price2 = exchangePrices[exchange2];
        if (Math.abs(price1 - price2) / Math.min(price1, price2) > 1e-3) {
          const buyExchange = price1 < price2 ? exchange1 : exchange2;
          const sellExchange = price1 < price2 ? exchange2 : exchange1;
          const buyPrice = Math.min(price1, price2);
          const sellPrice = Math.max(price1, price2);
          const priceDiff = (sellPrice - buyPrice) / buyPrice * 100;
          const flashLoanAmount = 1e5;
          const estimatedProfit = flashLoanAmount * (priceDiff / 100);
          const flashLoanProvider = this.selectOptimalProvider(flashLoanAmount);
          const flashLoanFee = this.calculateFlashLoanFee(flashLoanAmount, flashLoanProvider);
          const gasCost = 20;
          const afterFeesProfit = estimatedProfit - flashLoanFee - gasCost;
          if (afterFeesProfit > 0) {
            opportunities.push({
              id: `${tokenPair}-${buyExchange}-${sellExchange}-${Date.now()}`,
              tokenPair,
              buyExchange,
              sellExchange,
              priceDiff,
              estimatedProfit,
              afterFeesProfit,
              volume: this.categorizeVolume(afterFeesProfit),
              gasEstimate: 0.01,
              // ETH
              flashLoanProvider,
              isActive: true,
              createdAt: /* @__PURE__ */ new Date(),
              lastUpdated: /* @__PURE__ */ new Date()
            });
          }
        }
      }
    }
    return opportunities.sort((a, b) => b.afterFeesProfit - a.afterFeesProfit);
  }
  selectOptimalProvider(amount) {
    if (amount <= 1e6) {
      return "balancer";
    } else if (amount <= 5e5) {
      return "dydx";
    }
    return "aave";
  }
  calculateFlashLoanFee(amount, provider) {
    const feeRates = {
      balancer: 0,
      // 0%
      dydx: 0,
      // 0%
      aave: 5e-4
      // 0.05%
    };
    return amount * feeRates[provider];
  }
  categorizeVolume(profit) {
    if (profit > 200) return "High";
    if (profit > 100) return "Medium";
    return "Low";
  }
  async executeArbitrage(opportunityId) {
    try {
      const simulatedSuccess = Math.random() > 0.1;
      if (simulatedSuccess) {
        const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        return {
          success: true,
          txHash: mockTxHash
        };
      } else {
        return {
          success: false,
          error: "Insufficient liquidity or MEV competition"
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async getHistoricalData() {
    return {
      transactions: [],
      stats: {
        totalProfit: 589.37,
        dailyPnL: 75.5,
        successRate: 94.2,
        successfulTrades: 23,
        totalTrades: 24,
        maxDrawdown: 1.2,
        sharpeRatio: 3.47,
        winRate: 95.8
      }
    };
  }
};
var arbitrageService = new ArbitrageService();

// server/services/flashloan.ts
import { ethers as ethers2 } from "ethers";
var FlashLoanService = class {
  providers = {
    balancer: {
      name: "Balancer V2",
      contractAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      fee: 0,
      abi: [
        "function flashLoan(address recipient, address[] tokens, uint256[] amounts, bytes userData)"
      ]
    },
    dydx: {
      name: "dYdX",
      contractAddress: "0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e",
      fee: 0,
      abi: [
        "function initiateFlashLoan(address token, uint256 amount, bytes calldata)"
      ]
    },
    aave: {
      name: "Aave V3",
      contractAddress: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
      fee: 5e-4,
      // 0.05%
      abi: [
        "function flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes params, uint16 referralCode)"
      ]
    }
  };
  async executeBalancerFlashLoan(recipient, tokens, amounts, userData, signer) {
    const vault = new ethers2.Contract(
      this.providers.balancer.contractAddress,
      this.providers.balancer.abi,
      signer
    );
    return await vault.flashLoan(recipient, tokens, amounts, userData);
  }
  async executeAaveFlashLoan(receiverAddress, asset, amount, params, signer) {
    const pool = new ethers2.Contract(
      this.providers.aave.contractAddress,
      this.providers.aave.abi,
      signer
    );
    return await pool.flashLoanSimple(receiverAddress, asset, amount, params, 0);
  }
  async executeDydxFlashLoan(token, amount, calldata, signer) {
    throw new Error("dYdX flash loans not yet implemented");
  }
  calculateFee(amount, provider) {
    return amount * this.providers[provider].fee;
  }
  getProviderInfo(provider) {
    return this.providers[provider];
  }
  async estimateGasCost(provider) {
    const gasEstimates = {
      balancer: 4e5,
      // gas units
      dydx: 35e4,
      aave: 45e4
    };
    const gasPrice = 2e-8;
    const ethPrice = 2e3;
    const gasUnits = gasEstimates[provider];
    return gasUnits * gasPrice * ethPrice;
  }
  async getMaxAvailableLiquidity(provider, asset) {
    const mockLiquidity = {
      balancer: 1e9,
      // $1B
      dydx: 5e8,
      // $500M
      aave: 2e9
      // $2B
    };
    return mockLiquidity[provider];
  }
  getOptimalProvider(amount, asset) {
    if (amount <= 1e8) {
      return "balancer";
    } else if (amount <= 5e7) {
      return "dydx";
    }
    return "aave";
  }
};
var flashLoanService = new FlashLoanService();

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/arbitrage/scan", async (req, res) => {
    try {
      const opportunities = await arbitrageService.scanForOpportunities();
      res.json({ opportunities });
    } catch (error) {
      console.error("Error scanning opportunities:", error);
      res.status(500).json({ error: "Failed to scan opportunities" });
    }
  });
  app2.post("/api/arbitrage/execute", async (req, res) => {
    try {
      const { opportunityId } = req.body;
      if (!opportunityId) {
        return res.status(400).json({ error: "opportunityId is required" });
      }
      const result = await arbitrageService.executeArbitrage(opportunityId);
      res.json(result);
    } catch (error) {
      console.error("Error executing arbitrage:", error);
      res.status(500).json({ error: "Failed to execute arbitrage" });
    }
  });
  app2.get("/api/arbitrage/history", async (req, res) => {
    try {
      const data = await arbitrageService.getHistoricalData();
      res.json(data);
    } catch (error) {
      console.error("Error getting historical data:", error);
      res.status(500).json({ error: "Failed to get historical data" });
    }
  });
  app2.get("/api/flashloan/providers", async (req, res) => {
    try {
      const providers = [
        {
          id: "balancer",
          name: "Balancer V2",
          fee: 0,
          maxLiquidity: "$1B+",
          supportedAssets: ["ETH", "WETH", "DAI", "USDC", "USDT", "WBTC"],
          status: "online"
        },
        {
          id: "dydx",
          name: "dYdX",
          fee: 0,
          maxLiquidity: "$500M+",
          supportedAssets: ["ETH", "DAI", "USDC"],
          status: "online"
        },
        {
          id: "aave",
          name: "Aave V3",
          fee: 0.05,
          maxLiquidity: "$2B+",
          supportedAssets: ["ETH", "WETH", "DAI", "USDC", "USDT", "WBTC", "LINK", "AAVE"],
          status: "online"
        }
      ];
      res.json({ providers });
    } catch (error) {
      console.error("Error getting flash loan providers:", error);
      res.status(500).json({ error: "Failed to get providers" });
    }
  });
  app2.post("/api/flashloan/execute", async (req, res) => {
    try {
      const schema = z.object({
        provider: z.enum(["balancer", "dydx", "aave"]),
        amount: z.number().positive(),
        asset: z.string(),
        targetContract: z.string(),
        params: z.string()
      });
      const { provider, amount, asset, targetContract, params } = schema.parse(req.body);
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      res.json({
        success: true,
        txHash: mockTxHash,
        provider,
        amount,
        fee: flashLoanService.calculateFee(amount, provider)
      });
    } catch (error) {
      console.error("Error executing flash loan:", error);
      res.status(500).json({ error: "Failed to execute flash loan" });
    }
  });
  app2.get("/api/blockchain/status", async (req, res) => {
    try {
      const [ethGasPrice, ethBlockNumber, polygonGasPrice, polygonBlockNumber] = await Promise.all([
        blockchainService.getEthereumGasPrice(),
        blockchainService.getEthereumBlockNumber(),
        blockchainService.getPolygonGasPrice(),
        blockchainService.getPolygonBlockNumber()
      ]);
      res.json({
        ethereum: {
          connected: ethBlockNumber > 0,
          gasPrice: ethGasPrice,
          blockNumber: ethBlockNumber
        },
        polygon: {
          connected: polygonBlockNumber > 0,
          gasPrice: polygonGasPrice,
          blockNumber: polygonBlockNumber
        }
      });
    } catch (error) {
      console.error("Error getting blockchain status:", error);
      res.status(500).json({ error: "Failed to get blockchain status" });
    }
  });
  app2.get("/api/transaction/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      const result = await blockchainService.monitorTransaction(hash);
      res.json(result);
    } catch (error) {
      console.error("Error monitoring transaction:", error);
      res.status(500).json({ error: "Failed to monitor transaction" });
    }
  });
  app2.get("/api/wallet/:address/balance", async (req, res) => {
    try {
      const { address } = req.params;
      if (!ethers3.isAddress(address)) {
        return res.status(400).json({ error: "Invalid address" });
      }
      const mockBalance = 100;
      res.json({ balance: mockBalance, address });
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      res.status(500).json({ error: "Failed to get wallet balance" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
