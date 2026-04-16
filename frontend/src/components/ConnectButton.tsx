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
        className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-lg shadow-blue-600/20"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm">
        <span className="text-zinc-400">
          {balance ? `${Number(formatEther(balance.value)).toFixed(2)}` : "..."}{" "}
        </span>
        <span className="text-zinc-300 font-medium">META</span>
      </div>
      <button
        onClick={() => disconnect()}
        className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg text-sm font-mono text-zinc-300 transition-all"
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    </div>
  );
}
