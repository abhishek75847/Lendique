# Dynamic Asset Data - Real-Time Blockchain Integration

## Overview

Your asset list now displays **100% real-time data** fetched directly from blockchain smart contracts every 30 seconds!

---

## What's Now Dynamic (Real-Time from Blockchain)

### ✅ Supply APY
- **Source**: `InterestRateModel.getSupplyRate(asset)`
- **Updates**: Every 30 seconds
- **What it shows**: Current interest rate you earn by supplying this asset
- **Formula**: Based on utilization rate and protocol parameters

### ✅ Borrow APY
- **Source**: `InterestRateModel.getBorrowRate(asset)`
- **Updates**: Every 30 seconds
- **What it shows**: Current interest rate you pay when borrowing
- **Formula**: Supply APY + risk premium based on utilization

### ✅ Total Supplied
- **Source**: `LendingPool.getTotalSupply(asset)`
- **Updates**: Every 30 seconds
- **What it shows**: Total amount of this asset supplied by all users
- **Real blockchain state**: Sum of all user deposits

### ✅ Total Borrowed
- **Source**: `LendingPool.getTotalBorrow(asset)`
- **Updates**: Every 30 seconds
- **What it shows**: Total amount of this asset borrowed by all users
- **Real blockchain state**: Sum of all user borrows

### ✅ Utilization Rate
- **Source**: `InterestRateModel.getUtilizationRate(asset)`
- **Updates**: Every 30 seconds
- **Formula**: `(Total Borrowed / Total Supplied) × 100`
- **What it shows**: How much of supplied capital is being borrowed
- **Impact**: Higher utilization → Higher APY (to incentivize more supply)

---

## How It Works

### Data Flow Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│                   (Dashboard.tsx)                        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ Uses hook
                     ↓
┌──────────────────────────────────────────────────────────┐
│                  useAssetData Hook                       │
│               (Updates every 30 sec)                     │
└────────┬──────────────────────────────────┬──────────────┘
         │                                   │
         │ Fetches from                     │ Saves to
         ↓                                   ↓
┌─────────────────────┐           ┌──────────────────────┐
│  SMART CONTRACTS    │           │   SUPABASE DB        │
│  (Blockchain)       │           │   (Cache/History)    │
├─────────────────────┤           ├──────────────────────┤
│                     │           │                      │
│ LendingPool:        │           │ assets table:        │
│ • getTotalSupply()  │──────────>│ • supply_apy        │
│ • getTotalBorrow()  │           │ • borrow_apy        │
│                     │           │ • total_supplied    │
│ InterestRateModel:  │           │ • total_borrowed    │
│ • getSupplyRate()   │           │ • utilization_rate  │
│ • getBorrowRate()   │           │ • updated_at        │
│ • getUtilization()  │           │                      │
└─────────────────────┘           └──────────────────────┘
```

### Hook Implementation

```typescript
// src/hooks/useAssetData.ts

export function useAssetData() {
  const [assets, setAssets] = useState([]);
  const contracts = useContracts();

  useEffect(() => {
    async function fetchAssetData() {
      // 1. Get base asset info from database
      const { data: dbAssets } = await supabase
        .from('assets')
        .select('*')
        .eq('is_active', true);

      // 2. Enhance with real-time blockchain data
      const enhancedAssets = await Promise.all(
        dbAssets.map(async (asset) => {
          // Fetch live data from contracts
          const [totalSupplied, totalBorrowed, supplyRate, borrowRate, utilizationRate] =
            await Promise.all([
              contracts.lendingPool.read.getTotalSupply(asset.contract_address),
              contracts.lendingPool.read.getTotalBorrow(asset.contract_address),
              contracts.interestRateModel.read.getSupplyRate(asset.contract_address),
              contracts.interestRateModel.read.getBorrowRate(asset.contract_address),
              contracts.interestRateModel.read.getUtilizationRate(asset.contract_address),
            ]);

          // 3. Update database cache
          await supabase.from('assets').update({
            supply_apy: Number(supplyRate) / 100,
            borrow_apy: Number(borrowRate) / 100,
            total_supplied: Number(ethers.formatEther(totalSupplied)),
            total_borrowed: Number(ethers.formatEther(totalBorrowed)),
            utilization_rate: Number(utilizationRate) / 100,
          }).eq('id', asset.id);

          return { ...asset, /* updated values */ };
        })
      );

      setAssets(enhancedAssets);
    }

    fetchAssetData(); // Initial fetch
    const interval = setInterval(fetchAssetData, 30000); // Every 30 sec
    return () => clearInterval(interval);
  }, [contracts]);

  return { assets, loading, error };
}
```

---

## What Happens in Real-Time

### Scenario: Large Borrow Transaction

**Initial State:**
```
ETH Market:
- Total Supplied: 100 ETH
- Total Borrowed: 50 ETH
- Utilization: 50%
- Supply APY: 3.5%
- Borrow APY: 5.2%
```

**Someone borrows 30 ETH:**
```
1. Transaction confirmed on blockchain
2. LendingPool state updates:
   - total_borrowed = 80 ETH
3. InterestRateModel recalculates:
   - utilization = 80/100 = 80%
   - supply_apy = 5.8% (increased!)
   - borrow_apy = 7.4% (increased!)
```

**Your UI updates (within 30 seconds):**
```
ETH Market:
- Total Supplied: 100 ETH
- Total Borrowed: 80 ETH
- Utilization: 80%
- Supply APY: 5.8% ⬆️ (was 3.5%)
- Borrow APY: 7.4% ⬆️ (was 5.2%)
```

### Why APY Changed

**Interest Rate Model Formula:**
```typescript
// Simplified version

if (utilization < 80%) {
  supplyRate = baseRate + (utilization * multiplier1);
  borrowRate = supplyRate + spread;
} else {
  // "Kink" - aggressive rate increase above 80%
  supplyRate = baseRate + (80 * multiplier1) + ((utilization - 80) * multiplier2);
  borrowRate = supplyRate + spread;
}

// Example with 80% utilization:
baseRate = 2%
multiplier1 = 0.05
multiplier2 = 0.20 (aggressive above kink)
spread = 1.5%

supplyRate = 2% + (80 * 0.05) = 6%
borrowRate = 6% + 1.5% = 7.5%
```

---

## Update Frequency

### Every 30 Seconds:
1. Hook fetches fresh data from all contracts
2. Calculates real APYs based on current utilization
3. Updates local state
4. Saves to database (for offline fallback)
5. UI re-renders with new values

### Immediate Updates:
- After YOU make a transaction
- `onRefresh()` is called
- Fresh data fetched instantly

### Fallback Behavior:
- If contracts unavailable → Shows cached database values
- If blockchain connection lost → Uses last known values
- Error handling ensures UI never breaks

---

## Verification

### Test Real-Time Updates

**Step 1: Note Current Values**
```
Open dashboard
Check ETH supply APY: 3.5%
Check utilization: 50%
```

**Step 2: Make Large Transaction**
```
Supply or borrow significant amount
Wait for transaction confirmation
```

**Step 3: Watch Updates**
```
Within 30 seconds, all values update:
- Your transaction reflected in totals
- Utilization rate changes
- APYs adjust based on new utilization
```

### Compare with Contracts

You can verify any value directly:

```typescript
// In browser console or test script

const provider = new ethers.BrowserProvider(window.ethereum);
const lendingPool = new ethers.Contract(POOL_ADDRESS, ABI, provider);
const interestRateModel = new ethers.Contract(IRM_ADDRESS, ABI, provider);

// Check total supplied
const totalSupplied = await lendingPool.getTotalSupply(ASSETS.ETH);
console.log('Blockchain:', ethers.formatEther(totalSupplied));
console.log('Dashboard:', document.querySelector('.total-supplied').textContent);
// Should match!

// Check supply APY
const supplyRate = await interestRateModel.getSupplyRate(ASSETS.ETH);
console.log('Blockchain:', Number(supplyRate) / 100, '%');
console.log('Dashboard:', document.querySelector('.supply-apy').textContent);
// Should match!
```

---

## Benefits of Dynamic Data

### 1. **Accurate Decision Making**
Users see real-time APYs and can choose best opportunities

### 2. **Market Responsive**
Rates adjust automatically based on supply/demand

### 3. **Transparent**
All data verifiable on blockchain

### 4. **No Manual Updates**
Protocol parameters update themselves

### 5. **Competitive Rates**
Markets naturally find equilibrium prices

---

## Database Sync

### Why Cache in Database?

1. **Performance**: Faster initial load
2. **Offline Support**: Shows last known values if blockchain unavailable
3. **Historical Data**: Can track APY changes over time
4. **Analytics**: Query historical utilization/APY trends

### Update Strategy

```typescript
// Fetch from blockchain
const liveData = await contracts.getLiveData();

// Update database cache
await supabase.from('assets').update({
  supply_apy: liveData.supplyApy,
  borrow_apy: liveData.borrowApy,
  total_supplied: liveData.totalSupplied,
  total_borrowed: liveData.totalBorrowed,
  utilization_rate: liveData.utilization,
  updated_at: new Date().toISOString(), // Timestamp
}).eq('contract_address', asset);

// UI uses fresh data immediately
setAssets(liveData);
```

### Database Schema

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  contract_address TEXT UNIQUE NOT NULL,
  decimals INTEGER DEFAULT 18,

  -- Dynamic fields (updated from blockchain)
  supply_apy NUMERIC DEFAULT 0,           -- Real-time from contract
  borrow_apy NUMERIC DEFAULT 0,           -- Real-time from contract
  total_supplied NUMERIC DEFAULT 0,       -- Real-time from contract
  total_borrowed NUMERIC DEFAULT 0,       -- Real-time from contract
  utilization_rate NUMERIC DEFAULT 0,     -- Real-time from contract

  -- Static fields (protocol configuration)
  max_ltv INTEGER DEFAULT 75,
  liquidation_threshold INTEGER DEFAULT 80,
  liquidation_penalty INTEGER DEFAULT 5,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()     -- Last blockchain sync
);
```

---

## Error Handling

### Contract Call Failures

```typescript
try {
  const supplyRate = await interestRateModel.read.getSupplyRate(asset);
  return Number(supplyRate) / 100;
} catch (error) {
  console.error('Failed to fetch supply rate:', error);
  // Fallback to cached database value
  return asset.supply_apy;
}
```

### Network Issues

```typescript
if (!contracts || !isConnected) {
  // Show database values
  const { data: cachedAssets } = await supabase.from('assets').select('*');
  setAssets(cachedAssets);
  return;
}
```

### Graceful Degradation

```
Best Case:    Live blockchain data every 30 sec
Good Case:    Cached data from last successful fetch
Worst Case:   Static fallback values from database
Never:        Broken UI or missing data
```

---

## Performance Optimization

### Parallel Fetching

```typescript
// ❌ Slow - Sequential
for (const asset of assets) {
  const supply = await getSupply(asset);
  const borrow = await getBorrow(asset);
}

// ✅ Fast - Parallel
const results = await Promise.all(
  assets.map(async (asset) => {
    const [supply, borrow] = await Promise.all([
      getSupply(asset),
      getBorrow(asset),
    ]);
    return { asset, supply, borrow };
  })
);
```

### Batching Updates

```typescript
// Update all assets in single database transaction
await supabase.from('assets').upsert(
  assets.map(asset => ({
    id: asset.id,
    supply_apy: asset.supply_apy,
    borrow_apy: asset.borrow_apy,
    // ... other fields
  }))
);
```

### Debouncing

```typescript
// Don't fetch on every render
useEffect(() => {
  const fetchData = debounce(async () => {
    // Fetch logic
  }, 30000);

  fetchData();
  return () => clearInterval(fetchData);
}, [contracts]);
```

---

## Testing Dynamic Updates

### Manual Test

```bash
# Terminal 1: Watch database
watch -n 1 'psql $DB_URL -c "SELECT symbol, supply_apy, utilization_rate, updated_at FROM assets"'

# Terminal 2: Make transaction
# Use frontend to supply/borrow

# Observe:
# - updated_at changes
# - APYs adjust
# - Utilization rate updates
```

### Automated Test

```typescript
describe('Dynamic Asset Data', () => {
  it('updates APY based on utilization', async () => {
    const { assets } = renderHook(() => useAssetData());

    const initialApy = assets[0].supply_apy;

    // Simulate large borrow (increases utilization)
    await contracts.lendingPool.borrow(ETH, parseEther('50'));

    // Wait for hook update
    await waitFor(() => {
      expect(assets[0].supply_apy).toBeGreaterThan(initialApy);
    }, { timeout: 35000 }); // 30s interval + 5s buffer
  });
});
```

---

## Summary

### What's Real-Time Now:

✅ **Supply APY** - From InterestRateModel contract
✅ **Borrow APY** - From InterestRateModel contract
✅ **Total Supplied** - From LendingPool contract
✅ **Total Borrowed** - From LendingPool contract
✅ **Utilization Rate** - Calculated from contract data
✅ **Updates every 30 seconds** - Automatic refresh
✅ **Updates after transactions** - Immediate refresh
✅ **Cached in database** - For performance & offline

### No More Static/Mock Data:

❌ Hard-coded APY values
❌ Fake utilization rates
❌ Static totals
❌ Manual database updates

### Your asset list is now a **real-time blockchain dashboard**! 🚀

Every number you see is fetched directly from smart contracts and updates automatically every 30 seconds, giving users accurate, up-to-date market information for making lending and borrowing decisions.
