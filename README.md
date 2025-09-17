# FCT Miner

An interactive FCT token miner with real-time dashboard interface for both mainnet and Sepolia testnet.

## Quick Start

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Configure Wallet**

   - Add your private key to `.env` file:

   ```bash
   PRIVATE_KEY=0x... # Your wallet private key
   NETWORK=sepolia   # or mainnet

   # Optional: Gas price multiplier (default: 1.5 = 50% buffer)
   # GAS_PRICE_MULTIPLIER=1.5  # 50% buffer for faster confirmation
   ```

3. **Fund Wallet**

   - **Sepolia**: Get test ETH from [sepoliafaucet.com](https://sepoliafaucet.com/)
   - **Mainnet**: Send real ETH to your wallet address

4. **Start Mining**

   ```bash
   # Mine on current network
   npm run mine

   # Mine on specific networks
   npm run mine:sepolia
   npm run mine:mainnet
   ```

## Available Commands

### Mining Commands

```bash
npm run mine              # Mine on current network
npm run mine:sepolia      # Switch to Sepolia + mine
npm run mine:mainnet      # Switch to mainnet + mine
```

### Network Management

```bash
npm run network           # Interactive network switcher
npm run network:show      # Show current network
npm run network:sepolia   # Switch to Sepolia testnet
npm run network:mainnet   # Switch to mainnet
```

### Other Tools

```bash
npm run swap              # FCT swapping (mainnet only)
npm run l2hash            # L1 to L2 hash conversion utility
```

## Network Configuration

The miner automatically adapts to the selected network:

### Sepolia Testnet

- **Purpose**: Testing and development
- **ETH Source**: [sepoliafaucet.com](https://sepoliafaucet.com/)
- **Features**: Lower gas costs, no trading pairs
- **Explorer**: [sepolia.explorer.facet.org](https://sepolia.explorer.facet.org)

### Mainnet

- **Purpose**: Production mining
- **ETH Source**: Real ETH required
- **Features**: Full functionality, trading, price data
- **Explorer**: [explorer.facet.org](https://explorer.facet.org)

## Environment Variables

```bash
# Required
PRIVATE_KEY=0x...         # Your wallet private key

# Network Configuration
NETWORK=sepolia           # Options: mainnet, sepolia

# Optional: Gas price multiplier for faster confirmation
GAS_PRICE_MULTIPLIER=1.5 # Default: 1.5 (50% buffer)

# Optional RPC Overrides
L1_RPC_URL=...           # Custom L1 RPC endpoint
FACET_RPC_URL=...        # Custom Facet RPC endpoint
```

## How It Works

1. **Data Generation**: Creates optimized mining data payload
2. **Gas Estimation**: Calculates L1 gas costs and FCT rewards
3. **Price Analysis**: Fetches current ETH price from [eth-price.facet.org](https://eth-price.facet.org)
4. **Transaction Execution**: Sends L1 transaction to Facet inbox
5. **Confirmation**: Waits for both L1 and Facet confirmations

## Dashboard Interface

The miner features a real-time dashboard that displays:

- **System Information**: Network, wallet address (full for easy copying), balance, ETH price
- **Mining Progress**: Live transaction counter, total ETH spent, FCT minted
- **Current Transaction**: Status updates (preparing → submitting → confirming → completed)
- **Statistics**: Mining rate, average cost per FCT, estimated time remaining
- **Interactive Elements**: Clickable transaction hashes that open in block explorer

## Features

- ✅ **Interactive Dashboard**: Real-time mining statistics and progress tracking
- ✅ **Clean Terminal Interface**: Live updates with color-coded status
- ✅ **Clickable Transaction Hashes**: Command+click to open in block explorer
- ✅ **Multi-Network Support**: Seamless mainnet/testnet switching
- ✅ **Real-Time Pricing**: Live ETH price from Facet API
- ✅ **Gas Optimization**: Efficient 95%+ mining efficiency
- ✅ **Market Analysis**: Cost comparisons and FDV calculations
- ✅ **Trading Integration**: Swap vs mine comparisons (mainnet)
- ✅ **Robust Error Handling**: Fallbacks and timeout management
- ✅ **Flexible Mining Sizes**: Choose from preset options or custom sizes
- ✅ **Spending Controls**: Set spending caps or use entire wallet balance

## Mining Economics

The miner calculates:

- **FCT Rewards**: Based on L1 calldata gas consumption
- **Mining Costs**: ETH burned for transaction fees
- **Efficiency**: Percentage of gas generating FCT vs overhead
- **Market Metrics**: Cost per FCT, Fully Diluted Valuation

## Requirements

- Node.js 18+
- pnpm (recommended) or npm
- ETH for gas fees (testnet or mainnet)

## Facet L2 交易要点
- 仅在 **Facet 主网 RPC** 下使用 (`FACET_RPC_URL=https://mainnet.facet.org`)。
- 池子是 **WETH / wFCT**；买原生 FCT = 先换到 wFCT，再 `withdraw()` 解包。
- 统一走 `swapExactTokensForTokens` + `approve`；不要用以太坊 L1 的 Router 地址。

## 快速开始
```bash
cp .env.example .env  # 填上 PRIVATE_KEY / FACET_CHAIN_ID / ROUTER / WETH / WFCT
pnpm i

# 校验网络/合约
pnpm tsx check-network.ts

# 查看余额/授权
pnpm tsx check-status.ts

# 报价
pnpm tsx facet-swapper.ts quote 0.001

# 交换 WETH -> wFCT（滑点 0.5%）
pnpm tsx facet-swapper.ts swap-wfct 0.001 50

# 交换 WETH -> FCT（先换 wFCT 再 unwrap）
pnpm tsx facet-swapper.ts swap-fct 0.001 50

# 取消挂单（EIP-1559 高价替换）
pnpm tsx cancel-range.ts


