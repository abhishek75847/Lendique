# 🚀 Complete Lendique Deployment Guide

This is the **COMPLETE step-by-step guide** to deploy Lendique smart contracts and connect them to your frontend.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Install Dependencies](#step-1-install-dependencies)
3. [Step 2: Get Testnet ETH](#step-2-get-testnet-eth)
4. [Step 3: Set Up Private Key](#step-3-set-up-private-key)
5. [Step 4: Build Contracts](#step-4-build-contracts)
6. [Step 5: Export ABIs](#step-5-export-abis-critical)
7. [Step 6: Deploy All 9 Contracts](#step-6-deploy-all-9-contracts)
8. [Step 7: Initialize Contracts](#step-7-initialize-contracts)
9. [Step 8: Configure Parameters](#step-8-configure-parameters)
10. [Step 9: Update Frontend Configuration](#step-9-update-frontend-configuration)
11. [Step 10: Test Everything](#step-10-test-everything)
12. [Automated Deployment Script](#automated-deployment-script)
13. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, make sure you have:
- A wallet with Arbitrum Sepolia ETH (~0.05 ETH for deployment)
- Basic command line knowledge
- Access to this project's repository

---

## Step 1: Install Dependencies

### 1.1 Install Rust and Cargo

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart your terminal or run:
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version
```

### 1.2 Add WebAssembly Target

```bash
rustup target add wasm32-unknown-unknown
```

### 1.3 Install Cargo Stylus

```bash
cargo install cargo-stylus
```

### 1.4 Install Foundry (for initialization and testing)

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
cast --version
```

---

## Step 2: Get Testnet ETH

### 2.1 Get Sepolia ETH

Visit one of these faucets:
- https://sepoliafaucet.com/
- https://faucet.quicknode.com/ethereum/sepolia

### 2.2 Bridge to Arbitrum Sepolia

1. Visit: https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia
2. Connect your wallet
3. Bridge ETH from Sepolia to Arbitrum Sepolia (minimum 0.05 ETH recommended)

### Network Details

- **Chain ID**: 421614
- **RPC URL**: https://sepolia-rollup.arbitrum.io/rpc
- **Explorer**: https://sepolia.arbiscan.io/
- **Native Currency**: ETH

---

## Step 3: Set Up Private Key

### 3.1 Create Key File

```bash
cd contracts/stylus

# Create a key file (NEVER commit this!)
echo "your_private_key_here" > deployer-key.txt
chmod 600 deployer-key.txt
```

**How to get your private key:**
- MetaMask: Settings > Security & Privacy > Show Private Key
- Other wallets: Check wallet documentation

### 3.2 Secure Your Key

```bash
# Make sure it's in .gitignore
cd ../..
echo "deployer-key.txt" >> .gitignore
echo "contracts/stylus/deployer-key.txt" >> .gitignore
```

**WARNING**: NEVER commit your private key to git or share it publicly!

---

## Step 4: Build Contracts

```bash
cd contracts/stylus

# Check if contracts can be compiled
cargo stylus check

# Build optimized WASM
cargo build --release --target wasm32-unknown-unknown
```

**Expected output:**
```
✓ Compiled successfully
✓ WASM file created at: target/wasm32-unknown-unknown/release/lendique_contracts.wasm
```

---

## Step 5: Export ABIs (CRITICAL!)

**This step is MANDATORY!** Your frontend needs ABIs to communicate with contracts.

### 5.1 Export All ABIs

```bash
# Still in contracts/stylus directory

# Export ABI for LendingPool
cargo stylus export-abi > ../../src/abis/LendingPool.json

# Export ABI for CollateralManager
cargo stylus export-abi > ../../src/abis/CollateralManager.json

# Export ABI for InterestRateModel
cargo stylus export-abi > ../../src/abis/InterestRateModel.json

# Export ABI for RiskEngine
cargo stylus export-abi > ../../src/abis/RiskEngine.json

# Export ABI for LiquidationEngine
cargo stylus export-abi > ../../src/abis/LiquidationEngine.json

# Export ABI for AIComputeVault
cargo stylus export-abi > ../../src/abis/AIComputeVault.json

# Export ABI for PortfolioRebalancer
cargo stylus export-abi > ../../src/abis/PortfolioRebalancer.json

# Export ABI for GaslessAA
cargo stylus export-abi > ../../src/abis/GaslessAA.json

# Export ABI for ReceiptGenerator
cargo stylus export-abi > ../../src/abis/ReceiptGenerator.json
```

### 5.2 Verify ABIs Were Created

```bash
ls -lh ../../src/abis/
```

You should see 9 JSON files (plus ERC20.json which already exists).

---

## Step 6: Deploy All 9 Contracts

### 6.1 Deploy LendingPool

```bash
cargo stylus deploy \
  --private-key-path=./deployer-key.txt \
  --endpoint=https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file=./target/wasm32-unknown-unknown/release/lendique_contracts.wasm
```

**Save the output address!** Example:
```
✓ Deployed to: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### 6.2 Deploy CollateralManager

```bash
cargo stylus deploy \
  --private-key-path=./deployer-key.txt \
  --endpoint=https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file=./target/wasm32-unknown-unknown/release/lendique_contracts.wasm
```

**Save this address too!**

### 6.3 Deploy Remaining 7 Contracts

Repeat the same command for:
1. LiquidationEngine
2. InterestRateModel
3. RiskEngine
4. AIComputeVault
5. PortfolioRebalancer
6. GaslessAA
7. ReceiptGenerator

**Save ALL addresses!** You'll need them in Step 9.

### 6.4 Track Your Deployed Addresses

Create a temporary file to track addresses:

```bash
# Create a deployment log
cat > deployment-log.txt << EOF
LENDING_POOL_ADDRESS=
COLLATERAL_MANAGER_ADDRESS=
LIQUIDATION_ENGINE_ADDRESS=
INTEREST_RATE_MODEL_ADDRESS=
RISK_ENGINE_ADDRESS=
AI_COMPUTE_VAULT_ADDRESS=
PORTFOLIO_REBALANCER_ADDRESS=
GASLESS_AA_ADDRESS=
RECEIPT_GENERATOR_ADDRESS=
EOF
```

Fill in the addresses as you deploy each contract.

---

## Step 7: Initialize Contracts

After deployment, initialize each contract with `init()` or specific parameters.

### 7.1 Set Environment Variables

```bash
export PRIVATE_KEY=$(cat deployer-key.txt)
export RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
```

### 7.2 Initialize LendingPool

```bash
cast send <LENDING_POOL_ADDRESS> "init()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 7.3 Initialize CollateralManager

```bash
cast send <COLLATERAL_MANAGER_ADDRESS> "init()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 7.4 Initialize InterestRateModel

```bash
# Parameters: base_rate, multiplier, jump_multiplier, optimal_utilization
# Example: 2%, 10%, 50%, 80%
cast send <INTEREST_RATE_MODEL_ADDRESS> \
  "init(uint256,uint256,uint256,uint256)" 200 1000 5000 8000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 7.5 Initialize LiquidationEngine

```bash
# Parameters: liquidation_threshold, liquidation_penalty
# Example: 100% threshold, 5% penalty
cast send <LIQUIDATION_ENGINE_ADDRESS> \
  "init(uint256,uint256)" 10000 500 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 7.6 Initialize RiskEngine

```bash
cast send <RISK_ENGINE_ADDRESS> "init()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 7.7 Initialize Remaining Contracts

```bash
# AIComputeVault
cast send <AI_COMPUTE_VAULT_ADDRESS> "init()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# PortfolioRebalancer
cast send <PORTFOLIO_REBALANCER_ADDRESS> "init()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# GaslessAA
cast send <GASLESS_AA_ADDRESS> "init()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# ReceiptGenerator
cast send <RECEIPT_GENERATOR_ADDRESS> "init()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## Step 8: Configure Parameters

### 8.1 Set Collateral Factors

```bash
# ETH: 75% collateral factor
cast send <COLLATERAL_MANAGER_ADDRESS> \
  "set_collateral_factor(address,uint256)" \
  0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE 7500 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# USDC: 80% collateral factor (use actual USDC address)
cast send <COLLATERAL_MANAGER_ADDRESS> \
  "set_collateral_factor(address,uint256)" \
  <USDC_ADDRESS> 8000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 8.2 Set Liquidation Thresholds

```bash
# ETH: 80% liquidation threshold
cast send <COLLATERAL_MANAGER_ADDRESS> \
  "set_liquidation_threshold(address,uint256)" \
  0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE 8000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 8.3 Get Token Addresses

For Arbitrum Sepolia testnet:
- **ETH**: `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` (native ETH)
- **USDC**: Check Arbitrum Sepolia faucet for test tokens
- **USDT**: Check Arbitrum Sepolia faucet for test tokens
- **WBTC**: Check Arbitrum Sepolia faucet for test tokens

---

## Step 9: Update Frontend Configuration

### 9.1 Update .env File

```bash
cd ../../  # Go back to project root

# Edit .env file
nano .env
```

Replace the placeholder addresses with your deployed addresses:

```bash
# Smart Contract Addresses (Replace with your deployed addresses)
VITE_LENDING_POOL_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
VITE_COLLATERAL_MANAGER_ADDRESS=0x8Fc5e1A8e9A2F8b9c3D4e5F6A7B8C9D0E1F2A3B4
VITE_LIQUIDATION_ENGINE_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
VITE_INTEREST_RATE_MODEL_ADDRESS=0xabcdef1234567890abcdef1234567890abcdef12
VITE_RISK_ENGINE_ADDRESS=0x9876543210fedcba9876543210fedcba98765432
VITE_AI_COMPUTE_VAULT_ADDRESS=0xfedcba9876543210fedcba9876543210fedcba98
VITE_PORTFOLIO_REBALANCER_ADDRESS=0x1111222233334444555566667777888899990000
VITE_GASLESS_AA_ADDRESS=0xaaaBBBcccDDDeeeFFF000111222333444555666
VITE_RECEIPT_GENERATOR_ADDRESS=0x777888999aaaBBBcccDDDeeeFFF000111222333

# Supported Asset Addresses (Replace with actual token addresses)
VITE_ETH_ADDRESS=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
VITE_USDC_ADDRESS=0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d
VITE_USDT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
VITE_WBTC_ADDRESS=0xabcdef1234567890abcdef1234567890abcdef12
```

### 9.2 Verify ABIs Are in Place

```bash
ls -lh src/abis/
```

Should show:
```
AIComputeVault.json
CollateralManager.json
ERC20.json
GaslessAA.json
InterestRateModel.json
LendingPool.json
LiquidationEngine.json
PortfolioRebalancer.json
ReceiptGenerator.json
RiskEngine.json
```

---

## Step 10: Test Everything

### 10.1 Start Frontend

```bash
npm run dev
```

### 10.2 Test Contract Calls

Open another terminal and test contract reads:

```bash
# Check if LendingPool is initialized
cast call <LENDING_POOL_ADDRESS> \
  "get_total_supplied(address)(uint256)" \
  0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc

# Check InterestRateModel base rate
cast call <INTEREST_RATE_MODEL_ADDRESS> \
  "get_base_rate()(uint256)" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

### 10.3 Test via Frontend

1. Open browser to `http://localhost:5173`
2. Connect your wallet (MetaMask)
3. Try to supply a small amount of ETH (e.g., 0.001 ETH)
4. Check transaction on https://sepolia.arbiscan.io/

### 10.4 Verify on Arbiscan

1. Go to https://sepolia.arbiscan.io/
2. Search for your LendingPool address
3. Click "Contract" tab
4. You should see the contract bytecode

---

## Automated Deployment Script

Create a deployment script to automate the process:

### create-deploy-script.sh

```bash
#!/bin/bash
# deploy-all.sh - Automated deployment script

set -e

echo "🚀 Lendique Deployment Script"
echo "=============================="

# Change to contracts directory
cd contracts/stylus

# Step 1: Build
echo "📦 Building contracts..."
cargo build --release --target wasm32-unknown-unknown

# Step 2: Export ABIs
echo "📄 Exporting ABIs..."
contracts=(
  "LendingPool"
  "CollateralManager"
  "InterestRateModel"
  "RiskEngine"
  "LiquidationEngine"
  "AIComputeVault"
  "PortfolioRebalancer"
  "GaslessAA"
  "ReceiptGenerator"
)

for contract in "${contracts[@]}"; do
  echo "  - Exporting $contract ABI..."
  cargo stylus export-abi > "../../src/abis/${contract}.json"
done

# Step 3: Deploy contracts
echo "🚢 Deploying contracts..."

WASM_FILE="./target/wasm32-unknown-unknown/release/lendique_contracts.wasm"
ENDPOINT="https://sepolia-rollup.arbitrum.io/rpc"
PRIVATE_KEY_PATH="./deployer-key.txt"

declare -A ADDRESSES

for contract in "${contracts[@]}"; do
  echo "  - Deploying $contract..."

  OUTPUT=$(cargo stylus deploy \
    --private-key-path=$PRIVATE_KEY_PATH \
    --endpoint=$ENDPOINT \
    --wasm-file=$WASM_FILE 2>&1)

  ADDRESS=$(echo "$OUTPUT" | grep -oP 'Deployed to: \K0x[a-fA-F0-9]{40}')
  ADDRESSES[$contract]=$ADDRESS

  echo "    ✓ Deployed at: $ADDRESS"
  sleep 2
done

# Step 4: Initialize contracts
echo "⚙️  Initializing contracts..."

export PRIVATE_KEY=$(cat $PRIVATE_KEY_PATH)

# Initialize basic contracts
for contract in "LendingPool" "CollateralManager" "RiskEngine" "AIComputeVault" "PortfolioRebalancer" "GaslessAA" "ReceiptGenerator"; do
  echo "  - Initializing $contract..."
  cast send ${ADDRESSES[$contract]} "init()" \
    --rpc-url $ENDPOINT \
    --private-key $PRIVATE_KEY
  sleep 2
done

# Initialize InterestRateModel with parameters
echo "  - Initializing InterestRateModel..."
cast send ${ADDRESSES[InterestRateModel]} \
  "init(uint256,uint256,uint256,uint256)" 200 1000 5000 8000 \
  --rpc-url $ENDPOINT \
  --private-key $PRIVATE_KEY
sleep 2

# Initialize LiquidationEngine with parameters
echo "  - Initializing LiquidationEngine..."
cast send ${ADDRESSES[LiquidationEngine]} \
  "init(uint256,uint256)" 10000 500 \
  --rpc-url $ENDPOINT \
  --private-key $PRIVATE_KEY

# Step 5: Generate .env updates
echo "📝 Generating .env configuration..."

cd ../..

cat > deployment-addresses.txt << EOF
# Copy these to your .env file:

VITE_LENDING_POOL_ADDRESS=${ADDRESSES[LendingPool]}
VITE_COLLATERAL_MANAGER_ADDRESS=${ADDRESSES[CollateralManager]}
VITE_LIQUIDATION_ENGINE_ADDRESS=${ADDRESSES[LiquidationEngine]}
VITE_INTEREST_RATE_MODEL_ADDRESS=${ADDRESSES[InterestRateModel]}
VITE_RISK_ENGINE_ADDRESS=${ADDRESSES[RiskEngine]}
VITE_AI_COMPUTE_VAULT_ADDRESS=${ADDRESSES[AIComputeVault]}
VITE_PORTFOLIO_REBALANCER_ADDRESS=${ADDRESSES[PortfolioRebalancer]}
VITE_GASLESS_AA_ADDRESS=${ADDRESSES[GaslessAA]}
VITE_RECEIPT_GENERATOR_ADDRESS=${ADDRESSES[ReceiptGenerator]}
EOF

echo ""
echo "✅ Deployment Complete!"
echo "======================="
echo ""
echo "📋 Deployed Contract Addresses:"
for contract in "${contracts[@]}"; do
  echo "  $contract: ${ADDRESSES[$contract]}"
done
echo ""
echo "📄 Configuration saved to: deployment-addresses.txt"
echo ""
echo "🔧 Next Steps:"
echo "  1. Copy addresses from deployment-addresses.txt to your .env file"
echo "  2. Run: npm run dev"
echo "  3. Test the application in your browser"
echo ""
```

### Make it executable and run:

```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

---

## Troubleshooting

### Issue: "Insufficient funds"

**Solution**: Get more testnet ETH from the faucet and bridge to Arbitrum Sepolia.

### Issue: "WASM file not found"

**Solution**: Run `cargo build --release --target wasm32-unknown-unknown` first.

### Issue: "Private key not found"

**Solution**: Create `deployer-key.txt` in `contracts/stylus/` with your private key.

### Issue: "Frontend shows 'undefined' for contract address"

**Solution**:
1. Check `.env` file has the correct addresses
2. Restart the dev server: `npm run dev`
3. Clear browser cache

### Issue: "Transaction fails with 'invalid address'"

**Solution**:
1. Verify all 9 contracts are deployed
2. Check addresses in `.env` match deployed addresses
3. Make sure addresses start with `0x`

### Issue: "Function 'supply' does not exist"

**Solution**:
1. Export ABIs: `cargo stylus export-abi > ../../src/abis/LendingPool.json`
2. Restart frontend: `npm run dev`

### Issue: "Contract not initialized"

**Solution**: Run the `cast send` initialization commands for each contract.

### Issue: "Health factor calculation fails"

**Solution**: Make sure CollateralManager is initialized and collateral factors are set.

---

## Gas Costs (Approximate)

- **LendingPool**: ~0.005 ETH
- **CollateralManager**: ~0.004 ETH
- **Other contracts**: ~0.003-0.005 ETH each
- **Total deployment**: ~0.035-0.045 ETH
- **Initialization**: ~0.005-0.010 ETH
- **Configuration**: ~0.002-0.005 ETH

**Total needed**: ~0.05 ETH on Arbitrum Sepolia

---

## Production Deployment Checklist

Before deploying to mainnet:

- [ ] Audit smart contracts (professional security audit)
- [ ] Test extensively on Sepolia testnet
- [ ] Set up multisig for contract ownership
- [ ] Configure emergency pause functionality
- [ ] Set up monitoring and alerts
- [ ] Prepare incident response plan
- [ ] Get sufficient mainnet ETH (~0.5-1 ETH for safety)
- [ ] Deploy to Arbitrum One mainnet
- [ ] Verify all contracts on Arbiscan
- [ ] Test with small amounts first
- [ ] Update frontend with mainnet addresses
- [ ] Update DNS/domain settings
- [ ] Announce deployment to community

---

## Security Best Practices

1. **Never commit private keys** - Always use `.gitignore`
2. **Use hardware wallets** - For mainnet deployments
3. **Test extensively** - On testnet before mainnet
4. **Get audits** - Professional security audits are essential
5. **Use timelock** - For critical parameter changes
6. **Monitor contracts** - Set up alerts for unusual activity
7. **Have emergency plans** - Pause functionality, upgrade paths
8. **Start small** - Test with small amounts on mainnet first
9. **Document everything** - Keep detailed deployment logs
10. **Backup everything** - Save all addresses, ABIs, and keys securely

---

## Support & Resources

- **Arbitrum Stylus Docs**: https://docs.arbitrum.io/stylus/stylus-gentle-introduction
- **Cargo Stylus**: https://github.com/OffchainLabs/cargo-stylus
- **Foundry Book**: https://book.getfoundry.sh/
- **Arbitrum Discord**: https://discord.gg/arbitrum
- **Arbitrum Sepolia Explorer**: https://sepolia.arbiscan.io/
- **Arbitrum Sepolia Faucet**: https://faucet.quicknode.com/arbitrum/sepolia

---

## Quick Reference Card

### Network Info
```
Chain ID: 421614
RPC: https://sepolia-rollup.arbitrum.io/rpc
Explorer: https://sepolia.arbiscan.io
```

### Essential Commands
```bash
# Build
cargo build --release --target wasm32-unknown-unknown

# Export ABI
cargo stylus export-abi > ../../src/abis/ContractName.json

# Deploy
cargo stylus deploy \
  --private-key-path=./deployer-key.txt \
  --endpoint=https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file=./target/wasm32-unknown-unknown/release/lendique_contracts.wasm

# Initialize
cast send <ADDRESS> "init()" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $PRIVATE_KEY

# Check contract
cast call <ADDRESS> "get_total_supplied(address)(uint256)" <ASSET_ADDRESS> \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

---

## What You Should Have After Deployment

✅ 9 deployed smart contracts on Arbitrum Sepolia
✅ 9 ABI files in `src/abis/`
✅ Updated `.env` file with all contract addresses
✅ All contracts initialized
✅ Collateral factors configured
✅ Working frontend that can interact with contracts
✅ Verified contracts on Arbiscan (optional but recommended)

---

**🎉 Congratulations! Your Lendique DeFi protocol is now deployed and ready to use!**

**Need Help?** Open an issue on GitHub or contact the team.
