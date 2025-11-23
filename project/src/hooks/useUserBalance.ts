import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { useWallet } from '../contexts/WalletContext';

export function useUserBalance(asset: string) {
  const [supplyBalance, setSupplyBalance] = useState<string>('0');
  const [borrowBalance, setBorrowBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contracts = useContracts();
  const { address } = useWallet();

  useEffect(() => {
    async function fetchBalances() {
      if (!contracts || !address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [supplied, borrowed] = await Promise.all([
          contracts.lendingPool.read.getUserSupplyBalance(address, asset),
          contracts.lendingPool.read.getUserBorrowBalance(address, asset),
        ]);

        setSupplyBalance(ethers.formatEther(supplied));
        setBorrowBalance(ethers.formatEther(borrowed));
        setError(null);
      } catch (err: any) {
        console.error('Error fetching balances:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBalances();

    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [contracts, address, asset]);

  return { supplyBalance, borrowBalance, loading, error };
}
