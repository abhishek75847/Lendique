import { useState } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { useWallet } from '../contexts/WalletContext';
import { ASSETS } from '../config/contracts';
import { supabase } from '../lib/supabase';

interface SupplyResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function useSupply() {
  const [loading, setLoading] = useState(false);
  const contracts = useContracts();
  const { address } = useWallet();

  const supplyETH = async (amount: string): Promise<SupplyResult> => {
    if (!contracts || !address) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      console.log(`Supplying ${amount} ETH...`);

      const amountWei = ethers.parseEther(amount);

      const gasEstimate = await contracts.lendingPool.write.supply.estimateGas(
        ASSETS.ETH,
        amountWei,
        { value: amountWei }
      );

      const gasLimit = (gasEstimate * 120n) / 100n;

      const tx = await contracts.lendingPool.write.supply(
        ASSETS.ETH,
        amountWei,
        {
          value: amountWei,
          gasLimit,
        }
      );

      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        console.log('Transaction confirmed:', receipt.hash);

        await supabase.from('transactions').insert({
          tx_hash: receipt.hash,
          user_address: address,
          action: 'supply',
          asset: ASSETS.ETH,
          amount,
          status: 'confirmed',
        });

        return { success: true, txHash: receipt.hash };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
    } catch (err: any) {
      console.error('Supply error:', err);

      let errorMessage = 'Transaction failed';

      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'User rejected transaction';
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.message) {
        errorMessage = err.message;
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const supplyERC20 = async (
    tokenAddress: string,
    amount: string,
    decimals: number = 6
  ): Promise<SupplyResult> => {
    if (!contracts || !address) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      console.log(`Supplying ${amount} tokens...`);

      const amountWei = ethers.parseUnits(amount, decimals);
      const tokenContract = contracts.erc20(tokenAddress);

      const currentAllowance = await tokenContract.read.allowance(
        address,
        contracts.lendingPool.write.target
      );

      if (currentAllowance < amountWei) {
        console.log('Approving token spending...');

        const approveTx = await tokenContract.write.approve(
          contracts.lendingPool.write.target,
          ethers.MaxUint256
        );

        console.log('Approval transaction sent:', approveTx.hash);
        await approveTx.wait();
        console.log('Approval confirmed');
      }

      const supplyTx = await contracts.lendingPool.write.supply(
        tokenAddress,
        amountWei
      );

      console.log('Supply transaction sent:', supplyTx.hash);
      const receipt = await supplyTx.wait();

      if (receipt && receipt.status === 1) {
        await supabase.from('transactions').insert({
          tx_hash: receipt.hash,
          user_address: address,
          action: 'supply',
          asset: tokenAddress,
          amount,
          status: 'confirmed',
        });

        return { success: true, txHash: receipt.hash };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
    } catch (err: any) {
      console.error('Supply ERC20 error:', err);
      return { success: false, error: err.message || 'Transaction failed' };
    } finally {
      setLoading(false);
    }
  };

  return { supplyETH, supplyERC20, loading };
}
