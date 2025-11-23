import { Wallet, TrendingUp, AlertCircle, PieChart, Brain } from 'lucide-react';
import { UserPosition, UserStats } from '../types';
import { useRiskScore } from '../hooks/useRiskScore';

interface PortfolioOverviewProps {
  positions: UserPosition[];
  stats: UserStats;
}

export const PortfolioOverview = ({ positions, stats }: PortfolioOverviewProps) => {
  const supplyPositions = positions.filter(p => p.supplied_amount > 0);
  const borrowPositions = positions.filter(p => p.borrowed_amount > 0);

  const { riskScore } = useRiskScore(
    stats.health_factor,
    stats.total_borrowed,
    stats.total_supplied
  );

  const getHealthColor = (health: number) => {
    if (health > 1.5) return 'text-emerald-400';
    if (health > 1) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthStatus = (health: number) => {
    if (health > 1.5) return 'Healthy';
    if (health > 1) return 'Moderate Risk';
    return 'At Risk';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Portfolio Balance</h3>
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            ${(stats.total_supplied - stats.total_borrowed).toLocaleString()}
          </div>
          <div className="text-sm text-slate-400">Net Position</div>
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Supplied</span>
              <span className="text-emerald-400 font-medium">${stats.total_supplied.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Borrowed</span>
              <span className="text-blue-400 font-medium">${stats.total_borrowed.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Health Factor</h3>
            <AlertCircle className={`w-5 h-5 ${getHealthColor(stats.health_factor)}`} />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getHealthColor(stats.health_factor)}`}>
            {stats.health_factor > 0 ? stats.health_factor.toFixed(2) : '∞'}
          </div>
          <div className={`text-sm ${getHealthColor(stats.health_factor)}`}>
            {getHealthStatus(stats.health_factor)}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  stats.health_factor > 1.5
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                    : stats.health_factor > 1
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${Math.min((stats.health_factor / 2) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">AI Risk Score</h3>
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {riskScore ? riskScore.score.toFixed(1) : stats.risk_score.toFixed(1)}/100
          </div>
          <div className="text-sm text-slate-400">
            {riskScore?.level === 'critical' && '🔴 Critical Risk'}
            {riskScore?.level === 'high' && '🟠 High Risk'}
            {riskScore?.level === 'medium' && '🟡 Moderate Risk'}
            {riskScore?.level === 'low' && '🟢 Low Risk'}
            {!riskScore && 'AI Risk Assessment'}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500"
                style={{ width: `${riskScore?.score || stats.risk_score}%` }}
              ></div>
            </div>
            {riskScore && (
              <div className="mt-3 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Liquidation Risk:</span>
                  <span className="font-medium">{(riskScore.liquidation_probability * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Estimate:</span>
                  <span className="font-medium">{riskScore.time_to_liquidation_estimate}</span>
                </div>
                <div className="mt-2 p-2 bg-white/5 rounded text-xs">
                  <span className="text-blue-400">💡 </span>
                  {riskScore.recommended_action}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span>Supply Positions</span>
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {supplyPositions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No supply positions yet
              </div>
            ) : (
              supplyPositions.map((position) => (
                <div key={position.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                        {position.asset?.symbol[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{position.asset?.symbol}</div>
                        <div className="text-sm text-slate-400">{position.asset?.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">
                        {position.supplied_amount.toLocaleString()} {position.asset?.symbol}
                      </div>
                      <div className="text-sm text-emerald-400">
                        APY: {position.asset?.supply_apy.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  {position.collateral_amount > 0 && (
                    <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-white/10">
                      <span className="text-slate-400">Used as Collateral</span>
                      <span className="text-blue-400 font-medium">
                        {position.collateral_amount.toLocaleString()} {position.asset?.symbol}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span>Borrow Positions</span>
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {borrowPositions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No borrow positions yet
              </div>
            ) : (
              borrowPositions.map((position) => (
                <div key={position.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                        {position.asset?.symbol[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{position.asset?.symbol}</div>
                        <div className="text-sm text-slate-400">{position.asset?.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">
                        {position.borrowed_amount.toLocaleString()} {position.asset?.symbol}
                      </div>
                      <div className="text-sm text-blue-400">
                        APY: {position.asset?.borrow_apy.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  {position.interest_accrued > 0 && (
                    <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-white/10">
                      <span className="text-slate-400">Interest Accrued</span>
                      <span className="text-yellow-400 font-medium">
                        {position.interest_accrued.toLocaleString()} {position.asset?.symbol}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
