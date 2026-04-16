"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { GovernanceABI, ADDRESSES } from "@/lib/contracts";

const STATE_LABELS = ["Pending", "Active", "Defeated", "Succeeded", "Executed", "Canceled"];
const STATE_STYLES: Record<string, string> = {
  Pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Defeated: "bg-red-500/10 text-red-400 border-red-500/20",
  Succeeded: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Executed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  Canceled: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

export function GovernancePanel() {
  const { address } = useAccount();
  const [voteId, setVoteId] = useState("0");
  const [voteSupport, setVoteSupport] = useState<number>(1);

  const { data: proposalCount } = useReadContract({
    address: ADDRESSES.Governance,
    abi: GovernanceABI,
    functionName: "proposalCount",
  });

  const count = proposalCount ? Number(proposalCount) : 0;

  const { data: latestState } = useReadContract({
    address: ADDRESSES.Governance,
    abi: GovernanceABI,
    functionName: "state",
    args: count > 0 ? [BigInt(count - 1)] : undefined,
  });

  const { data: latestProposal } = useReadContract({
    address: ADDRESSES.Governance,
    abi: GovernanceABI,
    functionName: "proposals",
    args: count > 0 ? [BigInt(count - 1)] : undefined,
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const busy = isPending || isConfirming;

  const handleVote = () => {
    writeContract({
      address: ADDRESSES.Governance,
      abi: GovernanceABI,
      functionName: "vote",
      args: [BigInt(voteId), voteSupport],
    });
  };

  const stateLabel = latestState !== undefined ? STATE_LABELS[Number(latestState)] : "-";
  const stateStyle = STATE_STYLES[stateLabel] ?? "";
  const proposal = latestProposal as [string, bigint, bigint, bigint, bigint, bigint, boolean, boolean] | undefined;

  return (
    <div className="space-y-5">
      {/* Governance info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card rounded-xl p-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Proposals</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{count}</p>
        </div>
        <div className="stat-card rounded-xl p-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Parameters</p>
          <p className="text-xs text-zinc-300 mt-2">Delay: 1d | Period: 3d</p>
          <p className="text-xs text-zinc-500">Quorum: 1 veMETA</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
        <h4 className="text-xs font-medium text-zinc-400 mb-2">Governance Lifecycle</h4>
        <div className="flex items-center justify-between text-center text-[10px]">
          {["Propose", "→ 1d Delay", "→ 3d Voting", "→ Execute"].map((step, i) => (
            <span key={i} className={i % 2 === 0 ? "text-zinc-300 font-medium" : "text-zinc-600"}>
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Latest proposal */}
      {count > 0 && proposal && (
        <div className="glow-card rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-zinc-300">Proposal #{count - 1}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${stateStyle}`}>
              {stateLabel}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "For", value: proposal[3], color: "text-emerald-400" },
              { label: "Against", value: proposal[4], color: "text-red-400" },
              { label: "Abstain", value: proposal[5], color: "text-zinc-400" },
            ].map((v) => (
              <div key={v.label} className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-zinc-500">{v.label}</p>
                <p className={`font-mono font-bold text-sm ${v.color}`}>
                  {Number(BigInt(v.value) / BigInt(1e16)) / 100}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vote */}
      {!address ? (
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-center">
          <p className="text-zinc-400 text-sm">Connect wallet to vote</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-400">Cast Vote</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={voteId}
              onChange={(e) => setVoteId(e.target.value)}
              placeholder="#"
              min="0"
              className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 transition text-zinc-100 text-center"
            />
            <select
              value={voteSupport}
              onChange={(e) => setVoteSupport(Number(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 outline-none text-zinc-100"
            >
              <option value={1}>For</option>
              <option value={0}>Against</option>
              <option value={2}>Abstain</option>
            </select>
            <button
              onClick={handleVote}
              disabled={busy}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 py-2.5 rounded-lg font-medium transition-all text-sm"
            >
              {busy ? "..." : "Vote"}
            </button>
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-sm text-emerald-400 text-center">
          Transaction confirmed
        </div>
      )}
    </div>
  );
}
