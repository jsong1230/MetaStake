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

function fmt(val: bigint | undefined, decimals = 2): string {
  if (!val) return "0";
  return Number(formatEther(val)).toFixed(decimals);
}

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

  const { data: maxLock } = useReadContract({
    address: ADDRESSES.MetaStake,
    abi: MetaStakeABI,
    functionName: "MAX_LOCK",
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const hasLock = lock && (lock as [bigint, bigint])[0] > 0n;
  const lockAmount = hasLock ? (lock as [bigint, bigint])[0] : 0n;
  const unlockTime = hasLock ? (lock as [bigint, bigint])[1] : 0n;
  const isExpired = unlockTime > 0n && BigInt(Math.floor(Date.now() / 1000)) >= unlockTime;
  const maxWeeks = maxLock ? Number(maxLock) / 604800 : 52;
  const busy = isPending || isConfirming;

  const refetch = () => { refetchLock(); refetchVe(); };

  // Preview veMETA for input
  const previewVe = amount && weeks
    ? (Number(amount) * Number(weeks) * 7 * 86400) / (maxLock ? Number(maxLock) : 31536000)
    : 0;

  const handleLock = () => {
    if (!amount || !weeks) return;
    writeContract(
      {
        address: ADDRESSES.MetaStake,
        abi: MetaStakeABI,
        functionName: "createLock",
        args: [BigInt(Number(weeks) * 7 * 24 * 3600)],
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
      { address: ADDRESSES.MetaStake, abi: MetaStakeABI, functionName: "withdraw" },
      { onSuccess: () => setTimeout(refetch, 3000) }
    );
  };

  if (!address) {
    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-xl font-semibold text-zinc-200">Lock META, Earn veMETA</h3>
          <p className="text-zinc-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
            Lock your META tokens to receive veMETA voting power. Longer locks give more power. veMETA decays linearly until unlock.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Max Lock", value: `${maxWeeks}w`, desc: "Maximum duration" },
            { label: "Min Lock", value: "1w", desc: "Minimum duration" },
            { label: "Model", value: "veCRV", desc: "Linear decay" },
          ].map((s) => (
            <div key={s.label} className="stat-card rounded-xl p-3 text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-bold text-zinc-100 mt-1">{s.value}</p>
              <p className="text-[10px] text-zinc-600">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-center">
          <p className="text-zinc-400 text-sm">Connect your wallet to start staking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* My Position */}
      {hasLock && (
        <div className="glow-card rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Your Position</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-zinc-100">{fmt(lockAmount)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">META Locked</p>
            </div>
            <div>
              <p className="text-2xl font-bold gradient-text">{fmt(veMeta as bigint | undefined)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">veMETA Power</p>
            </div>
            <div>
              <p className="text-lg font-bold text-zinc-100">
                {unlockTime > 0n ? new Date(Number(unlockTime) * 1000).toLocaleDateString() : "-"}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isExpired ? "Expired — withdraw available" : "Unlock Date"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Lock */}
      {!hasLock && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-400">Create Lock</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Amount (META)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 transition text-zinc-100"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Duration (weeks)</label>
              <input
                type="number"
                value={weeks}
                onChange={(e) => setWeeks(e.target.value)}
                min="1"
                max={maxWeeks}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 transition text-zinc-100"
              />
            </div>
          </div>
          {previewVe > 0 && (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 flex justify-between text-sm">
              <span className="text-zinc-400">Estimated veMETA</span>
              <span className="font-mono font-medium gradient-text">{previewVe.toFixed(2)}</span>
            </div>
          )}
          <button
            onClick={handleLock}
            disabled={busy || !amount || !weeks}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-600/10 disabled:shadow-none"
          >
            {busy ? "Confirming..." : "Lock META"}
          </button>
        </div>
      )}

      {/* Increase / Withdraw */}
      {hasLock && !isExpired && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Add META</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 transition text-zinc-100"
            />
            <button
              onClick={handleIncrease}
              disabled={busy || !addAmount}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 px-5 py-2.5 rounded-lg font-medium transition-all"
            >
              {busy ? "..." : "Add"}
            </button>
          </div>
        </div>
      )}

      {hasLock && isExpired && (
        <button
          onClick={handleWithdraw}
          disabled={busy}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-600/10"
        >
          {busy ? "Confirming..." : "Withdraw All META"}
        </button>
      )}

      {isSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-sm text-emerald-400 text-center">
          Transaction confirmed
        </div>
      )}
    </div>
  );
}
