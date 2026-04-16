import { notFound } from "next/navigation";
import { LANGS, LANG_LABELS, TRANSLATIONS, type Lang } from "@/lib/manual-i18n";
import Link from "next/link";

const CONTRACTS = [
  { name: "MetaStake", addr: "0x9a1d09D75a036c2137b89a8C767e18e77d82ff69" },
  { name: "FeeDistributor", addr: "0x26541F01D2fDd70da17a2FEC9e6B23ebe51ed502" },
  { name: "Governance", addr: "0x616dE1bE241508Fcc35ba2813883038B9494C90A" },
  { name: "OperatorRegistry", addr: "0x19F412E4FB526b3eb89e0bd62A06D2184D915B89" },
];

const SERVICES = [
  { name: "zkBridge Relayer", role: "ZK proof submission", min: "10 META", slash: "10%" },
  { name: "Dispute Resolver", role: "MetaPool disputes", min: "20 META", slash: "20%" },
  { name: "Agent Verifier", role: "meta-agents identity", min: "10 META", slash: "5%" },
];

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-zinc-800 text-blue-400 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-300 flex gap-2">
      <span className="shrink-0">⚠️</span><span>{children}</span>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-blue-300">{children}</div>;
}

function StepFlow({ steps }: { steps: string[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap text-sm my-3">
      {steps.map((s, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-zinc-600">→</span>}
          <span className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-300">{s}</span>
        </span>
      ))}
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-zinc-100 mb-4 pb-2 border-b border-zinc-800">{title}</h2>
      {children}
    </section>
  );
}

function Table({ headers, rows }: { headers?: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="stat-card rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        {headers && (
          <thead>
            <tr className="border-b border-zinc-800">
              {headers.map((h) => <th key={h} className="px-4 py-2 text-left text-zinc-500 font-medium">{h}</th>)}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-800 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-2.5 ${j === 0 ? "text-zinc-200 font-medium" : "text-zinc-400"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ManualPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!LANGS.includes(lang as Lang)) notFound();
  const t = TRANSLATIONS[lang as Lang];
  const s = t.sections;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      {/* Header */}
      <header className="border-b border-zinc-800/80 px-6 py-3 flex items-center justify-between sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">M</div>
            <span className="text-base font-semibold text-zinc-100">MetaStake</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-sm text-zinc-400">{t.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          {LANGS.map((l) => (
            <Link
              key={l}
              href={`/manual/${l}`}
              className={`text-xs px-2.5 py-1 rounded-md transition ${
                l === lang
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              {LANG_LABELS[l]}
            </Link>
          ))}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar TOC */}
        <nav className="hidden lg:block w-48 shrink-0 sticky top-20 self-start">
          <ul className="space-y-1.5">
            {t.toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-sm text-zinc-500 hover:text-zinc-200 transition block py-0.5">{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <article className="flex-1 min-w-0 space-y-12">
          <div>
            <h1 className="text-4xl font-bold text-zinc-100">{t.title}</h1>
            <p className="text-zinc-500 mt-2">{t.subtitle}</p>
          </div>

          {/* 1. Start */}
          <Section id="start" title={s.start.title}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.start.networkTitle}</h3>
                <Table rows={[
                  ["Network Name", "Metadium Testnet"],
                  ["RPC URL", <Code key="rpc">https://api.metadium.com/dev</Code>],
                  ["Chain ID", "12"],
                  ["Currency Symbol", "META"],
                ]} />
                <p className="text-sm text-zinc-500 mt-2">{s.start.networkNote}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.start.connectTitle}</h3>
                <p className="text-sm">{s.start.connectDesc}</p>
              </div>
            </div>
          </Section>

          {/* 2. Staking */}
          <Section id="staking" title={s.staking.title}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.staking.conceptTitle}</h3>
                <p className="text-sm leading-relaxed mb-3">{s.staking.conceptDesc}</p>
                <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-300">
                  {s.staking.formula}{"\n\n"}{s.staking.example}
                </pre>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {s.staking.specs.map((sp) => (
                  <div key={sp.label} className="stat-card rounded-xl p-3 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{sp.label}</p>
                    <p className="text-sm font-semibold text-zinc-100 mt-1">{sp.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.staking.createTitle}</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-sm">
                  {s.staking.createSteps.map((step) => <li key={step}>{step}</li>)}
                </ol>
                <div className="mt-3"><Note>{s.staking.createNote}</Note></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.staking.addTitle}</h3>
                <p className="text-sm">{s.staking.addDesc}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.staking.withdrawTitle}</h3>
                <p className="text-sm mb-2">{s.staking.withdrawDesc}</p>
                <Note>{s.staking.withdrawNote}</Note>
              </div>
            </div>
          </Section>

          {/* 3. Rewards */}
          <Section id="rewards" title={s.rewards.title}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.rewards.conceptTitle}</h3>
                <p className="text-sm leading-relaxed mb-3">{s.rewards.conceptDesc}</p>
                <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-300">{s.rewards.formula}</pre>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.rewards.flowTitle}</h3>
                <StepFlow steps={s.rewards.flowSteps} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.rewards.usageTitle}</h3>
                <Table rows={s.rewards.usageItems} />
              </div>
            </div>
          </Section>

          {/* 4. Governance */}
          <Section id="governance" title={s.governance.title}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.governance.conceptTitle}</h3>
                <p className="text-sm leading-relaxed mb-3">{s.governance.conceptDesc}</p>
                <InfoBox>{s.governance.notChainGov}</InfoBox>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.governance.votableTitle}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {s.governance.votableItems.map((v) => <li key={v}>{v}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.governance.lifecycleTitle}</h3>
                <StepFlow steps={s.governance.lifecycleSteps} />
                <Table
                  headers={["Status", ""]}
                  rows={s.governance.states.map(([status, desc]) => [status, desc])}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.governance.voteTitle}</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-sm">
                  {s.governance.voteSteps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
            </div>
          </Section>

          {/* 5. Operators */}
          <Section id="operators" title={s.operators.title}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.operators.conceptTitle}</h3>
                <p className="text-sm leading-relaxed">{s.operators.conceptDesc}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.operators.servicesTitle}</h3>
                <Table
                  headers={["Service", "Role", "Min Stake", "Slash"]}
                  rows={SERVICES.map((svc) => [svc.name, svc.role, svc.min, <span key={svc.name} className="text-red-400">{svc.slash}</span>])}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.operators.becomeTitle}</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-sm">
                  {s.operators.becomeSteps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.operators.unstakeTitle}</h3>
                <StepFlow steps={s.operators.unstakeSteps} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{s.operators.slashTitle}</h3>
                <ul className="list-disc list-inside space-y-1.5 text-sm">
                  {s.operators.slashItems.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          </Section>

          {/* 6. Contracts */}
          <Section id="contracts" title={s.contracts.title}>
            <p className="text-sm text-zinc-400 mb-3">{s.contracts.networkNote} &middot; RPC: <Code>https://api.metadium.com/dev</Code></p>
            <Table rows={CONTRACTS.map((c) => [c.name, <span key={c.name} className="font-mono text-xs break-all">{c.addr}</span>])} />
          </Section>

          {/* 7. FAQ */}
          <Section id="faq" title={s.faq.title}>
            <div className="space-y-4">
              {s.faq.items.map((faq) => (
                <div key={faq.q} className="stat-card rounded-xl p-4">
                  <p className="font-medium text-zinc-200 text-sm">{faq.q}</p>
                  <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </Section>
        </article>
      </div>
    </div>
  );
}
