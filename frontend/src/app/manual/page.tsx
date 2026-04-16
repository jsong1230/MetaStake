"use client";

import Link from "next/link";

const CONTRACTS = [
  { name: "MetaStake", addr: "0x9a1d09D75a036c2137b89a8C767e18e77d82ff69" },
  { name: "FeeDistributor", addr: "0x26541F01D2fDd70da17a2FEC9e6B23ebe51ed502" },
  { name: "Governance", addr: "0x616dE1bE241508Fcc35ba2813883038B9494C90A" },
  { name: "OperatorRegistry", addr: "0x19F412E4FB526b3eb89e0bd62A06D2184D915B89" },
];

const SERVICES = [
  { id: 0, name: "zkBridge Relayer", role: "ZK 증명 온체인 제출", min: "10 META", slash: "10%" },
  { id: 1, name: "Dispute Resolver", role: "MetaPool 분쟁 해결 투표", min: "20 META", slash: "20%" },
  { id: 2, name: "Agent Verifier", role: "meta-agents 신원 검증", min: "10 META", slash: "5%" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-zinc-100 mb-4 pb-2 border-b border-zinc-800">{title}</h2>
      {children}
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-zinc-800 text-blue-400 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-x-auto text-sm font-mono text-zinc-300 leading-relaxed">
      {children}
    </pre>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-300 flex gap-2">
      <span className="shrink-0">⚠️</span>
      <span>{children}</span>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-blue-300">
      {children}
    </div>
  );
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

export default function ManualPage() {
  const toc = [
    { id: "start", label: "시작하기" },
    { id: "staking", label: "META 스테이킹" },
    { id: "rewards", label: "수수료 보상" },
    { id: "governance", label: "거버넌스" },
    { id: "operators", label: "서비스 오퍼레이터" },
    { id: "contracts", label: "컨트랙트 주소" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      {/* Header */}
      <header className="border-b border-zinc-800/80 px-6 py-3 flex items-center justify-between sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              M
            </div>
            <span className="text-base font-semibold text-zinc-100">MetaStake</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-sm text-zinc-400">Manual</span>
        </div>
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition">
          ← App
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar TOC */}
        <nav className="hidden lg:block w-48 shrink-0 sticky top-20 self-start">
          <p className="text-xs uppercase tracking-wider text-zinc-600 font-medium mb-3">목차</p>
          <ul className="space-y-1.5">
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="text-sm text-zinc-500 hover:text-zinc-200 transition block py-0.5">
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <article className="flex-1 min-w-0 space-y-12">
          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold text-zinc-100">사용 매뉴얼</h1>
            <p className="text-zinc-500 mt-2">MetaStake — veMETA 거버넌스 스테이킹 플랫폼</p>
          </div>

          {/* 1. 시작하기 */}
          <Section id="start" title="1. 시작하기">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">MetaMask 네트워크 추가</h3>
                <div className="stat-card rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        ["Network Name", "Metadium Testnet"],
                        ["RPC URL", "https://api.metadium.com/dev"],
                        ["Chain ID", "12"],
                        ["Currency Symbol", "META"],
                      ].map(([k, v]) => (
                        <tr key={k} className="border-b border-zinc-800 last:border-0">
                          <td className="px-4 py-2.5 text-zinc-500 font-medium">{k}</td>
                          <td className="px-4 py-2.5 font-mono text-zinc-200">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-zinc-500 mt-2">
                  MetaMask → Settings → Networks → Add Network → 위 정보 입력
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">지갑 연결</h3>
                <p className="text-sm">사이트 우측 상단 <Code>Connect Wallet</Code> 클릭 → MetaMask 팝업에서 승인.</p>
              </div>
            </div>
          </Section>

          {/* 2. 스테이킹 */}
          <Section id="staking" title="2. META 스테이킹 (veMETA)">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">개념</h3>
                <p className="text-sm leading-relaxed mb-3">
                  META를 일정 기간 <strong className="text-zinc-100">잠금(lock)</strong> 하면 <strong className="text-blue-400">veMETA</strong>를 받는다.
                  veMETA는 시간이 지나며 선형 감소하여 unlock 시점에 0이 된다.
                </p>
                <CodeBlock>{`veMETA = 잠금량 × (남은 기간 / 최대 기간)

예시: 100 META를 26주 lock
→ 초기 veMETA ≈ 100 × (26/52) = 50`}</CodeBlock>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "최소 잠금", value: "1주" },
                  { label: "최대 잠금", value: "52주 (1년)" },
                  { label: "전송", value: "불가 (non-transferable)" },
                ].map((s) => (
                  <div key={s.label} className="stat-card rounded-xl p-3 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
                    <p className="text-sm font-semibold text-zinc-100 mt-1">{s.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">Lock 생성</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-sm">
                  <li><strong className="text-zinc-200">Stake</strong> 탭으로 이동</li>
                  <li><strong className="text-zinc-200">Amount</strong>: 잠글 META 수량 입력</li>
                  <li><strong className="text-zinc-200">Duration</strong>: 잠금 기간 (주 단위) 입력</li>
                  <li>하단에 예상 veMETA가 표시됨</li>
                  <li><strong className="text-zinc-200">Lock META</strong> 클릭 → MetaMask 서명</li>
                </ol>
                <Note>한 주소당 하나의 lock만 가능. 기존 lock이 있으면 새로 생성 불가.</Note>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">META 추가</h3>
                <p className="text-sm">기존 lock에 META를 추가할 수 있다. 잠금 기간은 변경되지 않음. <strong className="text-zinc-200">Add META</strong> 섹션에서 수량 입력 후 <Code>Add</Code> 클릭.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">META 회수 (Withdraw)</h3>
                <p className="text-sm mb-2">잠금 기간 만료 후에만 가능. 만료 시 <Code>Withdraw All META</Code> 버튼이 나타남.</p>
                <Note>만료 전 조기 출금은 불가 (strict lock).</Note>
              </div>
            </div>
          </Section>

          {/* 3. 수수료 보상 */}
          <Section id="rewards" title="3. 수수료 보상 (Rewards)">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">개념</h3>
                <p className="text-sm leading-relaxed">
                  MetaPool, MetaLotto 등 생태계 서비스에서 발생하는 수수료가 FeeDistributor에 모인다.
                  veMETA 보유자는 자신의 지분 비율만큼 매 epoch(1주) 보상을 claim할 수 있다.
                </p>
                <CodeBlock>{`내 보상 = epoch 총 수수료 × (내 veMETA / 전체 veMETA)`}</CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">흐름</h3>
                <StepFlow steps={["서비스 수수료 입금", "1주 경과 (epoch 종료)", "Checkpoint 실행", "Claim Rewards"]} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">Rewards 탭 사용</h3>
                <div className="stat-card rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        ["Current Epoch", "현재 진행 중인 epoch 번호"],
                        ["Epoch 0 Fees", "epoch 0에 모인 수수료 총액"],
                        ["Claimable Rewards", "내가 받을 수 있는 보상 (META)"],
                        ["Checkpoint", "epoch 종료 후 한 번만 실행 (누구든 가능)"],
                        ["Claim Rewards", "claimable > 0일 때 활성화"],
                      ].map(([k, v]) => (
                        <tr key={k} className="border-b border-zinc-800 last:border-0">
                          <td className="px-4 py-2.5 text-zinc-200 font-medium w-44">{k}</td>
                          <td className="px-4 py-2.5 text-zinc-400">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Section>

          {/* 4. 거버넌스 */}
          <Section id="governance" title="4. 거버넌스 (Governance)">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">개념</h3>
                <p className="text-sm leading-relaxed">
                  veMETA 홀더가 생태계 서비스의 파라미터를 변경할 수 있는 온체인 투표 시스템.
                </p>
                <InfoBox>
                  이것은 Metadium 체인 합의(PoA) 거버넌스가 <strong>아닙니다</strong>. MetaStake 생태계 서비스 파라미터 결정용입니다.
                </InfoBox>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">투표 가능 대상 (예시)</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>수수료 분배 비율</li>
                  <li>오퍼레이터 최소 스테이크 금액</li>
                  <li>트레저리 자금 사용</li>
                  <li>새 서비스 추가</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">제안 생명주기</h3>
                <StepFlow steps={["생성", "1일 대기 (Pending)", "3일 투표 (Active)", "결과", "실행 (Executed)"]} />
                <div className="stat-card rounded-xl overflow-hidden mt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="px-4 py-2 text-left text-zinc-500 font-medium">상태</th>
                        <th className="px-4 py-2 text-left text-zinc-500 font-medium">의미</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Pending", "생성 후 votingDelay(1일) 대기", "text-yellow-400"],
                        ["Active", "투표 진행 중 (3일간)", "text-blue-400"],
                        ["Succeeded", "정족수 충족 + 찬성 > 반대", "text-emerald-400"],
                        ["Defeated", "정족수 미달 또는 반대 ≥ 찬성", "text-red-400"],
                        ["Executed", "통과된 제안이 온체인 실행됨", "text-zinc-400"],
                        ["Canceled", "제안자가 취소", "text-zinc-500"],
                      ].map(([status, desc, color]) => (
                        <tr key={status} className="border-b border-zinc-800 last:border-0">
                          <td className={`px-4 py-2 font-medium ${color}`}>{status}</td>
                          <td className="px-4 py-2 text-zinc-400">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">투표 방법</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-sm">
                  <li><strong className="text-zinc-200">Governance</strong> 탭으로 이동</li>
                  <li>Proposal ID 입력, 투표 방향 선택 (For / Against / Abstain)</li>
                  <li><Code>Vote</Code> 클릭</li>
                  <li>투표 가중치 = 투표 시점의 내 veMETA 잔액</li>
                </ol>
              </div>
            </div>
          </Section>

          {/* 5. 오퍼레이터 */}
          <Section id="operators" title="5. 서비스 오퍼레이터 (Operators)">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">개념</h3>
                <p className="text-sm leading-relaxed">
                  생태계 서비스 운영자(operator)가 META를 담보로 스테이킹하고, 서비스를 운영한다.
                  악의적 행위 시 스테이크 일부가 <strong className="text-red-400">슬래싱(삭감)</strong>되어 트레저리로 귀속된다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">등록된 서비스</h3>
                <div className="stat-card rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="px-4 py-2 text-left text-zinc-500 font-medium">서비스</th>
                        <th className="px-4 py-2 text-left text-zinc-500 font-medium">역할</th>
                        <th className="px-4 py-2 text-right text-zinc-500 font-medium">최소</th>
                        <th className="px-4 py-2 text-right text-zinc-500 font-medium">슬래시</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SERVICES.map((s) => (
                        <tr key={s.id} className="border-b border-zinc-800 last:border-0">
                          <td className="px-4 py-2.5 text-zinc-200 font-medium">{s.name}</td>
                          <td className="px-4 py-2.5 text-zinc-400">{s.role}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-zinc-300">{s.min}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-red-400">{s.slash}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">오퍼레이터 되기</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-sm">
                  <li><strong className="text-zinc-200">Operators</strong> 탭에서 원하는 서비스 선택</li>
                  <li>최소 스테이크 이상의 META 입력</li>
                  <li><Code>Stake</Code> 클릭</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">스테이크 해제</h3>
                <StepFlow steps={["Request Unstake", "7일 쿨다운", "Withdraw Stake"]} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">슬래싱</h3>
                <ul className="list-disc list-inside space-y-1.5 text-sm">
                  <li>서비스 admin이 판단하여 슬래시 실행</li>
                  <li>스테이크의 해당 서비스 슬래시율(%) 만큼 삭감</li>
                  <li>삭감분은 트레저리로 이동</li>
                  <li>삭감 후 최소 스테이크 미달 시 자동 비활성화 → 잔여분 즉시 출금 가능</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* 6. 컨트랙트 주소 */}
          <Section id="contracts" title="6. 컨트랙트 주소">
            <p className="text-sm text-zinc-400 mb-3">Metadium Testnet (Chain ID 12) &middot; RPC: <Code>https://api.metadium.com/dev</Code></p>
            <div className="stat-card rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {CONTRACTS.map((c) => (
                    <tr key={c.name} className="border-b border-zinc-800 last:border-0">
                      <td className="px-4 py-2.5 text-zinc-200 font-medium w-44">{c.name}</td>
                      <td className="px-4 py-2.5 font-mono text-zinc-400 text-xs break-all">{c.addr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 7. FAQ */}
          <Section id="faq" title="7. FAQ">
            <div className="space-y-4">
              {[
                {
                  q: "veMETA는 거래할 수 있나요?",
                  a: "아니오. veMETA는 non-transferable이며 ERC-20 토큰이 아닙니다. 스마트 컨트랙트에서 실시간 계산되는 가상의 투표 가중치입니다.",
                },
                {
                  q: "잠금 기간을 줄일 수 있나요?",
                  a: "불가합니다. strict lock 정책으로 만료 전 조기 출금이 불가합니다.",
                },
                {
                  q: "같은 주소로 여러 lock을 만들 수 있나요?",
                  a: "아니오. 주소당 하나의 lock만 허용됩니다. 기존 lock에 META를 추가하거나 기간을 연장하세요.",
                },
                {
                  q: "수수료 보상은 자동으로 들어오나요?",
                  a: "아니오. 매 epoch(1주) 종료 후 누군가 checkpoint를 실행해야 하고, 개인이 claim해야 합니다.",
                },
                {
                  q: "오퍼레이터와 일반 스테이커의 차이는?",
                  a: "일반 스테이커: META lock → veMETA → 수수료 분배 + 거버넌스 투표권. 오퍼레이터: META 스테이크 → 서비스 운영 권한 + 슬래싱 리스크. 둘은 별개이며 동시 참여 가능.",
                },
                {
                  q: "Metadium 체인 거버넌스와 관련이 있나요?",
                  a: "없습니다. MetaStake의 거버넌스는 체인 합의(PoA)와 무관하며, 생태계 서비스의 파라미터를 결정하는 용도입니다.",
                },
              ].map((faq) => (
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
