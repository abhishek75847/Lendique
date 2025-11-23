# Lendique Architecture - How Everything Works After Deployment

This document explains the complete architecture and data flow of Lendique after all components are deployed.

## System Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Frontend  │ ──────> │   Supabase   │ ──────> │ Arbitrum L3     │
│  (React)    │ <────── │   Backend    │ <────── │ Smart Contracts │
└─────────────┘         └──────────────┘         └─────────────────┘
     │                        │                           │
     │                        │                           │
     v                        v                           v
  Browser                 PostgreSQL                  Blockchain
  Wallet                  Edge Functions              State
```

## Component Architecture

### 1. Frontend Layer (React + Vite)

**Location**: Browser (deployed on Vercel/Netlify/etc.)

**Components**:
- `LandingPage.tsx` - Marketing page
- `Dashboard.tsx` - Main app interface
- `LendingPool.tsx` - Supply/Borrow UI
- `WalletDisplay.tsx` - Wallet connection status
- `AIAssistant.tsx` - AI chat interface

**Key Functions**:
- User authentication (Supabase Auth)
- Wallet connection (MetaMask via ethers.js)
- Display real-time portfolio data
- Submit transactions to blockchain
- Communicate with Supabase Edge Functions

### 2. Wallet Layer (MetaMask/Browser Wallet)

**Location**: Browser extension

**Functions**:
- Store private keys securely
- Sign transactions
- Manage network connections
- Approve contract interactions

### 3. Backend Layer (Supabase)

**Location**: Cloud (Supabase infrastructure)

**Components**:

#### A. PostgreSQL Database
Stores all application data:
- User accounts and profiles
- Asset information (ETH, USDC, etc.)
- User positions (supplied/borrowed amounts)
- Transaction history
- AI predictions
- Liquidation records
- Interest rate history
- Notifications

#### B. Edge Functions (Serverless)

**blockchain-indexer**:
- Listens for blockchain events
- Updates database when transactions occur
- Calculates health factors
- Indexes supply, borrow, repay, liquidation events

**ai-predictions**:
- Generates liquidation risk predictions
- Provides interest rate optimization
- Offers portfolio rebalancing advice
- Creates AI-powered insights

**realtime-events**:
- Processes price updates
- Sends notifications to users
- Broadcasts system messages
- Updates APY rates

### 4. Blockchain Layer (Arbitrum L3)

**Location**: Arbitrum Orbit L3 Chain (custom chain)

**Smart Contracts** (9 contracts):

1. **LendingPool** - Core lending logic
2. **CollateralManager** - Manages collateral
3. **LiquidationEngine** - Handles liquidations
4. **InterestRateModel** - Calculates APY
5. **RiskEngine** - Assesses risk
6. **AiComputeVault** - On-chain AI inference
7. **PortfolioRebalancer** - Auto-rebalancing
8. **GaslessAccountAbstraction** - Meta-transactions
9. **ReceiptGenerator** - L3→L2 proofs

## Complete User Flow Examples

### Example 1: User Supplies ETH

**Step 1: User Action**
```
User clicks "Supply 1 ETH" in the UI
↓
Frontend calls LendingPool contract
```

**Step 2: Wallet Interaction**
```
MetaMask popup appears
User approves transaction
Transaction signed with private key
↓
Transaction sent to Arbitrum L3 RPC
```

**Step 3: Smart Contract Execution**
```
LendingPool.supply() executes on-chain:
1. Validates amount > 0
2. Accrues interest
3. Updates user_supply_balance mapping
4. Updates total_supplied
5. Emits SupplyEvent
↓
Transaction confirmed on blockchain
Transaction hash: 0xabc123...
```

**Step 4: Event Indexing**
```
blockchain-indexer Edge Function detects SupplyEvent:
1. Inserts transaction into 'transactions' table
2. Updates 'user_positions' table
3. Recalculates user health factor
4. Updates 'users' table with new stats
↓
Database updated in real-time
```

**Step 5: Frontend Update**
```
Frontend receives database update via Supabase Realtime:
1. Dashboard refreshes
2. New balance displayed
3. Transaction appears in history
4. Health factor updates
↓
User sees updated portfolio immediately
```

### Example 2: Liquidation Flow

**Step 1: Price Drop**
```
ETH price drops 20%
↓
realtime-events Edge Function triggered
```

**Step 2: Risk Detection**
```
Edge Function:
1. Recalculates all user health factors
2. Detects User A: health_factor = 0.95 (< 1.0)
3. Calls ai-predictions for risk assessment
↓
AI predicts 95% liquidation probability
```

**Step 3: User Notification**
```
System creates notification:
- Type: 'liquidation_warning'
- Title: 'Critical: Low Health Factor'
- Message: 'Your health factor is 0.95. Add collateral immediately.'
↓
Frontend shows alert banner
Email/push notification sent
```

**Step 4: Liquidation Execution**
```
If user doesn't act, liquidator bot detects opportunity:
1. Calls LiquidationEngine.liquidate()
2. Contract validates health_factor < 1.0
3. Calculates collateral to seize (+ 5% penalty)
4. Transfers collateral to liquidator
5. Reduces user debt
6. Emits LiquidationEvent
```

**Step 5: Database Update**
```
blockchain-indexer detects LiquidationEvent:
1. Inserts into 'liquidations' table
2. Updates user positions
3. Creates notification for liquidated user
4. Updates liquidation statistics
↓
User sees liquidation in transaction history
```

### Example 3: AI Portfolio Advice

**Step 1: User Request**
```
User types in AI chat: "How should I rebalance my portfolio?"
↓
Frontend calls ai-predictions Edge Function
```

**Step 2: Data Gathering**
```
Edge Function:
1. Queries user_positions table
2. Gets current market prices
3. Retrieves user risk tolerance
4. Calculates current allocation
```

**Step 3: AI Processing**
```
AI model analyzes:
- Current portfolio: 70% ETH, 30% USDC
- Market volatility: ETH volatility = 0.45
- User risk profile: Medium
- Historical performance
↓
Generates recommendations
```

**Step 4: Response Generation**
```
AI recommends:
- Reduce ETH to 50%
- Increase stablecoin to 50%
- Reasoning: "High ETH volatility + medium risk tolerance"
- Expected risk reduction: 25%
↓
Stores prediction in 'ai_predictions' table
```

**Step 5: User Action**
```
Frontend displays recommendations:
- Shows current vs. recommended allocation
- "Rebalance Now" button
- Expected gas costs
↓
User can execute rebalance with one click
```

## Data Flow Diagrams

### Supply/Borrow Flow
```
Frontend                Wallet              Blockchain           Backend
   │                       │                     │                  │
   │── Supply 1 ETH ──────>│                     │                  │
   │                       │                     │                  │
   │                       │── Sign TX ─────────>│                  │
   │                       │                     │                  │
   │                       │                     │── SupplyEvent ───>│
   │                       │                     │                  │
   │                       │                     │                  │── Update DB
   │<──────────────────────────── Realtime Update ─────────────────│
   │                       │                     │                  │
   │── Display Success ────│                     │                  │
```

### AI Prediction Flow
```
Frontend                Edge Function        AI Model             Database
   │                       │                     │                  │
   │── Request Advice ────>│                     │                  │
   │                       │                     │                  │
   │                       │── Query Data ──────>│                  │
   │                       │                     │                  │
   │                       │── Run Model ────────>│                  │
   │                       │<── Prediction ──────│                  │
   │                       │                     │                  │
   │                       │── Store Result ─────────────────────────>│
   │                       │                     │                  │
   │<── Display Advice ────│                     │                  │
```

### Liquidation Monitoring Flow
```
Price Feed             Blockchain           Edge Function         Database
   │                       │                     │                  │
   │── Price Update ──────>│                     │                  │
   │                       │                     │                  │
   │                       │── Price Event ─────>│                  │
   │                       │                     │                  │
   │                       │                     │── Query Positions >│
   │                       │                     │<── User Data ────│
   │                       │                     │                  │
   │                       │                     │── Calculate HF ──│
   │                       │                     │                  │
   │                       │                     │── Notify Users ──>│
   │                       │                     │                  │
   │                       │<── Liquidate ───────│                  │
```

## Key Integration Points

### 1. Wallet ↔ Frontend
- **Library**: ethers.js v6
- **Connection**: Via `window.ethereum` injected by MetaMask
- **Functions**:
  - `connectWallet()` - Establish connection
  - `switchNetwork()` - Change to Arbitrum L3
  - `signer.sendTransaction()` - Submit transactions

### 2. Frontend ↔ Supabase
- **Library**: @supabase/supabase-js
- **Connection**: HTTPS + WebSocket (for Realtime)
- **Functions**:
  - `supabase.from('table').select()` - Query data
  - `supabase.from('table').insert()` - Write data
  - `supabase.functions.invoke()` - Call Edge Functions
  - `supabase.channel().on()` - Subscribe to updates

### 3. Wallet ↔ Blockchain
- **Protocol**: JSON-RPC over HTTPS
- **Endpoint**: https://sepolia-rollup.arbitrum.io/rpc
- **Methods**:
  - `eth_sendTransaction` - Submit transaction
  - `eth_call` - Read contract state
  - `eth_estimateGas` - Estimate costs
  - `eth_getTransactionReceipt` - Get confirmation

### 4. Blockchain ↔ Backend
- **Method**: Event listening + Webhooks
- **Flow**:
  - Smart contract emits event
  - Edge Function polls for new events
  - Events trigger database updates
  - Realtime pushes to frontend

## Environment Variables

### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_LENDING_POOL_ADDRESS=0x...
VITE_CHAIN_ID=421614
VITE_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
```

### Edge Functions (Auto-configured by Supabase)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=postgres://...
```

### Smart Contracts (None needed - immutable on-chain)

## Security Architecture

### 1. Private Key Security
- **Never leaves**: Browser wallet extension
- **Never stored**: In database or logs
- **Never transmitted**: To backend servers
- **Used for**: Signing transactions only

### 2. Database Security
- **Row Level Security**: Every table has RLS policies
- **JWT Authentication**: All queries validated
- **Service Role**: Only Edge Functions have elevated access
- **Encrypted**: All data encrypted at rest

### 3. Smart Contract Security
- **Overflow protection**: All arithmetic uses checked operations
- **Access control**: Owner-only functions
- **Pausable**: Emergency stop functionality
- **Reentrancy guards**: Built into Stylus SDK

### 4. API Security
- **CORS**: Properly configured on Edge Functions
- **Rate limiting**: Built into Supabase
- **Input validation**: All parameters validated
- **SQL injection**: Prevented by parameterized queries

## Monitoring & Debugging

### 1. Frontend Errors
```javascript
// Check browser console
console.log('Wallet connected:', address);
console.error('Transaction failed:', error);

// Check wallet connection
if (window.ethereum) {
  console.log('Wallet available');
}
```

### 2. Blockchain Transactions
```bash
# Check transaction on explorer
https://sepolia.arbiscan.io/tx/0xabc...

# Check contract on explorer
https://sepolia.arbiscan.io/address/0x123...

# Query contract directly
cast call <CONTRACT> "get_total_supplied(address)(uint256)" <ASSET>
```

### 3. Backend Logs
```bash
# View Edge Function logs
supabase functions logs blockchain-indexer

# Check database
psql $DATABASE_URL
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;
```

### 4. Health Checks
```bash
# Test RPC connection
curl -X POST https://sepolia-rollup.arbitrum.io/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test Supabase
curl https://your-project.supabase.co/rest/v1/assets \
  -H "apikey: your_anon_key"

# Test Edge Function
curl https://your-project.supabase.co/functions/v1/blockchain-indexer \
  -H "Authorization: Bearer your_anon_key"
```

## Performance Optimization

### 1. Database Indexing
```sql
-- Indexes already created in migration
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_user_positions_user_id ON user_positions(user_id);
```

### 2. Caching Strategy
- **Browser**: Cache wallet connection, contract ABIs
- **Database**: Cache frequently accessed assets
- **Edge Functions**: Cache price data (5-minute TTL)

### 3. Batch Operations
- **Frontend**: Batch multiple reads into single query
- **Blockchain**: Use multicall for batch contract reads
- **Database**: Use bulk inserts for multiple transactions

## Scaling Considerations

### Current Capacity
- **Supabase**: 500 concurrent connections
- **Edge Functions**: 50 concurrent invocations
- **Blockchain**: 2000 TPS (Arbitrum L3)

### When to Scale
- **Database**: > 1M rows in transactions table
- **Edge Functions**: > 100K invocations/day
- **Frontend**: > 100K monthly active users

### Scaling Options
1. **Database**: Upgrade Supabase plan, add read replicas
2. **Edge Functions**: Horizontal scaling (automatic)
3. **Frontend**: CDN caching, code splitting
4. **Blockchain**: Deploy to multiple L3 chains

## Troubleshooting Guide

### "Wallet not connecting"
1. Check MetaMask is installed
2. Verify network is Arbitrum Sepolia
3. Clear browser cache
4. Check console for errors

### "Transaction failing"
1. Check sufficient ETH for gas
2. Verify contract address is correct
3. Check network matches contract deployment
4. Review transaction parameters

### "Data not updating"
1. Check Realtime subscription is active
2. Verify RLS policies allow access
3. Check Edge Function logs
4. Confirm blockchain events are being emitted

### "Health factor incorrect"
1. Verify price oracle data is fresh
2. Check collateral factors are set
3. Review calculation in Edge Function
4. Query smart contract directly to compare

## Next Steps After Deployment

1. **Monitor** - Set up alerts for critical metrics
2. **Test** - Perform end-to-end testing with real funds
3. **Audit** - Get smart contracts professionally audited
4. **Optimize** - Profile and optimize slow queries
5. **Scale** - Plan for user growth
6. **Document** - Keep this guide updated

## Support Resources

- **Frontend**: Check browser console, React DevTools
- **Backend**: Supabase Dashboard logs
- **Blockchain**: Arbiscan block explorer
- **Community**: Discord, GitHub Issues

---

This architecture is designed for security, scalability, and performance. All components work together to provide a seamless DeFi lending experience.
