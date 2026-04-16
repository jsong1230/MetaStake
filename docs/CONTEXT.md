# Context: MetaStake 프로젝트 배경

## 상위 목표

**메타디움 생태계 활성화.** CTO Jeffrey Song이 설정한 최상위 목표.

## 메타디움 현황 (2026-04)

- 시가총액 $16M, META $0.0094, 100만+ 지갑
- Camellia HF (geth v1.13.14) 검증 완료, 배포 전
- DID 특허 93건, MyKeepin 운영 중
- 핵심 과제: "기술은 준비됐지만 사용자가 적다"

## 기존 testnet 서비스 (10.150.254.110)

| 서비스 | 포트 | 내용 |
|--------|------|------|
| meta-agents | 3100 | AI 에이전트 DID + 트레이딩 리더보드 |
| MetaLotto | 3300 | META 토큰 온체인 복권 |
| MetaPool | 3200 | META 토큰 Binary 예측 마켓 |

전부 Metadium testnet (chainId 12)에 배포. PM2로 운영.

## 생태계 확장 계획

1. **meta-zkbridge** — Ethereum ↔ Metadium 탈중앙화 bridge (진행 중)
2. **MetaStake** — 본 프로젝트, 스테이킹 + 거버넌스 (**B+C 하이브리드**)
3. Meta Portal — 통합 대시보드 (TBD)
4. MetaSwap — DEX (TBD)
5. MetaBadge — 업적 NFT (TBD)

## 왜 MetaStake B+C인가

CTO 선택 근거:
- **순수 이자 모델(A)**은 트레저리 emission 필요 → 인플레이션 우려
- **B (veMETA 거버넌스)** + **C (operator staking)** 조합이 가장 맥락에 맞음
  - 3개 서비스 + 향후 bridge가 모두 수수료 발생 구조
  - veMETA 홀더에게 분배 재원 확보 가능
  - operator staking은 zkBridge 등 서비스의 경제적 보안 레이어로 자연스럽게 연동

## 왜 PoA 체인에서 이런 설계가 가능한가

- 일반적 스테이킹은 consensus 보안을 위한 것이지만, PoA는 authority node가 합의
- 하지만 **생태계 서비스 운영**에는 여전히 경제적 인센티브/보안이 필요
- 즉 이 프로젝트는 consensus가 아닌 **서비스 레이어의 경제 보안**을 다룸

## 관련 인프라

- **배포 서버**: jsong-demo-01 (10.150.254.110) — PM2 호스팅
- **CI/CD**: jsong-cicd-01 (10.150.254.156) — GitHub Actions self-hosted runner
- **go-metadium**: camellia 브랜치 운영 중 (Cancun EIPs 지원)

## 참고 세션

이 프로젝트는 claude-agent (개인비서 세션) 2026-04-16 논의에서 시작.
실제 개발은 이 리포에서 별도 세션으로 진행 예정.

관련 리포:
- https://github.com/jsong1230/meta-agents
- https://github.com/jsong1230/MetaLotto
- https://github.com/jsong1230/MetaPool
- https://github.com/jsong1230/meta-zkbridge
