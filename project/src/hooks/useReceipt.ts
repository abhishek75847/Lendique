import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { useWallet } from '../contexts/WalletContext';
import { supabase } from '../lib/supabase';

export enum ReceiptAction {
  SUPPLY = 1,
  WITHDRAW = 2,
  BORROW = 3,
  REPAY = 4,
}

export interface Receipt {
  id: string;
  receipt_id: bigint;
  user: string;
  action: ReceiptAction;
  action_name: string;
  amount: string;
  timestamp: number;
  proof_hash: string;
  submitted_to_l2: boolean;
  verified: boolean;
  tx_hash?: string;
}

export function useReceipt() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contracts = useContracts();
  const { address, isConnected } = useWallet();

  const getActionName = (action: number): string => {
    switch (action) {
      case ReceiptAction.SUPPLY:
        return 'Supply';
      case ReceiptAction.WITHDRAW:
        return 'Withdraw';
      case ReceiptAction.BORROW:
        return 'Borrow';
      case ReceiptAction.REPAY:
        return 'Repay';
      default:
        return 'Unknown';
    }
  };

  const generateReceipt = async (
    action: ReceiptAction,
    amount: bigint
  ): Promise<bigint | null> => {
    if (!contracts?.receiptGenerator || !address) {
      setError('Contracts not initialized or wallet not connected');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🧾 Generating receipt for action: ${getActionName(action)}, amount: ${amount}`);

      const tx = await contracts.receiptGenerator.write.generate_receipt([
        BigInt(action),
        amount,
      ]);

      const receipt = await tx.wait();
      console.log('✅ Receipt transaction confirmed:', receipt.hash);

      const receiptGeneratedEvent = receipt.logs.find(
        (log: any) => log.topics[0] === ethers.id('ReceiptGenerated(uint256,address,uint256,uint256,bytes32)')
      );

      if (receiptGeneratedEvent) {
        const receiptId = BigInt(receiptGeneratedEvent.topics[1]);
        console.log(`✅ Receipt ID generated: ${receiptId}`);

        const receiptData = await contracts.receiptGenerator.read.get_receipt([receiptId]);
        const [user, actionNum, amountValue, timestamp, proofHash, submittedToL2] = receiptData;

        await supabase.from('receipts').insert({
          receipt_id: receiptId.toString(),
          wallet_address: user.toLowerCase(),
          action: Number(actionNum),
          action_name: getActionName(Number(actionNum)),
          amount: amountValue.toString(),
          timestamp: Number(timestamp),
          proof_hash: proofHash,
          submitted_to_l2: submittedToL2,
          verified: true,
          tx_hash: receipt.hash,
        });

        console.log(`✅ Receipt ${receiptId} saved to database`);

        return receiptId;
      }

      return null;
    } catch (err: any) {
      console.error('❌ Error generating receipt:', err);
      setError(err.message || 'Failed to generate receipt');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReceipts = async () => {
    if (!contracts?.receiptGenerator || !address || !isConnected) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`📋 Fetching receipts for user: ${address}`);

      const { data: dbReceipts, error: dbError } = await supabase
        .from('receipts')
        .select('*')
        .eq('wallet_address', address.toLowerCase())
        .order('timestamp', { ascending: false });

      if (dbError) throw dbError;

      if (!dbReceipts || dbReceipts.length === 0) {
        console.log('No receipts found in database, checking blockchain...');

        const receiptIds = await contracts.receiptGenerator.read.get_user_receipts([address]);

        if (receiptIds.length === 0) {
          setReceipts([]);
          return;
        }

        const receiptsData = await Promise.all(
          receiptIds.map(async (id: bigint) => {
            const data = await contracts.receiptGenerator.read.get_receipt([id]);
            const [user, action, amount, timestamp, proofHash, submittedToL2] = data;

            const receipt: Receipt = {
              id: id.toString(),
              receipt_id: id,
              user: user.toLowerCase(),
              action: Number(action) as ReceiptAction,
              action_name: getActionName(Number(action)),
              amount: amount.toString(),
              timestamp: Number(timestamp),
              proof_hash: proofHash,
              submitted_to_l2: submittedToL2,
              verified: true,
            };

            await supabase.from('receipts').insert({
              receipt_id: id.toString(),
              wallet_address: user.toLowerCase(),
              action: Number(action),
              action_name: getActionName(Number(action)),
              amount: amount.toString(),
              timestamp: Number(timestamp),
              proof_hash: proofHash,
              submitted_to_l2: submittedToL2,
              verified: true,
            });

            return receipt;
          })
        );

        setReceipts(receiptsData);
      } else {
        const receiptsData: Receipt[] = dbReceipts.map((r: any) => ({
          id: r.id,
          receipt_id: BigInt(r.receipt_id),
          user: r.wallet_address,
          action: r.action as ReceiptAction,
          action_name: r.action_name,
          amount: r.amount,
          timestamp: r.timestamp,
          proof_hash: r.proof_hash,
          submitted_to_l2: r.submitted_to_l2,
          verified: r.verified,
          tx_hash: r.tx_hash,
        }));

        setReceipts(receiptsData);
        console.log(`✅ Loaded ${receiptsData.length} receipts from database`);
      }
    } catch (err: any) {
      console.error('❌ Error fetching receipts:', err);
      setError(err.message || 'Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  };

  const verifyReceipt = async (receiptId: bigint): Promise<boolean> => {
    if (!contracts?.receiptGenerator) {
      return false;
    }

    try {
      const isValid = await contracts.receiptGenerator.read.verify_receipt([receiptId]);
      console.log(`🔍 Receipt ${receiptId} verification:`, isValid);

      await supabase
        .from('receipts')
        .update({ verified: isValid })
        .eq('receipt_id', receiptId.toString());

      return isValid;
    } catch (err: any) {
      console.error('❌ Error verifying receipt:', err);
      return false;
    }
  };

  const getReceipt = async (receiptId: bigint): Promise<Receipt | null> => {
    if (!contracts?.receiptGenerator) {
      return null;
    }

    try {
      const data = await contracts.receiptGenerator.read.get_receipt([receiptId]);
      const [user, action, amount, timestamp, proofHash, submittedToL2] = data;

      return {
        id: receiptId.toString(),
        receipt_id: receiptId,
        user: user.toLowerCase(),
        action: Number(action) as ReceiptAction,
        action_name: getActionName(Number(action)),
        amount: amount.toString(),
        timestamp: Number(timestamp),
        proof_hash: proofHash,
        submitted_to_l2: submittedToL2,
        verified: true,
      };
    } catch (err: any) {
      console.error('❌ Error getting receipt:', err);
      return null;
    }
  };

  useEffect(() => {
    if (isConnected && address && contracts?.receiptGenerator) {
      fetchUserReceipts();
    }
  }, [isConnected, address, contracts?.receiptGenerator]);

  return {
    receipts,
    loading,
    error,
    generateReceipt,
    fetchUserReceipts,
    verifyReceipt,
    getReceipt,
  };
}
