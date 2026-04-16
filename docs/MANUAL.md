# MetaStake 사용 매뉴얼

## 목차
1. [시작하기](#1-시작하기)
2. [META 스테이킹 (veMETA)](#2-meta-스테이킹-vemeta)
3. [수수료 보상 (Rewards)](#3-수수료-보상-rewards)
4. [거버넌스 (Governance)](#4-거버넌스-governance)
5. [서비스 오퍼레이터 (Operators)](#5-서비스-오퍼레이터-operators)
6. [컨트랙트 주소](#6-컨트랙트-주소)
7. [FAQ](#7-faq)

---

## 1. 시작하기

### 접속
- **Tailscale**: http://100.126.168.26:3400
- **LAN**: http://10.150.254.110:3400

### MetaMask 네트워크 추가

| 항목 | 값 |
|------|-----|
| Network Name | Metadium Testnet |
| RPC URL | `https://api.metadium.com/dev` |
| Chain ID | `12` |
| Currency | META |

MetaMask → Settings → Networks → Add Network → 위 정보 입력.

### 지갑 연결
사이트 우측 상단 **Connect Wallet** 클릭 → MetaMask 팝업에서 승인.

---

## 2. META 스테이킹 (veMETA)

### 개념

META를 일정 기간 **잠금(lock)** 하면 **veMETA** 를 받는다.

```
veMETA = 잠금량 × (남은 기간 / 최대 기간)
```

- veMETA는 시간이 지나며 선형 감소하여 unlock 시점에 0이 됨
- veMETA는 전송 불가 (non-transferable)
- 잠금 기간: 최소 1주 ~ 최대 52주 (1년)

**예시**: 100 META를 26주 lock → 초기 veMETA ≈ 50

### Lock 생성

1. **Stake** 탭으로 이동
2. **Amount**: 잠글 META 수량 입력
3. **Duration**: 잠금 기간 (주 단위) 입력
4. 하단에 예상 veMETA가 표시됨
5. **Lock META** 클릭 → MetaMask 서명

> ⚠️ 한 주소당 하나의 lock만 가능. 기존 lock이 있으면 새로 생성 불가.

### META 추가 (Increase Amount)

기존 lock에 META를 추가할 수 있다. 잠금 기간은 변경되지 않음.

1. **Add META** 섹션에서 추가량 입력
2. **Add** 클릭

### Lock 연장 (Extend Lock)

> 현재 UI에서는 미지원. 컨트랙트 직접 호출로 가능:
> ```bash
> cast send $STAKING "extendLock(uint256)" $NEW_UNLOCK_TIME \
>   --rpc-url https://api.metadium.com/dev --private-key $KEY \
>   --legacy --gas-price 80000000000
> ```

### META 회수 (Withdraw)

잠금 기간이 만료된 후에만 가능.

1. 만료 시 **Withdraw All META** 버튼이 표시됨
2. 클릭하면 전체 잠금 META가 지갑으로 반환됨
3. 반환 후 새 lock을 다시 생성할 수 있음

> ⚠️ 만료 전 조기 출금은 불가 (strict lock).

---

## 3. 수수료 보상 (Rewards)

### 개념

MetaPool, MetaLotto 등 생태계 서비스에서 발생하는 수수료가 **FeeDistributor** 에 모인다. veMETA 보유자는 자신의 지분 비율만큼 매 epoch(1주) 보상을 claim할 수 있다.

```
내 보상 = epoch 총 수수료 × (내 veMETA / 전체 veMETA)
```

### 흐름

```
서비스 → 수수료 입금 → epoch 종료 → checkpoint → claim
```

1. **수수료 입금**: 서비스가 FeeDistributor에 native META를 전송
2. **Epoch 종료**: 1주가 지나면 해당 epoch 종료
3. **Checkpoint**: 누구나 `Checkpoint Epoch N` 버튼으로 해당 epoch의 totalVeMETA를 기록
4. **Claim**: veMETA 홀더가 **Claim Rewards** 클릭하여 보상 수령

### Rewards 탭 사용

- **Current Epoch**: 현재 진행 중인 epoch 번호
- **Epoch 0 Fees**: epoch 0에 모인 수수료 총액
- **Claimable Rewards**: 내가 받을 수 있는 보상 (META)
- **Checkpoint**: epoch 종료 후 한 번만 실행하면 됨 (누구든 가능)
- **Claim Rewards**: claimable > 0일 때 활성화

---

## 4. 거버넌스 (Governance)

### 개념

veMETA 홀더가 생태계 서비스의 파라미터를 변경할 수 있는 온체인 투표 시스템.

> ⚠️ 이것은 Metadium 체인 합의(PoA) 거버넌스가 **아님**. MetaStake 생태계 서비스 파라미터 결정용.

### 투표 가능 대상 (예시)
- 수수료 분배 비율
- 오퍼레이터 최소 스테이크 금액
- 트레저리 자금 사용
- 새 서비스 추가

### 제안 생명주기

```
생성 → 1일 대기(Pending) → 3일 투표(Active) → 결과(Succeeded/Defeated) → 실행(Executed)
```

| 상태 | 의미 |
|------|------|
| Pending | 생성 후 votingDelay(1일) 대기 |
| Active | 투표 진행 중 (3일간) |
| Succeeded | 정족수 충족 + 찬성 > 반대 |
| Defeated | 정족수 미달 또는 반대 ≥ 찬성 |
| Executed | 통과된 제안이 온체인 실행됨 |
| Canceled | 제안자가 취소 |

### 파라미터

| 항목 | 값 |
|------|-----|
| votingDelay | 1일 |
| votingPeriod | 3일 |
| proposalThreshold | 1 veMETA (제안 생성 최소 요건) |
| quorum | 1 veMETA (투표 유효 최소 참여) |

### 투표 방법

1. **Governance** 탭으로 이동
2. Proposal ID 입력, 투표 방향 선택 (For / Against / Abstain)
3. **Vote** 클릭
4. 투표 가중치 = 투표 시점의 내 veMETA 잔액

### 제안 생성

> 현재 UI에서는 투표만 지원. 제안 생성은 컨트랙트 직접 호출:
> ```bash
> cast send $GOVERNANCE "propose(address[],uint256[],bytes[],string)" \
>   "[TARGET_ADDR]" "[0]" "[CALLDATA]" "제안 설명" \
>   --rpc-url https://api.metadium.com/dev --private-key $KEY \
>   --legacy --gas-price 80000000000
> ```

---

## 5. 서비스 오퍼레이터 (Operators)

### 개념

생태계 서비스 운영자(operator)가 META를 담보로 스테이킹하고, 서비스를 운영한다. 악의적 행위 시 스테이크 일부가 **슬래싱(삭감)** 되어 트레저리로 귀속된다.

### 등록된 서비스

| ID | 서비스 | 역할 | 최소 스테이크 | 슬래시율 |
|----|--------|------|:------------:|:--------:|
| 0 | zkBridge Relayer | ZK 증명 온체인 제출 | 10 META | 10% |
| 1 | Dispute Resolver | MetaPool 분쟁 해결 투표 | 20 META | 20% |
| 2 | Agent Verifier | meta-agents 신원 검증 | 10 META | 5% |

### 오퍼레이터 되기

1. **Operators** 탭에서 원하는 서비스 선택
2. 최소 스테이크 이상의 META 입력
3. **Stake** 클릭

### 스테이크 해제

1. **Request Unstake** 클릭 → 7일 쿨다운 시작
2. 7일 후 **Withdraw Stake** 클릭

### 슬래싱

- 서비스 admin이 판단하여 슬래시 실행
- 스테이크의 해당 서비스 슬래시율(%) 만큼 삭감
- 삭감분은 트레저리로 이동
- 삭감 후 최소 스테이크 미달 시 자동 비활성화 → 잔여분은 즉시 출금 가능

---

## 6. 컨트랙트 주소

Metadium Testnet (Chain ID 12)

| 컨트랙트 | 주소 |
|---------|------|
| MetaStake | `0x9a1d09D75a036c2137b89a8C767e18e77d82ff69` |
| FeeDistributor | `0x26541F01D2fDd70da17a2FEC9e6B23ebe51ed502` |
| Governance | `0x616dE1bE241508Fcc35ba2813883038B9494C90A` |
| OperatorRegistry | `0x19F412E4FB526b3eb89e0bd62A06D2184D915B89` |

RPC: `https://api.metadium.com/dev`

---

## 7. FAQ

### veMETA는 거래할 수 있나요?
아니오. veMETA는 non-transferable이며 ERC-20 토큰이 아닙니다. 스마트 컨트랙트에서 실시간 계산되는 가상의 투표 가중치입니다.

### 잠금 기간을 줄일 수 있나요?
불가합니다. strict lock 정책으로 만료 전 조기 출금이 불가합니다.

### 같은 주소로 여러 lock을 만들 수 있나요?
아니오. 주소당 하나의 lock만 허용됩니다. 기존 lock에 META를 추가하거나 기간을 연장하세요.

### 수수료 보상은 자동으로 들어오나요?
아니오. 매 epoch(1주) 종료 후 누군가 checkpoint를 실행해야 하고, 개인이 claim해야 합니다.

### 오퍼레이터와 일반 스테이커의 차이는?
- **일반 스테이커**: META lock → veMETA → 수수료 분배 + 거버넌스 투표권
- **오퍼레이터**: META 스테이크 → 서비스 운영 권한 + 슬래싱 리스크

둘은 별개의 시스템이며 동시에 참여 가능합니다.

### Metadium 체인 거버넌스와 관련이 있나요?
없습니다. MetaStake의 거버넌스는 체인 합의(PoA)와 무관하며, 생태계 서비스의 파라미터를 결정하는 용도입니다.
