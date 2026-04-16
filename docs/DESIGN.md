# MetaStake 설계 문서

## 배경

메타디움은 PoA(Proof of Authority) 체인이라 이더리움/코스모스 같은 consensus staking은 불가능하다. 하지만 생태계 서비스들(MetaPool, MetaLotto, meta-agents, 향후 meta-zkbridge)에서 발생하는 수수료와 운영 역할을 기반으로 한 스테이킹은 가능하다.

**목표:**
- META 토큰에 실질 유틸리티 부여 (보유 이유)
- 생태계 서비스 성장 시 스테이커 가치 상승 (positive flywheel)
- 서비스 운영(operator)에 경제적 보안 제공

## 모델: B + C 하이브리드

### B. veMETA 거버넌스 + 수수료 분배

Curve Finance의 veCRV에서 영감. META를 락업하면 락업 기간에 비례해 **veMETA**(non-transferable 투표권) 획득.

**핵심 메커니즘:**
```
veMETA(user) = META_locked × (lock_remaining / MAX_LOCK)
```

- 최대 락업 기간: **4년** (or 1년, 테스트넷이니 짧게 조정 가능)
- 최소 락업 기간: **1주**
- veMETA는 시간이 지나며 linear하게 감소 (unlock에 가까워질수록 0에 수렴)
- 사용자는 lock 연장 또는 META 추가 가능
- veMETA는 전송 불가

**권한:**
- 거버넌스 투표 (서비스 파라미터, 트레저리, 신규 서비스 통합)
- 주간 수수료 분배 수령

### C. Service Operator Staking

생태계 서비스는 operator를 필요로 함:
- **zkBridge relayer**: ZK 증명을 온체인에 제출
- **MetaPool dispute resolver**: 분쟁 해결 투표
- **meta-agents 인증 노드**: 에이전트 검증

Operator가 되려면:
1. 서비스별 지정된 양의 META 또는 veMETA 스테이킹
2. Slashing 조건 동의
3. 성공적으로 작업 수행 시 수수료 수령

**Slashing 조건 (서비스별):**
| 서비스 | 조건 | 슬래시 비율 |
|--------|------|------------|
| Bridge relayer | 잘못된/지연된 proof 제출 | 5~10% |
| Dispute resolver | 다수와 반대 투표 (악의적) | 10~20% |
| Agent 인증 노드 | 부정확한 검증 | 5~10% |

슬래시된 META는 **트레저리로 반환** (burn은 옵션).

## 컨트랙트 구조

```
┌──────────────────────────┐
│  MetaStake (core)        │
│  - lock/unlock META      │
│  - veMETA balance 계산    │
└────────────┬─────────────┘
             │
             ├── FeeCollector
             │   - 서비스에서 수수료 수취
             │   - 주간 epoch로 veMETA 홀더에 분배
             │
             ├── Governance
             │   - veMETA 기반 투표
             │   - 제안/실행
             │
             └── OperatorRegistry
                 - 서비스별 operator 등록/해제
                 - Slashing 실행
```

### 컨트랙트 목록

| 컨트랙트 | 역할 |
|---------|------|
| `MetaStake.sol` | META 락업, veMETA balance, lock 관리 |
| `FeeCollector.sol` | 서비스 수수료 수취 → epoch별 분배 |
| `FeeDistributor.sol` | veMETA 가중치 기반 claim |
| `Governance.sol` | 제안/투표/실행 |
| `OperatorRegistry.sol` | Operator 등록/슬래시 |
| `ServiceAdapter.sol` (per-service) | 각 서비스와의 연결 |

## Phase 로드맵

### Phase 1: 기본 스테이킹 + veMETA (2주)
- `MetaStake.sol` 컨트랙트
- 락업/veMETA 계산/unlock
- 기본 UI (lock/view/unlock)
- Metadium testnet 배포

**성공 기준:** META 락업 → veMETA 획득 → 시간 경과에 따른 감소 확인

### Phase 2: Fee 분배 (2주)
- `FeeCollector` + `FeeDistributor`
- MetaPool/MetaLotto에서 수수료 일부를 FeeCollector로 전송하도록 adapter 추가
- 주간 epoch로 veMETA 가중 분배
- UI에 "claim rewards" 추가

**성공 기준:** 서비스 수수료 → veMETA 홀더 분배 → claim 성공

### Phase 3: Governance (2주)
- `Governance.sol` (OpenZeppelin Governor 기반)
- 제안 생성/투표/실행
- 간단한 파라미터 변경 제안 (예: 수수료율)

### Phase 4: Operator Staking (3~4주)
- `OperatorRegistry`
- 서비스별 adapter (`BridgeRelayer`, `DisputeResolver` 등)
- Slashing 로직
- zkBridge relayer 연동이 첫 target

## 기술적 결정 사항

### veMETA 계산 방식
Curve 방식을 채택하되 단순화:
- 사용자 lock 정보: `(amount, unlock_time)`
- veMETA = `amount × max(0, unlock_time - now) / MAX_LOCK`
- 실시간 계산, 저장 안 함

### 수수료 분배 주기
- **주간 epoch** (604800초)
- 각 epoch의 시작 시점 veMETA snapshot 기준으로 분배

### Unlock 정책
- **락업 기간 만료 전 강제 unlock 불가** (veCRV 방식)
- 대안: 페널티 있는 조기 unlock (ve8020 등 변형 모델)
- **초기에는 strict lock 채택**

## 오픈 이슈

1. **최대 락업 기간**: 4년 vs 1년 (testnet이니까 짧게 해서 테스트 쉽게)
2. **수수료 비중**: 서비스 수수료의 몇 %를 stakers에게 분배할지
3. **Governance 권한 범위**: 어디까지 veMETA 투표로 결정할지
4. **Bootstrap 인센티브**: 초기 스테이커에게 추가 보상 (emissions) 줄지
5. **meta-agents와의 연결**: 고신뢰 에이전트에 veMETA 요구?

## 생태계 연동 맵

```
                     ┌─────────────┐
                     │  MetaStake   │
                     │  (veMETA)    │
                     └──────┬───────┘
                            │
       ┌────────────────────┼─────────────────────┐
       │                    │                     │
       ▼                    ▼                     ▼
┌────────────┐      ┌────────────┐        ┌─────────────┐
│ MetaPool   │      │ MetaLotto  │        │ meta-zkbridge│
│ dispute    │      │ fee share  │        │ relayer     │
│ resolver   │      │            │        │ operator    │
└────────────┘      └────────────┘        └─────────────┘
       │                    │                     │
       └────────────── 수수료 ────────────────────┘
                            │
                            ▼
                    veMETA 홀더에 분배
```

## 참고

- [Curve veCRV whitepaper](https://resources.curve.fi/base-features/understanding-crv)
- [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/4.x/api/governance)
- [EigenLayer (restaking 참고)](https://docs.eigenlayer.xyz/)
