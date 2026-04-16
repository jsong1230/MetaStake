export const LANGS = ["ko", "en", "zh", "ja"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_LABELS: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  zh: "中文",
  ja: "日本語",
};

export interface ManualContent {
  title: string;
  subtitle: string;
  toc: { id: string; label: string }[];
  sections: {
    start: StartSection;
    staking: StakingSection;
    rewards: RewardsSection;
    governance: GovernanceSection;
    operators: OperatorsSection;
    contracts: ContractsSection;
    faq: FaqSection;
  };
}

interface StartSection {
  title: string;
  networkTitle: string;
  networkNote: string;
  connectTitle: string;
  connectDesc: string;
}

interface StakingSection {
  title: string;
  conceptTitle: string;
  conceptDesc: string;
  formula: string;
  example: string;
  specs: { label: string; value: string }[];
  createTitle: string;
  createSteps: string[];
  createNote: string;
  addTitle: string;
  addDesc: string;
  withdrawTitle: string;
  withdrawDesc: string;
  withdrawNote: string;
}

interface RewardsSection {
  title: string;
  conceptTitle: string;
  conceptDesc: string;
  formula: string;
  flowTitle: string;
  flowSteps: string[];
  usageTitle: string;
  usageItems: [string, string][];
}

interface GovernanceSection {
  title: string;
  conceptTitle: string;
  conceptDesc: string;
  notChainGov: string;
  votableTitle: string;
  votableItems: string[];
  lifecycleTitle: string;
  lifecycleSteps: string[];
  states: [string, string][];
  voteTitle: string;
  voteSteps: string[];
}

interface OperatorsSection {
  title: string;
  conceptTitle: string;
  conceptDesc: string;
  servicesTitle: string;
  becomeTitle: string;
  becomeSteps: string[];
  unstakeTitle: string;
  unstakeSteps: string[];
  slashTitle: string;
  slashItems: string[];
}

interface ContractsSection {
  title: string;
  networkNote: string;
}

interface FaqSection {
  title: string;
  items: { q: string; a: string }[];
}

// ─── Korean ──────────────────────────────────────────────────────────────────

const ko: ManualContent = {
  title: "사용 매뉴얼",
  subtitle: "MetaStake — veMETA 거버넌스 스테이킹 플랫폼",
  toc: [
    { id: "start", label: "시작하기" },
    { id: "staking", label: "META 스테이킹" },
    { id: "rewards", label: "수수료 보상" },
    { id: "governance", label: "거버넌스" },
    { id: "operators", label: "서비스 오퍼레이터" },
    { id: "contracts", label: "컨트랙트 주소" },
    { id: "faq", label: "FAQ" },
  ],
  sections: {
    start: {
      title: "1. 시작하기",
      networkTitle: "MetaMask 네트워크 추가",
      networkNote: "MetaMask → Settings → Networks → Add Network → 위 정보 입력",
      connectTitle: "지갑 연결",
      connectDesc: "사이트 우측 상단 Connect Wallet 클릭 → MetaMask 팝업에서 승인.",
    },
    staking: {
      title: "2. META 스테이킹 (veMETA)",
      conceptTitle: "개념",
      conceptDesc: "META를 일정 기간 잠금(lock) 하면 veMETA를 받는다. veMETA는 시간이 지나며 선형 감소하여 unlock 시점에 0이 된다.",
      formula: "veMETA = 잠금량 × (남은 기간 / 최대 기간)",
      example: "예시: 100 META를 26주 lock → 초기 veMETA ≈ 50",
      specs: [
        { label: "최소 잠금", value: "1주" },
        { label: "최대 잠금", value: "52주 (1년)" },
        { label: "전송", value: "불가 (non-transferable)" },
      ],
      createTitle: "Lock 생성",
      createSteps: [
        "Stake 탭으로 이동",
        "Amount: 잠글 META 수량 입력",
        "Duration: 잠금 기간 (주 단위) 입력",
        "하단에 예상 veMETA가 표시됨",
        "Lock META 클릭 → MetaMask 서명",
      ],
      createNote: "한 주소당 하나의 lock만 가능. 기존 lock이 있으면 새로 생성 불가.",
      addTitle: "META 추가",
      addDesc: "기존 lock에 META를 추가할 수 있다. 잠금 기간은 변경되지 않음. Add META 섹션에서 수량 입력 후 Add 클릭.",
      withdrawTitle: "META 회수 (Withdraw)",
      withdrawDesc: "잠금 기간 만료 후에만 가능. 만료 시 Withdraw All META 버튼이 나타남.",
      withdrawNote: "만료 전 조기 출금은 불가 (strict lock).",
    },
    rewards: {
      title: "3. 수수료 보상 (Rewards)",
      conceptTitle: "개념",
      conceptDesc: "MetaPool, MetaLotto 등 생태계 서비스에서 발생하는 수수료가 FeeDistributor에 모인다. veMETA 보유자는 자신의 지분 비율만큼 매 epoch(1주) 보상을 claim할 수 있다.",
      formula: "내 보상 = epoch 총 수수료 × (내 veMETA / 전체 veMETA)",
      flowTitle: "흐름",
      flowSteps: ["서비스 수수료 입금", "1주 경과 (epoch 종료)", "Checkpoint 실행", "Claim Rewards"],
      usageTitle: "Rewards 탭 사용",
      usageItems: [
        ["Current Epoch", "현재 진행 중인 epoch 번호"],
        ["Epoch 0 Fees", "epoch 0에 모인 수수료 총액"],
        ["Claimable Rewards", "내가 받을 수 있는 보상 (META)"],
        ["Checkpoint", "epoch 종료 후 한 번만 실행 (누구든 가능)"],
        ["Claim Rewards", "claimable > 0일 때 활성화"],
      ],
    },
    governance: {
      title: "4. 거버넌스 (Governance)",
      conceptTitle: "개념",
      conceptDesc: "veMETA 홀더가 생태계 서비스의 파라미터를 변경할 수 있는 온체인 투표 시스템.",
      notChainGov: "이것은 Metadium 체인 합의(PoA) 거버넌스가 아닙니다. MetaStake 생태계 서비스 파라미터 결정용입니다.",
      votableTitle: "투표 가능 대상 (예시)",
      votableItems: ["수수료 분배 비율", "오퍼레이터 최소 스테이크 금액", "트레저리 자금 사용", "새 서비스 추가"],
      lifecycleTitle: "제안 생명주기",
      lifecycleSteps: ["생성", "1일 대기 (Pending)", "3일 투표 (Active)", "결과", "실행 (Executed)"],
      states: [
        ["Pending", "생성 후 votingDelay(1일) 대기"],
        ["Active", "투표 진행 중 (3일간)"],
        ["Succeeded", "정족수 충족 + 찬성 > 반대"],
        ["Defeated", "정족수 미달 또는 반대 ≥ 찬성"],
        ["Executed", "통과된 제안이 온체인 실행됨"],
        ["Canceled", "제안자가 취소"],
      ],
      voteTitle: "투표 방법",
      voteSteps: [
        "Governance 탭으로 이동",
        "Proposal ID 입력, 투표 방향 선택 (For / Against / Abstain)",
        "Vote 클릭",
        "투표 가중치 = 투표 시점의 내 veMETA 잔액",
      ],
    },
    operators: {
      title: "5. 서비스 오퍼레이터 (Operators)",
      conceptTitle: "개념",
      conceptDesc: "생태계 서비스 운영자(operator)가 META를 담보로 스테이킹하고, 서비스를 운영한다. 악의적 행위 시 스테이크 일부가 슬래싱(삭감)되어 트레저리로 귀속된다.",
      servicesTitle: "등록된 서비스",
      becomeTitle: "오퍼레이터 되기",
      becomeSteps: ["Operators 탭에서 원하는 서비스 선택", "최소 스테이크 이상의 META 입력", "Stake 클릭"],
      unstakeTitle: "스테이크 해제",
      unstakeSteps: ["Request Unstake", "7일 쿨다운", "Withdraw Stake"],
      slashTitle: "슬래싱",
      slashItems: [
        "서비스 admin이 판단하여 슬래시 실행",
        "스테이크의 해당 서비스 슬래시율(%) 만큼 삭감",
        "삭감분은 트레저리로 이동",
        "삭감 후 최소 스테이크 미달 시 자동 비활성화 → 잔여분 즉시 출금 가능",
      ],
    },
    contracts: {
      title: "6. 컨트랙트 주소",
      networkNote: "Metadium Testnet (Chain ID 12)",
    },
    faq: {
      title: "7. FAQ",
      items: [
        { q: "veMETA는 거래할 수 있나요?", a: "아니오. veMETA는 non-transferable이며 ERC-20 토큰이 아닙니다. 스마트 컨트랙트에서 실시간 계산되는 가상의 투표 가중치입니다." },
        { q: "잠금 기간을 줄일 수 있나요?", a: "불가합니다. strict lock 정책으로 만료 전 조기 출금이 불가합니다." },
        { q: "같은 주소로 여러 lock을 만들 수 있나요?", a: "아니오. 주소당 하나의 lock만 허용됩니다. 기존 lock에 META를 추가하거나 기간을 연장하세요." },
        { q: "수수료 보상은 자동으로 들어오나요?", a: "아니오. 매 epoch(1주) 종료 후 누군가 checkpoint를 실행해야 하고, 개인이 claim해야 합니다." },
        { q: "오퍼레이터와 일반 스테이커의 차이는?", a: "일반 스테이커: META lock → veMETA → 수수료 분배 + 거버넌스 투표권. 오퍼레이터: META 스테이크 → 서비스 운영 권한 + 슬래싱 리스크. 둘은 별개이며 동시 참여 가능." },
        { q: "Metadium 체인 거버넌스와 관련이 있나요?", a: "없습니다. MetaStake의 거버넌스는 체인 합의(PoA)와 무관하며, 생태계 서비스의 파라미터를 결정하는 용도입니다." },
      ],
    },
  },
};

// ─── English ─────────────────────────────────────────────────────────────────

const en: ManualContent = {
  title: "User Manual",
  subtitle: "MetaStake — veMETA Governance Staking Platform",
  toc: [
    { id: "start", label: "Getting Started" },
    { id: "staking", label: "META Staking" },
    { id: "rewards", label: "Fee Rewards" },
    { id: "governance", label: "Governance" },
    { id: "operators", label: "Service Operators" },
    { id: "contracts", label: "Contract Addresses" },
    { id: "faq", label: "FAQ" },
  ],
  sections: {
    start: {
      title: "1. Getting Started",
      networkTitle: "Add MetaMask Network",
      networkNote: "MetaMask → Settings → Networks → Add Network → Enter the info above",
      connectTitle: "Connect Wallet",
      connectDesc: "Click Connect Wallet at the top right → Approve in MetaMask popup.",
    },
    staking: {
      title: "2. META Staking (veMETA)",
      conceptTitle: "Concept",
      conceptDesc: "Lock META for a period to receive veMETA. veMETA decays linearly over time and reaches 0 at unlock.",
      formula: "veMETA = locked_amount × (remaining_time / max_lock)",
      example: "Example: Lock 100 META for 26 weeks → Initial veMETA ≈ 50",
      specs: [
        { label: "Min Lock", value: "1 week" },
        { label: "Max Lock", value: "52 weeks (1 year)" },
        { label: "Transfer", value: "Not allowed (non-transferable)" },
      ],
      createTitle: "Create Lock",
      createSteps: [
        "Go to the Stake tab",
        "Amount: Enter META quantity to lock",
        "Duration: Enter lock period (in weeks)",
        "Estimated veMETA is shown below",
        "Click Lock META → Sign in MetaMask",
      ],
      createNote: "Only one lock per address. Cannot create a new one if a lock already exists.",
      addTitle: "Add META",
      addDesc: "You can add META to an existing lock. The lock period remains unchanged. Enter the amount in the Add META section and click Add.",
      withdrawTitle: "Withdraw META",
      withdrawDesc: "Only available after the lock period expires. A Withdraw All META button appears upon expiry.",
      withdrawNote: "Early withdrawal before expiry is not allowed (strict lock).",
    },
    rewards: {
      title: "3. Fee Rewards",
      conceptTitle: "Concept",
      conceptDesc: "Fees from ecosystem services (MetaPool, MetaLotto, etc.) are collected in the FeeDistributor. veMETA holders can claim their proportional share every epoch (1 week).",
      formula: "my_reward = epoch_total_fees × (my_veMETA / total_veMETA)",
      flowTitle: "Flow",
      flowSteps: ["Service fee deposit", "1 week passes (epoch ends)", "Checkpoint executed", "Claim Rewards"],
      usageTitle: "Using the Rewards Tab",
      usageItems: [
        ["Current Epoch", "Current ongoing epoch number"],
        ["Epoch 0 Fees", "Total fees collected in epoch 0"],
        ["Claimable Rewards", "Rewards you can claim (META)"],
        ["Checkpoint", "Execute once after epoch ends (anyone can do this)"],
        ["Claim Rewards", "Enabled when claimable > 0"],
      ],
    },
    governance: {
      title: "4. Governance",
      conceptTitle: "Concept",
      conceptDesc: "An on-chain voting system where veMETA holders can change ecosystem service parameters.",
      notChainGov: "This is NOT Metadium chain consensus (PoA) governance. It is for MetaStake ecosystem service parameter decisions only.",
      votableTitle: "Votable Topics (Examples)",
      votableItems: ["Fee distribution ratio", "Operator minimum stake amount", "Treasury fund usage", "Adding new services"],
      lifecycleTitle: "Proposal Lifecycle",
      lifecycleSteps: ["Create", "1-day delay (Pending)", "3-day voting (Active)", "Result", "Execute (Executed)"],
      states: [
        ["Pending", "Waiting for votingDelay (1 day) after creation"],
        ["Active", "Voting in progress (3 days)"],
        ["Succeeded", "Quorum met + For > Against"],
        ["Defeated", "Quorum not met or Against ≥ For"],
        ["Executed", "Passed proposal executed on-chain"],
        ["Canceled", "Canceled by proposer"],
      ],
      voteTitle: "How to Vote",
      voteSteps: [
        "Go to the Governance tab",
        "Enter Proposal ID, select vote direction (For / Against / Abstain)",
        "Click Vote",
        "Vote weight = your veMETA balance at vote time",
      ],
    },
    operators: {
      title: "5. Service Operators",
      conceptTitle: "Concept",
      conceptDesc: "Service operators stake META as collateral to run ecosystem services. Malicious behavior triggers slashing — a portion of the stake is transferred to the treasury.",
      servicesTitle: "Registered Services",
      becomeTitle: "Become an Operator",
      becomeSteps: ["Select a service in the Operators tab", "Enter META equal to or above minimum stake", "Click Stake"],
      unstakeTitle: "Unstaking",
      unstakeSteps: ["Request Unstake", "7-day cooldown", "Withdraw Stake"],
      slashTitle: "Slashing",
      slashItems: [
        "Service admin executes the slash",
        "Stake reduced by the service's slash rate (%)",
        "Slashed amount goes to treasury",
        "If remaining stake falls below minimum, auto-deactivated → remaining can be withdrawn immediately",
      ],
    },
    contracts: {
      title: "6. Contract Addresses",
      networkNote: "Metadium Testnet (Chain ID 12)",
    },
    faq: {
      title: "7. FAQ",
      items: [
        { q: "Can veMETA be traded?", a: "No. veMETA is non-transferable and is not an ERC-20 token. It is a virtual voting weight calculated in real-time by the smart contract." },
        { q: "Can I shorten the lock period?", a: "No. Under the strict lock policy, early withdrawal before expiry is not possible." },
        { q: "Can I create multiple locks with the same address?", a: "No. Only one lock per address is allowed. You can add META to an existing lock or extend the period." },
        { q: "Are fee rewards distributed automatically?", a: "No. After each epoch (1 week) ends, someone must execute a checkpoint, and individuals must claim manually." },
        { q: "What's the difference between operators and regular stakers?", a: "Regular stakers: META lock → veMETA → fee distribution + governance voting. Operators: META stake → service operation rights + slashing risk. They are separate systems and you can participate in both." },
        { q: "Is this related to Metadium chain governance?", a: "No. MetaStake governance is unrelated to chain consensus (PoA) and is used to decide ecosystem service parameters." },
      ],
    },
  },
};

// ─── Chinese ─────────────────────────────────────────────────────────────────

const zh: ManualContent = {
  title: "使用手册",
  subtitle: "MetaStake — veMETA 治理质押平台",
  toc: [
    { id: "start", label: "开始使用" },
    { id: "staking", label: "META 质押" },
    { id: "rewards", label: "手续费奖励" },
    { id: "governance", label: "治理" },
    { id: "operators", label: "服务运营商" },
    { id: "contracts", label: "合约地址" },
    { id: "faq", label: "常见问题" },
  ],
  sections: {
    start: {
      title: "1. 开始使用",
      networkTitle: "添加 MetaMask 网络",
      networkNote: "MetaMask → Settings → Networks → Add Network → 输入以上信息",
      connectTitle: "连接钱包",
      connectDesc: "点击右上角 Connect Wallet → 在 MetaMask 弹窗中确认。",
    },
    staking: {
      title: "2. META 质押 (veMETA)",
      conceptTitle: "概念",
      conceptDesc: "将 META 锁定一段时间即可获得 veMETA。veMETA 随时间线性衰减，在解锁时归零。",
      formula: "veMETA = 锁定量 × (剩余时间 / 最大锁定期)",
      example: "示例：锁定 100 META 26周 → 初始 veMETA ≈ 50",
      specs: [
        { label: "最短锁定", value: "1周" },
        { label: "最长锁定", value: "52周（1年）" },
        { label: "转账", value: "不可（non-transferable）" },
      ],
      createTitle: "创建锁定",
      createSteps: [
        "前往 Stake 标签页",
        "Amount：输入锁定的 META 数量",
        "Duration：输入锁定期（以周为单位）",
        "下方显示预估 veMETA",
        "点击 Lock META → MetaMask 签名",
      ],
      createNote: "每个地址只能有一个锁定。已有锁定时无法创建新的。",
      addTitle: "追加 META",
      addDesc: "可以向现有锁定追加 META。锁定期不变。在 Add META 区域输入数量后点击 Add。",
      withdrawTitle: "提取 META（Withdraw）",
      withdrawDesc: "仅在锁定期满后可用。到期后会出现 Withdraw All META 按钮。",
      withdrawNote: "到期前不可提前提取（strict lock）。",
    },
    rewards: {
      title: "3. 手续费奖励（Rewards）",
      conceptTitle: "概念",
      conceptDesc: "来自生态服务（MetaPool、MetaLotto 等）的手续费汇集到 FeeDistributor。veMETA 持有者可按比例每个 epoch（1周）领取奖励。",
      formula: "我的奖励 = epoch 总手续费 × (我的 veMETA / 总 veMETA)",
      flowTitle: "流程",
      flowSteps: ["服务手续费存入", "1周过后（epoch 结束）", "执行 Checkpoint", "Claim Rewards"],
      usageTitle: "Rewards 标签页使用",
      usageItems: [
        ["Current Epoch", "当前进行中的 epoch 编号"],
        ["Epoch 0 Fees", "epoch 0 收集的总手续费"],
        ["Claimable Rewards", "可领取的奖励（META）"],
        ["Checkpoint", "epoch 结束后执行一次（任何人都可以）"],
        ["Claim Rewards", "claimable > 0 时激活"],
      ],
    },
    governance: {
      title: "4. 治理（Governance）",
      conceptTitle: "概念",
      conceptDesc: "veMETA 持有者可以通过链上投票系统更改生态服务参数。",
      notChainGov: "这不是 Metadium 链共识（PoA）治理。仅用于 MetaStake 生态服务参数决策。",
      votableTitle: "可投票事项（示例）",
      votableItems: ["手续费分配比例", "运营商最低质押金额", "国库资金使用", "添加新服务"],
      lifecycleTitle: "提案生命周期",
      lifecycleSteps: ["创建", "1天等待（Pending）", "3天投票（Active）", "结果", "执行（Executed）"],
      states: [
        ["Pending", "创建后等待 votingDelay（1天）"],
        ["Active", "投票进行中（3天）"],
        ["Succeeded", "达到法定人数 + 赞成 > 反对"],
        ["Defeated", "未达法定人数或反对 ≥ 赞成"],
        ["Executed", "通过的提案已在链上执行"],
        ["Canceled", "提案者取消"],
      ],
      voteTitle: "如何投票",
      voteSteps: [
        "前往 Governance 标签页",
        "输入 Proposal ID，选择投票方向（For / Against / Abstain）",
        "点击 Vote",
        "投票权重 = 投票时的 veMETA 余额",
      ],
    },
    operators: {
      title: "5. 服务运营商（Operators）",
      conceptTitle: "概念",
      conceptDesc: "服务运营商将 META 作为抵押品进行质押，运营生态服务。恶意行为将触发罚没（slashing）——部分质押将转入国库。",
      servicesTitle: "已注册服务",
      becomeTitle: "成为运营商",
      becomeSteps: ["在 Operators 标签页选择服务", "输入不低于最低质押的 META", "点击 Stake"],
      unstakeTitle: "解除质押",
      unstakeSteps: ["Request Unstake", "7天冷却期", "Withdraw Stake"],
      slashTitle: "罚没（Slashing）",
      slashItems: [
        "服务管理员执行罚没",
        "按服务的罚没率（%）扣减质押",
        "罚没金额转入国库",
        "扣减后低于最低质押时自动停用 → 剩余可立即提取",
      ],
    },
    contracts: {
      title: "6. 合约地址",
      networkNote: "Metadium 测试网（Chain ID 12）",
    },
    faq: {
      title: "7. 常见问题",
      items: [
        { q: "veMETA 可以交易吗？", a: "不可以。veMETA 是 non-transferable 的，不是 ERC-20 代币。它是智能合约实时计算的虚拟投票权重。" },
        { q: "可以缩短锁定期吗？", a: "不可以。strict lock 策略下，到期前无法提前提取。" },
        { q: "同一地址可以创建多个锁定吗？", a: "不可以。每个地址只允许一个锁定。可以追加 META 或延长期限。" },
        { q: "手续费奖励会自动发放吗？", a: "不会。每个 epoch（1周）结束后需要有人执行 checkpoint，个人需要手动 claim。" },
        { q: "运营商和普通质押者有什么区别？", a: "普通质押者：META lock → veMETA → 手续费分配 + 治理投票权。运营商：META 质押 → 服务运营权 + 罚没风险。两者独立，可同时参与。" },
        { q: "这与 Metadium 链治理有关吗？", a: "无关。MetaStake 治理与链共识（PoA）无关，仅用于决定生态服务参数。" },
      ],
    },
  },
};

// ─── Japanese ────────────────────────────────────────────────────────────────

const ja: ManualContent = {
  title: "ユーザーマニュアル",
  subtitle: "MetaStake — veMETA ガバナンスステーキングプラットフォーム",
  toc: [
    { id: "start", label: "はじめに" },
    { id: "staking", label: "META ステーキング" },
    { id: "rewards", label: "手数料報酬" },
    { id: "governance", label: "ガバナンス" },
    { id: "operators", label: "サービスオペレーター" },
    { id: "contracts", label: "コントラクトアドレス" },
    { id: "faq", label: "FAQ" },
  ],
  sections: {
    start: {
      title: "1. はじめに",
      networkTitle: "MetaMask ネットワーク追加",
      networkNote: "MetaMask → Settings → Networks → Add Network → 上記情報を入力",
      connectTitle: "ウォレット接続",
      connectDesc: "右上の Connect Wallet をクリック → MetaMask ポップアップで承認。",
    },
    staking: {
      title: "2. META ステーキング（veMETA）",
      conceptTitle: "概要",
      conceptDesc: "META を一定期間ロック（lock）すると veMETA を受け取れます。veMETA は時間の経過とともに線形に減少し、アンロック時にゼロになります。",
      formula: "veMETA = ロック量 ×（残り期間 / 最大期間）",
      example: "例：100 META を26週ロック → 初期 veMETA ≈ 50",
      specs: [
        { label: "最短ロック", value: "1週間" },
        { label: "最長ロック", value: "52週（1年）" },
        { label: "送金", value: "不可（non-transferable）" },
      ],
      createTitle: "ロック作成",
      createSteps: [
        "Stake タブへ移動",
        "Amount：ロックする META 数量を入力",
        "Duration：ロック期間（週単位）を入力",
        "下部に推定 veMETA が表示される",
        "Lock META をクリック → MetaMask で署名",
      ],
      createNote: "アドレスごとに1つのロックのみ可能。既存のロックがある場合は新規作成不可。",
      addTitle: "META 追加",
      addDesc: "既存のロックに META を追加できます。ロック期間は変更されません。Add META セクションで数量を入力し Add をクリック。",
      withdrawTitle: "META 引き出し（Withdraw）",
      withdrawDesc: "ロック期間満了後のみ可能。満了時に Withdraw All META ボタンが表示されます。",
      withdrawNote: "満了前の早期引き出しは不可（strict lock）。",
    },
    rewards: {
      title: "3. 手数料報酬（Rewards）",
      conceptTitle: "概要",
      conceptDesc: "MetaPool、MetaLotto などのエコシステムサービスからの手数料が FeeDistributor に集まります。veMETA 保有者は自分の持分比率に応じて、各 epoch（1週間）ごとに報酬を claim できます。",
      formula: "報酬 = epoch 総手数料 ×（自分の veMETA / 全体 veMETA）",
      flowTitle: "フロー",
      flowSteps: ["サービス手数料入金", "1週間経過（epoch 終了）", "Checkpoint 実行", "Claim Rewards"],
      usageTitle: "Rewards タブの使い方",
      usageItems: [
        ["Current Epoch", "現在進行中の epoch 番号"],
        ["Epoch 0 Fees", "epoch 0 で集まった手数料総額"],
        ["Claimable Rewards", "受け取り可能な報酬（META）"],
        ["Checkpoint", "epoch 終了後に1回実行（誰でも可）"],
        ["Claim Rewards", "claimable > 0 のとき有効化"],
      ],
    },
    governance: {
      title: "4. ガバナンス（Governance）",
      conceptTitle: "概要",
      conceptDesc: "veMETA ホルダーがエコシステムサービスのパラメータを変更できるオンチェーン投票システム。",
      notChainGov: "これは Metadium チェーンの合意（PoA）ガバナンスではありません。MetaStake エコシステムサービスのパラメータ決定専用です。",
      votableTitle: "投票可能な事項（例）",
      votableItems: ["手数料配分比率", "オペレーター最低ステーク金額", "トレジャリー資金の使用", "新サービスの追加"],
      lifecycleTitle: "提案のライフサイクル",
      lifecycleSteps: ["作成", "1日待機（Pending）", "3日投票（Active）", "結果", "実行（Executed）"],
      states: [
        ["Pending", "作成後 votingDelay（1日）待機"],
        ["Active", "投票進行中（3日間）"],
        ["Succeeded", "定足数達成 + 賛成 > 反対"],
        ["Defeated", "定足数未達または反対 ≥ 賛成"],
        ["Executed", "可決された提案がオンチェーンで実行済み"],
        ["Canceled", "提案者によりキャンセル"],
      ],
      voteTitle: "投票方法",
      voteSteps: [
        "Governance タブへ移動",
        "Proposal ID を入力、投票方向を選択（For / Against / Abstain）",
        "Vote をクリック",
        "投票の重み = 投票時点の自分の veMETA 残高",
      ],
    },
    operators: {
      title: "5. サービスオペレーター（Operators）",
      conceptTitle: "概要",
      conceptDesc: "サービスオペレーターは META を担保としてステーキングし、サービスを運営します。悪意ある行為が発覚した場合、ステークの一部がスラッシュ（削減）されトレジャリーに移転されます。",
      servicesTitle: "登録済みサービス",
      becomeTitle: "オペレーターになる",
      becomeSteps: ["Operators タブで希望するサービスを選択", "最低ステーク以上の META を入力", "Stake をクリック"],
      unstakeTitle: "ステーク解除",
      unstakeSteps: ["Request Unstake", "7日クールダウン", "Withdraw Stake"],
      slashTitle: "スラッシング",
      slashItems: [
        "サービス管理者がスラッシュを実行",
        "サービスのスラッシュ率（%）分だけステークが削減",
        "削減分はトレジャリーに移転",
        "削減後に最低ステークを下回った場合、自動無効化 → 残額は即時引き出し可能",
      ],
    },
    contracts: {
      title: "6. コントラクトアドレス",
      networkNote: "Metadium テストネット（Chain ID 12）",
    },
    faq: {
      title: "7. FAQ",
      items: [
        { q: "veMETA は取引できますか？", a: "いいえ。veMETA は non-transferable であり、ERC-20 トークンではありません。スマートコントラクトがリアルタイムで計算する仮想的な投票重みです。" },
        { q: "ロック期間を短縮できますか？", a: "できません。strict lock ポリシーにより、満了前の早期引き出しは不可能です。" },
        { q: "同じアドレスで複数のロックを作成できますか？", a: "できません。アドレスごとに1つのロックのみ許可されます。既存のロックに META を追加するか、期間を延長してください。" },
        { q: "手数料報酬は自動で入りますか？", a: "いいえ。各 epoch（1週間）終了後に誰かが checkpoint を実行する必要があり、個人が claim する必要があります。" },
        { q: "オペレーターと一般ステーカーの違いは？", a: "一般ステーカー：META lock → veMETA → 手数料分配 + ガバナンス投票権。オペレーター：META ステーク → サービス運営権限 + スラッシングリスク。両者は別系統で、同時参加可能です。" },
        { q: "Metadium チェーンのガバナンスと関係ありますか？", a: "ありません。MetaStake のガバナンスはチェーン合意（PoA）とは無関係で、エコシステムサービスのパラメータ決定に使用されます。" },
      ],
    },
  },
};

export const TRANSLATIONS: Record<Lang, ManualContent> = { ko, en, zh, ja };
