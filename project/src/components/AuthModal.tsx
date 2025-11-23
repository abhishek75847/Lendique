import { useState } from 'react';
import { X, Mail, Lock, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { WalletConnectModal } from './WalletConnectModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { signIn, signUp } = useAuth();
  const { address, isConnected } = useWallet();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!walletAddress) {
          setError('Wallet address is required');
          setLoading(false);
          return;
        }
        await signUp(email, password, walletAddress);
      } else {
        await signIn(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Lendique</h2>
          </div>
          <p className="text-slate-400 mb-8">
            {isSignUp ? 'Create your account to start lending' : 'Welcome back to Lendique'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Wallet Address
                </label>
                {isConnected && address ? (
                  <div className="flex items-center space-x-2 p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-lg">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-emerald-400 font-mono text-sm">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowWalletModal(true)}
                    className="w-full flex items-center justify-center space-x-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white font-medium"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isSignUp && !address)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg py-3 font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-slate-400">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowWalletModal(true)}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg py-3 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="w-5 h-5" />
              <span>Connect Wallet Only</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>

      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnected={(addr) => {
          setWalletAddress(addr);
          setShowWalletModal(false);
        }}
      />
    </div>
  );
};
