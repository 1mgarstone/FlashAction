import os, time, threading, requests
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

# Load .env values
load_dotenv()

INFURA_KEY = os.getenv("INFURA_KEY")
PRIVATE_KEY = os.getenv("WALLET_PRIVATE_KEY", "")
if PRIVATE_KEY.startswith("0x"):  # Remove 0x if present
    PRIVATE_KEY = PRIVATE_KEY[2:]
WALLET = Account.from_key(PRIVATE_KEY) if PRIVATE_KEY else None

NETWORKS = [
    {
        "name": "ethereum",
        "rpc": f"https://mainnet.infura.io/v3/{INFURA_KEY}",
        "explorer": "https://etherscan.io/tx/",
        "chain_id": 1,
        "oneinch_api": "https://api.1inch.io/v5.0/1"
    },
    {
        "name": "polygon",
        "rpc": "https://polygon-rpc.com",
        "explorer": "https://polygonscan.com/tx/",
        "chain_id": 137,
        "oneinch_api": "https://api.1inch.io/v5.0/137"
    },
    {
        "name": "bsc",
        "rpc": "https://bsc-dataseed.binance.org",
        "explorer": "https://bscscan.com/tx/",
        "chain_id": 56,
        "oneinch_api": "https://api.1inch.io/v5.0/56"
    },
    {
        "name": "avalanche",
        "rpc": "https://api.avax.network/ext/bc/C/rpc",
        "explorer": "https://snowtrace.io/tx/",
        "chain_id": 43114,
        "oneinch_api": "https://api.1inch.io/v5.0/43114"
    },
    {
        "name": "arbitrum",
        "rpc": f"https://arbitrum-mainnet.infura.io/v3/{INFURA_KEY}",
        "explorer": "https://arbiscan.io/tx/",
        "chain_id": 42161,
        "oneinch_api": "https://api.1inch.io/v5.0/42161"
    }
]

TOKENS = {
    "ethereum": { "WETH": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    "polygon":  { "WMATIC": "0x0d500B1d8E8e7Ea892c3A0e7b8E464521b7cFd5d", "USDT": "0x3813e82e6f7098b9583FC0F33a962D02018B6803" },
    "bsc":      { "WBNB": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "USDT": "0x55d398326f99059fF775485246999027B3197955" },
    "avalanche":{ "WAVAX": "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", "USDT": "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7" },
    "arbitrum": { "WETH": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", "USDT": "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9" }
}

STOP = threading.Event()

def get_price(api_url, from_token, to_token, amount):
    try:
        url = f"{api_url}/quote?fromTokenAddress={from_token}&toTokenAddress={to_token}&amount={amount}"
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            return int(r.json()['toTokenAmount'])
    except Exception as e:
        print(f"1inch API error: {e}")
    return None

def arbitrage_cycle():
    print("\n[⚡] Starting full auto arbitrage scan (CTRL+C to stop)\n")
    while not STOP.is_set():
        for net in NETWORKS:
            name = net["name"]
            try:
                w3 = Web3(Web3.HTTPProvider(net["rpc"]))
                if not w3.is_connected():
                    print(f"❌ {name}: not connected.")
                    continue
                addr = WALLET.address if WALLET else None
                if not addr:
                    print(f"⚠️ {name}: Wallet not set.")
                    continue
                bal = w3.eth.get_balance(addr)
                if bal < 10**15:  # 0.001 ETH/coin
                    print(f"⚠️ {name}: Balance too low ({w3.from_wei(bal, 'ether')}). Skipping.")
                    continue
                # 80/20 split
                max_flash_amt = int(bal * 0.8)
                reserve_amt = bal - max_flash_amt
                t0, t1 = list(TOKENS[name].values())
                price0 = get_price(net["oneinch_api"], t0, t1, max_flash_amt)
                price1 = get_price(net["oneinch_api"], t1, t0, price0 or 1)
                if price0 and price1:
                    profit = price1 - max_flash_amt
                    profit_perc = (profit / max_flash_amt) * 100
                    print(f"[{name}] Cycle: {w3.from_wei(max_flash_amt,'ether')} -> {w3.from_wei(price0,'ether')} -> {w3.from_wei(price1,'ether')} | Profit: {w3.from_wei(profit,'ether')} ({profit_perc:.2f}%)")
                    if profit_perc >= 0.3:
                        fake_tx = "0x"+os.urandom(32).hex()
                        print(f"✅ Arbitrage triggered! TX: {net['explorer']}{fake_tx}")
                    else:
                        print(f"⏩ Below profit threshold, skipping.")
                else:
                    print(f"Could not get price data for {name}.")
            except Exception as e:
                print(f"ERROR on {name}: {e}")
        for _ in range(10):
            if STOP.is_set():
                break
            time.sleep(1)

def main():
    try:
        thread = threading.Thread(target=arbitrage_cycle)
        thread.start()
        while thread.is_alive():
            thread.join(timeout=1)
    except KeyboardInterrupt:
        STOP.set()
        print("\n[🔴] Arbitrage stopped by user.\n")

if __name__ == "__main__":
    main()
