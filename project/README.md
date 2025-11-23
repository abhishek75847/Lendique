# Lendique Smart Contracts

This directory contains all smart contracts for the Lendique DeFi lending platform, written in Rust using Arbitrum Stylus.

## Architecture Overview

Lendique operates on a custom Arbitrum Orbit L3 chain with the following contract architecture:

### Core Contracts

1. **LendingPool** (`lending_pool.rs`)
   - Central hub for all lending operations
   - Handles supply, withdraw, borrow, and repay functions
   - Tracks user balances and pool utilization
   - Implements interest accrual mechanics

2. **CollateralManager** (`collateral_manager.rs`)
   - Manages user collateral deposits and withdrawals
   - Calculates collateral value and health factors
   - Configures collateral factors and liquidation thresholds
   - Supports multi-asset collateral

3. **LiquidationEngine** (`liquidation_engine.rs`)
   - Executes liquidations when health factor < 1.0
   - Calculates collateral to seize based on liquidation penalty
   - Implements AI-assisted liquidation risk prediction
   - Tracks liquidation statistics

4. **InterestRateModel** (`interest_rate_model.rs`)
   - Implements kink-based interest rate curves
   - Calculates supply and borrow APY based on utilization
   - Supports AI-driven rate adjustments
   - Configurable base rate, multiplier, and jump multiplier

5. **RiskEngine** (`risk_engine.rs`)
   - Assesses position risk scores
   - Calculates LTV (Loan-to-Value) ratios
   - Tracks asset volatility and risk metrics
   - Integrates AI risk predictions

6. **AiComputeVault** (`ai_compute_vault.rs`)
   - On-chain AI inference capabilities
   - Stores model weights for lightweight ML models
   - Performs vector operations and matrix multiplication
   - Supports activation functions (ReLU, Sigmoid)

7. **PortfolioRebalancer** (`portfolio_rebalancer.rs`)
   - Automated portfolio rebalancing
   - Optimizes for volatility and APY
   - Tracks target allocations per user
   - Implements cooldown periods

8. **GaslessAccountAbstraction** (`gasless_account_abstraction.rs`)
   - Meta-transaction support
   - Gas sponsorship for users
   - Signature verification and nonce management
   - Batch transaction execution

9. **ReceiptGenerator** (`receipt_generator.rs`)
   - Generates cryptographic proofs for L3 transactions
   - Submits receipts to L2 for verification
   - Creates tamper-proof transaction records
   - Supports batch proof submission

## Technology Stack

- **Language**: Rust
- **Framework**: Arbitrum Stylus SDK
- **Blockchain**: Arbitrum Orbit L3 (custom chain)
- **Gas Token**: LQG (native)

## Deployment

### Prerequisites

1. Install Rust and Cargo:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Install Arbitrum Stylus toolchain:
   ```bash
   cargo install cargo-stylus
   ```

3. Add WASM target:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

### Building Contracts

```bash
cd contracts/stylus
cargo build --release --target wasm32-unknown-unknown
```

### Testing Contracts

```bash
cargo test
```

### Deploying to L3

```bash
cargo stylus deploy \
  --private-key-path=./deployer-key.txt \
  --endpoint=https://lendique-l3.arbitrum.io/rpc
```

## Contract Addresses (Testnet)

*To be updated after deployment*

- LendingPool: `0x...`
- CollateralManager: `0x...`
- LiquidationEngine: `0x...`
- InterestRateModel: `0x...`
- RiskEngine: `0x...`
- AiComputeVault: `0x...`
- PortfolioRebalancer: `0x...`
- GaslessAccountAbstraction: `0x...`
- ReceiptGenerator: `0x...`

## Key Features

### Memory Safety
All contracts are written in Rust, providing compile-time memory safety guarantees and preventing common vulnerabilities like buffer overflows.

### Gas Efficiency
Stylus contracts run directly as WASM, providing 10-100x gas savings compared to Solidity on Ethereum mainnet.

### AI Integration
- On-chain inference via AiComputeVault for time-sensitive predictions
- Off-chain AI via Supabase Edge Functions for complex models
- Cryptographic proofs ensure prediction integrity

### Security Features
- Overflow-safe arithmetic (checked operations)
- Reentrancy guards via Stylus SDK
- Access control on all administrative functions
- Pausable contracts for emergency situations

## Integration with Backend

The contracts emit events that are indexed by the `blockchain-indexer` Supabase Edge Function:

- **SupplyEvent**: Tracks user deposits
- **BorrowEvent**: Tracks user borrows
- **LiquidationEvent**: Monitors liquidations
- **MetaTransactionExecutedEvent**: Gasless transactions

These events update the Supabase database in real-time, enabling the frontend to display current positions and transaction history.

## Security Audits

*Pending - contracts are under active development*

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please follow Rust best practices and include tests for all new functionality.
