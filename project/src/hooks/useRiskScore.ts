import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface RiskScore {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  liquidation_probability: number;
  recommended_action: string;
  time_to_liquidation_estimate: string;
  confidence_score: number;
}

export function useRiskScore(healthFactor: number, totalBorrowed: number, totalSupplied: number) {
  const { user } = useAuth();
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function calculateRiskScore() {
      if (!user || totalBorrowed === 0) {
        setRiskScore({
          score: 0,
          level: 'low',
          liquidation_probability: 0,
          recommended_action: 'No active borrows - position is safe',
          time_to_liquidation_estimate: 'N/A',
          confidence_score: 1.0,
        });
        return;
      }

      setLoading(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const volatility = 0.2;

        const response = await fetch(`${supabaseUrl}/functions/v1/ai-predictions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            prediction_type: 'liquidation_risk',
            user_id: user.id,
            input_data: {
              health_factor: healthFactor,
              volatility: volatility,
              total_borrowed: totalBorrowed,
              total_supplied: totalSupplied,
              ltv: totalSupplied > 0 ? (totalBorrowed / totalSupplied) * 100 : 0,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI risk prediction');
        }

        const data = await response.json();

        if (data.success && data.prediction) {
          const pred = data.prediction;

          let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
          if (pred.risk_score > 80) level = 'critical';
          else if (pred.risk_score > 60) level = 'high';
          else if (pred.risk_score > 30) level = 'medium';

          setRiskScore({
            score: pred.risk_score,
            level,
            liquidation_probability: pred.liquidation_probability || 0,
            recommended_action: pred.recommended_action || 'Position is healthy',
            time_to_liquidation_estimate: pred.time_to_liquidation_estimate || '> 1 week',
            confidence_score: data.confidence_score || 0.85,
          });
        } else {
          throw new Error('Invalid AI response');
        }

        setError(null);
      } catch (err: any) {
        console.error('Error calculating risk score:', err);
        setError(err.message);

        const fallbackScore = calculateFallbackRiskScore(healthFactor, totalBorrowed, totalSupplied);
        setRiskScore(fallbackScore);
      } finally {
        setLoading(false);
      }
    }

    calculateRiskScore();

    const interval = setInterval(calculateRiskScore, 60000);
    return () => clearInterval(interval);
  }, [user, healthFactor, totalBorrowed, totalSupplied]);

  return { riskScore, loading, error };
}

function calculateFallbackRiskScore(
  healthFactor: number,
  totalBorrowed: number,
  totalSupplied: number
): RiskScore {
  let score = 0;
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let recommendedAction = 'Position is healthy';
  let timeEstimate = '> 1 week';

  if (totalBorrowed === 0) {
    return {
      score: 0,
      level: 'low',
      liquidation_probability: 0,
      recommended_action: 'No active borrows - position is safe',
      time_to_liquidation_estimate: 'N/A',
      confidence_score: 1.0,
    };
  }

  if (healthFactor < 1.0) {
    score = 100;
    level = 'critical';
    recommendedAction = 'URGENT: Add collateral or repay debt immediately';
    timeEstimate = '< 1 hour';
  } else if (healthFactor < 1.2) {
    score = 85;
    level = 'critical';
    recommendedAction = 'Add collateral immediately to avoid liquidation';
    timeEstimate = '< 24 hours';
  } else if (healthFactor < 1.5) {
    score = 60;
    level = 'high';
    recommendedAction = 'Monitor position closely and consider adding collateral';
    timeEstimate = '1-3 days';
  } else if (healthFactor < 2.0) {
    score = 35;
    level = 'medium';
    recommendedAction = 'Position is safe but watch for market volatility';
    timeEstimate = '> 1 week';
  } else {
    score = 15;
    level = 'low';
    recommendedAction = 'Position is healthy with good safety margin';
    timeEstimate = '> 1 month';
  }

  const ltv = totalSupplied > 0 ? (totalBorrowed / totalSupplied) * 100 : 0;
  if (ltv > 70) {
    score = Math.min(100, score + 10);
  }

  const liquidationProbability = score / 100;

  return {
    score,
    level,
    liquidation_probability: liquidationProbability,
    recommended_action: recommendedAction,
    time_to_liquidation_estimate: timeEstimate,
    confidence_score: 0.75,
  };
}
