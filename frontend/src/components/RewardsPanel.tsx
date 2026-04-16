"use client";

import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import { FeeDistributorABI, ADDRESSES } from "@/lib/contracts";

export function RewardsPanel() {
  const { address } = useAccount();

  const { data: currentEpoch } = useReadContract({
    address: ADDRESSES.FeeDistributor,
    abi: FeeDistributorABI,
    functionName: "currentEpoch",
  });

  const epoch = currentEpoch ? Number(currentEpoch) : 0;

  const { data: claimable } = useReadContract({
    address: ADDRESSES.FeeDistributor,
    abi: FeeDistributorABI,
    functionName: "claimable",
    args: address && epoch > 0 ? [address, 0n, BigInt(epoch)] : undefined,
  });

  const { data: epoch0 } = useReadContract({
    address: ADDRESSES.FeeDistributor,
    abi: FeeDistributorABI,
    functionName: "epochs",
    args: [0n],
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleCheckpoint = () => {
    if (epoch === 0) return;
    writeContract({
      address: ADDRESSES.FeeDistributor,
      abi: FeeDistributorABI,
      functionName: "checkpoint",
      args: [BigInt(epoch - 1)],
    });
  };

  const handleClaim = () => {
    if (epoch === 0) return;
    writeContract({
      address: ADDRESSES.FeeDistributor,
      abi: FeeDistributorABI,
      functionName: "claim",
      args: [0n, BigInt(epoch)],
    });
  };

  if (!address) {
    return <p className="text-gray-500 text-center py-8">Connect wallet to view rewards</p>;
  }

  const epochFees = epoch0 ? (epoch0 as [bigint, bigint, bigint, boolean])[0] : 0n;
  const epochCheckpointed = epoch0 ? (epoch0 as [bigint, bigint, bigint, boolean])[3] : false;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Current Epoch</p>
          <p className="text-xl font-bold mt-1">{epoch}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Epoch 0 Fees</p>
          <p className="text-xl font-bold mt-1">
            {Number(formatEther(epochFees)).toFixed(4)} META
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-lg">Claimable Rewards</h3>
        <p className="text-3xl font-bold text-green-400">
          {claimable ? Number(formatEther(claimable as bigint)).toFixed(4) : "0.0000"} META
        </p>

        <div className="flex gap-3">
          {epoch > 0 && !epochCheckpointed && (
            <button
              onClick={handleCheckpoint}
              disabled={isPending || isConfirming}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 py-2.5 rounded-lg font-medium transition"
            >
              {isPending || isConfirming ? "..." : `Checkpoint Epoch ${epoch - 1}`}
            </button>
          )}
          <button
            onClick={handleClaim}
            disabled={isPending || isConfirming || !claimable || (claimable as bigint) === 0n}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2.5 rounded-lg font-medium transition"
          >
            {isPending || isConfirming ? "Confirming..." : "Claim"}
          </button>
        </div>
      </div>

      {isSuccess && (
        <p className="text-green-400 text-sm text-center">Transaction confirmed!</p>
      )}
    </div>
  );
}
