# 🔗 Understanding ABIs and Contract Addresses

**Quick answer: YES, you MUST update ABIs after deploying contracts!**

This guide explains why ABIs matter and how they work with contract addresses.

---

## 📖 What is an ABI?

**ABI = Application Binary Interface**

Think of it as a **menu** for your smart contract:

```
Restaurant Menu (ABI)          Smart Contract ABI
═══════════════════            ═══════════════════
Item: Burger                   Function: supply
Price: $10                     Parameters: (address, uint256)
Description: With cheese       Returns: void

Item: Pizza                    Function: borrow
Price: $15                     Parameters: (address, uint256)
Description: Pepperoni         Returns: void
```

---

## 🔍 What's Inside an ABI?

```json
{
  "abi": [
    {
      "name": "supply",
      "type": "function",
      "inputs": [
        { "name": "asset", "type": "address" },
        { "name": "amount", "type": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "payable"
    }
  ]
}
```

**This tells your frontend:**
- ✅ Function name: `supply`
- ✅ Parameter 1: `asset` (Ethereum address)
- ✅ Parameter 2: `amount` (big number)
- ✅ Costs gas: `payable`

---

## 🎯 How Frontend Uses ABI + Address

### The Three Ingredients

```typescript
// 1. Contract Address (WHERE the contract is)
const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

// 2. ABI (WHAT functions the contract has)
import LendingPoolABI from '../abis/LendingPool.json';

// 3. Signer (WHO is calling - your wallet)
const signer = await provider.getSigner();

// Mix them together = Working contract!
const contract = new ethers.Contract(address, LendingPoolABI.abi, signer);

// Now you can call functions:
await contract.supply(assetAddress, amount);
```

---

## 🔄 The Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Write Contract in Rust                                │
│  ─────────────────────────────────────────────────────────────  │
│  pub fn supply(&mut self, asset: Address, amount: U256) { ... } │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Build Contract                                         │
│  ─────────────────────────────────────────────────────────────  │
│  $ cargo build --release --target wasm32-unknown-unknown        │
│  ✓ Creates: lendique_contracts.wasm                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Export ABI (CRITICAL!)                                 │
│  ─────────────────────────────────────────────────────────────  │
│  $ cargo stylus export-abi > ../../src/abis/LendingPool.json   │
│  ✓ Creates: JSON file with function definitions                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Deploy to Blockchain                                   │
│  ─────────────────────────────────────────────────────────────  │
│  $ cargo stylus deploy ...                                      │
│  ✓ Contract deployed to: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Update .env with Address                               │
│  ─────────────────────────────────────────────────────────────  │
│  VITE_LENDING_POOL_ADDRESS=0x742d35...                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: Frontend Connects Everything                           │
│  ─────────────────────────────────────────────────────────────  │
│  const contract = new ethers.Contract(                          │
│    import.meta.env.VITE_LENDING_POOL_ADDRESS,  ← From .env     │
│    LendingPoolABI.abi,                          ← From src/abis/│
│    signer                                       ← From MetaMask  │
│  );                                                              │
│                                                                  │
│  await contract.supply(asset, amount);  ← WORKS! ✓              │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ When You MUST Update ABIs

| Scenario | Update ABI? | Update Address? | Why? |
|----------|-------------|-----------------|------|
| **Changed function signature** | ✅ YES | ✅ YES | New deployment = new address + new ABI |
| **Added new function** | ✅ YES | ✅ YES | ABI needs to know about new function |
| **Removed function** | ✅ YES | ✅ YES | ABI needs to remove old function |
| **Changed parameters** | ✅ YES | ✅ YES | ABI needs new parameter types |
| **Bug fix in contract** | ✅ YES | ✅ YES | Redeployment = new address + export ABI |
| **First deployment** | ✅ YES | ✅ YES | Need both to work |
| **Only frontend change** | ❌ NO | ❌ NO | Contract unchanged |

---

## ❌ What Happens If You Skip Exporting ABI?

### Scenario: You deployed but forgot to export ABI

```bash
# You did this:
cargo stylus deploy ...
# ✓ Contract deployed to: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# But forgot this:
# cargo stylus export-abi > ../../src/abis/LendingPool.json

# Result in frontend:
```

```javascript
// Your code:
await contract.supply(asset, amount);

// Error you get:
Error: function 'supply' does not exist
```

**Why?** Frontend is using OLD ABI that doesn't match your NEW contract!

---

## ❌ What Happens If You Skip Updating Address?

### Scenario: You exported ABI but didn't update .env

```bash
# You did this:
cargo stylus export-abi > ../../src/abis/LendingPool.json ✓

# But .env still has:
VITE_LENDING_POOL_ADDRESS=0x0000000000000000000000000000000000000000

# Result in frontend:
```

```javascript
// Your code tries to call:
await contract.supply(asset, amount);

// Error you get:
Error: Contract not found at address 0x0000...
// or
Error: call revert exception
```

**Why?** Frontend is calling the WRONG address (old/dummy address)!

---

## ✅ Correct Process

```bash
# 1. Build
cargo build --release --target wasm32-unknown-unknown

# 2. Export ABI FIRST
cargo stylus export-abi > ../../src/abis/LendingPool.json

# 3. Deploy
cargo stylus deploy ...
# Output: Deployed to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# 4. Update .env
# VITE_LENDING_POOL_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# 5. Restart frontend
npm run dev

# 6. Test - IT WORKS! ✓
```

---

## 📊 File Locations

```
project/
├── contracts/stylus/
│   ├── src/
│   │   └── lending_pool.rs          ← 1. Your Rust code
│   └── target/
│       └── wasm32-unknown-unknown/
│           └── release/
│               └── lendique_contracts.wasm  ← 2. Compiled WASM
│
├── src/
│   ├── abis/
│   │   └── LendingPool.json         ← 3. Exported ABI (YOU MUST CREATE)
│   └── config/
│       └── contracts.ts              ← 4. Uses addresses from .env
│
└── .env                              ← 5. Contract addresses (YOU MUST UPDATE)
```

---

## 🔬 Deep Dive: How It Works

### Without ABI (Manual encoding - painful!)

```javascript
// You'd have to do this manually:
const functionSelector = ethers.id("supply(address,uint256)").slice(0, 10);
const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address", "uint256"],
  [asset, amount]
);
const calldata = functionSelector + encodedParams.slice(2);

await signer.sendTransaction({
  to: contractAddress,
  data: calldata,
  value: amount
});

// This is error-prone and tedious!
```

### With ABI (Easy!)

```javascript
// ABI makes it simple:
await contract.supply(asset, amount);

// ethers.js uses the ABI to:
// 1. Find the function signature
// 2. Encode parameters correctly
// 3. Create the transaction
// 4. Send it for you
```

---

## 📋 Checklist for Each Contract

For EACH of the 9 contracts, you must:

```
Contract: LendingPool
├── [ ] Written in Rust (src/lending_pool.rs)
├── [ ] Built to WASM (cargo build)
├── [ ] ABI exported (cargo stylus export-abi > ../../src/abis/LendingPool.json)
├── [ ] Deployed to blockchain (cargo stylus deploy)
├── [ ] Address saved (0x742d35...)
├── [ ] Address in .env (VITE_LENDING_POOL_ADDRESS=0x...)
└── [ ] Frontend tested (npm run dev)
```

Repeat for all 9:
1. LendingPool
2. CollateralManager
3. InterestRateModel
4. RiskEngine
5. LiquidationEngine
6. AIComputeVault
7. PortfolioRebalancer
8. GaslessAA
9. ReceiptGenerator

---

## 🎯 Quick Test Commands

### Test if ABI is correct:

```bash
# Check if ABI file exists and has content
cat src/abis/LendingPool.json

# Should show JSON with "abi" array
```

### Test if address is correct:

```bash
# Check if contract exists at address
cast code $VITE_LENDING_POOL_ADDRESS \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc

# Should show bytecode (0x60806040...)
# If shows 0x, contract doesn't exist at that address!
```

### Test if they work together:

```bash
# Try to call a function
cast call $VITE_LENDING_POOL_ADDRESS \
  "get_total_supplied(address)(uint256)" \
  0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc

# Should return a number (even if 0)
```

---

## 🚨 Common Mistakes

### Mistake 1: Exported ABI from wrong contract

```bash
# Wrong - exports first contract in workspace
cargo stylus export-abi > ../../src/abis/LendingPool.json

# If you have multiple contracts, make sure you're exporting the right one!
```

### Mistake 2: Forgot to restart frontend

```bash
# Updated .env but frontend still uses old values
# Solution: Restart dev server
npm run dev
```

### Mistake 3: ABI and contract mismatch

```bash
# Deployed LendingPool v2
# But still using LendingPool v1 ABI
# Solution: Always export ABI AFTER building, BEFORE deploying
```

---

## ✅ The Golden Rule

```
┌──────────────────────────────────────────────────┐
│                                                  │
│   EVERY TIME you deploy or redeploy:            │
│                                                  │
│   1. Export ABI                                  │
│   2. Deploy contract                             │
│   3. Update .env with new address                │
│   4. Restart frontend                            │
│                                                  │
│   ALL FOUR STEPS. NO EXCEPTIONS.                 │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 📚 Summary

| Component | What It Is | Where It Comes From | When to Update |
|-----------|------------|---------------------|----------------|
| **ABI** | Function menu | `cargo stylus export-abi` | Every contract change |
| **Address** | Contract location | Deployment output | Every deployment |
| **Signer** | Your wallet | MetaMask | Never (user provides) |

**All three are required for frontend to work!**

---

## 🎓 Key Takeaways

1. **ABI = Menu** - Tells frontend what functions exist
2. **Address = Location** - Tells frontend where contract is
3. **Both Required** - Frontend needs both to work
4. **Update Both** - Every time you redeploy
5. **Export First** - Export ABI before deploying
6. **Update .env** - Add address after deploying
7. **Restart Frontend** - Always restart after changes

---

**🎉 Now you understand why ABIs are critical!**

For step-by-step deployment, see [COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md)
