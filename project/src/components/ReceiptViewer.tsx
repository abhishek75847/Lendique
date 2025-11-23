import { useReceipt, ReceiptAction } from '../hooks/useReceipt';
import { FileCheck, Download, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ethers } from 'ethers';

export function ReceiptViewer() {
  const { receipts, loading, error, verifyReceipt } = useReceipt();

  const formatAmount = (amount: string, decimals: number = 18) => {
    try {
      return Number(ethers.formatUnits(amount, decimals)).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getActionColor = (action: ReceiptAction) => {
    switch (action) {
      case ReceiptAction.SUPPLY:
        return 'text-green-600 bg-green-50';
      case ReceiptAction.WITHDRAW:
        return 'text-orange-600 bg-orange-50';
      case ReceiptAction.BORROW:
        return 'text-blue-600 bg-blue-50';
      case ReceiptAction.REPAY:
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const downloadReceipt = (receipt: any) => {
    const data = {
      receiptId: receipt.receipt_id.toString(),
      user: receipt.user,
      action: receipt.action_name,
      amount: receipt.amount,
      timestamp: formatDate(receipt.timestamp),
      proofHash: receipt.proof_hash,
      verified: receipt.verified,
      submittedToL2: receipt.submitted_to_l2,
      txHash: receipt.tx_hash,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.receipt_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading receipts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center">
          <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Receipts Yet</h3>
          <p className="text-gray-500">Your transaction receipts will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileCheck className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Transaction Receipts</h2>
          </div>
          <span className="text-sm text-gray-500">{receipts.length} total</span>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {receipts.map((receipt) => (
          <div key={receipt.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(receipt.action)}`}>
                    {receipt.action_name}
                  </span>

                  {receipt.verified ? (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Verified
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      Pending
                    </div>
                  )}

                  {receipt.submitted_to_l2 && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      L2 Submitted
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <p className="font-mono font-medium text-gray-900 mt-1">
                      {formatAmount(receipt.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <p className="text-gray-900 mt-1">{formatDate(receipt.timestamp)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Proof Hash:</span>
                    <p className="font-mono text-xs text-gray-900 mt-1 break-all">
                      {receipt.proof_hash}
                    </p>
                  </div>
                  {receipt.tx_hash && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Transaction:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="font-mono text-xs text-blue-600">{receipt.tx_hash.slice(0, 20)}...</p>
                        <a
                          href={`https://sepolia.arbiscan.io/tx/${receipt.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => downloadReceipt(receipt)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Download Receipt"
                >
                  <Download className="w-5 h-5" />
                </button>

                {!receipt.verified && (
                  <button
                    onClick={() => verifyReceipt(receipt.receipt_id)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
