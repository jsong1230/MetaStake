"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { OperatorRegistryABI, ADDRESSES } from "@/lib/contracts";

const SERVICES = [
  { id: 0, name: "zkBridge Relayer", min: "10", slash: "10%", desc: "Submit ZK proofs on-chain" },
  { id: 1, name: "Dispute Resolver", min: "20", slash: "20%", desc: "Resolve MetaPool disputes" },
  { id: 2, name: "Agent Verifier", min: "10", slash: "5%", desc: "Verify meta-agents identity" },
];

function ServiceCard({ svc, userAddr }: { svc: typeof SERVICES[0]; userAddr: string | undefined }) {
  const [stakeAmount, setStakeAmount] = useState(svc.min);

  const { data: op, refetch } = useReadContract({
    address: ADDRESSES.OperatorRegistry,
    abi: OperatorRegistryABI,
    functionName: "getOperator",
    args: userAddr ? [BigInt(svc.id), userAddr as `0x${string}`] : undefined,
  });

  const { data: opCount } = useReadContract({
    address: ADDRESSES.OperatorRegistry,
    abi: OperatorRegistryABI,
    functionName: "operatorCount",
    args: [BigInt(svc.id)],
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const busy = isPending || isConfirming;

  const opData = op as [bigint, bigint, boolean] | undefined;
  const isOperator = opData?.[2] ?? false;
  const stake = opData?.[0] ?? 0n;
  const hasUnstakeRequest = (opData?.[1] ?? 0n) > 0n;

  const handleStake = () => {
    writeContract(
      {
        address: ADDRESSES.OperatorRegistry,
        abi: OperatorRegistryABI,
        functionName: "stake",
        args: [BigInt(svc.id)],
        value: parseEther(stakeAmount),
      },
      { onSuccess: () => setTimeout(refetch, 3000) }
    );
  };

  const handleRequestUnstake = () => {
    writeContract(
      {
        address: ADDRESSES.OperatorRegistry,
        abi: OperatorRegistryABI,
        functionName: "requestUnstake",
        args: [BigInt(svc.id)],
      },
      { onSuccess: () => setTimeout(refetch, 3000) }
    );
  };

  const handleWithdraw = () => {
    writeContract(
      {
        address: ADDRESSES.OperatorRegistry,
        abi: OperatorRegistryABI,
        functionName: "withdraw",
        args: [BigInt(svc.id)],
      },
      { onSuccess: () => setTimeout(refetch, 3000) }
    );
  };

  return (
    <div className="stat-card rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-zinc-100">{svc.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{svc.desc}</p>
        </div>
        {isOperator && (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-medium">
            Active
          </span>
        )}
      </div>

      <div className="flex gap-4 text-xs">
        <span className="text-zinc-500">Min: <span className="text-zinc-300">{svc.min} META</span></span>
        <span className="text-zinc-500">Slash: <span className="text-red-400">{svc.slash}</span></span>
        <span className="text-zinc-500">Operators: <span className="text-zinc-300">{opCount?.toString() ?? "0"}</span></span>
      </div>

      {!userAddr ? (
        <div className="bg-zinc-800/30 rounded-lg px-3 py-2 text-center">
          <p className="text-zinc-500 text-xs">Connect wallet to become an operator</p>
        </div>
      ) : isOperator ? (
        <div className="space-y-2">
          <div className="bg-zinc-800/50 rounded-lg px-3 py-2 flex justify-between text-sm">
            <span className="text-zinc-400">Your Stake</span>
            <span className="font-mono font-medium text-blue-400">{Number(formatEther(stake)).toFixed(1)} META</span>
          </div>
          {!hasUnstakeRequest ? (
            <button onClick={handleRequestUnstake} disabled={busy}
              className="w-full bg-amber-600/80 hover:bg-amber-500 disabled:bg-zinc-700 py-2 rounded-lg text-xs font-medium transition-all">
              {busy ? "..." : "Request Unstake (7d cooldown)"}
            </button>
          ) : (
            <button onClick={handleWithdraw} disabled={busy}
              className="w-full bg-red-600/80 hover:bg-red-500 disabled:bg-zinc-700 py-2 rounded-lg text-xs font-medium transition-all">
              {busy ? "..." : "Withdraw Stake"}
            </button>
          )}
        </div>
      ) : stake > 0n ? (
        <div className="space-y-2">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-400">
            Deactivated — {Number(formatEther(stake)).toFixed(1)} META remaining
          </div>
          <button onClick={handleWithdraw} disabled={busy}
            className="w-full bg-amber-600/80 hover:bg-amber-500 disabled:bg-zinc-700 py-2 rounded-lg text-xs font-medium transition-all">
            {busy ? "..." : "Withdraw Remaining"}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)}
            min={svc.min}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition text-zinc-100 text-sm" />
          <button onClick={handleStake} disabled={busy}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-medium transition-all">
            {busy ? "..." : "Stake"}
          </button>
        </div>
      )}
      {isSuccess && <p className="text-emerald-400 text-xs text-center">Confirmed!</p>}
    </div>
  );
}

export function OperatorsPanel() {
  const { address } = useAccount();

  return (
    <div className="space-y-5">
      <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
        <h4 className="text-xs font-medium text-zinc-400 mb-1">Service Operator Staking</h4>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Operators stake META to run ecosystem services. Misbehaviour triggers slashing. Slashed META goes to the treasury.
        </p>
      </div>
      {SERVICES.map((svc) => (
        <ServiceCard key={svc.id} svc={svc} userAddr={address} />
      ))}
    </div>
  );
}
