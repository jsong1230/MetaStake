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
const STATE_COLORS: Record<string, string> = {
  Pending: "text-yellow-400",
  Active: "text-blue-400",
  Defeated: "text-red-400",
  Succeeded: "text-green-400",
  Executed: "text-gray-400",
  Canceled: "text-gray-500",
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

  // Show latest proposal state
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
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleVote = () => {
    writeContract({
      address: ADDRESSES.Governance,
      abi: GovernanceABI,
      functionName: "vote",
      args: [BigInt(voteId), voteSupport],
    });
  };

  const handleExecute = () => {
    writeContract({
      address: ADDRESSES.Governance,
      abi: GovernanceABI,
      functionName: "execute",
      args: [BigInt(voteId)],
    });
  };

  if (!address) {
    return <p className="text-gray-500 text-center py-8">Connect wallet for governance</p>;
  }

  const stateLabel =
    latestState !== undefined ? STATE_LABELS[Number(latestState)] : "-";
  const stateColor = STATE_COLORS[stateLabel] ?? "text-gray-400";

  // Parse proposal tuple
  const proposal = latestProposal as
    | [string, bigint, bigint, bigint, bigint, bigint, boolean, boolean]
    | undefined;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Total Proposals</p>
        <p className="text-xl font-bold mt-1">{count}</p>
      </div>

      {count > 0 && proposal && (
        <div className="bg-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Proposal #{count - 1}</h3>
            <span className={`text-sm font-medium ${stateColor}`}>{stateLabel}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="text-gray-400">For</p>
              <p className="text-green-400 font-mono">
                {Number(BigInt(proposal[3]) / 10n ** 16n) / 100}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Against</p>
              <p className="text-red-400 font-mono">
                {Number(BigInt(proposal[4]) / 10n ** 16n) / 100}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Abstain</p>
              <p className="text-gray-300 font-mono">
                {Number(BigInt(proposal[5]) / 10n ** 16n) / 100}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold">Vote</h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={voteId}
            onChange={(e) => setVoteId(e.target.value)}
            placeholder="Proposal ID"
            min="0"
            className="w-24 bg-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={voteSupport}
            onChange={(e) => setVoteSupport(Number(e.target.value))}
            className="bg-gray-700 rounded-lg px-3 py-2 outline-none"
          >
            <option value={1}>For</option>
            <option value={0}>Against</option>
            <option value={2}>Abstain</option>
          </select>
          <button
            onClick={handleVote}
            disabled={isPending || isConfirming}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-2 rounded-lg font-medium transition"
          >
            {isPending || isConfirming ? "..." : "Cast Vote"}
          </button>
        </div>
        {stateLabel === "Succeeded" && (
          <button
            onClick={handleExecute}
            disabled={isPending || isConfirming}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2.5 rounded-lg font-medium transition"
          >
            Execute Proposal #{voteId}
          </button>
        )}
      </div>

      {isSuccess && (
        <p className="text-green-400 text-sm text-center">Transaction confirmed!</p>
      )}
    </div>
  );
}
