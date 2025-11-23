import { useState, useEffect } from 'react';
import {
  TrendingUp, Wallet, CreditCard, AlertTriangle, Bell,
  LogOut, Menu, X, MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { supabase } from '../lib/supabase';
import { UserPosition, UserStats } from '../types';
import { LendingPool } from './LendingPool';
import { PortfolioOverview } from './PortfolioOverview';
import { TransactionHistory } from './TransactionHistory';
import { AIAssistant } from './AIAssistant';
import { NotificationPanel } from './NotificationPanel';
import { WalletDisplay } from './WalletDisplay';
import { useAssetData } from '../hooks/useAssetData';
import { useRiskScore } from '../hooks/useRiskScore';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isConnected } = useWallet();
  const { assets, loading: assetsLoading } = useAssetData();
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_supplied: 0,
    total_borrowed: 0,
    health_factor: 0,
    risk_score: 0,
    net_apy: 0,
  });

  const { riskScore } = useRiskScore(
    stats.health_factor,
    stats.total_borrowed,
    stats.total_supplied
  );

  const [activeTab, setActiveTab] = useState<'supply' | 'borrow' | 'portfolio' | 'transactions'>('supply');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user && isConnected) {
      loadUserData();
    }
  }, [user, isConnected]);

  useEffect(() => {
    if (riskScore) {
      setStats(prev => ({
        ...prev,
        risk_score: riskScore.score,
      }));
    }
  }, [riskScore]);

  const loadUserData = async () => {
    if (!user) return;

    const { data: positionsData } = await supabase
      .from('user_positions')
      .select('*, asset:assets(*)')
      .eq('user_id', user.id);

    if (positionsData) {
      setPositions(positionsData as any);

      let totalSupplied = 0;
      let totalBorrowed = 0;

      positionsData.forEach((pos: any) => {
        totalSupplied += pos.supplied_amount || 0;
        totalBorrowed += pos.borrowed_amount || 0;
      });

      const healthFactor = totalBorrowed > 0 ? (totalSupplied * 0.75) / totalBorrowed : Infinity;

      setStats({
        total_supplied: totalSupplied,
        total_borrowed: totalBorrowed,
        health_factor: isFinite(healthFactor) ? healthFactor : 0,
        risk_score: totalBorrowed > 0 ? Math.min((totalBorrowed / totalSupplied) * 100, 100) : 0,
        net_apy: 0,
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Lendique</span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => setActiveTab('supply')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'supply'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Supply
              </button>
              <button
                onClick={() => setActiveTab('borrow')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'borrow'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Borrow
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'portfolio'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'transactions'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                History
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex">
                <WalletDisplay />
              </div>
              <button
                onClick={() => setShowAI(!showAI)}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('supply');
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all text-left ${
                  activeTab === 'supply'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Supply
              </button>
              <button
                onClick={() => {
                  setActiveTab('borrow');
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all text-left ${
                  activeTab === 'borrow'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Borrow
              </button>
              <button
                onClick={() => {
                  setActiveTab('portfolio');
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all text-left ${
                  activeTab === 'portfolio'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => {
                  setActiveTab('transactions');
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all text-left ${
                  activeTab === 'transactions'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                History
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Total Supplied</span>
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              ${stats.total_supplied.toLocaleString()}
            </div>
            <div className="text-sm text-emerald-400">+12.5% this month</div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Total Borrowed</span>
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              ${stats.total_borrowed.toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">Safe borrowing</div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Health Factor</span>
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.health_factor > 0 ? stats.health_factor.toFixed(2) : '∞'}
            </div>
            <div className={`text-sm ${stats.health_factor > 1.5 ? 'text-emerald-400' : stats.health_factor > 1 ? 'text-yellow-400' : 'text-red-400'}`}>
              {stats.health_factor > 1.5 ? 'Healthy' : stats.health_factor > 1 ? 'Moderate Risk' : 'At Risk'}
            </div>
          </div>
        </div>

        {activeTab === 'supply' && <LendingPool assets={assets} mode="supply" onRefresh={loadUserData} />}
        {activeTab === 'borrow' && <LendingPool assets={assets} mode="borrow" onRefresh={loadUserData} />}
        {activeTab === 'portfolio' && <PortfolioOverview positions={positions} stats={stats} />}
        {activeTab === 'transactions' && <TransactionHistory />}
      </div>

      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
      {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
    </div>
  );
};
