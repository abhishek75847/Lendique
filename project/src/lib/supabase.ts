import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          email: string | null;
          created_at: string;
          updated_at: string;
          total_supplied: number;
          total_borrowed: number;
          health_factor: number;
          risk_score: number;
        };
      };
      assets: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
      };
      user_positions: {
        Row: {
          id: string;
          user_id: string;
          asset_id: string;
          supplied_amount: number;
          borrowed_amount: number;
          collateral_amount: number;
          interest_accrued: number;
          last_interaction: string;
          created_at: string;
          updated_at: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          asset_id: string;
          type: string;
          amount: number;
          tx_hash: string | null;
          status: string;
          gas_used: number;
          created_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: any;
          read: boolean;
          created_at: string;
        };
      };
      ai_predictions: {
        Row: {
          id: string;
          user_id: string | null;
          prediction_type: string;
          input_data: any;
          output_data: any;
          confidence_score: number;
          proof_hash: string | null;
          model_version: string | null;
          created_at: string;
        };
      };
    };
  };
};
