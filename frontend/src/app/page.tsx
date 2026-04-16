"use client";

import { useState } from "react";
import { ConnectButton } from "@/components/ConnectButton";
import { StakePanel } from "@/components/StakePanel";
import { RewardsPanel } from "@/components/RewardsPanel";
import { GovernancePanel } from "@/components/GovernancePanel";
import { OperatorsPanel } from "@/components/OperatorsPanel";

const TABS = ["Stake", "Rewards", "Governance", "Operators"] as const;
type Tab = (typeof TABS)[number];

export default function Home() {
  const [tab, setTab] = useState<Tab>("Stake");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">MetaStake</h1>
          <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">
            Testnet
          </span>
        </div>
        <ConnectButton />
      </header>

      {/* Tabs */}
      <nav className="border-b border-gray-800 px-6 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="max-w-xl mx-auto px-4 py-8">
        {tab === "Stake" && <StakePanel />}
        {tab === "Rewards" && <RewardsPanel />}
        {tab === "Governance" && <GovernancePanel />}
        {tab === "Operators" && <OperatorsPanel />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-800 px-6 py-3 text-center text-xs text-gray-500">
        Metadium Testnet (chainId 12) &middot; veMETA Governance Staking
      </footer>
    </div>
  );
}
