/*
  # Lendique Platform Database Schema

  ## Overview
  Complete database schema for the Lendique DeFi lending platform with AI integration.

  ## 1. New Tables

  ### `users`
  - `id` (uuid, primary key) - User identifier linked to auth.users
  - `wallet_address` (text, unique) - Ethereum wallet address
  - `email` (text) - User email
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `total_supplied` (numeric) - Total amount supplied across all assets
  - `total_borrowed` (numeric) - Total amount borrowed
  - `health_factor` (numeric) - Current health factor
  - `risk_score` (numeric) - AI-calculated risk score

  ### `assets`
  - `id` (uuid, primary key) - Asset identifier
  - `symbol` (text, unique) - Asset symbol (ETH, USDC, etc.)
  - `name` (text) - Full asset name
  - `decimals` (int) - Token decimals
  - `contract_address` (text) - L3 contract address
  - `icon_url` (text) - Asset icon URL
  - `is_active` (boolean) - Whether asset is active for lending
  - `supply_apy` (numeric) - Current supply APY
  - `borrow_apy` (numeric) - Current borrow APY
  - `total_supplied` (numeric) - Total supplied in pool
  - `total_borrowed` (numeric) - Total borrowed from pool
  - `utilization_rate` (numeric) - Pool utilization percentage
  - `max_ltv` (numeric) - Maximum loan-to-value ratio
  - `liquidation_threshold` (numeric) - Liquidation threshold
  - `liquidation_penalty` (numeric) - Liquidation penalty percentage
  - `created_at` (timestamptz) - Asset creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `user_positions`
  - `id` (uuid, primary key) - Position identifier
  - `user_id` (uuid, foreign key) - References users
  - `asset_id` (uuid, foreign key) - References assets
  - `supplied_amount` (numeric) - Amount supplied
  - `borrowed_amount` (numeric) - Amount borrowed
  - `collateral_amount` (numeric) - Amount used as collateral
  - `interest_accrued` (numeric) - Accrued interest
  - `last_interaction` (timestamptz) - Last supply/borrow/repay
  - `created_at` (timestamptz) - Position creation
  - `updated_at` (timestamptz) - Last update

  ### `transactions`
  - `id` (uuid, primary key) - Transaction identifier
  - `user_id` (uuid, foreign key) - References users
  - `asset_id` (uuid, foreign key) - References assets
  - `type` (text) - Transaction type (supply, withdraw, borrow, repay, liquidate)
  - `amount` (numeric) - Transaction amount
  - `tx_hash` (text) - Blockchain transaction hash
  - `status` (text) - Transaction status (pending, confirmed, failed)
  - `gas_used` (numeric) - Gas consumed
  - `created_at` (timestamptz) - Transaction timestamp

  ### `liquidations`
  - `id` (uuid, primary key) - Liquidation identifier
  - `user_id` (uuid, foreign key) - User being liquidated
  - `liquidator_id` (uuid, foreign key) - Liquidator user
  - `collateral_asset_id` (uuid, foreign key) - Collateral asset
  - `debt_asset_id` (uuid, foreign key) - Debt asset
  - `collateral_amount` (numeric) - Collateral seized
  - `debt_amount` (numeric) - Debt repaid
  - `penalty_amount` (numeric) - Liquidation penalty
  - `health_factor_before` (numeric) - Health factor before liquidation
  - `tx_hash` (text) - Transaction hash
  - `created_at` (timestamptz) - Liquidation timestamp

  ### `ai_predictions`
  - `id` (uuid, primary key) - Prediction identifier
  - `user_id` (uuid, foreign key) - References users
  - `prediction_type` (text) - Type (liquidation_risk, rate_optimization, portfolio_advice)
  - `input_data` (jsonb) - Input parameters
  - `output_data` (jsonb) - Prediction results
  - `confidence_score` (numeric) - AI confidence level
  - `proof_hash` (text) - Cryptographic proof
  - `model_version` (text) - AI model version
  - `created_at` (timestamptz) - Prediction timestamp

  ### `interest_rate_history`
  - `id` (uuid, primary key) - History entry identifier
  - `asset_id` (uuid, foreign key) - References assets
  - `supply_apy` (numeric) - Supply APY at time
  - `borrow_apy` (numeric) - Borrow APY at time
  - `utilization_rate` (numeric) - Utilization rate
  - `timestamp` (timestamptz) - Record timestamp

  ### `portfolio_rebalances`
  - `id` (uuid, primary key) - Rebalance identifier
  - `user_id` (uuid, foreign key) - References users
  - `strategy` (text) - Rebalancing strategy
  - `from_asset_id` (uuid, foreign key) - Source asset
  - `to_asset_id` (uuid, foreign key) - Target asset
  - `amount` (numeric) - Amount rebalanced
  - `reason` (text) - AI reasoning
  - `tx_hash` (text) - Transaction hash
  - `created_at` (timestamptz) - Rebalance timestamp

  ### `notifications`
  - `id` (uuid, primary key) - Notification identifier
  - `user_id` (uuid, foreign key) - References users
  - `type` (text) - Notification type (liquidation_warning, rate_change, etc.)
  - `title` (text) - Notification title
  - `message` (text) - Notification message
  - `data` (jsonb) - Additional data
  - `read` (boolean) - Read status
  - `created_at` (timestamptz) - Notification timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Users can only read/write their own data
  - Public read access for assets and interest rate history
  - Authenticated users required for all operations

  ## 3. Indexes
  - Indexes on foreign keys for performance
  - Indexes on frequently queried fields
  - Composite indexes for common query patterns
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text UNIQUE NOT NULL,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  total_supplied numeric DEFAULT 0,
  total_borrowed numeric DEFAULT 0,
  health_factor numeric DEFAULT 0,
  risk_score numeric DEFAULT 0
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text UNIQUE NOT NULL,
  name text NOT NULL,
  decimals int NOT NULL DEFAULT 18,
  contract_address text NOT NULL,
  icon_url text,
  is_active boolean DEFAULT true,
  supply_apy numeric DEFAULT 0,
  borrow_apy numeric DEFAULT 0,
  total_supplied numeric DEFAULT 0,
  total_borrowed numeric DEFAULT 0,
  utilization_rate numeric DEFAULT 0,
  max_ltv numeric DEFAULT 0,
  liquidation_threshold numeric DEFAULT 0,
  liquidation_penalty numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_positions table
CREATE TABLE IF NOT EXISTS user_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  supplied_amount numeric DEFAULT 0,
  borrowed_amount numeric DEFAULT 0,
  collateral_amount numeric DEFAULT 0,
  interest_accrued numeric DEFAULT 0,
  last_interaction timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, asset_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  tx_hash text,
  status text DEFAULT 'pending',
  gas_used numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create liquidations table
CREATE TABLE IF NOT EXISTS liquidations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  liquidator_id uuid REFERENCES users(id) ON DELETE SET NULL,
  collateral_asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  debt_asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  collateral_amount numeric NOT NULL,
  debt_amount numeric NOT NULL,
  penalty_amount numeric NOT NULL,
  health_factor_before numeric NOT NULL,
  tx_hash text,
  created_at timestamptz DEFAULT now()
);

-- Create ai_predictions table
CREATE TABLE IF NOT EXISTS ai_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  prediction_type text NOT NULL,
  input_data jsonb NOT NULL,
  output_data jsonb NOT NULL,
  confidence_score numeric DEFAULT 0,
  proof_hash text,
  model_version text,
  created_at timestamptz DEFAULT now()
);

-- Create interest_rate_history table
CREATE TABLE IF NOT EXISTS interest_rate_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  supply_apy numeric NOT NULL,
  borrow_apy numeric NOT NULL,
  utilization_rate numeric NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create portfolio_rebalances table
CREATE TABLE IF NOT EXISTS portfolio_rebalances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  strategy text NOT NULL,
  from_asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  to_asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  reason text,
  tx_hash text,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_rebalances ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_rate_history ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User positions policies
CREATE POLICY "Users can view own positions"
  ON user_positions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own positions"
  ON user_positions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own positions"
  ON user_positions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Liquidations policies
CREATE POLICY "Users can view own liquidations"
  ON liquidations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR liquidator_id = auth.uid());

CREATE POLICY "Users can insert liquidations"
  ON liquidations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- AI predictions policies
CREATE POLICY "Users can view own predictions"
  ON ai_predictions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert predictions"
  ON ai_predictions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Portfolio rebalances policies
CREATE POLICY "Users can view own rebalances"
  ON portfolio_rebalances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own rebalances"
  ON portfolio_rebalances FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Assets policies (public read)
CREATE POLICY "Anyone can view assets"
  ON assets FOR SELECT
  TO authenticated
  USING (true);

-- Interest rate history policies (public read)
CREATE POLICY "Anyone can view interest rate history"
  ON interest_rate_history FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_positions_user_id ON user_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_positions_asset_id ON user_positions(asset_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_asset_id ON transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_liquidations_user_id ON liquidations(user_id);
CREATE INDEX IF NOT EXISTS idx_liquidations_created_at ON liquidations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_user_id ON ai_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_interest_rate_history_asset_id ON interest_rate_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_interest_rate_history_timestamp ON interest_rate_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Insert sample assets
INSERT INTO assets (symbol, name, decimals, contract_address, icon_url, is_active, supply_apy, borrow_apy, total_supplied, total_borrowed, utilization_rate, max_ltv, liquidation_threshold, liquidation_penalty)
VALUES 
  ('ETH', 'Ethereum', 18, '0x0000000000000000000000000000000000000000', 'https://cryptologos.cc/logos/ethereum-eth-logo.png', true, 3.24, 4.56, 150000, 120000, 80, 75, 80, 5),
  ('USDC', 'USD Coin', 6, '0x0000000000000000000000000000000000000001', 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', true, 5.12, 6.89, 5000000, 4200000, 84, 80, 85, 5),
  ('USDT', 'Tether USD', 6, '0x0000000000000000000000000000000000000002', 'https://cryptologos.cc/logos/tether-usdt-logo.png', true, 4.98, 6.54, 4800000, 3900000, 81.25, 80, 85, 5),
  ('WBTC', 'Wrapped Bitcoin', 8, '0x0000000000000000000000000000000000000003', 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png', true, 2.87, 4.12, 8500, 6800, 80, 70, 75, 6),
  ('DAI', 'Dai Stablecoin', 18, '0x0000000000000000000000000000000000000004', 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png', true, 5.45, 7.23, 3200000, 2700000, 84.38, 80, 85, 5),
  ('ARB', 'Arbitrum', 18, '0x0000000000000000000000000000000000000005', 'https://cryptologos.cc/logos/arbitrum-arb-logo.png', true, 4.67, 6.34, 45000000, 36000000, 80, 65, 70, 7)
ON CONFLICT (symbol) DO NOTHING;