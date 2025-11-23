import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

const LENDIQUE_L3_CHAIN_ID = 421614;
const LENDIQUE_L3_RPC = 'https://sepolia-rollup.arbitrum.io/rpc';

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      checkConnection();

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const checkConnection = async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      if (accounts.length > 0) {
        setAddress(accounts[0]);

        const chainIdHex = await window.ethereum.request({
          method: 'eth_chainId',
        });
        setChainId(parseInt(chainIdHex, 16));

        const browserProvider = new BrowserProvider(window.ethereum);
        const signer = await browserProvider.getSigner();
        setSigner(signer);
        setProvider(browserProvider);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      setAddress(accounts[0]);

      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId',
      });
      const currentChainId = parseInt(chainIdHex, 16);
      setChainId(currentChainId);

      const browserProvider = new BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      setSigner(signer);
      setProvider(browserProvider);

      if (currentChainId !== LENDIQUE_L3_CHAIN_ID) {
        await switchNetwork(LENDIQUE_L3_CHAIN_ID);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setChainId(null);
    setSigner(null);
    setProvider(null);
  };

  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${LENDIQUE_L3_CHAIN_ID.toString(16)}`,
                chainName: 'Arbitrum Sepolia',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [LENDIQUE_L3_RPC],
                blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          throw addError;
        }
      } else {
        console.error('Error switching network:', error);
        throw error;
      }
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnecting,
        isConnected: !!address,
        signer,
        provider,
        connectWallet,
        disconnectWallet,
        switchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
