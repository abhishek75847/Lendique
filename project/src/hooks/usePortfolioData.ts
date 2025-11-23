import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { useWallet } from '../contexts/WalletContext';
import { ASSETS } from '../config/contracts';

interface PortfolioData {
  totalSupplied: number;
  totalBorrowed: number;
  healthFactor: number;
  positions: {
    asset: string;
    supplied: string;
    borrowed: string;
    supplyAPY: number;
    borrowAPY: number;
  }[];
}

export function usePortfolioData() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contracts = useContracts();
  const { address, isConnected } = useWallet();

  useEffect(() => {
    async function fetchPortfolioData() {
      if (!contracts || !address || !isConnected) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const positions = [];
        let totalSuppliedValue = 0;
        let totalBorrowedValue = 0;

        for (const [assetName, assetAddress] of Object.entries(ASSETS)) {
          const [supplied, borrowed, supplyRate, borrowRate] = await Promise.all([
            contracts.lendingPool.read.getUserSupplyBalance(address, assetAddress),
            contracts.lendingPool.read.getUserBorrowBalance(address, assetAddress),
            contracts.interestRateModel.read.getSupplyRate(assetAddress),
            contracts.interestRateModel.read.getBorrowRate(assetAddress),
          ]);

          const suppliedAmount = Number(ethers.formatEther(supplied));
          const borrowedAmount = Number(ethers.formatEther(borrowed));

          if (suppliedAmount > 0 || borrowedAmount > 0) {
            positions.push({
              asset: assetName,
              supplied: suppliedAmount.toFixed(4),
              borrowed: borrowedAmount.toFixed(4),
              supplyAPY: Number(supplyRate) / 100,
              borrowAPY: Number(borrowRate) / 100,
            });

            totalSuppliedValue += suppliedAmount;
            totalBorrowedValue += borrowedAmount;
          }
        }

        const healthFactor = await contracts.collateralManager.read.calculateHealthFactor(
          address
        );

        setData({
          totalSupplied: totalSuppliedValue,
          totalBorrowed: totalBorrowedValue,
          healthFactor: Number(healthFactor) / 10000,
          positions,
        });

        setError(null);
      } catch (err: any) {
        console.error('Error fetching portfolio data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPortfolioData();

    const interval = setInterval(fetchPortfolioData, 15000);
    return () => clearInterval(interval);
  }, [contracts, address, isConnected]);

  return { data, loading, error };
}
