import { useState, useEffect } from 'react';
import { useContracts } from './useContracts';
import { useWallet } from '../contexts/WalletContext';

export function useHealthFactor() {
  const [healthFactor, setHealthFactor] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contracts = useContracts();
  const { address } = useWallet();

  useEffect(() => {
    async function fetchHealthFactor() {
      if (!contracts || !address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const hf = await contracts.collateralManager.read.calculateHealthFactor(
          address
        );

        const healthFactorDecimal = Number(hf) / 10000;
        setHealthFactor(healthFactorDecimal);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching health factor:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHealthFactor();

    const interval = setInterval(fetchHealthFactor, 10000);
    return () => clearInterval(interval);
  }, [contracts, address]);

  return { healthFactor, loading, error };
}
