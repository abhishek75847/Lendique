import { TrendingUp, Shield, Zap, Bot, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Lendique</span>
            </div>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/50"
            >
              Launch App
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            AI-Powered DeFi Lending
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              On Arbitrum L3
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Experience the future of decentralized lending with AI-optimized rates,
            predictive risk management, and lightning-fast transactions on our custom Layer 3.
          </p>
          <button
            onClick={onGetStarted}
            className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-2xl shadow-blue-500/50 flex items-center mx-auto space-x-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI Risk Engine</h3>
            <p className="text-slate-300 leading-relaxed">
              Advanced machine learning models predict liquidation risks and optimize your portfolio in real-time.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">L3 Speed</h3>
            <p className="text-slate-300 leading-relaxed">
              Sub-second finality and ultra-low gas fees on our custom Arbitrum Orbit Layer 3 chain.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Battle Tested</h3>
            <p className="text-slate-300 leading-relaxed">
              Rust-based smart contracts with formal verification and comprehensive security audits.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Optimized APY</h3>
            <p className="text-slate-300 leading-relaxed">
              AI-driven interest rate models maximize returns for lenders and minimize costs for borrowers.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Join the Future of Lending
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Supply assets, earn interest, or borrow against your collateral with the power of AI optimization.
          </p>
          <div className="flex items-center justify-center space-x-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">$2.4B+</div>
              <div className="text-slate-400">Total Value Locked</div>
            </div>
            <div className="w-px h-16 bg-white/20"></div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">150K+</div>
              <div className="text-slate-400">Active Users</div>
            </div>
            <div className="w-px h-16 bg-white/20"></div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-slate-400">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
