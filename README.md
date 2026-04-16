# MetaStake

Metadium governance + service operator staking (veMETA model).

## 개요

META 토큰을 락업하여 거버넌스 투표권(veMETA)과 서비스 수수료 분배를 받는 스테이킹 프로토콜. 또한 생태계 서비스(MetaPool dispute, zkBridge relayer 등)의 operator가 되기 위한 경제적 보안 레이어로도 동작.

## 모델: B + C 하이브리드

- **B. veMETA 거버넌스**: 락업 → 투표권 + 수수료 분배
- **C. Service Operator Staking**: 스테이킹 → 서비스 운영 권한 + 성과 수수료 (slash 리스크)

## 기술 스택

- Solidity ^0.8.24 + Foundry
- Frontend: Next.js (TBD)
- Target: Metadium testnet (chainId 12)

## 상태

**Phase 1~4 완료** (99 tests passing)

| Phase | 내용 | 상태 |
|-------|------|------|
| 1 | MetaStake — 락업/veMETA 계산/unlock | 완료 |
| 2 | FeeDistributor — epoch별 수수료 분배 | 완료 |
| 3 | Governance — veMETA 기반 제안/투표/실행 | 완료 |
| 4 | OperatorRegistry — operator 등록/슬래시 | 완료 |

## Quick Start

```bash
cd contracts
forge install
forge test
```

## Deployed Contracts (Testnet)

Metadium testnet (chainId 12, RPC: `https://api.metadium.com/dev`)

| 컨트랙트 | 주소 |
|---------|------|
| MetaStake | `0x9a1d09D75a036c2137b89a8C767e18e77d82ff69` |
| FeeDistributor | `0x26541F01D2fDd70da17a2FEC9e6B23ebe51ed502` |
| Governance | `0x616dE1bE241508Fcc35ba2813883038B9494C90A` |
| OperatorRegistry | `0x19F412E4FB526b3eb89e0bd62A06D2184D915B89` |

자세한 설계는 `docs/DESIGN.md` 참조.
