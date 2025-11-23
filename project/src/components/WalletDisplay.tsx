import { Wallet, LogOut, AlertCircle, Check } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export const WalletDisplay = () => {
  const { address, chainId, disconnectWallet, switchNetwork, connectWallet, isConnecting } = useWallet();

  const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

  const isCorrectNetwork = chainId === ARBITRUM_SEPOLIA_CHAIN_ID;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = (id: number | null) => {
    switch (id) {
      case 1:
        return 'Ethereum';
      case 42161:
        return 'Arbitrum One';
      case 421614:
        return 'Arbitrum Sepolia';
      default:
        return 'Unknown Network';
    }
  };

  if (!address) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50"
      >
        <Wallet className="w-4 h-4" />
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {!isCorrectNetwork && (
        <button
          onClick={() => switchNetwork(ARBITRUM_SEPOLIA_CHAIN_ID)}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/50 rounded-lg transition-all"
        >
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-medium text-sm">Switch Network</span>
        </button>
      )}

      <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
        <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-emerald-400' : 'bg-yellow-400'}`}></div>
        <span className="text-slate-300 text-sm font-medium">
          {getNetworkName(chainId)}
        </span>
      </div>

      <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
        <Wallet className="w-4 h-4 text-blue-400" />
        <span className="text-white font-mono text-sm">{formatAddress(address)}</span>
      </div>

      <button
        onClick={disconnectWallet}
        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        title="Disconnect Wallet"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};
