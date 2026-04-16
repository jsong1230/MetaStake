# MetaStake

## 프로젝트
META 토큰 거버넌스 스테이킹 + 서비스 operator 스테이킹 (veMETA 모델)

## 모델
B + C 하이브리드
- B: veMETA 거버넌스 (락업 → 투표권 + 수수료 분배)
- C: Service operator 스테이킹 (운영 권한 + slash 리스크)

## 기술 스택
- Contracts: Solidity ^0.8.24 + Foundry
- Frontend: Next.js (TBD)
- Target: Metadium testnet (chainId 12)

## 디렉토리
- `contracts/` — Foundry 프로젝트
  - `src/` — 스마트 컨트랙트 (MetaStake, FeeDistributor, Governance, OperatorRegistry)
  - `test/` — Foundry 테스트
  - `script/` — 배포 스크립트 (Deploy.s.sol)
  - `lib/` — 의존성 (forge-std, openzeppelin-contracts)
- `docs/` — 설계 문서

## 생태계 연동
- MetaPool, MetaLotto: 수수료 일부를 veMETA 홀더에게 분배
- meta-zkbridge (예정): relayer operator 스테이킹
- meta-agents: 고신뢰 에이전트 표시에 veMETA 활용 가능

## 참고
- 배포 서버: jsong-demo-01 (10.150.254.110)
- CI/CD: jsong-cicd-01 (10.150.254.156)
