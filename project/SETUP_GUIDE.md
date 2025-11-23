# Complete Setup Guide: From Zero to Working DApp

This guide walks you through EVERY step needed to connect your frontend to smart contracts, from deployment to seeing real transactions.

---

## Part 1: Understanding What You Need

### The Missing Pieces in Your Project

Currently, your project has:
✅ Frontend React code
✅ Supabase backend configured
✅ Smart contract Rust code
❌ Contract ABIs (Application Binary Interface)
❌ Deployed contract addresses
❌ Contract interaction code fully wired up

**This guide will help you complete the missing pieces.**

---

## Part 2: Deploy Your Smart Contracts

### Step 1: Install Stylus CLI

```bash
cargo install --force cargo-stylus
```

### Step 2: Build Your Contracts

```bash
cd contracts/stylus
cargo build --release
```

### Step 3: Deploy Each Contract

You need to deploy all 9 contracts. Here's how:

```bash
# Make sure you have test ETH on Arbitrum Sepolia
# Get it from: https://faucet.quicknode.com/arbitrum/sepolia

# Deploy LendingPool
cargo stylus deploy \
  --private-key="YOUR_PRIVATE_KEY" \
  --endpoint="https://sepolia-rollup.arbitrum.io/rpc"

# This will output something like:
# Contract deployed at: 0x1234567890abcdef...
```

**IMPORTANT:** Save each contract address! You'll need them in the next step.

Repeat for all contracts:
- LendingPool
- CollateralManager
- LiquidationEngine
- InterestRateModel
- RiskEngine
- AiComputeVault
- PortfolioRebalancer
- GaslessAccountAbstraction
- ReceiptGenerator

### Step 4: Update .env File

Open `.env` and replace the `0x0000...` addresses with your deployed addresses:

```bash
# Smart Contract Addresses
VITE_LENDING_POOL_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
VITE_COLLATERAL_MANAGER_ADDRESS=0xabcdef1234567890abcdef1234567890abcdef12
VITE_LIQUIDATION_ENGINE_ADDRESS=0x567890abcdef1234567890abcdef1234567890ab
# ... and so on for all 9 contracts
```

Also update token addresses:
```bash
# For Arbitrum Sepolia testnet
VITE_USDC_ADDRESS=0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d
VITE_USDT_ADDRESS=0x... # Get from Arbitrum testnet token list
VITE_WBTC_ADDRESS=0x... # Get from Arbitrum testnet token list
```

---

## Part 3: Generate Contract ABIs

### What is an ABI?

An ABI (Application Binary Interface) is like a menu for your smart contract. It tells the frontend:
- What functions exist
- What parameters they need
- What they return

### Method 1: Generate from Rust Code (Recommended)

```bash
cd contracts/stylus
cargo stylus export-abi > ../../src/abis/LendingPool.json
```

This creates a JSON file that looks like:

```json
{
  "abi": [
    {
      "type": "function",
      "name": "supply",
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

### Method 2: Use the Provided ABIs

I've already created sample ABIs for you in `src/abis/`:
- `LendingPool.json`
- `CollateralManager.json`
- `InterestRateModel.json`
- `ERC20.json`

These match the functions in your Rust contracts. If you modify your Rust code, regenerate the ABIs.

---

## Part 4: How Frontend Connects to Contracts

### The Connection Flow

```
User clicks button
     ↓
React component calls hook (useSupply)
     ↓
Hook uses ethers.js + ABI
     ↓
ethers.js creates transaction
     ↓
MetaMask popup appears
     ↓
User approves
     ↓
Transaction sent to blockchain
     ↓
Smart contract executes
     ↓
Event emitted
     ↓
Frontend receives confirmation
```

### Example: Supply ETH

**1. User Interface (React Component)**

```tsx
import { useSupply } from '../hooks/useSupply';
import { ASSETS } from '../config/contracts';

function SupplyButton() {
  const { supplyETH, loading } = useSupply();

  const handleSupply = async () => {
    const result = await supplyETH('1.0'); // Supply 1 ETH

    if (result.success) {
      alert(`Success! Tx: ${result.txHash}`);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <button onClick={handleSupply} disabled={loading}>
      {loading ? 'Supplying...' : 'Supply 1 ETH'}
    </button>
  );
}
```

**2. Custom Hook (useSupply)**

```typescript
// src/hooks/useSupply.ts
import { ethers } from 'ethers';
import { useContracts } from './useContracts';

export function useSupply() {
  const contracts = useContracts();

  const supplyETH = async (amount: string) => {
    const amountWei = ethers.parseEther(amount);

    // Call smart contract
    const tx = await contracts.lendingPool.write.supply(
      ASSETS.ETH,
      amountWei,
      { value: amountWei } // Send ETH with transaction
    );

    // Wait for confirmation
    const receipt = await tx.wait();

    return { success: true, txHash: receipt.hash };
  };

  return { supplyETH };
}
```

**3. Contract Initialization (useContracts)**

```typescript
// src/hooks/useContracts.ts
import { ethers } from 'ethers';
import LendingPoolABI from '../abis/LendingPool.json';
import { CONTRACTS } from '../config/contracts';

export function useContracts() {
  // Get provider from MetaMask
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // Create contract instance
  const lendingPool = new ethers.Contract(
    CONTRACTS.LENDING_POOL,        // Address from .env
    LendingPoolABI.abi,            // ABI JSON
    signer                         // Signer (can write)
  );

  return { lendingPool };
}
```

**4. Smart Contract (Rust - Already Written)**

```rust
// contracts/stylus/src/lending_pool.rs
#[public]
impl LendingPool {
    pub fn supply(&mut self, asset: Address, amount: U256) -> Result<(), Vec<u8>> {
        let user = msg::sender();

        // Update user balance
        let mut balance = self.user_supply_balance.get(user);
        balance += amount;
        self.user_supply_balance.insert(user, balance);

        // Emit event
        evm::log(Supply {
            user,
            asset,
            amount,
        });

        Ok(())
    }
}
```

---

## Part 5: Testing Your Setup

### Test 1: Check Connection

```typescript
// Add this to your app to test
import { CONTRACTS, getContractStatus } from './config/contracts';

function ConnectionTest() {
  const status = getContractStatus();

  return (
    <div>
      <h3>Contract Deployment Status</h3>
      <p>Lending Pool: {status.lendingPool ? '✅ Deployed' : '❌ Not Deployed'}</p>
      <p>Collateral Manager: {status.collateralManager ? '✅' : '❌'}</p>
    </div>
  );
}
```

### Test 2: Read Contract Data

```typescript
import { useContracts } from './hooks/useContracts';
import { ASSETS } from './config/contracts';

function BalanceDisplay() {
  const contracts = useContracts();
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    async function loadBalance() {
      if (!contracts) return;

      const bal = await contracts.lendingPool.read.getTotalSupplied(ASSETS.ETH);
      setBalance(ethers.formatEther(bal));
    }

    loadBalance();
  }, [contracts]);

  return <div>Total ETH Supplied: {balance}</div>;
}
```

### Test 3: Send Transaction

Use the SupplyButton component from above.

**Expected flow:**
1. Click button
2. MetaMask popup appears
3. Approve transaction
4. Wait 2-5 seconds
5. See success message with transaction hash
6. Check transaction on [Arbiscan](https://sepolia.arbiscan.io)

---

## Part 6: How ABIs Work (Deep Dive)

### What's in an ABI?

```json
{
  "type": "function",
  "name": "supply",
  "inputs": [
    { "name": "asset", "type": "address" },
    { "name": "amount", "type": "uint256" }
  ],
  "outputs": [],
  "stateMutability": "payable"
}
```

**This tells ethers.js:**
- Function name: `supply`
- Takes 2 parameters: an address and a number
- Returns nothing
- Can receive ETH (`payable`)

### How ethers.js Uses ABIs

```typescript
// Without ABI - You'd need to do this manually:
const data = '0x1a2b3c4d...' // Encoded function call
await signer.sendTransaction({ to: CONTRACT_ADDRESS, data });

// With ABI - ethers.js does it automatically:
await contract.supply(assetAddress, amount);
```

The ABI lets you call functions naturally in JavaScript!

---

## Part 7: Environment Variables Explained

### Why VITE_ Prefix?

Vite (your build tool) only exposes env variables starting with `VITE_` to the browser.

```bash
# ✅ Accessible in browser
VITE_CONTRACT_ADDRESS=0x123...

# ❌ NOT accessible in browser (for security)
CONTRACT_ADDRESS=0x123...
SECRET_KEY=abc...
```

### How to Access in Code

```typescript
// ✅ Correct
const address = import.meta.env.VITE_CONTRACT_ADDRESS;

// ❌ Wrong
const address = process.env.VITE_CONTRACT_ADDRESS;
```

---

## Part 8: Complete Example - Supply ETH

Let me show you the COMPLETE flow with all files:

### File 1: Component

```tsx
// src/components/SupplyETH.tsx
import { useState } from 'react';
import { useSupply } from '../hooks/useSupply';
import { useUserBalance } from '../hooks/useUserBalance';
import { ASSETS } from '../config/contracts';

export function SupplyETH() {
  const [amount, setAmount] = useState('');
  const { supplyETH, loading } = useSupply();
  const { supplyBalance } = useUserBalance(ASSETS.ETH);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await supplyETH(amount);

    if (result.success) {
      alert(`Success! View on explorer: https://sepolia.arbiscan.io/tx/${result.txHash}`);
      setAmount('');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Supply ETH</h3>
      <p>Current Balance: {supplyBalance} ETH</p>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount to supply"
        step="0.01"
        min="0"
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Supply ETH'}
      </button>
    </form>
  );
}
```

### File 2: Hook

The hook is already created at `src/hooks/useSupply.ts`

### File 3: Contract Config

Already created at `src/config/contracts.ts`

### File 4: ABI

Already created at `src/abis/LendingPool.json`

---

## Part 9: Debugging Common Issues

### Issue 1: "Wallet not connected"

**Cause:** MetaMask not installed or not connected

**Solution:**
```typescript
// Check if MetaMask is installed
if (!window.ethereum) {
  alert('Please install MetaMask');
}

// Request connection
await window.ethereum.request({ method: 'eth_requestAccounts' });
```

### Issue 2: "Wrong network"

**Cause:** MetaMask connected to different network

**Solution:**
```typescript
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x66eee' }], // Arbitrum Sepolia
});
```

### Issue 3: "Contract not deployed"

**Cause:** Contract address is still `0x0000...`

**Solution:** Deploy contracts and update `.env` file

### Issue 4: "Transaction fails"

**Cause:** Multiple possible reasons

**Debug steps:**
1. Check if you have enough ETH for gas
2. Verify contract address is correct
3. Check function parameters are correct type
4. Look at error message in MetaMask

---

## Part 10: Checklist

Before your app works, verify:

- [ ] Rust contracts compiled (`cargo build --release`)
- [ ] All 9 contracts deployed to Arbitrum Sepolia
- [ ] Contract addresses added to `.env` file
- [ ] ABIs generated/exist in `src/abis/`
- [ ] MetaMask installed
- [ ] MetaMask connected to Arbitrum Sepolia
- [ ] Test ETH in wallet (get from faucet)
- [ ] `npm install` ran successfully
- [ ] `npm run dev` runs without errors

---

## Part 11: Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Build contracts
cd contracts/stylus
cargo build --release

# 3. Deploy contracts (save addresses!)
cargo stylus deploy --private-key="YOUR_KEY" --endpoint="https://sepolia-rollup.arbitrum.io/rpc"

# 4. Update .env with contract addresses

# 5. Start frontend
npm run dev

# 6. Open http://localhost:5173
# 7. Connect MetaMask
# 8. Try supplying ETH!
```

---

## Part 12: Where Each File Is

```
project/
├── .env                          ← Contract addresses & RPC URL
├── src/
│   ├── abis/                    ← Contract ABIs (4 files)
│   │   ├── LendingPool.json
│   │   ├── CollateralManager.json
│   │   ├── InterestRateModel.json
│   │   └── ERC20.json
│   ├── config/
│   │   └── contracts.ts         ← Contract addresses config
│   ├── hooks/                   ← Contract interaction hooks
│   │   ├── useContracts.ts
│   │   ├── useSupply.ts
│   │   ├── useBorrow.ts
│   │   ├── useHealthFactor.ts
│   │   └── useUserBalance.ts
│   └── components/              ← UI components (already exist)
└── contracts/stylus/src/        ← Rust smart contracts (already exist)
```

---

## Summary

**The 3 Key Pieces:**

1. **Contract Address** (from deployment)
   - Tells frontend WHERE the contract is
   - Stored in `.env`

2. **ABI** (from cargo stylus export-abi)
   - Tells frontend WHAT functions exist
   - Stored in `src/abis/*.json`

3. **ethers.js** (already installed)
   - Handles HOW to call functions
   - Used in `src/hooks/*.ts`

**When you have all 3, you can:**
```typescript
const contract = new ethers.Contract(ADDRESS, ABI, signer);
await contract.supply(asset, amount);
```

And it just works! 🎉

---

Need help with any step? Check the error message and refer back to Part 9: Debugging Common Issues.
