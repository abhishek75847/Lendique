# How Frontend Interacts with Smart Contracts - Visual Guide

## The Complete Picture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER'S BROWSER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  REACT COMPONENT (SupplyButton.tsx)                              │  │
│  │                                                                    │  │
│  │  User clicks "Supply 1 ETH"                                       │  │
│  │  ↓                                                                 │  │
│  │  const { supplyETH } = useSupply();                               │  │
│  │  await supplyETH('1.0');                                          │  │
│  └──────────────────────┬───────────────────────────────────────────┘  │
│                         │                                                │
│  ┌──────────────────────▼───────────────────────────────────────────┐  │
│  │  CUSTOM HOOK (useSupply.ts)                                       │  │
│  │                                                                    │  │
│  │  const contracts = useContracts();                                │  │
│  │  const amountWei = ethers.parseEther('1.0');                      │  │
│  │  ↓                                                                 │  │
│  │  const tx = await contracts.lendingPool.write.supply(             │  │
│  │    ASSETS.ETH,                                                    │  │
│  │    amountWei,                                                     │  │
│  │    { value: amountWei }                                           │  │
│  │  );                                                               │  │
│  └──────────────────────┬───────────────────────────────────────────┘  │
│                         │                                                │
│  ┌──────────────────────▼───────────────────────────────────────────┐  │
│  │  CONTRACT INSTANCE (useContracts.ts)                              │  │
│  │                                                                    │  │
│  │  new ethers.Contract(                                             │  │
│  │    '0x1234...',           ← Contract Address from .env            │  │
│  │    LendingPoolABI.abi,    ← ABI from src/abis/LendingPool.json   │  │
│  │    signer                 ← From MetaMask                         │  │
│  │  )                                                                 │  │
│  └──────────────────────┬───────────────────────────────────────────┘  │
│                         │                                                │
└─────────────────────────┼────────────────────────────────────────────────┘
                          │
                          │ ethers.js encodes function call
                          │
┌─────────────────────────▼────────────────────────────────────────────────┐
│                        METAMASK WALLET                                    │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  TRANSACTION POPUP                                           │        │
│  │                                                               │        │
│  │  From: 0xYourAddress                                         │        │
│  │  To: 0x1234... (LendingPool Contract)                        │        │
│  │  Value: 1.0 ETH                                              │        │
│  │  Gas: 0.0001 ETH                                             │        │
│  │                                                               │        │
│  │  [Reject]  [Approve] ← User clicks                           │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
│  User approves → Transaction signed with private key                     │
│                                                                           │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
                                │ Signed transaction sent
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                     ARBITRUM SEPOLIA BLOCKCHAIN                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  MEMPOOL (Pending Transactions)                              │        │
│  │                                                               │        │
│  │  Tx Hash: 0xabc123...                                        │        │
│  │  Status: Pending ⏳                                           │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
│  Validators pick up transaction and include in block                     │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  SMART CONTRACT EXECUTION                                    │        │
│  │  (LendingPool - Rust/Stylus)                                │        │
│  │                                                               │        │
│  │  pub fn supply(&mut self, asset: Address, amount: U256) {   │        │
│  │      let user = msg::sender();  // 0xYourAddress            │        │
│  │                                                               │        │
│  │      // Update balance                                       │        │
│  │      let balance = self.user_supply_balance.get(user);      │        │
│  │      self.user_supply_balance.insert(                        │        │
│  │          user,                                               │        │
│  │          balance + amount  // Old + 1 ETH                   │        │
│  │      );                                                       │        │
│  │                                                               │        │
│  │      // Emit event                                           │        │
│  │      evm::log(Supply {                                       │        │
│  │          user,                                               │        │
│  │          asset: 0xEeee...  (ETH),                           │        │
│  │          amount: 1000000000000000000  (1 ETH in wei)        │        │
│  │      });                                                      │        │
│  │  }                                                            │        │
│  │                                                               │        │
│  │  ✅ Transaction successful!                                  │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
│  Transaction included in Block #123456                                   │
│                                                                           │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
                                │ Event emitted
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                        SUPABASE BACKEND                                   │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  EDGE FUNCTION (blockchain-indexer)                          │        │
│  │                                                               │        │
│  │  // Listens for blockchain events                            │        │
│  │  const filter = contract.filters.Supply();                   │        │
│  │  const events = await contract.queryFilter(filter);          │        │
│  │                                                               │        │
│  │  // New Supply event detected!                               │        │
│  │  {                                                            │        │
│  │    user: '0xYourAddress',                                    │        │
│  │    asset: '0xEeee...',                                       │        │
│  │    amount: '1000000000000000000'                             │        │
│  │  }                                                            │        │
│  │                                                               │        │
│  │  // Update database                                          │        │
│  │  await supabase.from('transactions').insert({                │        │
│  │    tx_hash: '0xabc123...',                                   │        │
│  │    user_address: '0xYourAddress',                            │        │
│  │    action: 'supply',                                         │        │
│  │    asset: 'ETH',                                             │        │
│  │    amount: '1.0',                                            │        │
│  │    status: 'confirmed'                                       │        │
│  │  });                                                          │        │
│  │                                                               │        │
│  │  // Update user balance                                      │        │
│  │  await supabase.from('user_positions').update({              │        │
│  │    supplied_amount: balance + 1.0                            │        │
│  │  });                                                          │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  POSTGRESQL DATABASE                                         │        │
│  │                                                               │        │
│  │  transactions table:                                         │        │
│  │  | tx_hash    | user       | action | amount | status    |  │        │
│  │  |------------|------------|--------|--------|-----------|  │        │
│  │  | 0xabc123...| 0xYour...  | supply | 1.0    | confirmed |  │        │
│  │                                                               │        │
│  │  user_positions table:                                       │        │
│  │  | user       | asset | supplied | borrowed |               │        │
│  │  |------------|-------|----------|----------|               │        │
│  │  | 0xYour...  | ETH   | 2.5      | 0.0      |               │        │
│  │  └─────────────────────────────────────────────────────────┘        │
│                                                                           │
│  Database updated → Realtime subscription triggers                       │
│                                                                           │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
                                │ WebSocket notification
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                           USER'S BROWSER                                  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  SUPABASE REALTIME SUBSCRIPTION                              │        │
│  │                                                               │        │
│  │  supabase                                                     │        │
│  │    .channel('user_positions')                                │        │
│  │    .on('postgres_changes', payload => {                      │        │
│  │      // New data received!                                   │        │
│  │      setSupplyBalance('2.5');                                │        │
│  │    })                                                         │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  REACT COMPONENT RE-RENDERS                                 │        │
│  │                                                               │        │
│  │  Old UI:                                                      │        │
│  │  Supply Balance: 1.5 ETH                                     │        │
│  │                                                               │        │
│  │  ↓ State updated                                             │        │
│  │                                                               │        │
│  │  New UI:                                                      │        │
│  │  Supply Balance: 2.5 ETH ✨                                  │        │
│  │  Latest Transaction: +1.0 ETH (Confirmed ✅)                 │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## The 3 Essential Files

### 1. Contract Address (.env)

```bash
VITE_LENDING_POOL_ADDRESS=0x1234567890abcdef...
```

**Purpose:** Tells the frontend WHERE the contract lives on the blockchain

**How you get it:** Deploy contract with `cargo stylus deploy`

**What it looks like:**
- A 42-character hexadecimal string
- Starts with `0x`
- Example: `0x742d35Cc6634C0532925a3b844Bc454e4438f44e`

---

### 2. ABI (src/abis/LendingPool.json)

```json
{
  "abi": [
    {
      "type": "function",
      "name": "supply",
      "inputs": [
        { "name": "asset", "type": "address" },
        { "name": "amount", "type": "uint256" }
      ]
    }
  ]
}
```

**Purpose:** Tells the frontend WHAT functions the contract has

**How you get it:** Run `cargo stylus export-abi`

**What it contains:**
- Function names
- Input parameters (types and names)
- Output return values
- Whether functions are read-only or require transactions

**Think of it as:** A menu for the smart contract

---

### 3. ethers.js Integration (src/hooks/useContracts.ts)

```typescript
import { ethers } from 'ethers';
import LendingPoolABI from '../abis/LendingPool.json';

const contract = new ethers.Contract(
  '0x1234...',           // Address
  LendingPoolABI.abi,    // ABI
  signer                 // Connection to MetaMask
);
```

**Purpose:** Connects address + ABI + wallet = working contract interface

**What it does:**
- Reads contract state (free)
- Writes transactions (costs gas)
- Listens for events
- Handles errors

---

## Data Flow Timeline

Let's follow 1 ETH through the entire system:

```
T+0ms:    User clicks "Supply 1 ETH" button
          ↓
T+100ms:  React calls useSupply() hook
          ↓
T+200ms:  Hook calls ethers.js
          ethers.js encodes: supply(0xEeee..., 1000000000000000000)
          ↓
T+300ms:  MetaMask popup appears
          ↓
T+5s:     User clicks "Approve"
          MetaMask signs transaction with private key
          ↓
T+5.1s:   Signed transaction sent to Arbitrum RPC
          Transaction hash: 0xabc123...
          Frontend shows: "Transaction submitted ⏳"
          ↓
T+7s:     Transaction included in blockchain block
          Smart contract executes
          User's balance updated: 1.5 → 2.5 ETH
          Event emitted: Supply(user, ETH, 1.0)
          ↓
T+10s:    Supabase Edge Function detects event
          Queries blockchain for event details
          ↓
T+11s:    Edge Function writes to database:
          - transactions table: new row
          - user_positions table: updated balance
          ↓
T+11.1s:  PostgreSQL triggers Realtime notification
          ↓
T+11.2s:  Frontend receives WebSocket message
          React state updates
          ↓
T+11.3s:  UI re-renders
          User sees: "Supply Balance: 2.5 ETH ✅"
```

**Total time: ~11 seconds from click to UI update**

---

## Where Data Lives

### Blockchain (Permanent, Immutable)

```
Smart Contract Storage:
{
  user_supply_balance: {
    '0xYourAddress': 2500000000000000000  // 2.5 ETH in wei
  },
  total_supplied: 1000000000000000000000,  // 1000 ETH
  interest_rate: 250  // 2.5%
}

Event Log (indexed):
- Block 123456: Supply(0xYourAddress, ETH, 1.0)
- Block 123450: Borrow(0xOther..., USDC, 500)
```

**Characteristics:**
- Source of truth
- Costs gas to write
- Free to read
- Can't be deleted
- Updates in ~2-5 seconds

---

### Database (Fast, Queryable)

```sql
-- transactions table
tx_hash     | user_address | action | asset | amount | timestamp
------------|--------------|--------|-------|--------|----------
0xabc123... | 0xYour...    | supply | ETH   | 1.0    | 2024-11-22

-- user_positions table
user_address | asset | supplied | borrowed | health_factor
-------------|-------|----------|----------|---------------
0xYour...    | ETH   | 2.5      | 0.0      | ∞
0xYour...    | USDC  | 0.0      | 500      | 2.5

-- ai_predictions table
user_address | prediction_type | confidence | data
-------------|-----------------|------------|------
0xYour...    | liquidation_risk| 0.05       | {...}
```

**Characteristics:**
- Mirror of blockchain
- Fast queries
- Historical data
- Analytics
- Real-time subscriptions

---

### Frontend (Temporary, User-Specific)

```typescript
// React State
const [supplyBalance, setSupplyBalance] = useState('2.5');
const [healthFactor, setHealthFactor] = useState(3.5);
const [transactions, setTransactions] = useState([...]);

// LocalStorage
{
  "lastConnectedWallet": "0xYour...",
  "theme": "dark",
  "slippageTolerance": "0.5"
}
```

**Characteristics:**
- Ephemeral (lost on refresh)
- User-specific
- Fast access
- No server needed

---

## The Missing Link: How Do You Get Started?

### Scenario: Fresh Project

You have:
- ✅ React frontend code
- ✅ Rust smart contracts
- ❌ No deployed contracts
- ❌ No ABIs
- ❌ No addresses in .env

**Here's what you need to do:**

### Step 1: Deploy Contracts

```bash
cd contracts/stylus
cargo stylus deploy \
  --private-key="YOUR_PRIVATE_KEY" \
  --endpoint="https://sepolia-rollup.arbitrum.io/rpc"

# Output:
# Deploying contract...
# ✅ Contract deployed at: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
# Transaction: 0xabc123...
```

**Save this address!** Write it down.

### Step 2: Generate ABI

```bash
cargo stylus export-abi > ../../src/abis/LendingPool.json
```

This creates the ABI file automatically.

### Step 3: Update .env

```bash
# Open .env and paste the address
VITE_LENDING_POOL_ADDRESS=0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

### Step 4: Start Frontend

```bash
npm run dev
```

### Step 5: Connect Wallet & Test

1. Open http://localhost:5173
2. Click "Connect Wallet"
3. Approve MetaMask connection
4. Try "Supply 1 ETH"
5. Approve transaction
6. Wait 5 seconds
7. See updated balance! 🎉

---

## Quick Reference

### When Frontend Needs to READ Data

```typescript
// No transaction needed, free, instant
const balance = await contract.getUserSupplyBalance(address, asset);
const apy = await contract.getSupplyRate(asset);
const healthFactor = await contract.calculateHealthFactor(address);
```

**Uses:**
- `provider` (read-only connection)
- No MetaMask popup
- No gas fees

---

### When Frontend Needs to WRITE Data

```typescript
// Transaction needed, costs gas, takes ~5 seconds
const tx = await contract.supply(asset, amount, { value: amount });
await tx.wait(); // Wait for confirmation
```

**Uses:**
- `signer` (connected to MetaMask)
- MetaMask popup appears
- Costs gas fees
- Updates blockchain state

---

### When Frontend Needs to LISTEN for Changes

```typescript
// Subscribe to events
contract.on('Supply', (user, asset, amount) => {
  console.log(`${user} supplied ${amount}`);
  // Update UI
});
```

**Uses:**
- WebSocket connection to RPC
- Real-time notifications
- No gas fees

---

## Summary

**How it all connects:**

1. **Deploy contracts** → Get addresses
2. **Generate ABIs** → Get function definitions
3. **Add to .env** → Make addresses available
4. **ethers.js reads** ABI + Address + MetaMask
5. **Create contract instance** → Can call functions
6. **Call functions** → Send transactions or read data
7. **Events emitted** → Backend detects
8. **Database updated** → Frontend syncs
9. **UI refreshes** → User sees changes

**The magic:**
```typescript
// This one line does EVERYTHING:
const contract = new ethers.Contract(address, abi, signer);

// Now you can:
await contract.supply(asset, amount);           // Write
const balance = await contract.getBalance();    // Read
contract.on('Supply', handleSupply);            // Listen
```

That's it! Three files (address, ABI, ethers integration) make your entire frontend work with smart contracts.
