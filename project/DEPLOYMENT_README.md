# 📚 Lendique Deployment Documentation Hub

Welcome! This is your central guide to deploying Lendique smart contracts.

---

## 🎯 Start Here

**New to deployment?** → Read [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) (5 minutes)

**Want complete guide?** → Read [COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md) (30 minutes)

**Confused about ABIs?** → Read [ABI_AND_ADDRESS_GUIDE.md](./ABI_AND_ADDRESS_GUIDE.md) (10 minutes)

---

## 📖 Documentation Index

### 🚀 Deployment Guides

| Guide | Purpose | Time | Difficulty |
|-------|---------|------|------------|
| **[DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md)** | Fast track deployment | 5 min | Easy |
| **[COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md)** | Detailed step-by-step | 30 min | Medium |
| **[ABI_AND_ADDRESS_GUIDE.md](./ABI_AND_ADDRESS_GUIDE.md)** | Understanding ABIs | 10 min | Easy |

### 📋 Contract Documentation

| Guide | Purpose | Time |
|-------|---------|------|
| **[contracts/DEPLOYMENT.md](./contracts/DEPLOYMENT.md)** | Original deployment guide | 20 min |
| **[contracts/SETUP_GUIDE.md](./contracts/SETUP_GUIDE.md)** | Setup instructions | 15 min |
| **[contracts/HOW_IT_WORKS.md](./contracts/HOW_IT_WORKS.md)** | Technical deep dive | 45 min |
| **[contracts/INTEGRATION_GUIDE.md](./contracts/INTEGRATION_GUIDE.md)** | Frontend integration | 30 min |

### 🏗️ Architecture

| Guide | Purpose | Time |
|-------|---------|------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System architecture | 20 min |
| **[EVERYTHING_IS_REAL.md](./EVERYTHING_IS_REAL.md)** | How everything connects | 15 min |
| **[contracts/README.md](./contracts/README.md)** | Contract overview | 10 min |

---

## 🎯 Quick Navigation

### I want to...

**Deploy contracts for the first time**
→ Start with [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md)

**Understand what ABIs are**
→ Read [ABI_AND_ADDRESS_GUIDE.md](./ABI_AND_ADDRESS_GUIDE.md)

**Get detailed deployment steps**
→ Follow [COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md)

**Understand the architecture**
→ Review [ARCHITECTURE.md](./ARCHITECTURE.md)

**Integrate with frontend**
→ See [contracts/INTEGRATION_GUIDE.md](./contracts/INTEGRATION_GUIDE.md)

**Troubleshoot deployment issues**
→ Check [COMPLETE_DEPLOYMENT_GUIDE.md#troubleshooting](./COMPLETE_DEPLOYMENT_GUIDE.md#troubleshooting)

---

## 🚀 Ultra Quick Start

```bash
# 1. Install dependencies (one-time setup)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
cargo install cargo-stylus
curl -L https://foundry.paradigm.xyz | bash && foundryup

# 2. Get testnet ETH
# Visit: https://faucet.quicknode.com/arbitrum/sepolia

# 3. Save private key
cd contracts/stylus
echo "your_private_key" > deployer-key.txt
chmod 600 deployer-key.txt

# 4. Build and export ABIs
cargo build --release --target wasm32-unknown-unknown
for contract in LendingPool CollateralManager InterestRateModel RiskEngine LiquidationEngine AIComputeVault PortfolioRebalancer GaslessAA ReceiptGenerator; do
  cargo stylus export-abi > "../../src/abis/${contract}.json"
done

# 5. Deploy (repeat 9 times, save each address)
cargo stylus deploy \
  --private-key-path=./deployer-key.txt \
  --endpoint=https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file=./target/wasm32-unknown-unknown/release/lendique_contracts.wasm

# 6. Initialize contracts
cast send <ADDRESS> "init()" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --private-key $(cat deployer-key.txt)

# 7. Update .env with all 9 addresses
cd ../..
nano .env

# 8. Start frontend
npm run dev
```

---

## 📊 The 9 Contracts You'll Deploy

| # | Contract | User-Facing? | Purpose |
|---|----------|--------------|---------|
| 1 | **LendingPool** | ✅ Yes | Supply/borrow assets |
| 2 | **CollateralManager** | ✅ Yes | Track collateral & health factor |
| 3 | **InterestRateModel** | ✅ Yes | Calculate APY rates |
| 4 | **ReceiptGenerator** | ✅ Yes | Generate transaction proofs |
| 5 | **RiskEngine** | ❌ Backend | AI risk calculations |
| 6 | **LiquidationEngine** | ❌ Keepers | Liquidate positions |
| 7 | **AIComputeVault** | ❌ Backend | ML inference |
| 8 | **PortfolioRebalancer** | ❌ Automated | Auto-optimize |
| 9 | **GaslessAA** | ❌ Transparent | Gas sponsorship |

---

## ⚠️ Critical Steps - DO NOT SKIP!

### 1. Export ABIs (MANDATORY!)

```bash
cargo stylus export-abi > ../../src/abis/ContractName.json
```

**Why?** Frontend cannot communicate with contracts without ABIs!

### 2. Update .env (MANDATORY!)

```bash
VITE_LENDING_POOL_ADDRESS=0xYourDeployedAddress
```

**Why?** Frontend needs to know where contracts are deployed!

### 3. Restart Frontend (MANDATORY!)

```bash
npm run dev
```

**Why?** Changes to .env require restart!

---

## 🎓 Understanding the Deployment Process

```
Rust Code → Build WASM → Export ABI → Deploy → Update .env → Frontend Works
   ↑           ↑            ↑           ↑          ↑              ↑
   │           │            │           │          │              │
   │           │            │           │          │              │
Write      Compile      Generate     Upload    Configure    Test in
contract   binary       interface    to chain  frontend     browser
```

### What Each Step Does:

1. **Build WASM** - Compiles Rust → WebAssembly binary
2. **Export ABI** - Generates JSON interface for frontend
3. **Deploy** - Uploads WASM to blockchain, gets address
4. **Update .env** - Tells frontend where contract is
5. **Restart** - Frontend loads new configuration

---

## 🔧 Prerequisites

### Required Tools

- ✅ Rust + Cargo
- ✅ Cargo Stylus
- ✅ Foundry (cast)
- ✅ ~0.05 ETH on Arbitrum Sepolia

### Check if installed:

```bash
rustc --version        # Should show: rustc 1.xx.x
cargo --version        # Should show: cargo 1.xx.x
cargo stylus --version # Should show: cargo-stylus x.x.x
cast --version         # Should show: cast x.x.x
```

---

## 🌐 Network Information

```
Network: Arbitrum Sepolia (Testnet)
Chain ID: 421614
RPC URL: https://sepolia-rollup.arbitrum.io/rpc
Explorer: https://sepolia.arbiscan.io
Faucet: https://faucet.quicknode.com/arbitrum/sepolia
```

---

## 💰 Cost Estimate

- **Per contract deployment**: ~0.004-0.005 ETH
- **Total for 9 contracts**: ~0.035-0.045 ETH
- **Initialization + config**: ~0.010-0.015 ETH
- **TOTAL NEEDED**: ~0.05 ETH on Arbitrum Sepolia

---

## ✅ Deployment Checklist

Use this checklist to track your progress:

```
Phase 1: Setup
[ ] Rust installed
[ ] Cargo Stylus installed
[ ] Foundry installed
[ ] Private key saved in deployer-key.txt
[ ] 0.05 ETH on Arbitrum Sepolia

Phase 2: Build
[ ] Contracts compiled (cargo build)
[ ] All 9 ABIs exported to src/abis/
[ ] WASM file exists

Phase 3: Deploy
[ ] LendingPool deployed & address saved
[ ] CollateralManager deployed & address saved
[ ] InterestRateModel deployed & address saved
[ ] RiskEngine deployed & address saved
[ ] LiquidationEngine deployed & address saved
[ ] AIComputeVault deployed & address saved
[ ] PortfolioRebalancer deployed & address saved
[ ] GaslessAA deployed & address saved
[ ] ReceiptGenerator deployed & address saved

Phase 4: Initialize
[ ] All 9 contracts initialized
[ ] Collateral factors configured
[ ] Liquidation thresholds set

Phase 5: Frontend
[ ] All 9 addresses in .env
[ ] All 9 ABIs in src/abis/
[ ] Frontend restarted
[ ] Wallet connected
[ ] Test supply transaction successful
[ ] Test borrow transaction successful

Phase 6: Verify
[ ] All contracts verified on Arbiscan
[ ] All transactions visible on explorer
[ ] Health factor displays correctly
[ ] APY rates display correctly
```

---

## 🐛 Troubleshooting

### "Function 'supply' does not exist"
- **Problem**: Missing or outdated ABI
- **Solution**: `cargo stylus export-abi > ../../src/abis/LendingPool.json`

### "Contract not found"
- **Problem**: Wrong address in .env
- **Solution**: Update .env with deployed address

### "Transaction reverted"
- **Problem**: Contract not initialized
- **Solution**: Run `cast send <ADDRESS> "init()" ...`

### "Insufficient funds"
- **Problem**: Not enough ETH
- **Solution**: Get more from faucet

**More troubleshooting**: See [COMPLETE_DEPLOYMENT_GUIDE.md#troubleshooting](./COMPLETE_DEPLOYMENT_GUIDE.md#troubleshooting)

---

## 📞 Support & Resources

### Official Documentation
- **Arbitrum Stylus**: https://docs.arbitrum.io/stylus/
- **Cargo Stylus**: https://github.com/OffchainLabs/cargo-stylus
- **Foundry Book**: https://book.getfoundry.sh/

### Explorers & Tools
- **Arbiscan Sepolia**: https://sepolia.arbiscan.io/
- **Arbitrum Bridge**: https://bridge.arbitrum.io/
- **Testnet Faucet**: https://faucet.quicknode.com/arbitrum/sepolia

### Community
- **Arbitrum Discord**: https://discord.gg/arbitrum
- **Arbitrum Forum**: https://forum.arbitrum.foundation/

---

## 🎯 What You Should Have After Deployment

### Files Created/Updated:

```
project/
├── contracts/stylus/
│   ├── deployer-key.txt              ← Your private key (GITIGNORED)
│   └── target/
│       └── wasm32-unknown-unknown/
│           └── release/
│               └── lendique_contracts.wasm  ← Compiled binary
│
├── src/abis/                          ← 9 ABI JSON files
│   ├── LendingPool.json              ← Exported
│   ├── CollateralManager.json        ← Exported
│   ├── InterestRateModel.json        ← Exported
│   ├── RiskEngine.json               ← Exported
│   ├── LiquidationEngine.json        ← Exported
│   ├── AIComputeVault.json           ← Exported
│   ├── PortfolioRebalancer.json      ← Exported
│   ├── GaslessAA.json                ← Exported
│   └── ReceiptGenerator.json         ← Exported
│
└── .env                               ← Updated with 9 addresses
    VITE_LENDING_POOL_ADDRESS=0x...
    VITE_COLLATERAL_MANAGER_ADDRESS=0x...
    (... 7 more ...)
```

### On Blockchain:

- ✅ 9 deployed contracts on Arbitrum Sepolia
- ✅ All contracts initialized
- ✅ Collateral factors configured
- ✅ Visible on https://sepolia.arbiscan.io/

### Working Frontend:

- ✅ Can connect wallet
- ✅ Can supply assets
- ✅ Can borrow assets
- ✅ Health factor displays
- ✅ APY rates display
- ✅ Transaction history works

---

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ All 9 contracts deployed to Arbitrum Sepolia
2. ✅ All 9 ABIs exported to `src/abis/`
3. ✅ All 9 addresses in `.env`
4. ✅ Frontend starts without errors
5. ✅ Can connect MetaMask wallet
6. ✅ Can supply test ETH
7. ✅ Can see health factor
8. ✅ Transaction shows on Arbiscan

---

## 🚀 Next Steps After Deployment

1. **Test thoroughly** - Try all features
2. **Monitor contracts** - Watch for errors
3. **Invite testers** - Get feedback
4. **Fix issues** - Iterate based on testing
5. **Prepare for mainnet** - Get security audit
6. **Deploy to mainnet** - Follow same process
7. **Launch!** - Announce to community

---

## 📚 Recommended Reading Order

For beginners:
1. [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) - Get started fast
2. [ABI_AND_ADDRESS_GUIDE.md](./ABI_AND_ADDRESS_GUIDE.md) - Understand ABIs
3. [COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md) - Full details

For developers:
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
2. [contracts/HOW_IT_WORKS.md](./contracts/HOW_IT_WORKS.md) - Technical details
3. [contracts/INTEGRATION_GUIDE.md](./contracts/INTEGRATION_GUIDE.md) - Integration

For auditors:
1. [contracts/README.md](./contracts/README.md) - Contract overview
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
3. Rust source code in `contracts/stylus/src/`

---

## 💡 Pro Tips

1. **Save deployment logs** - Keep track of all addresses
2. **Test on testnet first** - Don't deploy to mainnet immediately
3. **Use version control** - Commit ABIs and addresses
4. **Document changes** - Note what changed in each deployment
5. **Automate** - Use deployment scripts for consistency
6. **Monitor gas** - Track costs for future deployments
7. **Backup keys** - Never lose your deployer private key
8. **Verify contracts** - On Arbiscan for transparency

---

## 🔐 Security Reminders

- ⚠️ **NEVER commit private keys** to git
- ⚠️ **NEVER share private keys** publicly
- ⚠️ **Use .gitignore** for deployer-key.txt
- ⚠️ **Test on testnet** before mainnet
- ⚠️ **Get security audit** for production
- ⚠️ **Monitor contracts** after deployment
- ⚠️ **Have emergency plan** for critical issues

---

## 🎓 Learning Resources

### Understanding Arbitrum Stylus
- Official docs: https://docs.arbitrum.io/stylus/
- Gentle intro: https://docs.arbitrum.io/stylus/stylus-gentle-introduction
- Rust SDK: https://docs.arbitrum.io/stylus/rust-sdk-guide

### Understanding ABIs
- [ABI_AND_ADDRESS_GUIDE.md](./ABI_AND_ADDRESS_GUIDE.md)
- Ethereum ABI spec: https://docs.soliditylang.org/en/latest/abi-spec.html

### Understanding Smart Contracts
- Foundry book: https://book.getfoundry.sh/
- ethers.js docs: https://docs.ethers.org/v6/

---

**🎉 You're ready to deploy! Choose your guide and get started!**

- **Quick start** → [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md)
- **Complete guide** → [COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md)
- **Understand ABIs** → [ABI_AND_ADDRESS_GUIDE.md](./ABI_AND_ADDRESS_GUIDE.md)
