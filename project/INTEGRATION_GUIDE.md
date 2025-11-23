# Frontend-Contract Integration Guide

This guide shows exactly how the React frontend interacts with the Rust smart contracts on Arbitrum L3.

## Table of Contents
1. [Setup & Configuration](#setup--configuration)
2. [Contract ABIs](#contract-abis)
3. [Reading Contract Data](#reading-contract-data)
4. [Writing to Contracts](#writing-to-contracts)
5. [Event Listening](#event-listening)
6. [Complete User Flows](#complete-user-flows)
7. [Error Handling](#error-handling)

---

## Setup & Configuration

### 1. Install Dependencies

```bash
npm install ethers@6.13.0
```

### 2. Environment Variables

Create `.env` file:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Blockchain
VITE_CHAIN_ID=421614
VITE_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
VITE_BLOCK_EXPLORER=https://sepolia.arbiscan.io

# Contract Addresses (after deployment)
VITE_LENDING_POOL_ADDRESS=0x1234...
VITE_COLLATERAL_MANAGER_ADDRESS=0x5678...
VITE_LIQUIDATION_ENGINE_ADDRESS=0x9abc...
VITE_INTEREST_RATE_MODEL_ADDRESS=0xdef0...
VITE_RISK_ENGINE_ADDRESS=0x1111...
VITE_AI_COMPUTE_VAULT_ADDRESS=0x2222...
VITE_PORTFOLIO_REBALANCER_ADDRESS=0x3333...
VITE_GASLESS_AA_ADDRESS=0x4444...
VITE_RECEIPT_GENERATOR_ADDRESS=0x5555...

# Asset Addresses
VITE_ETH_ADDRESS=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
VITE_USDC_ADDRESS=0x...
VITE_USDT_ADDRESS=0x...
VITE_WBTC_ADDRESS=0x...
```

### 3. Create Contract Configuration File

```typescript
// src/config/contracts.ts

export const CONTRACTS = {
  LENDING_POOL: import.meta.env.VITE_LENDING_POOL_ADDRESS,
  COLLATERAL_MANAGER: import.meta.env.VITE_COLLATERAL_MANAGER_ADDRESS,
  LIQUIDATION_ENGINE: import.meta.env.VITE_LIQUIDATION_ENGINE_ADDRESS,
  INTEREST_RATE_MODEL: import.meta.env.VITE_INTEREST_RATE_MODEL_ADDRESS,
  RISK_ENGINE: import.meta.env.VITE_RISK_ENGINE_ADDRESS,
  AI_COMPUTE_VAULT: import.meta.env.VITE_AI_COMPUTE_VAULT_ADDRESS,
  PORTFOLIO_REBALANCER: import.meta.env.VITE_PORTFOLIO_REBALANCER_ADDRESS,
  GASLESS_AA: import.meta.env.VITE_GASLESS_AA_ADDRESS,
  RECEIPT_GENERATOR: import.meta.env.VITE_RECEIPT_GENERATOR_ADDRESS,
} as const;

export const ASSETS = {
  ETH: import.meta.env.VITE_ETH_ADDRESS,
  USDC: import.meta.env.VITE_USDC_ADDRESS,
  USDT: import.meta.env.VITE_USDT_ADDRESS,
  WBTC: import.meta.env.VITE_WBTC_ADDRESS,
} as const;

export const CHAIN_CONFIG = {
  chainId: Number(import.meta.env.VITE_CHAIN_ID),
  name: 'Arbitrum Sepolia',
  rpcUrl: import.meta.env.VITE_RPC_URL,
  blockExplorer: import.meta.env.VITE_BLOCK_EXPLORER,
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
};
```

---

## Contract ABIs

### 1. Generate ABIs from Rust Contracts

After building your Stylus contracts:

```bash
cd contracts/stylus
cargo stylus export-abi --release
```

This generates ABI JSON files.

### 2. Create ABI Files

```typescript
// src/abis/LendingPool.json

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
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "borrow",
      "inputs": [
        { "name": "asset", "type": "address" },
        { "name": "amount", "type": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "repay",
      "inputs": [
        { "name": "asset", "type": "address" },
        { "name": "amount", "type": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "withdraw",
      "inputs": [
        { "name": "asset", "type": "address" },
        { "name": "amount", "type": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "get_user_supply_balance",
      "inputs": [
        { "name": "user", "type": "address" },
        { "name": "asset", "type": "address" }
      ],
      "outputs": [{ "name": "", "type": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "get_user_borrow_balance",
      "inputs": [
        { "name": "user", "type": "address" },
        { "name": "asset", "type": "address" }
      ],
      "outputs": [{ "name": "", "type": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "get_total_supplied",
      "inputs": [
        { "name": "asset", "type": "address" }
      ],
      "outputs": [{ "name": "", "type": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "get_total_borrowed",
      "inputs": [
        { "name": "asset", "type": "address" }
      ],
      "outputs": [{ "name": "", "type": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "Supply",
      "inputs": [
        { "name": "user", "type": "address", "indexed": true },
        { "name": "asset", "type": "address", "indexed": true },
        { "name": "amount", "type": "uint256", "indexed": false }
      ]
    },
    {
      "type": "event",
      "name": "Borrow",
      "inputs": [
        { "name": "user", "type": "address", "indexed": true },
        { "name": "asset", "type": "address", "indexed": true },
        { "name": "amount", "type": "uint256", "indexed": false }
      ]
    },
    {
      "type": "event",
      "name": "Repay",
      "inputs": [
        { "name": "user", "type": "address", "indexed": true },
        { "name": "asset", "type": "address", "indexed": true },
        { "name": "amount", "type": "uint256", "indexed": false }
      ]
    },
    {
      "type": "event",
      "name": "Withdraw",
      "inputs": [
        { "name": "user", "type": "address", "indexed": true },
        { "name": "asset", "type": "address", "indexed": true },
        { "name": "amount", "type": "uint256", "indexed": false }
      ]
    }
  ]
}
```

### 3. Create Type-Safe Contract Hooks

```typescript
// src/hooks/useContracts.ts

import { ethers } from 'ethers';
import { useMemo } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { CONTRACTS } from '../config/contracts';
import LendingPoolABI from '../abis/LendingPool.json';
import CollateralManagerABI from '../abis/CollateralManager.json';
import InterestRateModelABI from '../abis/InterestRateModel.json';

export function useContracts() {
  const { signer, provider } = useWallet();

  const contracts = useMemo(() => {
    if (!provider) return null;

    const readProvider = provider;
    const writeProvider = signer || provider;

    return {
      lendingPool: {
        read: new ethers.Contract(
          CONTRACTS.LENDING_POOL,
          LendingPoolABI.abi,
          readProvider
        ),
        write: new ethers.Contract(
          CONTRACTS.LENDING_POOL,
          LendingPoolABI.abi,
          writeProvider
        ),
      },
      collateralManager: {
        read: new ethers.Contract(
          CONTRACTS.COLLATERAL_MANAGER,
          CollateralManagerABI.abi,
          readProvider
        ),
        write: new ethers.Contract(
          CONTRACTS.COLLATERAL_MANAGER,
          CollateralManagerABI.abi,
          writeProvider
        ),
      },
      interestRateModel: {
        read: new ethers.Contract(
          CONTRACTS.INTEREST_RATE_MODEL,
          InterestRateModelABI.abi,
          readProvider
        ),
      },
    };
  }, [provider, signer]);

  return contracts;
}
```

---

## Reading Contract Data

### Example 1: Get User's Supply Balance

```typescript
// src/hooks/useUserBalance.ts

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { useWallet } from '../contexts/WalletContext';
import { ASSETS } from '../config/contracts';

export function useUserSupplyBalance(asset: string) {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contracts = useContracts();
  const { address } = useWallet();

  useEffect(() => {
    async function fetchBalance() {
      if (!contracts || !address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Call contract read function
        const balanceWei = await contracts.lendingPool.read.get_user_supply_balance(
          address,
          asset
        );

        // Convert from Wei to readable format
        const balanceEth = ethers.formatEther(balanceWei);
        setBalance(balanceEth);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching supply balance:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();

    // Refresh every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [contracts, address, asset]);

  return { balance, loading, error };
}
```

### Example 2: Get Pool Statistics

```typescript
// src/hooks/usePoolStats.ts

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { ASSETS } from '../config/contracts';

interface PoolStats {
  totalSupplied: string;
  totalBorrowed: string;
  utilizationRate: number;
  supplyApy: string;
  borrowApy: string;
}

export function usePoolStats(asset: string) {
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const contracts = useContracts();

  useEffect(() => {
    async function fetchStats() {
      if (!contracts) return;

      try {
        setLoading(true);

        // Batch multiple contract calls
        const [totalSupplied, totalBorrowed, supplyRate, borrowRate] =
          await Promise.all([
            contracts.lendingPool.read.get_total_supplied(asset),
            contracts.lendingPool.read.get_total_borrowed(asset),
            contracts.interestRateModel.read.get_supply_rate(asset),
            contracts.interestRateModel.read.get_borrow_rate(asset),
          ]);

        // Calculate utilization rate
        const supplied = Number(ethers.formatEther(totalSupplied));
        const borrowed = Number(ethers.formatEther(totalBorrowed));
        const utilization = supplied > 0 ? (borrowed / supplied) * 100 : 0;

        // Convert interest rates (assuming they're in basis points)
        const supplyApy = (Number(supplyRate) / 100).toFixed(2);
        const borrowApy = (Number(borrowRate) / 100).toFixed(2);

        setStats({
          totalSupplied: ethers.formatEther(totalSupplied),
          totalBorrowed: ethers.formatEther(totalBorrowed),
          utilizationRate: utilization,
          supplyApy,
          borrowApy,
        });
      } catch (err) {
        console.error('Error fetching pool stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [contracts, asset]);

  return { stats, loading };
}
```

### Example 3: Get Health Factor

```typescript
// src/hooks/useHealthFactor.ts

import { useState, useEffect } from 'react';
import { useContracts } from './useContracts';
import { useWallet } from '../contexts/WalletContext';

export function useHealthFactor() {
  const [healthFactor, setHealthFactor] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const contracts = useContracts();
  const { address } = useWallet();

  useEffect(() => {
    async function fetchHealthFactor() {
      if (!contracts || !address) return;

      try {
        setLoading(true);

        // Call CollateralManager to get health factor
        const hf = await contracts.collateralManager.read.calculate_health_factor(
          address
        );

        // Health factor is returned as uint256 (scaled by 10000)
        // 10000 = 1.0, 15000 = 1.5, etc.
        const healthFactorDecimal = Number(hf) / 10000;
        setHealthFactor(healthFactorDecimal);
      } catch (err) {
        console.error('Error fetching health factor:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHealthFactor();
    const interval = setInterval(fetchHealthFactor, 10000);
    return () => clearInterval(interval);
  }, [contracts, address]);

  return { healthFactor, loading };
}
```

---

## Writing to Contracts

### Example 1: Supply ETH

```typescript
// src/hooks/useSupply.ts

import { useState } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { ASSETS } from '../config/contracts';
import { supabase } from '../lib/supabase';

interface SupplyResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function useSupply() {
  const [loading, setLoading] = useState(false);
  const contracts = useContracts();

  const supply = async (
    asset: string,
    amount: string
  ): Promise<SupplyResult> => {
    if (!contracts) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);

      // Convert amount to Wei
      const amountWei = ethers.parseEther(amount);

      // Estimate gas
      const gasEstimate = await contracts.lendingPool.write.supply.estimateGas(
        asset,
        amountWei,
        { value: asset === ASSETS.ETH ? amountWei : 0 }
      );

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * 120n) / 100n;

      // Send transaction
      const tx = await contracts.lendingPool.write.supply(
        asset,
        amountWei,
        {
          value: asset === ASSETS.ETH ? amountWei : 0,
          gasLimit,
        }
      );

      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log('Transaction confirmed:', receipt.hash);

        // Store in database for indexing
        await supabase.from('transactions').insert({
          tx_hash: receipt.hash,
          user_address: await contracts.lendingPool.write.runner?.address,
          action: 'supply',
          asset,
          amount,
          status: 'confirmed',
        });

        return { success: true, txHash: receipt.hash };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
    } catch (err: any) {
      console.error('Supply error:', err);

      let errorMessage = 'Transaction failed';

      // Parse error messages
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'User rejected transaction';
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.message) {
        errorMessage = err.message;
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { supply, loading };
}
```

### Example 2: Supply ERC20 Token (USDC)

```typescript
// src/hooks/useSupplyERC20.ts

import { useState } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

export function useSupplyERC20() {
  const [loading, setLoading] = useState(false);
  const contracts = useContracts();

  const supplyERC20 = async (
    asset: string,
    amount: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!contracts) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);

      const amountWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals
      const lendingPoolAddress = await contracts.lendingPool.write.getAddress();

      // Step 1: Create ERC20 contract instance
      const tokenContract = new ethers.Contract(
        asset,
        ERC20_ABI,
        contracts.lendingPool.write.runner
      );

      // Step 2: Check current allowance
      const currentAllowance = await tokenContract.allowance(
        await contracts.lendingPool.write.runner?.address,
        lendingPoolAddress
      );

      // Step 3: Approve if needed
      if (currentAllowance < amountWei) {
        console.log('Approving token spending...');

        const approveTx = await tokenContract.approve(
          lendingPoolAddress,
          ethers.MaxUint256 // Approve unlimited
        );

        console.log('Approval transaction sent:', approveTx.hash);
        await approveTx.wait();
        console.log('Approval confirmed');
      }

      // Step 4: Supply tokens
      const supplyTx = await contracts.lendingPool.write.supply(
        asset,
        amountWei
      );

      console.log('Supply transaction sent:', supplyTx.hash);
      const receipt = await supplyTx.wait();

      if (receipt.status === 1) {
        return { success: true, txHash: receipt.hash };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
    } catch (err: any) {
      console.error('Supply ERC20 error:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { supplyERC20, loading };
}
```

### Example 3: Borrow Assets

```typescript
// src/hooks/useBorrow.ts

import { useState } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';

export function useBorrow() {
  const [loading, setLoading] = useState(false);
  const contracts = useContracts();

  const borrow = async (
    asset: string,
    amount: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!contracts) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);

      const amountWei = ethers.parseEther(amount);

      // Check if borrow is allowed
      const healthFactorBefore = await contracts.collateralManager.read
        .calculate_health_factor(
          await contracts.lendingPool.write.runner?.address
        );

      if (Number(healthFactorBefore) < 12000) { // 1.2
        return {
          success: false,
          error: 'Health factor too low to borrow',
        };
      }

      // Execute borrow
      const tx = await contracts.lendingPool.write.borrow(asset, amountWei);
      console.log('Borrow transaction sent:', tx.hash);

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        return { success: true, txHash: receipt.hash };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
    } catch (err: any) {
      console.error('Borrow error:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { borrow, loading };
}
```

---

## Event Listening

### Example 1: Listen for Supply Events

```typescript
// src/hooks/useSupplyEvents.ts

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { useWallet } from '../contexts/WalletContext';

interface SupplyEvent {
  user: string;
  asset: string;
  amount: string;
  blockNumber: number;
  txHash: string;
}

export function useSupplyEvents() {
  const [events, setEvents] = useState<SupplyEvent[]>([]);
  const contracts = useContracts();
  const { address } = useWallet();

  useEffect(() => {
    if (!contracts || !address) return;

    const contract = contracts.lendingPool.read;

    // Create event filter for user's supplies
    const filter = contract.filters.Supply(address);

    // Listen for new events
    const handleSupplyEvent = (
      user: string,
      asset: string,
      amount: bigint,
      event: any
    ) => {
      const newEvent: SupplyEvent = {
        user,
        asset,
        amount: ethers.formatEther(amount),
        blockNumber: event.log.blockNumber,
        txHash: event.log.transactionHash,
      };

      setEvents((prev) => [newEvent, ...prev]);
    };

    contract.on(filter, handleSupplyEvent);

    // Fetch historical events
    const fetchHistoricalEvents = async () => {
      const historicalEvents = await contract.queryFilter(
        filter,
        -10000 // Last 10000 blocks
      );

      const parsedEvents = historicalEvents.map((event) => ({
        user: event.args.user,
        asset: event.args.asset,
        amount: ethers.formatEther(event.args.amount),
        blockNumber: event.blockNumber,
        txHash: event.transactionHash,
      }));

      setEvents(parsedEvents);
    };

    fetchHistoricalEvents();

    // Cleanup
    return () => {
      contract.off(filter, handleSupplyEvent);
    };
  }, [contracts, address]);

  return events;
}
```

### Example 2: Monitor All User Actions

```typescript
// src/hooks/useUserActivityMonitor.ts

import { useEffect } from 'react';
import { useContracts } from './useContracts';
import { useWallet } from '../contexts/WalletContext';
import { supabase } from '../lib/supabase';

export function useUserActivityMonitor() {
  const contracts = useContracts();
  const { address } = useWallet();

  useEffect(() => {
    if (!contracts || !address) return;

    const lendingPool = contracts.lendingPool.read;

    // Supply events
    const supplyFilter = lendingPool.filters.Supply(address);
    lendingPool.on(supplyFilter, async (user, asset, amount, event) => {
      console.log('Supply event detected:', { user, asset, amount });

      // Trigger frontend notification
      // Update database via Edge Function
    });

    // Borrow events
    const borrowFilter = lendingPool.filters.Borrow(address);
    lendingPool.on(borrowFilter, async (user, asset, amount, event) => {
      console.log('Borrow event detected:', { user, asset, amount });
    });

    // Repay events
    const repayFilter = lendingPool.filters.Repay(address);
    lendingPool.on(repayFilter, async (user, asset, amount, event) => {
      console.log('Repay event detected:', { user, asset, amount });
    });

    // Cleanup
    return () => {
      lendingPool.off(supplyFilter);
      lendingPool.off(borrowFilter);
      lendingPool.off(repayFilter);
    };
  }, [contracts, address]);
}
```

---

## Complete User Flows

### Flow 1: Supply ETH - Complete Example

```typescript
// src/components/SupplyForm.tsx

import { useState } from 'react';
import { useSupply } from '../hooks/useSupply';
import { useUserSupplyBalance } from '../hooks/useUserBalance';
import { ASSETS } from '../config/contracts';

export function SupplyForm() {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const { supply, loading } = useSupply();
  const { balance, loading: balanceLoading } = useUserSupplyBalance(ASSETS.ETH);

  const handleSupply = async () => {
    if (!amount || Number(amount) <= 0) {
      setMessage('Please enter a valid amount');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('Preparing transaction...');

    const result = await supply(ASSETS.ETH, amount);

    if (result.success) {
      setStatus('success');
      setMessage(`Successfully supplied ${amount} ETH! Tx: ${result.txHash}`);
      setAmount('');

      // Navigate to explorer
      console.log(`View on explorer: https://sepolia.arbiscan.io/tx/${result.txHash}`);
    } else {
      setStatus('error');
      setMessage(result.error || 'Transaction failed');
    }
  };

  return (
    <div className="supply-form">
      <h3>Supply ETH</h3>

      {!balanceLoading && (
        <p>Current Supply Balance: {balance} ETH</p>
      )}

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount to supply"
        disabled={loading}
      />

      <button onClick={handleSupply} disabled={loading || status === 'loading'}>
        {loading ? 'Processing...' : 'Supply ETH'}
      </button>

      {status !== 'idle' && (
        <div className={`message ${status}`}>
          {message}
        </div>
      )}
    </div>
  );
}
```

### Flow 2: Borrow with Health Factor Check

```typescript
// src/components/BorrowForm.tsx

import { useState } from 'react';
import { useBorrow } from '../hooks/useBorrow';
import { useHealthFactor } from '../hooks/useHealthFactor';
import { ASSETS } from '../config/contracts';

export function BorrowForm() {
  const [amount, setAmount] = useState('');
  const { borrow, loading } = useBorrow();
  const { healthFactor, loading: hfLoading } = useHealthFactor();

  const handleBorrow = async () => {
    // Check health factor before borrowing
    if (healthFactor < 1.5) {
      alert('Your health factor is too low. Please supply more collateral.');
      return;
    }

    const result = await borrow(ASSETS.USDC, amount);

    if (result.success) {
      alert(`Successfully borrowed ${amount} USDC!`);
      setAmount('');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <div className="borrow-form">
      <h3>Borrow USDC</h3>

      {!hfLoading && (
        <div className={`health-factor ${healthFactor < 1.2 ? 'danger' : 'safe'}`}>
          Health Factor: {healthFactor.toFixed(2)}
        </div>
      )}

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount to borrow"
        disabled={loading || healthFactor < 1.2}
      />

      <button
        onClick={handleBorrow}
        disabled={loading || healthFactor < 1.2}
      >
        {loading ? 'Processing...' : 'Borrow USDC'}
      </button>

      {healthFactor < 1.2 && (
        <p className="warning">
          Supply more collateral to increase your health factor
        </p>
      )}
    </div>
  );
}
```

### Flow 3: Complete Dashboard Integration

```typescript
// src/components/DashboardWithContracts.tsx

import { useEffect, useState } from 'react';
import { useContracts } from '../hooks/useContracts';
import { useWallet } from '../contexts/WalletContext';
import { useHealthFactor } from '../hooks/useHealthFactor';
import { usePoolStats } from '../hooks/usePoolStats';
import { ASSETS } from '../config/contracts';
import { ethers } from 'ethers';

export function DashboardWithContracts() {
  const contracts = useContracts();
  const { address } = useWallet();
  const { healthFactor } = useHealthFactor();
  const { stats: ethStats } = usePoolStats(ASSETS.ETH);

  const [userPositions, setUserPositions] = useState({
    totalSupplied: '0',
    totalBorrowed: '0',
    borrowLimit: '0',
  });

  useEffect(() => {
    async function loadUserData() {
      if (!contracts || !address) return;

      try {
        // Get user's supplied ETH
        const suppliedETH = await contracts.lendingPool.read
          .get_user_supply_balance(address, ASSETS.ETH);

        // Get user's borrowed USDC
        const borrowedUSDC = await contracts.lendingPool.read
          .get_user_borrow_balance(address, ASSETS.USDC);

        // Get collateral factor
        const collateralFactor = await contracts.collateralManager.read
          .get_collateral_factor(ASSETS.ETH);

        // Calculate borrow limit
        const supplied = Number(ethers.formatEther(suppliedETH));
        const factor = Number(collateralFactor) / 10000;
        const borrowLimit = (supplied * factor * 2000).toFixed(2); // Assuming ETH = $2000

        setUserPositions({
          totalSupplied: ethers.formatEther(suppliedETH),
          totalBorrowed: ethers.formatUnits(borrowedUSDC, 6),
          borrowLimit,
        });
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    }

    loadUserData();

    // Refresh every 15 seconds
    const interval = setInterval(loadUserData, 15000);
    return () => clearInterval(interval);
  }, [contracts, address]);

  return (
    <div className="dashboard">
      <h2>My Portfolio</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Supplied</h3>
          <p>${userPositions.totalSupplied}</p>
        </div>

        <div className="stat-card">
          <h3>Total Borrowed</h3>
          <p>${userPositions.totalBorrowed}</p>
        </div>

        <div className="stat-card">
          <h3>Borrow Limit</h3>
          <p>${userPositions.borrowLimit}</p>
        </div>

        <div className="stat-card">
          <h3>Health Factor</h3>
          <p className={healthFactor < 1.2 ? 'danger' : 'safe'}>
            {healthFactor.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="market-stats">
        <h3>ETH Market</h3>
        {ethStats && (
          <>
            <p>Total Supplied: {ethStats.totalSupplied} ETH</p>
            <p>Total Borrowed: {ethStats.totalBorrowed} ETH</p>
            <p>Supply APY: {ethStats.supplyApy}%</p>
            <p>Borrow APY: {ethStats.borrowApy}%</p>
            <p>Utilization: {ethStats.utilizationRate.toFixed(2)}%</p>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Error Handling

### Common Errors and Solutions

```typescript
// src/utils/contractErrors.ts

export function parseContractError(error: any): string {
  // User rejected transaction
  if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
    return 'Transaction rejected by user';
  }

  // Insufficient funds
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return 'Insufficient ETH for gas fees';
  }

  // Network error
  if (error.code === 'NETWORK_ERROR') {
    return 'Network connection error. Please check your internet.';
  }

  // Contract revert errors
  if (error.reason) {
    return `Contract error: ${error.reason}`;
  }

  // Parse custom revert messages
  if (error.data) {
    try {
      const reason = ethers.toUtf8String('0x' + error.data.slice(138));
      return `Transaction failed: ${reason}`;
    } catch {
      // Couldn't parse
    }
  }

  return error.message || 'Unknown error occurred';
}

// Usage
try {
  await contracts.lendingPool.write.supply(asset, amount);
} catch (error) {
  const friendlyMessage = parseContractError(error);
  console.error(friendlyMessage);
}
```

---

## Testing Contract Interactions

### 1. Test on Local Network

```typescript
// src/utils/testHelpers.ts

export async function testContractConnection() {
  try {
    const provider = new ethers.JsonRpcProvider(
      import.meta.env.VITE_RPC_URL
    );

    // Test 1: Check connection
    const blockNumber = await provider.getBlockNumber();
    console.log('✓ Connected to network. Block:', blockNumber);

    // Test 2: Check contract exists
    const code = await provider.getCode(CONTRACTS.LENDING_POOL);
    if (code === '0x') {
      console.error('✗ Contract not deployed');
      return false;
    }
    console.log('✓ Contract found at address');

    // Test 3: Try reading data
    const contract = new ethers.Contract(
      CONTRACTS.LENDING_POOL,
      LendingPoolABI.abi,
      provider
    );

    const totalSupplied = await contract.get_total_supplied(ASSETS.ETH);
    console.log('✓ Can read contract data:', ethers.formatEther(totalSupplied));

    return true;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}
```

### 2. Manual Testing Checklist

```
Frontend-Contract Integration Checklist:

□ Wallet connects successfully
□ Network switches to Arbitrum Sepolia
□ Can read contract state (balances, rates)
□ Can estimate gas for transactions
□ Can send transactions
□ Transactions get confirmed
□ Events are detected
□ UI updates after transactions
□ Error messages display correctly
□ Loading states work properly
```

---

## Summary

The frontend interacts with smart contracts through this flow:

1. **Connect Wallet** → MetaMask injects `window.ethereum`
2. **Create Contract Instance** → ethers.js creates typed interface
3. **Read Data** → Call view functions (no gas)
4. **Write Data** → Send transactions (requires gas + signature)
5. **Listen for Events** → Subscribe to contract events
6. **Update UI** → React state updates from contract data

**Key Points:**
- Use `provider` for reading (free)
- Use `signer` for writing (requires gas)
- Always estimate gas before transactions
- Handle errors gracefully
- Listen to events for real-time updates
- Store transaction history in Supabase
- Keep UI responsive during blockchain calls

All contract interactions happen through ethers.js, which handles the low-level JSON-RPC communication with the blockchain.
