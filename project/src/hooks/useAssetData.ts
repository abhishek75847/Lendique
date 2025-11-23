import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { useWallet } from '../contexts/WalletContext';
import { ASSETS } from '../config/contracts';
import { supabase } from '../lib/supabase';

interface AssetData {
  id: string;
  symbol: string;
  name: string;
  contract_address: string;
  decimals: number;
  supply_apy: number;
  borrow_apy: number;
  total_supplied: number;
  total_borrowed: number;
  utilization_rate: number;
  max_ltv: number;
  liquidation_threshold: number;
  liquidation_penalty: number;
  is_active: boolean;
  icon_url: string | null;
}

export function useAssetData() {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contracts = useContracts();
  const { isConnected } = useWallet();

  useEffect(() => {
    async function fetchAssetData() {
      try {
        setLoading(true);

        const { data: dbAssets, error: dbError } = await supabase
          .from('assets')
          .select('*')
          .eq('is_active', true)
          .order('symbol');

        if (dbError) throw dbError;
        if (!dbAssets || dbAssets.length === 0) {
          setAssets([]);
          setLoading(false);
          return;
        }

        if (!contracts || !isConnected) {
          console.log('⚠️ Using cached asset data (contracts not connected)');
          setAssets(dbAssets as AssetData[]);
          setLoading(false);
          return;
        }

        console.log('🔗 Fetching real-time data from blockchain contracts...');

        const enhancedAssets = await Promise.all(
          dbAssets.map(async (asset) => {
            try {
              const assetAddress = asset.contract_address;

              const [
                totalSupplied,
                totalBorrowed,
                supplyRate,
                borrowRate,
                utilizationRate,
              ] = await Promise.all([
                contracts.lendingPool.read.getTotalSupplied([assetAddress]),
                contracts.lendingPool.read.getTotalBorrowed([assetAddress]),
                contracts.interestRateModel.read.getSupplyRate([assetAddress]),
                contracts.interestRateModel.read.getBorrowRate([assetAddress]),
                contracts.interestRateModel.read.getUtilizationRate([assetAddress]),
              ]);

              const totalSuppliedNum = Number(ethers.formatUnits(totalSupplied, asset.decimals));
              const totalBorrowedNum = Number(ethers.formatUnits(totalBorrowed, asset.decimals));
              const supplyApyNum = Number(supplyRate) / 100;
              const borrowApyNum = Number(borrowRate) / 100;
              const utilizationRateNum = Number(utilizationRate) / 100;

              console.log(`✅ ${asset.symbol}: Supplied=${totalSuppliedNum.toFixed(2)}, Borrowed=${totalBorrowedNum.toFixed(2)}, Util=${utilizationRateNum.toFixed(2)}%, SupplyAPY=${supplyApyNum}%, BorrowAPY=${borrowApyNum}%`);

              await supabase
                .from('assets')
                .update({
                  supply_apy: supplyApyNum,
                  borrow_apy: borrowApyNum,
                  total_supplied: totalSuppliedNum,
                  total_borrowed: totalBorrowedNum,
                  utilization_rate: utilizationRateNum,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', asset.id);

              return {
                ...asset,
                supply_apy: supplyApyNum,
                borrow_apy: borrowApyNum,
                total_supplied: totalSuppliedNum,
                total_borrowed: totalBorrowedNum,
                utilization_rate: utilizationRateNum,
              } as AssetData;
            } catch (err: any) {
              console.error(`❌ Error fetching blockchain data for ${asset.symbol}:`, err.message);
              console.log(`   Using cached database values for ${asset.symbol}`);
              return asset as AssetData;
            }
          })
        );

        setAssets(enhancedAssets);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching asset data:', err);
        setError(err.message);

        const { data: fallbackAssets } = await supabase
          .from('assets')
          .select('*')
          .eq('is_active', true)
          .order('symbol');

        if (fallbackAssets) {
          setAssets(fallbackAssets as AssetData[]);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAssetData();

    const interval = setInterval(fetchAssetData, 30000);
    return () => clearInterval(interval);
  }, [contracts, isConnected]);

  return { assets, loading, error };
}
