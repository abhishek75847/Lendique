import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, ExternalLink, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types';

export const TransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*, asset:assets(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && !error) {
      setTransactions(data as any);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'supply' || type === 'repay') {
      return <ArrowUpCircle className="w-5 h-5 text-emerald-400" />;
    }
    return <ArrowDownCircle className="w-5 h-5 text-blue-400" />;
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 mt-4">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white">Transaction History</h2>
        <p className="text-slate-400 mt-2">Your recent lending activity</p>
      </div>

      {transactions.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          No transactions yet. Start by supplying or borrowing assets!
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-6 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {getTypeIcon(tx.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-white font-semibold">
                        {getTypeLabel(tx.type)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {tx.asset?.symbol[0]}
                        </div>
                        <span className="text-slate-400 text-sm">{tx.asset?.symbol}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-slate-400">
                      <span>{formatDate(tx.created_at)}</span>
                      {tx.tx_hash && (
                        <>
                          <span>•</span>
                          <a
                            href={`https://arbiscan.io/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 hover:text-blue-400 transition-colors"
                          >
                            <span>View on Explorer</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      {tx.amount.toLocaleString()} {tx.asset?.symbol}
                    </div>
                    {tx.gas_used > 0 && (
                      <div className="text-xs text-slate-400">
                        Gas: {tx.gas_used.toFixed(6)} ETH
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusIcon(tx.status)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
