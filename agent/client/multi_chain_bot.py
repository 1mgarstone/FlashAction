import os
from web3 import Web3

# Pull INFURA_KEY from env, fallback to provided value
INFURA_KEY = os.getenv("INFURA_KEY", "e8f6c0e074f14302bee0125c92f39606")

NETWORKS = [
    {
        "name": "ethereum",
        "rpc": f"https://mainnet.infura.io/v3/{INFURA_KEY}",
        "explorer": "https://etherscan.io"
    },
    {
        "name": "polygon",
        "rpc": "https://polygon-rpc.com",
        "explorer": "https://polygonscan.com"
    },
    {
        "name": "bsc",
        "rpc": "https://bsc-dataseed.binance.org",
        "explorer": "https://bscscan.com"
    },
    {
        "name": "avalanche",
        "rpc": "https://api.avax.network/ext/bc/C/rpc",
        "explorer": "https://snowtrace.io"
    },
    {
        "name": "arbitrum",
        "rpc": f"https://arbitrum-mainnet.infura.io/v3/{INFURA_KEY}",
        "explorer": "https://arbiscan.io"
    }
]

DEXES = [
    "UniswapV3", "SushiSwap", "Balancer", "Curve", "DODO", "Kyber", "QuickSwap"
]

def connect_all_networks():
    providers = {}
    for net in NETWORKS:
        try:
            w3 = Web3(Web3.HTTPProvider(net["rpc"]))
            if w3.is_connected():
                print(f'✅ Connected to {net["name"].capitalize()} | Latest block: {w3.eth.block_number}')
            else:
                print(f'❌ Could not connect to {net["name"].capitalize()}')
            providers[net["name"]] = w3
        except Exception as e:
            print(f'⚠️ Error connecting to {net["name"]}: {e}')
            providers[net["name"]] = None
    return providers

if __name__ == "__main__":
    print("Connecting to all networks with neon glow 😎...\n")
    providers = connect_all_networks()
    print("\nReady for DEX arbitrage across these platforms:")
    print(", ".join(DEXES))
    print("\nTip: Loop through NETWORKS and DEXES to run your arbitrage logic.")
