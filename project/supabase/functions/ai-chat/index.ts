import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

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
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, user_id, context } = await req.json();

    if (!message || !user_id) {
      throw new Error('Missing required parameters');
    }

    if (!openaiKey) {
      const fallbackResponse = generateIntelligentResponse(message, context);

      await supabase.from('ai_predictions').insert({
        user_id,
        prediction_type: 'portfolio_advice',
        input_data: { query: message, context },
        output_data: { response: fallbackResponse },
        confidence_score: 0.85,
        model_version: 'rule-based-v1',
      });

      return new Response(
        JSON.stringify({
          success: true,
          response: fallbackResponse,
          model: 'rule-based-fallback',
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const systemPrompt = buildSystemPrompt(context);
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ];

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    await supabase.from('ai_predictions').insert({
      user_id,
      prediction_type: 'portfolio_advice',
      input_data: { query: message, context },
      output_data: { response: aiResponse },
      confidence_score: 0.92,
      model_version: 'gpt-4-turbo-preview',
    });

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        model: 'gpt-4-turbo-preview',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('AI chat error:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
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

function buildSystemPrompt(context: any): string {
  const { user_stats, positions } = context || {};

  let prompt = `You are an expert DeFi lending assistant for Lendique, a decentralized lending platform on Arbitrum.

Your role is to:
1. Help users understand their portfolio health and risk
2. Provide actionable advice on lending, borrowing, and collateral management
3. Explain DeFi concepts in simple terms
4. Alert users to potential liquidation risks
5. Suggest optimization strategies

User Context:`;

  if (user_stats) {
    prompt += `
- Total Supplied: $${user_stats.total_supplied?.toLocaleString() || 0}
- Total Borrowed: $${user_stats.total_borrowed?.toLocaleString() || 0}
- Health Factor: ${user_stats.health_factor?.toFixed(2) || 'N/A'}
- Risk Score: ${user_stats.risk_score?.toFixed(1) || 0}/100`;
  }

  if (positions && positions.length > 0) {
    prompt += `\n\nActive Positions:`;
    positions.forEach((pos: any) => {
      prompt += `\n- ${pos.asset?.symbol}: Supplied ${pos.supplied_amount}, Borrowed ${pos.borrowed_amount}`;
    });
  }

  prompt += `\n\nGuidelines:
- Keep responses concise and actionable (2-3 short paragraphs max)
- Use bullet points for recommendations
- Alert if health factor < 1.5
- Mention specific numbers from user's portfolio
- Be encouraging but realistic about risks
- Use simple language, avoid jargon`;

  return prompt;
}

function generateIntelligentResponse(query: string, context: any): string {
  const lowerQuery = query.toLowerCase();
  const { user_stats, positions } = context || {};

  const healthFactor = user_stats?.health_factor || 0;
  const totalSupplied = user_stats?.total_supplied || 0;
  const totalBorrowed = user_stats?.total_borrowed || 0;
  const riskScore = user_stats?.risk_score || 0;

  if (lowerQuery.includes('risk') || lowerQuery.includes('health') || lowerQuery.includes('safe')) {
    if (healthFactor === 0 || !isFinite(healthFactor)) {
      return `Your health factor is infinite, meaning you have no active borrows. This is the safest position possible! You can:

• Start borrowing up to 75% of your supplied value
• Use borrowed funds for yield farming or liquidity provision
• Always maintain health factor above 1.5 when borrowing

Would you like guidance on safe borrowing strategies?`;
    }

    if (healthFactor < 1.2) {
      return `⚠️ URGENT: Your health factor is ${healthFactor.toFixed(2)} - critically low!

You're at high risk of liquidation. Take action immediately:

1. Add more collateral (supply more assets)
2. Repay some of your borrowed amount
3. Target health factor > 1.5 for safety

Current position:
• Supplied: $${totalSupplied.toLocaleString()}
• Borrowed: $${totalBorrowed.toLocaleString()}
• Risk Score: ${riskScore.toFixed(0)}/100 (High)

Need help deciding what to do?`;
    }

    if (healthFactor < 1.5) {
      return `Your health factor is ${healthFactor.toFixed(2)} - moderate risk zone.

Recommendations:
• Add collateral to reach health factor > 1.5
• Avoid borrowing more without adding collateral first
• Monitor daily as price fluctuations can push you toward liquidation

Current stats:
• Supplied: $${totalSupplied.toLocaleString()}
• Borrowed: $${totalBorrowed.toLocaleString()}
• Maximum safe borrow: $${(totalSupplied * 0.75).toLocaleString()}

Want specific suggestions for your positions?`;
    }

    return `Your health factor is ${healthFactor.toFixed(2)} - excellent! Your position is healthy.

Current status:
• Supplied: $${totalSupplied.toLocaleString()}
• Borrowed: $${totalBorrowed.toLocaleString()}
• Risk Score: ${riskScore.toFixed(0)}/100 (Low)

You can safely:
• Borrow up to $${((totalSupplied * 0.75) - totalBorrowed).toLocaleString()} more
• Use leverage for yield strategies
• Maintain health factor > 1.5 as buffer

Looking to optimize your returns?`;
  }

  if (lowerQuery.includes('apy') || lowerQuery.includes('return') || lowerQuery.includes('earn') || lowerQuery.includes('yield')) {
    return `Current best yields on Lendique:

Supply APY (earn by lending):
• Stablecoins (USDC, DAI): 5-6% APY
• ETH: 3-4% APY
• Volatile assets: 6-8% APY

Optimization strategy:
1. Supply stablecoins for stable 5%+ returns
2. Use supplied assets as collateral
3. Borrow stablecoins at 6-7% APY
4. Re-supply or deploy to higher yield protocols
5. Net yield: 2-3% after borrow costs

Your current supplied: $${totalSupplied.toLocaleString()}
Potential optimization: +$${(totalSupplied * 0.03).toLocaleString()}/year

Want a personalized yield strategy?`;
  }

  if (lowerQuery.includes('borrow') || lowerQuery.includes('loan')) {
    const maxBorrow = totalSupplied * 0.75;
    const availableToBorrow = maxBorrow - totalBorrowed;

    return `Borrowing on Lendique:

Your current capacity:
• Total supplied: $${totalSupplied.toLocaleString()}
• Already borrowed: $${totalBorrowed.toLocaleString()}
• Available to borrow: $${availableToBorrow.toLocaleString()}
• Max safe borrow: $${maxBorrow.toLocaleString()} (75% LTV)

Borrow rates:
• ETH: 4-5% APY
• Stablecoins: 6-7% APY

Important:
• Keep health factor > 1.5 when borrowing
• Consider borrowing costs vs. your use case
• Monitor collateral value changes

What asset are you thinking of borrowing?`;
  }

  if (lowerQuery.includes('liquidation') || lowerQuery.includes('liquidate')) {
    return `Liquidation explained:

Liquidation happens when health factor drops below 1.0. This occurs when:
• Collateral value decreases (market crash)
• Borrowed asset value increases
• You borrow too much against your collateral

Protection strategies:
1. Maintain health factor > 1.5 (safety buffer)
2. Use stablecoin collateral for lower volatility
3. Set price alerts for your collateral assets
4. Keep funds ready to add collateral quickly

Your current health factor: ${healthFactor > 0 ? healthFactor.toFixed(2) : '∞'}
Status: ${healthFactor < 1.5 ? '⚠️ Add more collateral' : '✅ Safe'}

Lendique charges 5% liquidation penalty, so prevention is key!`;
  }

  if (lowerQuery.includes('strategy') || lowerQuery.includes('optimize') || lowerQuery.includes('improve')) {
    const hasPositions = positions && positions.length > 0;

    return `Optimal DeFi lending strategy for you:

${hasPositions ? '1. Diversify your supply:' : '1. Start by supplying:'}
${hasPositions ?
  `   • You have ${positions.length} position(s) - consider adding ${positions.length < 3 ? 'more assets' : 'to rebalance'}` :
  '   • 60% stablecoins (USDC, DAI) for stable yields\n   • 40% ETH/volatile for higher APY potential'
}

2. Use collateral wisely:
   • Supply $${totalSupplied > 0 ? totalSupplied.toLocaleString() : '1,000+'}
   • Borrow 50-60% of supply value
   • Maintain health factor > 1.8

3. Yield optimization:
   • Borrow stablecoins at 6-7%
   • Re-supply or use in higher yield protocols (8-12%)
   • Net yield: 2-4% leveraged returns

4. Risk management:
   • Check portfolio daily
   • Rebalance if health factor < 1.5
   • Keep emergency funds for collateral adds

Want help implementing this strategy?`;
  }

  if (lowerQuery.includes('supply') || lowerQuery.includes('deposit') || lowerQuery.includes('lend')) {
    return `Supplying assets on Lendique:

How it works:
1. Connect wallet and supply any supported asset
2. Start earning interest immediately
3. Use supplied assets as collateral to borrow
4. Withdraw anytime (unless used as collateral)

Best assets to supply:
• USDC/DAI: 5-6% APY, low volatility, high liquidity
• ETH: 3-4% APY, most accepted collateral
• Volatile assets: 6-8% APY, higher risk/reward

Your current: $${totalSupplied.toLocaleString()} supplied
${totalSupplied === 0 ? '\nStart with $100-1,000 to test the platform!' : '\nConsider diversifying across 3-4 different assets'}

Ready to supply more?`;
  }

  return `I can help you with:

📊 Portfolio Analysis:
• Review your current positions
• Calculate health factor and risks
• Optimize yield strategies

💰 Lending & Borrowing:
• Best assets to supply for your goals
• Safe borrowing limits
• Interest rate comparisons

⚠️ Risk Management:
• Liquidation prevention
• Collateral recommendations
• Market condition updates

Your current stats:
• Supplied: $${totalSupplied.toLocaleString()}
• Borrowed: $${totalBorrowed.toLocaleString()}
• Health Factor: ${healthFactor > 0 ? healthFactor.toFixed(2) : '∞'}

What would you like to know more about?`;
}
