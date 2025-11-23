# 🚀 Lendique Deployment - Quick Start

**For the complete guide, see [COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md)**

---

## TL;DR - What You Need

1. ✅ Rust + Cargo installed
2. ✅ Cargo Stylus installed
3. ✅ Foundry (cast) installed
4. ✅ ~0.05 ETH on Arbitrum Sepolia
5. ✅ Private key saved in `contracts/stylus/deployer-key.txt`

---

## 5-Minute Quick Deploy

```bash
# 1. Navigate to contracts
cd contracts/stylus

# 2. Build
cargo build --release --target wasm32-unknown-unknown

# 3. Export ALL ABIs (CRITICAL!)
for contract in LendingPool CollateralManager InterestRateModel RiskEngine LiquidationEngine AIComputeVault PortfolioRebalancer GaslessAA ReceiptGenerator; do
  cargo stylus export-abi > "../../src/abis/${contract}.json"
done

# 4. Deploy (repeat 9 times for each contract)
cargo stylus deploy \
  --private-key-path=./deployer-key.txt \
  --endpoint=https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file=./target/wasm32-unknown-unknown/release/lendique_contracts.wasm

# Save each address!

# 5. Initialize each contract
cast send <CONTRACT_ADDRESS> "init()" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $(cat deployer-key.txt)

# 6. Update .env with all 9 addresses
cd ../..
nano .env

# 7. Start frontend
npm run dev
```

---

## The 9 Contracts You Need to Deploy

| # | Contract Name | Needs Init? | Init Parameters |
|---|---------------|-------------|-----------------|
| 1 | LendingPool | ✅ Yes | `init()` |
| 2 | CollateralManager | ✅ Yes | `init()` |
| 3 | InterestRateModel | ✅ Yes | `init(200, 1000, 5000, 8000)` |
| 4 | LiquidationEngine | ✅ Yes | `init(10000, 500)` |
| 5 | RiskEngine | ✅ Yes | `init()` |
| 6 | AIComputeVault | ✅ Yes | `init()` |
| 7 | PortfolioRebalancer | ✅ Yes | `init()` |
| 8 | GaslessAA | ✅ Yes | `init()` |
| 9 | ReceiptGenerator | ✅ Yes | `init()` |

---

## Critical Steps - DO NOT SKIP!

### ⚠️ Step 1: Export ABIs

**YOU MUST DO THIS!** Your frontend cannot work without ABIs!

```bash
cd contracts/stylus

# Export all 9 ABIs
cargo stylus export-abi > ../../src/abis/LendingPool.json
cargo stylus export-abi > ../../src/abis/CollateralManager.json
cargo stylus export-abi > ../../src/abis/InterestRateModel.json
cargo stylus export-abi > ../../src/abis/RiskEngine.json
cargo stylus export-abi > ../../src/abis/LiquidationEngine.json
cargo stylus export-abi > ../../src/abis/AIComputeVault.json
cargo stylus export-abi > ../../src/abis/PortfolioRebalancer.json
cargo stylus export-abi > ../../src/abis/GaslessAA.json
cargo stylus export-abi > ../../src/abis/ReceiptGenerator.json
```

### ⚠️ Step 2: Update .env

**YOU MUST DO THIS!** Frontend needs contract addresses!

Edit `.env` file:

```bash
VITE_LENDING_POOL_ADDRESS=0xYourDeployedAddress1
VITE_COLLATERAL_MANAGER_ADDRESS=0xYourDeployedAddress2
VITE_LIQUIDATION_ENGINE_ADDRESS=0xYourDeployedAddress3
VITE_INTEREST_RATE_MODEL_ADDRESS=0xYourDeployedAddress4
VITE_RISK_ENGINE_ADDRESS=0xYourDeployedAddress5
VITE_AI_COMPUTE_VAULT_ADDRESS=0xYourDeployedAddress6
VITE_PORTFOLIO_REBALANCER_ADDRESS=0xYourDeployedAddress7
VITE_GASLESS_AA_ADDRESS=0xYourDeployedAddress8
VITE_RECEIPT_GENERATOR_ADDRESS=0xYourDeployedAddress9
```

---

## Network Configuration

```
Network: Arbitrum Sepolia
Chain ID: 421614
RPC: https://sepolia-rollup.arbitrum.io/rpc
Explorer: https://sepolia.arbiscan.io
Faucet: https://faucet.quicknode.com/arbitrum/sepolia
```

---

## How to Get Testnet ETH

1. Go to https://sepoliafaucet.com/ and get Sepolia ETH
2. Bridge to Arbitrum Sepolia: https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia
3. You need ~0.05 ETH on Arbitrum Sepolia

---

## Deployment Checklist

```
[ ] Rust installed (rustc --version)
[ ] Cargo Stylus installed (cargo stylus --version)
[ ] Foundry installed (cast --version)
[ ] Private key in contracts/stylus/deployer-key.txt
[ ] 0.05 ETH on Arbitrum Sepolia
[ ] Built contracts (cargo build --release)
[ ] Exported all 9 ABIs to src/abis/
[ ] Deployed all 9 contracts (saved addresses)
[ ] Initialized all 9 contracts
[ ] Updated .env with addresses
[ ] Restarted frontend (npm run dev)
[ ] Tested supply/borrow in browser
```

---

## Quick Test After Deployment

```bash
# Test LendingPool
cast call <LENDING_POOL_ADDRESS> \
  "get_total_supplied(address)(uint256)" \
  0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc

# Should return: 0 (zero) if no one supplied yet
```

---

## Common Errors

### "Function 'supply' does not exist"
❌ **Problem**: Missing or outdated ABI
✅ **Solution**: Run `cargo stylus export-abi > ../../src/abis/LendingPool.json`

### "Contract not found at address 0x000..."
❌ **Problem**: `.env` not updated with deployed address
✅ **Solution**: Update `.env` with actual deployed addresses

### "Transaction failed: contract not initialized"
❌ **Problem**: Forgot to run `init()` on contract
✅ **Solution**: Run `cast send <ADDRESS> "init()" --rpc-url ... --private-key ...`

### "Insufficient funds"
❌ **Problem**: Not enough ETH on Arbitrum Sepolia
✅ **Solution**: Get more ETH from faucet and bridge to Arbitrum Sepolia

---

## Automated Deployment

Want to automate? Use the deployment script:

```bash
# See COMPLETE_DEPLOYMENT_GUIDE.md for the full script
# It will:
# - Build all contracts
# - Export all ABIs
# - Deploy all contracts
# - Initialize everything
# - Generate .env configuration
```

---

## What Each Contract Does

| Contract | Purpose | User-Facing? |
|----------|---------|--------------|
| **LendingPool** | Supply/borrow assets | ✅ Yes |
| **CollateralManager** | Track collateral & health | ✅ Yes |
| **InterestRateModel** | Calculate APY rates | ✅ Yes |
| **ReceiptGenerator** | Generate transaction proofs | ✅ Yes |
| **RiskEngine** | AI risk calculations | ❌ Backend |
| **LiquidationEngine** | Liquidate unhealthy positions | ❌ Keepers |
| **AIComputeVault** | ML inference | ❌ Backend |
| **PortfolioRebalancer** | Auto-optimize portfolios | ❌ Automated |
| **GaslessAA** | Sponsor gas fees | ❌ Transparent |

---

## Gas Costs

- Each contract: ~0.004-0.005 ETH
- Total for 9 contracts: ~0.035-0.045 ETH
- Initialization + config: ~0.010-0.015 ETH
- **Total needed: ~0.05 ETH**

---

## After Deployment

Your `.env` should look like:

```bash
# Supabase (already configured)
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Blockchain
VITE_CHAIN_ID=421614
VITE_CHAIN_NAME=Arbitrum Sepolia
VITE_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
VITE_BLOCK_EXPLORER=https://sepolia.arbiscan.io

# Your deployed contracts (NOT 0x000...!)
VITE_LENDING_POOL_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
VITE_COLLATERAL_MANAGER_ADDRESS=0x8Fc5e1A8e9A2F8b9c3D4e5F6A7B8C9D0E1F2A3B4
# ... etc (all 9 contracts)

# Assets
VITE_ETH_ADDRESS=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
# ... etc
```

Your `src/abis/` should have:

```
✓ LendingPool.json
✓ CollateralManager.json
✓ InterestRateModel.json
✓ RiskEngine.json
✓ LiquidationEngine.json
✓ AIComputeVault.json
✓ PortfolioRebalancer.json
✓ GaslessAA.json
✓ ReceiptGenerator.json
✓ ERC20.json (already exists)
```

---

## Need Help?

- **Full Guide**: [COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md)
- **Contract Details**: [contracts/README.md](./contracts/README.md)
- **Arbitrum Docs**: https://docs.arbitrum.io/stylus/
- **Discord**: https://discord.gg/arbitrum

---

**🎉 That's it! Deploy, initialize, update .env, and start coding!**
