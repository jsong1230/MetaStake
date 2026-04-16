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

설계 단계.

자세한 내용은 `docs/DESIGN.md` 참조.
