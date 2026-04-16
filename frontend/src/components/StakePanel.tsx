"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { MetaStakeABI, ADDRESSES } from "@/lib/contracts";

export function StakePanel() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [weeks, setWeeks] = useState("26");
  const [addAmount, setAddAmount] = useState("");

  const { data: lock, refetch: refetchLock } = useReadContract({
    address: ADDRESSES.MetaStake,
    abi: MetaStakeABI,
    functionName: "getLock",
    args: address ? [address] : undefined,
  });

  const { data: veMeta, refetch: refetchVe } = useReadContract({
    address: ADDRESSES.MetaStake,
    abi: MetaStakeABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: totalLocked } = useReadContract({
    address: ADDRESSES.MetaStake,
    abi: MetaStakeABI,
    functionName: "totalLocked",
  });

  const { data: stakerCount } = useReadContract({
    address: ADDRESSES.MetaStake,
    abi: MetaStakeABI,
    functionName: "stakerCount",
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const hasLock = lock && (lock as [bigint, bigint])[0] > 0n;
  const lockAmount = hasLock ? (lock as [bigint, bigint])[0] : 0n;
  const unlockTime = hasLock ? (lock as [bigint, bigint])[1] : 0n;
  const isExpired = unlockTime > 0n && BigInt(Math.floor(Date.now() / 1000)) >= unlockTime;

  const refetch = () => {
    refetchLock();
    refetchVe();
  };

  const handleLock = () => {
    if (!amount || !weeks) return;
    const duration = BigInt(Number(weeks) * 7 * 24 * 3600);
    writeContract(
      {
        address: ADDRESSES.MetaStake,
        abi: MetaStakeABI,
        functionName: "createLock",
        args: [duration],
        value: parseEther(amount),
      },
      { onSuccess: () => setTimeout(refetch, 3000) }
    );
  };

  const handleIncrease = () => {
    if (!addAmount) return;
    writeContract(
      {
        address: ADDRESSES.MetaStake,
        abi: MetaStakeABI,
        functionName: "increaseAmount",
        value: parseEther(addAmount),
      },
      { onSuccess: () => setTimeout(refetch, 3000) }
    );
  };

  const handleWithdraw = () => {
    writeContract(
      {
        address: ADDRESSES.MetaStake,
        abi: MetaStakeABI,
        functionName: "withdraw",
      },
      { onSuccess: () => setTimeout(refetch, 3000) }
    );
  };

  if (!address) {
    return <p className="text-gray-500 text-center py-8">Connect wallet to stake</p>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total Locked</p>
          <p className="text-xl font-bold mt-1">
            {totalLocked ? Number(formatEther(totalLocked as bigint)).toFixed(2) : "0"} META
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Stakers</p>
          <p className="text-xl font-bold mt-1">{stakerCount?.toString() ?? "0"}</p>
        </div>
      </div>

      {/* My Position */}
      <div className="bg-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-lg">My Position</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-400">Locked</p>
            <p className="font-mono">{Number(formatEther(lockAmount)).toFixed(2)} META</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">veMETA</p>
            <p className="font-mono text-blue-400">
              {veMeta ? Number(formatEther(veMeta as bigint)).toFixed(2) : "0"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Unlock</p>
            <p className="font-mono text-sm">
              {unlockTime > 0n
                ? new Date(Number(unlockTime) * 1000).toLocaleDateString()
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!hasLock ? (
        <div className="bg-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">Create Lock</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Amount (META)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-gray-700 rounded-lg px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Duration (weeks)</label>
              <input
                type="number"
                value={weeks}
                onChange={(e) => setWeeks(e.target.value)}
                min="1"
                max="52"
                className="w-full bg-gray-700 rounded-lg px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleLock}
            disabled={isPending || isConfirming}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-2.5 rounded-lg font-medium transition"
          >
            {isPending || isConfirming ? "Confirming..." : "Lock META"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {!isExpired && (
            <div className="bg-gray-800 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold">Add META</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleIncrease}
                  disabled={isPending || isConfirming}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-medium transition"
                >
                  {isPending || isConfirming ? "..." : "Add"}
                </button>
              </div>
            </div>
          )}
          {isExpired && (
            <button
              onClick={handleWithdraw}
              disabled={isPending || isConfirming}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-3 rounded-xl font-medium transition"
            >
              {isPending || isConfirming ? "Confirming..." : "Withdraw All META"}
            </button>
          )}
        </div>
      )}

      {isSuccess && (
        <p className="text-green-400 text-sm text-center">Transaction confirmed!</p>
      )}
    </div>
  );
}
