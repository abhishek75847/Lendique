# Lendique Smart Contract Deployment Guide

This guide walks you through deploying Lendique's Rust-based Stylus smart contracts to Arbitrum.

## Prerequisites

### 1. Install Rust and Cargo

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart your terminal or run:
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version
```

### 2. Add WebAssembly Target

```bash
rustup target add wasm32-unknown-unknown
```

### 3. Install Cargo Stylus

```bash
cargo install cargo-stylus
```

### 4. Install Foundry (for contract verification)

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Network Configuration

### Arbitrum Sepolia Testnet (Recommended for Testing)

- **Chain ID**: 421614
- **RPC URL**: https://sepolia-rollup.arbitrum.io/rpc
- **Explorer**: https://sepolia.arbiscan.io/
- **Faucet**: https://faucet.quicknode.com/arbitrum/sepolia

### Arbitrum One Mainnet (Production)

- **Chain ID**: 42161
- **RPC URL**: https://arb1.arbitrum.io/rpc
- **Explorer**: https://arbiscan.io/

## Step 1: Get Testnet ETH

You need ETH on Arbitrum Sepolia to deploy contracts:

1. Get Sepolia ETH from a faucet:
   - https://sepoliafaucet.com/
   - https://faucet.quicknode.com/ethereum/sepolia

2. Bridge Sepolia ETH to Arbitrum Sepolia:
   - Visit: https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia
   - Connect your wallet
   - Bridge ETH from Sepolia to Arbitrum Sepolia

## Step 2: Set Up Private Key

Create a file to store your private key securely:

```bash
cd contracts/stylus

# Create a .env file (DO NOT commit this to git!)
echo "PRIVATE_KEY=your_private_key_here" > .env

# Or create a key file
echo "your_private_key_here" > deployer-key.txt
chmod 600 deployer-key.txt
```

**IMPORTANT**: Add `.env` and `deployer-key.txt` to your `.gitignore`:

```bash
echo ".env" >> ../../.gitignore
echo "deployer-key.txt" >> ../../.gitignore
```

## Step 3: Build the Contracts

```bash
cd contracts/stylus

# Check if contracts can be compiled
cargo stylus check

# Build optimized WASM
cargo build --release --target wasm32-unknown-unknown

# Optimize for deployment
cargo stylus export-abi --release
```

## Step 4: Deploy Contracts

### Deploy Individual Contracts

#### 1. Deploy LendingPool

```bash
cargo stylus deploy \
  --private-key-path=./deployer-key.txt \
  --endpoint=https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file=./target/wasm32-unknown-unknown/release/lendique_contracts.wasm
```

Save the deployed contract address from the output.

#### 2. Deploy CollateralManager

```bash
cargo stylus deploy \
  --private-key-path=./deployer-key.txt \
  --endpoint=https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file=./target/wasm32-unknown-unknown/release/lendique_contracts.wasm
```

#### 3. Deploy Remaining Contracts

Repeat for each contract:
- LiquidationEngine
- InterestRateModel
- RiskEngine
- AiComputeVault
- PortfolioRebalancer
- GaslessAccountAbstraction
- ReceiptGenerator

### Using Environment Variables

```bash
export PRIVATE_KEY="your_private_key_here"
export RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

cargo stylus deploy \
  --private-key=$PRIVATE_KEY \
  --endpoint=$RPC_URL \
  --wasm-file=./target/wasm32-unknown-unknown/release/lendique_contracts.wasm
```

## Step 5: Initialize Contracts

After deployment, initialize each contract:

### Using Cast (Foundry)

```bash
# Initialize LendingPool
cast send <LENDING_POOL_ADDRESS> "init()" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $PRIVATE_KEY

# Initialize CollateralManager
cast send <COLLATERAL_MANAGER_ADDRESS> "init()" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $PRIVATE_KEY

# Initialize InterestRateModel with parameters
# base_rate=200 (2%), multiplier=1000 (10%), jump_multiplier=5000 (50%), optimal_util=8000 (80%)
cast send <INTEREST_RATE_MODEL_ADDRESS> \
  "init(uint256,uint256,uint256,uint256)" 200 1000 5000 8000 \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $PRIVATE_KEY

# Initialize LiquidationEngine
# threshold=10000 (100%), penalty=500 (5%)
cast send <LIQUIDATION_ENGINE_ADDRESS> \
  "init(uint256,uint256)" 10000 500 \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $PRIVATE_KEY
```

## Step 6: Configure Contract Parameters

### Set Collateral Factors

```bash
# ETH: 75% collateral factor (7500)
cast send <COLLATERAL_MANAGER_ADDRESS> \
  "set_collateral_factor(address,uint256)" \
  <ETH_TOKEN_ADDRESS> 7500 \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $PRIVATE_KEY

# USDC: 80% collateral factor
cast send <COLLATERAL_MANAGER_ADDRESS> \
  "set_collateral_factor(address,uint256)" \
  <USDC_TOKEN_ADDRESS> 8000 \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $PRIVATE_KEY
```

### Set Liquidation Thresholds

```bash
cast send <COLLATERAL_MANAGER_ADDRESS> \
  "set_liquidation_threshold(address,uint256)" \
  <ETH_TOKEN_ADDRESS> 8000 \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $PRIVATE_KEY
```

## Step 7: Verify Contracts

### On Arbiscan

1. Go to https://sepolia.arbiscan.io/
2. Search for your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Select "Stylus WASM" as compiler type
6. Upload your WASM file

### Using Cargo Stylus

```bash
cargo stylus verify \
  --deployment-tx=<DEPLOYMENT_TX_HASH> \
  --endpoint=https://sepolia-rollup.arbitrum.io/rpc
```

## Step 8: Update Frontend Configuration

Create a contract addresses file:

```typescript
// src/config/contracts.ts
export const CONTRACTS = {
  LENDING_POOL: '0x...',
  COLLATERAL_MANAGER: '0x...',
  LIQUIDATION_ENGINE: '0x...',
  INTEREST_RATE_MODEL: '0x...',
  RISK_ENGINE: '0x...',
  AI_COMPUTE_VAULT: '0x...',
  PORTFOLIO_REBALANCER: '0x...',
  GASLESS_ACCOUNT_ABSTRACTION: '0x...',
  RECEIPT_GENERATOR: '0x...',
};

export const CHAIN_CONFIG = {
  CHAIN_ID: 421614,
  RPC_URL: 'https://sepolia-rollup.arbitrum.io/rpc',
  EXPLORER: 'https://sepolia.arbiscan.io',
};
```

## Step 9: Test Deployment

### Check Contract State

```bash
# Get total supplied for an asset
cast call <LENDING_POOL_ADDRESS> \
  "get_total_supplied(address)(uint256)" \
  <ASSET_ADDRESS> \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc

# Get base rate
cast call <INTEREST_RATE_MODEL_ADDRESS> \
  "get_base_rate()(uint256)" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

### Make a Test Transaction

```bash
# Supply 1 ETH to lending pool
cast send <LENDING_POOL_ADDRESS> \
  "supply(address,uint256)" \
  <ETH_ADDRESS> 1000000000000000000 \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $PRIVATE_KEY \
  --value 1ether
```

## Deployment Script (Automated)

Create a deployment script:

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Building contracts..."
cargo build --release --target wasm32-unknown-unknown

echo "Deploying LendingPool..."
LENDING_POOL=$(cargo stylus deploy \
  --private-key-path=./deployer-key.txt \
  --endpoint=https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file=./target/wasm32-unknown-unknown/release/lendique_contracts.wasm | \
  grep "Deployed to" | awk '{print $3}')

echo "LendingPool deployed at: $LENDING_POOL"

# Initialize
cast send $LENDING_POOL "init()" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key-path=./deployer-key.txt

echo "Deployment complete!"
echo "Save these addresses:"
echo "LENDING_POOL=$LENDING_POOL"
```

Make it executable:

```bash
chmod +x deploy.sh
./deploy.sh
```

## Common Issues & Solutions

### Issue: "Insufficient funds"
**Solution**: Get more testnet ETH from the faucet

### Issue: "WASM file not found"
**Solution**: Run `cargo build --release --target wasm32-unknown-unknown` first

### Issue: "Contract already deployed"
**Solution**: Use `--force` flag or deploy to a different network

### Issue: "Gas estimation failed"
**Solution**: Increase gas limit with `--gas-limit` flag

## Gas Costs (Approximate)

- LendingPool deployment: ~0.005 ETH
- CollateralManager deployment: ~0.004 ETH
- Other contracts: ~0.003-0.005 ETH each
- Total deployment: ~0.035-0.045 ETH

## Production Deployment Checklist

- [ ] Audit smart contracts
- [ ] Test on Sepolia testnet thoroughly
- [ ] Set up multisig for contract ownership
- [ ] Configure emergency pause functionality
- [ ] Set up monitoring and alerts
- [ ] Prepare incident response plan
- [ ] Get sufficient mainnet ETH
- [ ] Deploy to Arbitrum One mainnet
- [ ] Verify all contracts on Arbiscan
- [ ] Test with small amounts first
- [ ] Update frontend with mainnet addresses
- [ ] Announce deployment

## Support & Resources

- Arbitrum Stylus Docs: https://docs.arbitrum.io/stylus/stylus-gentle-introduction
- Cargo Stylus: https://github.com/OffchainLabs/cargo-stylus
- Arbitrum Discord: https://discord.gg/arbitrum
- Lendique GitHub: [Your repo URL]

## Security Best Practices

1. **Never commit private keys** - Use `.env` or key files (gitignored)
2. **Use hardware wallets** - For mainnet deployments
3. **Test extensively** - On testnet before mainnet
4. **Audit contracts** - Get professional security audits
5. **Use timelock** - For critical parameter changes
6. **Monitor contracts** - Set up alerts for unusual activity
7. **Have emergency plans** - Pause functionality, upgrade paths

---

**Need Help?** Open an issue on GitHub or contact the team on Discord.
