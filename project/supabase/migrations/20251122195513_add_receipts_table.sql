/*
  # Add Receipts Table

  ## Overview
  Creates table for storing blockchain transaction receipts with cryptographic proof verification.

  ## New Tables

  ### `receipts`
  - `id` (uuid, primary key) - Database identifier
  - `receipt_id` (text, unique) - Blockchain receipt ID
  - `wallet_address` (text, indexed) - User wallet address
  - `action` (int) - Action type (1=Supply, 2=Withdraw, 3=Borrow, 4=Repay)
  - `action_name` (text) - Human-readable action name
  - `amount` (text) - Transaction amount
  - `timestamp` (bigint) - Block timestamp
  - `proof_hash` (text) - Cryptographic proof hash
  - `submitted_to_l2` (boolean) - Whether submitted to L2
  - `verified` (boolean) - Whether receipt is verified
  - `tx_hash` (text) - Transaction hash
  - `created_at` (timestamptz) - Database creation time

  ## Security
  - Enable RLS on receipts table
  - Users can read own receipts
  - Authenticated users can create receipts
*/

CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id text UNIQUE NOT NULL,
  wallet_address text NOT NULL,
  action int NOT NULL,
  action_name text NOT NULL,
  amount text NOT NULL,
  timestamp bigint NOT NULL,
  proof_hash text NOT NULL,
  submitted_to_l2 boolean DEFAULT false,
  verified boolean DEFAULT false,
  tx_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_wallet ON receipts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_receipts_timestamp ON receipts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_action ON receipts(action);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own receipts"
  ON receipts
  FOR SELECT
  TO authenticated
  USING (LOWER(wallet_address) = LOWER(auth.jwt()->>'wallet_address'));

CREATE POLICY "Public read for receipts"
  ON receipts
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can insert receipts"
  ON receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own receipts"
  ON receipts
  FOR UPDATE
  TO authenticated
  USING (LOWER(wallet_address) = LOWER(auth.jwt()->>'wallet_address'))
  WITH CHECK (LOWER(wallet_address) = LOWER(auth.jwt()->>'wallet_address'));
