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
  { id: 0, name: "zkBridge Relayer", min: "10", slash: "10%" },
  { id: 1, name: "Dispute Resolver", min: "20", slash: "20%" },
  { id: 2, name: "Agent Verifier", min: "10", slash: "5%" },
];

function ServiceCard({ serviceId, address: userAddr }: { serviceId: number; address: string }) {
  const svc = SERVICES[serviceId];
  const [stakeAmount, setStakeAmount] = useState(svc.min);

  const { data: op, refetch } = useReadContract({
    address: ADDRESSES.OperatorRegistry,
    abi: OperatorRegistryABI,
    functionName: "getOperator",
    args: [BigInt(serviceId), userAddr as `0x${string}`],
  });

  const { data: opCount } = useReadContract({
    address: ADDRESSES.OperatorRegistry,
    abi: OperatorRegistryABI,
    functionName: "operatorCount",
    args: [BigInt(serviceId)],
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const opData = op as [bigint, bigint, boolean] | undefined;
  const isOperator = opData?.[2] ?? false;
  const stake = opData?.[0] ?? 0n;
  const unstakeReq = opData?.[1] ?? 0n;
  const hasUnstakeRequest = unstakeReq > 0n;

  const handleStake = () => {
    writeContract(
      {
        address: ADDRESSES.OperatorRegistry,
        abi: OperatorRegistryABI,
        functionName: "stake",
        args: [BigInt(serviceId)],
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
        args: [BigInt(serviceId)],
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
        args: [BigInt(serviceId)],
      },
      { onSuccess: () => setTimeout(refetch, 3000) }
    );
  };

  const busy = isPending || isConfirming;

  return (
    <div className="bg-gray-800 rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{svc.name}</h3>
          <p className="text-xs text-gray-400">
            Min: {svc.min} META | Slash: {svc.slash} | Operators: {opCount?.toString() ?? "0"}
          </p>
        </div>
        {isOperator && (
          <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded">Active</span>
        )}
      </div>

      {isOperator ? (
        <div className="space-y-2">
          <p className="text-sm">
            Staked: <span className="font-mono text-blue-400">{Number(formatEther(stake)).toFixed(2)} META</span>
          </p>
          {!hasUnstakeRequest ? (
            <button
              onClick={handleRequestUnstake}
              disabled={busy}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 py-2 rounded-lg text-sm font-medium transition"
            >
              {busy ? "..." : "Request Unstake (7d cooldown)"}
            </button>
          ) : (
            <button
              onClick={handleWithdraw}
              disabled={busy}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 py-2 rounded-lg text-sm font-medium transition"
            >
              {busy ? "..." : "Withdraw"}
            </button>
          )}
        </div>
      ) : stake > 0n ? (
        // Deactivated (slashed) — can withdraw remaining
        <div className="space-y-2">
          <p className="text-sm text-yellow-400">
            Deactivated — {Number(formatEther(stake)).toFixed(2)} META remaining
          </p>
          <button
            onClick={handleWithdraw}
            disabled={busy}
            className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 py-2 rounded-lg text-sm font-medium transition"
          >
            {busy ? "..." : "Withdraw Remaining"}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            min={svc.min}
            className="flex-1 bg-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleStake}
            disabled={busy}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-medium transition"
          >
            {busy ? "..." : "Stake"}
          </button>
        </div>
      )}
      {isSuccess && <p className="text-green-400 text-xs">Confirmed!</p>}
    </div>
  );
}

export function OperatorsPanel() {
  const { address } = useAccount();

  if (!address) {
    return <p className="text-gray-500 text-center py-8">Connect wallet to manage operators</p>;
  }

  return (
    <div className="space-y-4">
      {SERVICES.map((svc) => (
        <ServiceCard key={svc.id} serviceId={svc.id} address={address} />
      ))}
    </div>
  );
}
