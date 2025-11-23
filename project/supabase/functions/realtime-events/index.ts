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

    const { event_type, data } = await req.json();

    switch (event_type) {
      case 'price_update': {
        const { asset_id, new_price } = data;

        const { data: asset, error } = await supabase
          .from('assets')
          .select('*')
          .eq('id', asset_id)
          .single();

        if (error) throw error;

        const { data: positions } = await supabase
          .from('user_positions')
          .select('*, user:users(id)')
          .eq('asset_id', asset_id)
          .gt('borrowed_amount', 0);

        if (positions) {
          for (const position of positions) {
            const healthFactor = position.supplied_amount / (position.borrowed_amount || 1);

            if (healthFactor < 1.3) {
              await supabase
                .from('notifications')
                .insert({
                  user_id: position.user_id,
                  type: 'liquidation_warning',
                  title: 'Price Alert: Liquidation Risk',
                  message: `Price change detected for ${asset.symbol}. Your health factor is ${healthFactor.toFixed(2)}`,
                  data: { asset_id, new_price, health_factor: healthFactor },
                });
            }
          }
        }

        break;
      }

      case 'apy_update': {
        const { asset_id, supply_apy, borrow_apy } = data;

        await supabase
          .from('assets')
          .update({
            supply_apy,
            borrow_apy,
            updated_at: new Date().toISOString(),
          })
          .eq('id', asset_id);

        const { data: positions } = await supabase
          .from('user_positions')
          .select('user_id')
          .eq('asset_id', asset_id)
          .gt('supplied_amount', 0);

        if (positions && positions.length > 0) {
          const uniqueUserIds = [...new Set(positions.map(p => p.user_id))];

          for (const user_id of uniqueUserIds) {
            await supabase
              .from('notifications')
              .insert({
                user_id,
                type: 'rate_change',
                title: 'Interest Rate Update',
                message: `Supply APY is now ${supply_apy}% and Borrow APY is ${borrow_apy}%`,
                data: { asset_id, supply_apy, borrow_apy },
              });
          }
        }

        break;
      }

      case 'transaction_confirmed': {
        const { tx_hash, user_id, status } = data;

        await supabase
          .from('transactions')
          .update({ status })
          .eq('tx_hash', tx_hash);

        await supabase
          .from('notifications')
          .insert({
            user_id,
            type: 'transaction_complete',
            title: 'Transaction Confirmed',
            message: `Your transaction has been confirmed on the blockchain`,
            data: { tx_hash, status },
          });

        break;
      }

      case 'health_factor_update': {
        const { user_id, health_factor } = data;

        await supabase
          .from('users')
          .update({
            health_factor,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user_id);

        if (health_factor < 1.2) {
          await supabase
            .from('notifications')
            .insert({
              user_id,
              type: 'liquidation_warning',
              title: 'Critical: Low Health Factor',
              message: `Your health factor is ${health_factor.toFixed(2)}. Add collateral or repay debt to avoid liquidation.`,
              data: { health_factor },
            });
        }

        break;
      }

      case 'broadcast_system_message': {
        const { title, message, severity } = data;

        const { data: users } = await supabase
          .from('users')
          .select('id');

        if (users) {
          const notifications = users.map(user => ({
            user_id: user.id,
            type: 'system_message',
            title,
            message,
            data: { severity },
          }));

          await supabase
            .from('notifications')
            .insert(notifications);
        }

        break;
      }

      default:
        throw new Error('Unknown event type');
    }

    return new Response(
      JSON.stringify({ success: true, event_processed: event_type }),
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
