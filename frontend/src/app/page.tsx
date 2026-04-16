"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { ConnectButton } from "@/components/ConnectButton";
import { StakePanel } from "@/components/StakePanel";
import { RewardsPanel } from "@/components/RewardsPanel";
import { GovernancePanel } from "@/components/GovernancePanel";
import { OperatorsPanel } from "@/components/OperatorsPanel";
import { MetaStakeABI, FeeDistributorABI, GovernanceABI, OperatorRegistryABI, ADDRESSES } from "@/lib/contracts";

const TABS = ["Stake", "Rewards", "Governance", "Operators"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, string> = {
  Stake: "S",
  Rewards: "R",
  Governance: "G",
  Operators: "O",
};

function ProtocolStats() {
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
  const { data: totalSupply } = useReadContract({
    address: ADDRESSES.MetaStake,
    abi: MetaStakeABI,
    functionName: "totalSupply",
  });
  const { data: proposalCount } = useReadContract({
    address: ADDRESSES.Governance,
    abi: GovernanceABI,
    functionName: "proposalCount",
  });
  const { data: epoch0 } = useReadContract({
    address: ADDRESSES.FeeDistributor,
    abi: FeeDistributorABI,
    functionName: "epochs",
    args: [0n],
  });
  const { data: opCount0 } = useReadContract({
    address: ADDRESSES.OperatorRegistry,
    abi: OperatorRegistryABI,
    functionName: "operatorCount",
    args: [0n],
  });
  const { data: opCount1 } = useReadContract({
    address: ADDRESSES.OperatorRegistry,
    abi: OperatorRegistryABI,
    functionName: "operatorCount",
    args: [1n],
  });
  const { data: opCount2 } = useReadContract({
    address: ADDRESSES.OperatorRegistry,
    abi: OperatorRegistryABI,
    functionName: "operatorCount",
    args: [2n],
  });

  const locked = totalLocked ? Number(formatEther(totalLocked as bigint)) : 0;
  const supply = totalSupply ? Number(formatEther(totalSupply as bigint)) : 0;
  const fees = epoch0 ? Number(formatEther((epoch0 as unknown as [bigint])[0])) : 0;
  const totalOps = Number(opCount0 ?? 0) + Number(opCount1 ?? 0) + Number(opCount2 ?? 0);

  const stats = [
    { label: "Total Locked", value: `${locked.toFixed(1)} META`, sub: "Protocol TVL" },
    { label: "veMETA Supply", value: supply.toFixed(1), sub: "Voting power" },
    { label: "Stakers", value: stakerCount?.toString() ?? "0", sub: "Unique lockers" },
    { label: "Proposals", value: proposalCount?.toString() ?? "0", sub: "Governance" },
    { label: "Fees Collected", value: `${fees.toFixed(2)} META`, sub: "Epoch 0" },
    { label: "Operators", value: totalOps.toString(), sub: "Across 3 services" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="stat-card rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">{s.label}</p>
          <p className="text-lg font-bold mt-1 text-zinc-100">{s.value}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("Stake");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/80 px-6 py-3 flex items-center justify-between backdrop-blur-sm sticky top-0 z-50 bg-zinc-950/80">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
            M
          </div>
          <h1 className="text-base font-semibold tracking-tight">MetaStake</h1>
          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-medium">
            TESTNET
          </span>
        </div>
        <ConnectButton />
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-purple-600/3 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="gradient-text">veMETA</span> Governance
          </h2>
          <p className="text-zinc-400 mt-3 text-lg max-w-xl leading-relaxed">
            Lock META to earn voting power, collect protocol fees, and secure ecosystem services on Metadium.
          </p>
        </div>
      </section>

      {/* Protocol Stats */}
      <section className="max-w-6xl mx-auto px-6 pb-8 w-full">
        <ProtocolStats />
      </section>

      {/* Tabs + Content */}
      <section className="flex-1 max-w-6xl mx-auto px-6 pb-12 w-full">
        <div className="glow-card rounded-2xl overflow-hidden">
          {/* Tab bar */}
          <nav className="flex border-b border-zinc-800/50 px-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  tab === t
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                    tab === t
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {TAB_ICONS[t]}
                </span>
                {t}
              </button>
            ))}
          </nav>

          {/* Panel content */}
          <div className="p-6">
            {tab === "Stake" && <StakePanel />}
            {tab === "Rewards" && <RewardsPanel />}
            {tab === "Governance" && <GovernancePanel />}
            {tab === "Operators" && <OperatorsPanel />}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 px-6 py-4 mt-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-zinc-600">
          <span>Metadium Testnet &middot; Chain ID 12</span>
          <div className="flex gap-4">
            <a href="/manual" className="hover:text-zinc-400 transition">Manual</a>
            <a href="https://github.com/jsong1230/MetaStake" className="hover:text-zinc-400 transition" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://api.metadium.com/dev" className="hover:text-zinc-400 transition" target="_blank" rel="noopener noreferrer">RPC</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
