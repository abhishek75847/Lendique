import { X, Wallet, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (address: string) => void;
}

export const WalletConnectModal = ({ isOpen, onClose, onConnected }: WalletConnectModalProps) => {
  const { connectWallet, isConnecting, address } = useWallet();
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      setError('');
      await connectWallet();
      if (address && onConnected) {
        onConnected(address);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-md">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Connect Wallet</h3>
            <p className="text-sm text-slate-400 mt-1">
              Choose your preferred wallet to connect
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!window.ethereum ? (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium mb-1">Wallet Not Detected</p>
                <p className="text-sm text-yellow-400/80">
                  Please install MetaMask or another Web3 wallet to continue.
                </p>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 px-4 py-2 bg-yellow-500 text-slate-900 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
                >
                  Install MetaMask
                </a>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full flex items-center space-x-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                    {isConnecting ? 'Connecting...' : 'MetaMask'}
                  </div>
                  <div className="text-sm text-slate-400">
                    Connect with MetaMask wallet
                  </div>
                </div>
                <div className="text-slate-400 group-hover:text-white transition-colors">
                  →
                </div>
              </button>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full flex items-center space-x-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                    Browser Wallet
                  </div>
                  <div className="text-sm text-slate-400">
                    Connect with injected wallet
                  </div>
                </div>
                <div className="text-slate-400 group-hover:text-white transition-colors">
                  →
                </div>
              </button>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
                  Ensure you're connected to Arbitrum Sepolia network.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
