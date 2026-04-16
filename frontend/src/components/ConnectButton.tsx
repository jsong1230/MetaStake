"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { injected } from "wagmi/connectors";
import { metadiumTestnet } from "@/lib/wagmi";
import { formatEther } from "viem";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address, chainId: metadiumTestnet.id });

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected(), chainId: metadiumTestnet.id })}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400">
        {balance ? `${Number(formatEther(balance.value)).toFixed(2)} META` : "..."}
      </span>
      <button
        onClick={() => disconnect()}
        className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm font-mono transition"
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    </div>
  );
}
