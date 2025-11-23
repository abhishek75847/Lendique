export interface Asset {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  contract_address: string;
  icon_url: string | null;
  is_active: boolean;
  supply_apy: number;
  borrow_apy: number;
  total_supplied: number;
  total_borrowed: number;
  utilization_rate: number;
  max_ltv: number;
  liquidation_threshold: number;
  liquidation_penalty: number;
}

export interface UserPosition {
  id: string;
  user_id: string;
  asset_id: string;
  supplied_amount: number;
  borrowed_amount: number;
  collateral_amount: number;
  interest_accrued: number;
  asset?: Asset;
}

export interface Transaction {
  id: string;
  user_id: string;
  asset_id: string;
  type: 'supply' | 'withdraw' | 'borrow' | 'repay' | 'liquidate';
  amount: number;
  tx_hash: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  gas_used: number;
  created_at: string;
  asset?: Asset;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export interface AIPrediction {
  id: string;
  user_id: string | null;
  prediction_type: 'liquidation_risk' | 'rate_optimization' | 'portfolio_advice';
  input_data: any;
  output_data: any;
  confidence_score: number;
  proof_hash: string | null;
  model_version: string | null;
  created_at: string;
}

export interface UserStats {
  total_supplied: number;
  total_borrowed: number;
  health_factor: number;
  risk_score: number;
  net_apy: number;
}
