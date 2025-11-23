import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, payload } = await req.json();

    switch (action) {
      case 'index_supply': {
        const { user_id, asset_id, amount, tx_hash } = payload;

        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id,
            asset_id,
            type: 'supply',
            amount,
            tx_hash,
            status: 'confirmed',
          });

        if (txError) throw txError;

        const { data: position } = await supabase
          .from('user_positions')
          .select('*')
          .eq('user_id', user_id)
          .eq('asset_id', asset_id)
          .maybeSingle();

        if (position) {
          await supabase
            .from('user_positions')
            .update({
              supplied_amount: position.supplied_amount + amount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', position.id);
        } else {
          await supabase
            .from('user_positions')
            .insert({
              user_id,
              asset_id,
              supplied_amount: amount,
            });
        }

        break;
      }

      case 'index_borrow': {
        const { user_id, asset_id, amount, tx_hash } = payload;

        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id,
            asset_id,
            type: 'borrow',
            amount,
            tx_hash,
            status: 'confirmed',
          });

        if (txError) throw txError;

        const { data: position } = await supabase
          .from('user_positions')
          .select('*')
          .eq('user_id', user_id)
          .eq('asset_id', asset_id)
          .maybeSingle();

        if (position) {
          await supabase
            .from('user_positions')
            .update({
              borrowed_amount: position.borrowed_amount + amount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', position.id);
        } else {
          await supabase
            .from('user_positions')
            .insert({
              user_id,
              asset_id,
              borrowed_amount: amount,
            });
        }

        break;
      }

      case 'index_liquidation': {
        const { user_id, liquidator_id, collateral_asset_id, debt_asset_id, collateral_amount, debt_amount, penalty_amount, health_factor_before, tx_hash } = payload;

        await supabase
          .from('liquidations')
          .insert({
            user_id,
            liquidator_id,
            collateral_asset_id,
            debt_asset_id,
            collateral_amount,
            debt_amount,
            penalty_amount,
            health_factor_before,
            tx_hash,
          });

        await supabase
          .from('notifications')
          .insert({
            user_id,
            type: 'liquidation_warning',
            title: 'Position Liquidated',
            message: `Your position was liquidated. Collateral seized: ${collateral_amount}`,
            data: { tx_hash },
          });

        break;
      }

      case 'update_interest_rates': {
        const { asset_id, supply_apy, borrow_apy, utilization_rate } = payload;

        await supabase
          .from('assets')
          .update({
            supply_apy,
            borrow_apy,
            utilization_rate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', asset_id);

        await supabase
          .from('interest_rate_history')
          .insert({
            asset_id,
            supply_apy,
            borrow_apy,
            utilization_rate,
          });

        break;
      }

      case 'calculate_health_factor': {
        const { user_id } = payload;

        const { data: positions } = await supabase
          .from('user_positions')
          .select('*, asset:assets(*)')
          .eq('user_id', user_id);

        if (!positions) {
          throw new Error('No positions found');
        }

        let totalCollateralValue = 0;
        let totalDebtValue = 0;

        for (const position of positions) {
          const assetPrice = 1;
          totalCollateralValue += position.supplied_amount * assetPrice;
          totalDebtValue += position.borrowed_amount * assetPrice;
        }

        const healthFactor = totalDebtValue > 0 
          ? totalCollateralValue / totalDebtValue 
          : 999999;

        await supabase
          .from('users')
          .update({
            total_supplied: totalCollateralValue,
            total_borrowed: totalDebtValue,
            health_factor: healthFactor,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user_id);

        return new Response(
          JSON.stringify({ health_factor: healthFactor }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      default:
        throw new Error('Unknown action');
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
