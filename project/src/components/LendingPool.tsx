import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, Info, AlertCircle } from 'lucide-react';
import { Asset } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { supabase } from '../lib/supabase';
import { useSupply } from '../hooks/useSupply';
import { useBorrow } from '../hooks/useBorrow';
import { ASSETS } from '../config/contracts';

interface LendingPoolProps {
  assets: Asset[];
  mode: 'supply' | 'borrow';
  onRefresh: () => void;
}

export const LendingPool = ({ assets, mode, onRefresh }: LendingPoolProps) => {
  const { user } = useAuth();
  const { address, isConnected } = useWallet();
  const { supplyETH, supplyERC20, loading: supplyLoading } = useSupply();
  const { borrow, loading: borrowLoading } = useBorrow();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [amount, setAmount] = useState('');

  const loading = supplyLoading || borrowLoading;

  const handleTransaction = async () => {
    if (!selectedAsset || !amount || !user) return;

    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      let result;

      if (mode === 'supply') {
        if (selectedAsset.symbol === 'ETH') {
          result = await supplyETH(amount);
        } else {
          const tokenAddress = selectedAsset.contract_address;
          const decimals = selectedAsset.decimals || 18;
          result = await supplyERC20(tokenAddress, amount, decimals);
        }
      } else {
        const tokenAddress = selectedAsset.contract_address;
        const decimals = selectedAsset.decimals || 18;
        result = await borrow(tokenAddress, amount, decimals);
      }

      if (result.success) {
        alert(`Transaction successful! Tx: ${result.txHash?.substring(0, 10)}...`);
        setAmount('');
        setSelectedAsset(null);
        onRefresh();
      } else {
        alert(`Transaction failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Transaction failed:', error);
      alert(`Transaction failed: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            {mode === 'supply' ? (
              <>
                <ArrowUpCircle className="w-6 h-6 text-emerald-400" />
                <span>Supply Assets</span>
              </>
            ) : (
              <>
                <ArrowDownCircle className="w-6 h-6 text-blue-400" />
                <span>Borrow Assets</span>
              </>
            )}
          </h2>
          <p className="text-slate-400 mt-2">
            {mode === 'supply'
              ? 'Supply assets to earn interest and use as collateral'
              : 'Borrow assets against your collateral'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Asset</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-300">
                  {mode === 'supply' ? 'Supply APY' : 'Borrow APY'}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-300">Total {mode === 'supply' ? 'Supplied' : 'Borrowed'}</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-300">Utilization</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr
                  key={asset.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                        {asset.symbol[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{asset.symbol}</div>
                        <div className="text-sm text-slate-400">{asset.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-semibold text-emerald-400">
                      {mode === 'supply' ? asset.supply_apy.toFixed(2) : asset.borrow_apy.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-white">
                      {(mode === 'supply' ? asset.total_supplied : asset.total_borrowed).toLocaleString()} {asset.symbol}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                          style={{ width: `${Math.min(asset.utilization_rate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-400">{asset.utilization_rate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedAsset(asset)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/30"
                    >
                      {mode === 'supply' ? 'Supply' : 'Borrow'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-md">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">
                  {mode === 'supply' ? 'Supply' : 'Borrow'} {selectedAsset.symbol}
                </h3>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">APY</span>
                  <span className="text-emerald-400 font-semibold">
                    {mode === 'supply' ? selectedAsset.supply_apy.toFixed(2) : selectedAsset.borrow_apy.toFixed(2)}%
                  </span>
                </div>
                {mode === 'borrow' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Max LTV</span>
                      <span className="text-white font-semibold">{selectedAsset.max_ltv}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Liquidation Threshold</span>
                      <span className="text-white font-semibold">{selectedAsset.liquidation_threshold}%</span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                    step="0.01"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    {selectedAsset.symbol}
                  </div>
                </div>
              </div>

              {!isConnected && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3 flex items-start space-x-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-400">
                    Connect your wallet to perform transactions on the blockchain.
                  </p>
                </div>
              )}

              <button
                onClick={handleTransaction}
                disabled={loading || !amount || !isConnected}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg py-3 font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : !isConnected ? 'Connect Wallet First' : `${mode === 'supply' ? 'Supply' : 'Borrow'} ${selectedAsset.symbol}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
