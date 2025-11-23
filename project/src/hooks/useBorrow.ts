import { useState } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { useWallet } from '../contexts/WalletContext';
import { supabase } from '../lib/supabase';

interface BorrowResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function useBorrow() {
  const [loading, setLoading] = useState(false);
  const contracts = useContracts();
  const { address } = useWallet();

  const borrow = async (
    asset: string,
    amount: string,
    decimals: number = 18
  ): Promise<BorrowResult> => {
    if (!contracts || !address) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      console.log(`Borrowing ${amount} tokens...`);

      const amountWei = ethers.parseUnits(amount, decimals);

      const healthFactor = await contracts.collateralManager.read.calculateHealthFactor(
        address
      );

      const healthFactorDecimal = Number(healthFactor) / 10000;
      console.log('Current health factor:', healthFactorDecimal);

      if (healthFactorDecimal < 1.2) {
        return {
          success: false,
          error: `Health factor too low (${healthFactorDecimal.toFixed(2)}). Add more collateral.`,
        };
      }

      const tx = await contracts.lendingPool.write.borrow(asset, amountWei);
      console.log('Borrow transaction sent:', tx.hash);

      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        console.log('Borrow confirmed:', receipt.hash);

        await supabase.from('transactions').insert({
          tx_hash: receipt.hash,
          user_address: address,
          action: 'borrow',
          asset,
          amount,
          status: 'confirmed',
        });

        return { success: true, txHash: receipt.hash };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
    } catch (err: any) {
      console.error('Borrow error:', err);

      let errorMessage = 'Transaction failed';

      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'User rejected transaction';
      } else if (err.message) {
        errorMessage = err.message;
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { borrow, loading };
}
