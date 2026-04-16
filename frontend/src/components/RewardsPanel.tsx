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
  const { data: startTime } = useReadContract({
    address: ADDRESSES.FeeDistributor,
    abi: FeeDistributorABI,
    functionName: "startTime",
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
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const busy = isPending || isConfirming;

  const epochFees = epoch0 ? (epoch0 as [bigint, bigint, bigint, boolean])[0] : 0n;
  const epochCheckpointed = epoch0 ? (epoch0 as [bigint, bigint, bigint, boolean])[3] : false;
  const nextEpochStart = startTime ? Number(startTime) + (epoch + 1) * 604800 : 0;

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

  return (
    <div className="space-y-5">
      {/* Epoch info — always visible */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card rounded-xl p-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Current Epoch</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{epoch}</p>
        </div>
        <div className="stat-card rounded-xl p-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Epoch 0 Fees</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{Number(formatEther(epochFees)).toFixed(2)}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">META collected</p>
        </div>
        <div className="stat-card rounded-xl p-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Next Epoch</p>
          <p className="text-sm font-bold text-zinc-100 mt-1">
            {nextEpochStart ? new Date(nextEpochStart * 1000).toLocaleDateString() : "-"}
          </p>
          <p className="text-[10px] text-zinc-600 mt-0.5">Weekly cycle</p>
        </div>
      </div>

      {/* How it works — always visible */}
      <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
        <h4 className="text-xs font-medium text-zinc-400 mb-2">How Fee Distribution Works</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { step: "1", title: "Collect", desc: "Services send fees each epoch" },
            { step: "2", title: "Checkpoint", desc: "Anyone finalizes the epoch" },
            { step: "3", title: "Claim", desc: "veMETA holders claim share" },
          ].map((s) => (
            <div key={s.step}>
              <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center mx-auto">
                {s.step}
              </div>
              <p className="text-xs font-medium text-zinc-300 mt-2">{s.title}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {!address ? (
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-center">
          <p className="text-zinc-400 text-sm">Connect wallet to claim rewards</p>
        </div>
      ) : (
        <>
          <div className="glow-card rounded-xl p-5">
            <p className="text-xs text-zinc-400 mb-1">Your Claimable Rewards</p>
            <p className="text-3xl font-bold gradient-text">
              {claimable ? Number(formatEther(claimable as bigint)).toFixed(4) : "0.0000"}{" "}
              <span className="text-base text-zinc-400">META</span>
            </p>
          </div>

          <div className="flex gap-3">
            {epoch > 0 && !epochCheckpointed && (
              <button
                onClick={handleCheckpoint}
                disabled={busy}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                {busy ? "..." : `Checkpoint Epoch ${epoch - 1}`}
              </button>
            )}
            <button
              onClick={handleClaim}
              disabled={busy || !claimable || (claimable as bigint) === 0n}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              {busy ? "Confirming..." : "Claim Rewards"}
            </button>
          </div>
        </>
      )}

      {isSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-sm text-emerald-400 text-center">
          Transaction confirmed
        </div>
      )}
    </div>
  );
}
