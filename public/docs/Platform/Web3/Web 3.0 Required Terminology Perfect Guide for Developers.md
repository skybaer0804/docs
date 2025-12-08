# Web3 개발자를 위한 필수 용어 완벽 가이드

## 프로그래밍 언어 & 스마트 계약

### Solidity

Solidity는 Ethereum Virtual Machine (EVM)에서 실행되는 스마트 계약을 개발하기 위한 고급 프로그래밍 언어입니다. 2014년 Christian Reitwiessner가 제안했으며, 정적 타입, 객체지향의 특성을 가집니다.

**주요 특징:**

-   **Turing 완전성**: 이론상 개발자가 필요한 모든 계산을 수행할 수 있습니다
-   **EVM 컴파일**: Solidity 코드는 EVM이 읽을 수 있는 바이트코드로 컴파일됩니다
-   **고수준 언어**: 메모리나 바이트코드 같은 시스템 수준 조작이 필요 없습니다
-   **언어 영향**: C++, Python, JavaScript에 영향을 받았습니다

**구조:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

contract HelloWorld {
    string public message = "Hello, World!";

    function getMessage() external view returns (string memory) {
        return message;
    }
}
```

Solidity는 현재 업계에서 가장 널리 사용되는 스마트 계약 언어입니다. Polygon, Arbitrum, Optimism 같은 EVM 호환 체인에서도 사용 가능합니다.

## 스마트 계약 개발 프레임워크

### Hardhat

Hardhat은 최신의 개발자 중심 스마트 계약 프레임워크입니다. TypeScript 지원과 포괄적인 플러그인 생태계를 자랑합니다.

**핵심 기능:**

-   **Rust 기반 런타임**: Hardhat 3는 Rust로 작성되어 탁월한 성능을 제공합니다
-   **TypeScript 기본 지원**: 기존 웹 개발자의 경험을 활용할 수 있습니다
-   **상세한 디버깅**: 거래가 실패하면 "Non-payable function was called with value"와 같은 명확한 에러 메시지를 제공합니다
-   **멀티 언어 테스팅**: Solidity와 TypeScript 테스트를 혼합하여 작성 가능합니다
-   **플러그인 에코시스템**: 기능 확장이 용이합니다

**워크플로우:**

```bash
npx hardhat init
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js
```

**언제 사용할까?**

-   TypeScript 통합이 필요한 프로젝트
-   풍부한 플러그인 생태계를 원할 때
-   복잡한 개발 요구사항이 있을 때

### Foundry

초고속 성능을 추구하는 개발자를 위한 프레임워크입니다.

**장점:**

-   **빠른 테스트 속도**: Solidity로 작성된 테스트가 매우 빠릅니다
-   **Fuzz 테스팅**: 무작위 입력으로 계약을 테스트합니다
-   **Cheat codes**: 시간 조작, 상태 스냅샷 등 고급 테스트 기능
-   **Cast**: Blockchain 상호작용을 위한 CLI 도구

**워크플로우:**

```bash
forge init
forge build
forge test
forge script script/Deploy.s.sol --broadcast
```

**더 적합한 경우:**

-   성능이 최우선일 때
-   Substrate/Polkadot을 대상으로 할 때
-   Solidity로 테스트를 작성하고 싶을 때

### Truffle

업계 최초의 스마트 계약 프레임워크 (2015년 출시). 현재는 Hardhat과 Foundry에 밀렸지만, 여전히 사용됩니다.

**특징:**

-   통합 개발 환경
-   마이그레이션 기반 배포
-   포괄적인 도구 모음

> **주의**: Truffle은 최근 업데이트가 중단되었습니다.

### Waffle

OpenZeppelin과 Ethers.js 개발팀에 의해 만들어진 테스팅 라이브러리입니다. Hardhat이 더 인기 있습니다.

## 스케일링 솔루션: Layer 1 vs Layer 2

### Layer 1 (L1)

기본 블록체인 자체입니다. 모든 거래가 메인 블록체인에서 처리되고, 모든 노드가 검증합니다.

**특징:**

-   **최대 보안**: 전체 네트워크가 거래를 검증합니다
-   **완전 탈중앙화**: 중간 관리자 없음
-   **낮은 처리량**: Ethereum은 초당 약 15-30 거래
-   **높은 가스비**: 네트워크 혼잡 시 $5-50

**예시**: Ethereum, Bitcoin, Solana

**L1 스케일링 방법:**

-   **합의 메커니즘 최적화**: Core의 Satoshi Plus처럼 효율적인 합의
-   **Sharding**: 체인을 병렬 처리 세그먼트로 분할
-   **블록 파라미터 조정**: 블록 크기 증가 또는 블록 시간 감소

### Layer 2 (L2)

L1 위에 구축되는 스케일링 솔루션입니다. 거래를 오프체인에서 처리한 후, L1에 최종 정산합니다.

**특징:**

-   **높은 처리량**: 초당 1,000-4,000 거래
-   **낮은 가스비**: $0.01-0.1
-   **빠른 거래**: 밀리초 단위 확인
-   **L1 보안 상속**: L1의 보안을 기반으로 함

**트레이드오프:**

-   추가 신뢰 가정 (시퀀서, 오퍼레이터 등)
-   브리지 사용의 번거로움
-   L1으로 최종 정산 대기

| 측면   | Layer 1        | Layer 2        |
| ------ | -------------- | -------------- |
| 처리량 | 15-30 TPS      | 1,000+ TPS     |
| 가스비 | $5-50          | $0.01-0.1      |
| 최종성 | 블록 확정 시점 | 정산 대기 시간 |
| 보안   | 최대           | L1에 의존      |
| 복잡성 | 낮음           | 브리지 필요    |

### Optimistic Rollups

거래가 유효하다고 가정하는 L2 솔루션입니다.

**작동 방식:**

1. 다수의 거래를 배치로 수집합니다
2. L1에 배치 제출
3. 분쟁 기간 (최대 7일) 동안 누구든 사기 증명을 제출할 수 있습니다
4. 이의가 없으면 최종 확정

**특징:**

-   **빠른 제출**: 유효성 검증 불필요
-   **느린 최종성**: 1주일 대기 (이의 기간)
-   **낮은 계산 비용**: 증명 생성 불필요
-   **EVM 호환**: Ethereum 코드 그대로 사용 가능

**예시**: Arbitrum, Optimism

개발자 경험이 더 쉬움: 기존 Ethereum 스마트 계약을 거의 수정 없이 배포 가능.

### ZK-Rollups (영지식 증명 롤업)

모든 거래의 유효성을 암호화적으로 증명합니다.

**작동 방식:**

1. 거래를 오프체인에서 처리
2. 영지식 증명 (ZK-proof)을 생성하여 모든 거래가 유효함을 증명
3. L1에 증명과 상태 변화만 제출
4. L1이 증명을 검증하면 즉시 최종 확정

**특징:**

-   **즉시 최종성**: 수 시간 내 자금 인출 가능
-   **높은 보안**: 암호화적 확실성 제공
-   **더 낮은 가스**: 증명만 저장하므로 L1 데이터 사용량 적음
-   **높은 계산 비용**: ZK-proof 생성이 비쌉니다

**예시**: zkSync, StarkNet

| 측면   | Optimistic     | ZK            |
| ------ | -------------- | ------------- |
| 최종성 | 1주일          | 수 시간       |
| 계산   | 낮음           | 높음          |
| 보안   | 거래 검증 필요 | 암호화 확실성 |
| 생태계 | 더 성숙        | 성장 중       |

### ZK-proof (영지식 증명)

정보를 공개하지 않고 그 정보가 참임을 증명하는 암호화 기술입니다.

**예시:**

-   당신이 100만 달러를 가지고 있음을 증명하되, 정확한 금액은 공개 안 함
-   거래가 유효함을 증명하되, 거래 내용은 공개 안 함

**ZK-Rollups에서의 역할:**

-   수천 개의 거래를 하나의 증명으로 압축
-   L1은 증명만 검증하면 됩니다

## 교차 체인 (Cross-Chain) 통신

### LayerZero

초경량 노드를 사용한 신뢰 최소화 교차 체인 메시지 전송입니다.

**아키텍처:**

-   **Ultra-Light Node (ULN)**: 각 체인에서 실행되는 스마트 계약
-   **Oracle**: Chainlink를 사용하여 블록 헤더 전송
-   **Relayer**: 거래 데이터와 증명 검증

**특징:**

-   **독립적 검증**: Oracle과 Relayer가 분리되어 있어, 한쪽 타협 시에도 안전
-   **낮은 비용**: 풀 노드 대신 초경량 노드 사용
-   **메시지 중심**: 자산 이동 아님, 메시지 전송에 특화

**작동 예시:**

```
Ethereum에서 Polygon으로 메시지 전송

1. LayerZero Endpoint (Ethereum)이 메시지 감지
2. Oracle이 블록 헤더를 Polygon으로 전송
3. Relayer가 거래 증명 전송
4. Polygon의 ULN이 검증
5. 메시지 실행
```

### Wormhole

Guardian 네트워크를 기반으로 한 교차 체인 메시징입니다.

**아키텍처:**

-   **Guardian Network**: Figment, Staked, Everstake 같은 독립 검증자들
-   **투표 기반**: 충분한 Guardian의 서명이 모이면 최종 확정
-   **중립성**: 어떤 단일 엔티티도 네트워크를 소유하지 않음

**특징:**

-   **빠른 처리**: Guardian들의 빠른 투표
-   **간단한 구조**: 신뢰와 탈중앙화의 균형
-   **38개 이상의 체인 지원**: 범용 메시징 브리지

**보안 위험:**

-   모든 교차 체인 브리지는 공격 대상입니다
-   2022년 Nomad 브리지: $190M 손실

### Axelar, Wormhole, LayerZero 비교

| 프로토콜  | 메커니즘             | 속도 | 보안 특성       |
| --------- | -------------------- | ---- | --------------- |
| LayerZero | ULN + Oracle/Relayer | 높음 | 독립 검증       |
| Wormhole  | Guardian 투표        | 빠름 | Guardian 다양성 |
| Axelar    | Validator 라우팅     | 중간 | 결정적 라우팅   |

## 블록체인 애플리케이션

### DeFi (탈중앙화 금융)

스마트 계약을 통해 중개자 없이 금융 서비스를 제공합니다.

**핵심 원리:**

-   중앙 은행이나 거래소 없음
-   스마트 계약이 자동으로 조건을 실행
-   사용자는 암호화폐 지갑으로 직접 거래

**DeFi 주요 서비스:**

#### 대출/차입 (Lending/Borrowing)

-   담보를 제공하고 대출받기 (Aave)
-   자산을 락업하고 이자 수익 (Compound)
-   스마트 계약이 이자율과 담보 자동 관리

#### 탈중앙화 거래소 (DEX)

-   Uniswap 같은 플랫폼
-   중개자 없이 토큰 직접 교환
-   자동 마켓 메이커 (AMM) 사용

#### 플래시 론 (Flash Loans)

-   담보 없이 즉시 대출
-   같은 거래 내에서 즉시 반환
-   재정 거래 활용

#### 스테이킹 & 유동성 채굴

-   토큰을 락업하고 보상 획득
-   네트워크 보안 참여

**구조:**

```
사용자 (Wallet)
↓
DeFi Smart Contract (Aave, Uniswap 등)
↓
담보 보유 / 거래 체결 / 이자 계산
```

2024년 성장: $300M (2019) → $100B+ (2024)

### DeFi 자동화

AI와 오라클을 결합하여 스마트 계약의 거래 조건을 동적으로 조정합니다.

**예시:**

-   시장 변동성이 증가하면 자동으로 대출 이자율 상향 조정
-   담보 가격이 떨어지면 자동으로 청산 위험도 증가
-   AI가 시장 예측 데이터를 Chainlink 오라클로 제공

### NFT (Non-Fungible Token)

고유한 디지털 자산을 나타내는 토큰입니다.

**표준:**

#### ERC-721 (개별 고유성)

-   각 토큰이 고유
-   PFP (프로필 사진), 게임 아이템, 부동산
-   한 번에 하나의 NFT만 거래 가능

```solidity
// ERC-721 예시
// Token ID 1 ≠ Token ID 2 (완전 다름)
```

#### ERC-1155 (멀티 토큰 표준)

-   한 계약에서 여러 토큰 타입 지원
-   게임 아이템, 대체 가능 + 대체 불가능 토큰 혼합
-   배치 거래로 가스비 최대 90% 절감

```solidity
// ERC-1155: 한 거래에 100개 칼과 50개 방패 동시 이동
```

#### ERC-721A (가스비 최적화)

-   여러 NFT를 한 개 NFT 비용으로 민팅
-   Azuki 프로젝트의 팀이 개발

#### ERC-721R (환불 가능 NFT)

-   NFT 구매 후 환불 기간 제공
-   러그풀 방지
-   14일 환불 기간 표준

### SocialFi (소셜 금융)

소셜 미디어와 DeFi를 결합합니다.

**핵심 특징:**

-   **토큰 기반 보상**
    -   콘텐츠 생성, 공유, 댓글에 토큰 보상
    -   팔로워가 크리에이터 토큰 구매 가능
-   **직접 수익화**
    -   플랫폼 중개 없이 팬과 직접 거래
    -   크리에이터가 전체 수익 획득
-   **DAO 거버넌스**
    -   토큰 보유자가 플랫폼 결정에 투표
    -   커뮤니티 중심 운영
-   **데이터 소유권**
    -   사용자가 자신의 데이터 제어
    -   블록체인에 기록

**예시**: Mirror, Lens Protocol, Farcaster

**장점:**

-   전 세계 누구나 접근 가능 (은행 계좌 불필요)
-   수익화 경로 다양화
-   창작자 권한 부여

### DAO (탈중앙화 자율조직)

스마트 계약으로 인코딩된 규칙에 따라 자율적으로 운영되는 조직입니다.

**구조:**

```
DAO
├── 거버넌스 토큰 (투표권)
├── 제안 (Proposal) 시스템
├── 투표 (Voting)
└── 자동 실행 (Smart Contract)
```

**작동 방식:**

1. **제안**: 토큰 홀더가 변경 제안
2. **투표**: 토큰 수에 비례한 투표권으로 투표
3. **자동 실행**: 스마트 계약이 결과 자동 실행

**예시:**

| DAO      | 목적                   |
| -------- | ---------------------- |
| MakerDAO | DAI 스테이블코인 관리  |
| Uniswap  | DEX 프로토콜 개선      |
| Aave     | 대출 프로토콜 거버넌스 |

**전통 조직 vs DAO:**

| 측면     | 전통 조직     | DAO                  |
| -------- | ------------- | -------------------- |
| 의사결정 | 경영진이 결정 | 토큰 홀더 투표       |
| 투명성   | 제한적        | 완전 공개 (블록체인) |
| 효율성   | 느림          | 빠름 (자동화)        |
| 신뢰     | 인물에 의존   | 코드 신뢰            |

## 인프라 & 데이터

### DePIN (탈중앙화 물리 인프라 네트워크)

개인이 물리적 하드웨어를 공유하고 토큰으로 보상받는 네트워크입니다.

**5계층 아키텍처:**

1. **애플리케이션 계층**: 사용자가 접하는 서비스
2. **거버넌스 계층**: DAO, DID로 민주적 관리
3. **데이터 계층**: 디바이스에서 수집한 데이터 관리
4. **블록체인 계층**: Layer 1, Layer 2, 스마트 계약
5. **인프라 계층**: 실제 하드웨어 (센서, 서버, 라우터)

**핵심 특징:**

-   **집단 소유권**: 중앙 기업이 아닌 개별 배포자가 네트워크 운영
-   **토큰 인센티브**: 네트워크 참여자에게 토큰 보상
-   **장치 관리**: 스마트 계약이 하드웨어 자동 제어
-   **저지연 통신**: 실시간 물리 데이터 처리

**시장 현황 (2025년 11월):**

-   시장 규모: $11B
-   활성 프로젝트: 1,500+
-   일일 기여 디바이스: 1,300만개

**주요 DePIN 프로젝트:**

-   **Helium (무선망)**
    -   380,000개의 Wi-Fi 핫스팟
    -   IoT 커버리지 제공
    -   가정용 라우터로 수익 창출
-   **에너지 네트워크**: 태양광 패널 소유자가 잉여 전기 판매
-   **CDN & 스토리지**: 개인 노드가 비디오 전달 또는 저장소 제공
-   **컴퓨팅 파워 공유**: GPU/CPU 임대로 보상
-   **위성 지상국 (DePIN Space)**: 개인이 위성 다운링크/업링크 시간 공유

**DePIN의 우월성:**

-   중앙 기업이 경제성이 낮다고 판단한 지역도 커버 가능
-   기존 통신사보다 빠른 배포
-   지역 공동체 참여로 효율성 증대

### The Graph

블록체인 데이터의 탈중앙화 인덱싱 프로토콜입니다.

**문제점:**

-   블록체인은 방대한 데이터 저장
-   특정 정보 조회가 어려움 (예: "특정 NFT 소유자는?")
-   모든 블록을 스캔해야 함

**해결책:**

The Graph는 데이터를 인덱싱하고 GraphQL로 쿼리 제공

**구성 요소:**

#### Subgraph

-   특정 스마트 계약에서 어떤 데이터를 인덱싱할지 정의
-   AssemblyScript로 매핑 작성
-   예: "Uniswap의 모든 스왑 거래 인덱싱"

#### Graph Nodes

-   블록체인 스캔 및 데이터 수집
-   Subgraph 정의에 따라 처리

#### GraphQL 쿼리

-   개발자가 필요한 데이터만 요청
-   SQL처럼 유연한 쿼리

**예:**

```graphql
query {
    swaps(first: 10) {
        id
        from
        to
        amount
    }
}
```

#### The Graph Network

-   **Indexers**: 노드 실행 및 쿼리 처리
-   **Curators**: 가치 있는 Subgraph 발견
-   **Delegators**: GRT 토큰 스테이킹으로 Indexer 지원

**이점:**

-   빠른 데이터 접근: 즉시 인덱싱된 데이터
-   비용 절감: 비싼 커스텀 인프라 불필요
-   탈중앙화: 중앙화 API 대신 신뢰 최소화
-   개발자 유연성: 정확히 필요한 데이터만 조회

**사용 사례:**

-   Uniswap 거래 데이터
-   Aave 대출 현황
-   Decentraland 부동산 거래

### Gas Fees (가스비)

Ethereum 거래의 비용으로, 네트워크 보안을 위한 인센티브입니다.

**개념:**

-   현실의 자동차 연료처럼, 블록체인 거래도 "가스"를 소비합니다
-   1 가스 = 이더리움의 최소 단위 (1 gwei = 10^-9 ETH)

**계산 공식:**

```
총 가스비 = (기본 가스비 + 팁) × 가스 리미트
```

**예시:**

```
(75 gwei + 5 gwei) × 30,000 = 2,400,000 gwei = 0.0024 ETH
```

**구성 요소:**

-   **기본 가스비 (Base Fee)**
    -   네트워크 수요에 따라 자동 조정
    -   네트워크 혼잡도가 높으면 증가
    -   거래 승인 시 소각되어 인플레이션 방지
-   **팁 (Priority Fee)**
    -   채굴자/검증자에게 지급
    -   높을수록 거래가 빨리 처리됨
-   **가스 리미트 (Gas Limit)**
    -   최대 사용 가능한 가스량
    -   단순 ETH 전송: 21,000 가스
    -   ERC-20 토큰 승인: 45,000 가스

**가스비가 올라가는 이유:**

-   네트워크 혼잡: Bitcoin 급등 또는 NFT 열풍 때
-   블록체인 용량 초과

**가스비를 낮추는 방법:**

-   오프피크 시간: 주말이나 새벽 거래
-   Layer 2 사용: 가스비를 $0.01-0.1로 감소
-   배치 거래: ERC-1155로 여러 거래 동시 처리

## 신원 & 개인정보

### SSI (자가주권신원)

사용자가 자신의 디지털 신원을 완전히 소유하고 제어합니다.

**전통적 신원 관리 vs SSI:**

| 측면       | Silos Model | 연합 IDP         | SSI         |
| ---------- | ----------- | ---------------- | ----------- |
| 소유자     | 각 기업     | Facebook, Google | 사용자 자신 |
| 보안       | 분산 위험   | 중앙화 취약점    | 개별 제어   |
| 프라이버시 | 매우 낮음   | 제한적           | 최대        |
| 통제       | 불가능      | 제한적           | 완전 통제   |

**3가지 핵심 프로토콜:**

#### Decentralized Identifiers (DID)

-   중앙 기관과 무관한 고유 식별자
-   블록체인에 기록
-   형식: `did:ethereum:0x1234...`
-   공개/비공개 DID 선택 가능

#### Verifiable Credentials (VC)

-   디지털 증명서 (학위, 면허 등)
-   서명으로 위변조 방지
-   W3C 표준

#### Distributed Ledger Technology (블록체인)

-   신원 정보를 분산 저장
-   어떤 중앙 서버에도 의존하지 않음

**신뢰 삼각형:**

```
발급자 (Issuer)
↗ ↖
검증 ← 신뢰 삼각형
↙ ↖
사용자 ←────→ 검증자 (Verifier)
(User) (P2P 안전 채널)
```

**장점:**

-   프라이버시: 필요한 정보만 공개
-   보안: 중앙 서버 해킹 불가능
-   단순성: 하나의 지갑으로 모든 서비스 접근
-   국경 무관: 글로벌 디지털 신원

### RWA (실물자산 토큰화)

부동산, 미술품, 채권 같은 현실 자산을 블록체인 토큰으로 변환합니다.

**개념:**

-   디지털 소유권 증명서
-   분할 소유권 가능
-   거래 추적 가능

**장점:**

#### 분할 소유권 (Fractionalisation)

-   비싼 부동산을 작은 단위로 나누어 다수 투자자 참여
-   1,000만 달러 건물을 10,000개 토큰으로 분할
-   투자 진입 장벽 낮춤

#### 효율성

-   중개자 제거로 거래 비용 절감
-   페이퍼워크 감소
-   빠른 거래

#### 유동성

-   부동산 같은 비유동 자산을 쉽게 거래
-   토큰이면 마켓플레이스에서 판매 가능

#### 투명성

-   모든 소유권 기록이 블록체인에 저장
-   위조 불가능
-   거래 추적 용이

**토큰화 대상:**

| 자산          | 예시                     |
| ------------- | ------------------------ |
| 부동산        | 아파트, 상업용 건물      |
| 미술품        | 그림, 수집품             |
| 채권          | 정부채, 회사채           |
| 상품          | 금, 석유                 |
| 트레이딩 카드 | 스포츠 카드, 수집용 카드 |

**실제 예시 (부동산):**

```
1. 아파트 (가치: $500,000)
2. 토큰화: 500,000개의 RWA 토큰 생성
3. 각 토큰 = $1 상당의 부동산
4. 투자자들이 필요한 만큼 구매 가능
5. 모든 거래가 블록체인에 기록
```

**시장 성장:**

-   2024년 12월: $13.5B
-   2030년 예측: $2T

## 보안 취약점

### Reentrancy 공격

스마트 계약이 자신의 상태를 업데이트하기 전에 외부 계약을 호출할 때 발생하는 취약점입니다.

**작동 방식:**

```solidity
// 취약한 코드
function withdraw(uint amount) public {
    require(balance[msg.sender] >= amount);

    // 1. 첫 번째 상태 확인: balance = 1 ETH
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);

    // 3. 상태 업데이트 (너무 늦음!)
    balance[msg.sender] -= amount;
}
```

**공격 시나리오:**

```
1. 공격자가 1 ETH를 출금하려고 함
2. withdraw() 실행
3. call{}로 1 ETH 전송
4. 공격자의 receive() 함수 실행됨 (제어권 탈취!)
5. 공격자가 다시 withdraw() 호출
6. balance가 아직 업데이트 안 됨 (step 1의 balance = 1 ETH로 보임)
7. 다시 1 ETH 출금 가능!
8. 반복... → 계약이 완전히 고갈될 때까지
```

**The DAO 해킹 (2016년):**

-   피해: $60M
-   원인: Reentrancy 취약점
-   결과: Ethereum 하드포크 (역사 분기)

**종류:**

-   **단일 함수 Reentrancy**: 같은 함수를 반복 호출
-   **교차 계약 Reentrancy**: 다른 계약의 함수로 인해 발생
-   **읽기 전용 Reentrancy**: View 함수가 오래된 상태 반환

**방어 방법:**

#### Checks-Effects-Interactions 패턴

```solidity
// 안전한 코드
function withdraw(uint amount) public {
    // Checks: 조건 확인
    require(balance[msg.sender] >= amount);

    // Effects: 상태 변경 (상호작용 전에!)
    balance[msg.sender] -= amount;

    // Interactions: 외부 호출 (마지막)
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
}
```

#### Mutex (재진입 방지)

```solidity
bool locked = false;

modifier nonReentrant() {
    require(!locked);
    locked = true;
    _;
    locked = false;
}

function withdraw(uint amount) public nonReentrant {
    // 재진입 불가능
}
```

#### OpenZeppelin ReentrancyGuard 사용

```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Safe is ReentrancyGuard {
    function withdraw() public nonReentrant {
        // 안전
    }
}
```

### Access Control (접근 제어)

스마트 계약에서 누가 어떤 함수를 실행할 수 있는지 제한합니다.

**구현 방법:**

#### Ownable 패턴 (단일 소유자)

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleContract is Ownable {
    function importantFunction() public onlyOwner {
        // 오직 소유자만 실행 가능
    }
}
```

**특징:**

-   가장 간단함
-   배포 시 소유자 주소 설정
-   소유자가 모든 권한 보유

**문제점:**

-   소유자 주소 탈취 시 모든 권한 손실
-   탈중앙화 아님
-   병목 현상

#### Role-Based Access Control (RBAC)

```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ComplexContract is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    function mint() public onlyRole(MINTER_ROLE) {
        // MINTER 역할만 실행 가능
    }
}
```

**역할 구조:**

| 역할      | 권한                        |
| --------- | --------------------------- |
| Admin     | 사용자 추가/제거, 설정 변경 |
| Moderator | 행동 승인/거부              |
| User      | 기본 기능 사용              |
| Minter    | 토큰 생성                   |
| Burner    | 토큰 소각                   |

**장점:**

-   더 세분화된 제어
-   권한 분산으로 보안 향상
-   확장성 좋음

### Integer Overflow (정수 오버플로우)

정수가 최대값을 초과하면 최소값으로 순환하는 취약점입니다.

**예시 (Solidity 0.7 이전):**

```solidity
uint8 value = 255; // 최대값
value++; // 0이 됨! (순환)
```

**공격:**

-   토큰 발행량 계산 오류
-   가격 조작

**방어:**

-   Solidity 0.8+: 기본적으로 오버플로우 방지 (자동 검사)
-   SafeMath 라이브러리 사용 (구 버전)

## 개발 도구 & 테스트

### RPC 제공자: Alchemy, Infura

개발자가 블록체인과 통신하기 위한 노드 인프라입니다.

**역할:**

-   개발 앱과 블록체인을 연결
-   블록체인 데이터 조회
-   거래 전송

#### Alchemy

-   Supernode 제공
-   HTTP와 WebSocket 지원
-   Mainnet과 테스트넷 접근
-   추가 기능: Notify, Transact, MEV 보호
-   수십 개 네트워크 지원
-   무료: 150만-300만 요청/월

#### Infura

-   ConsenSys 운영
-   MetaMask 기본 통합
-   Archive 데이터 지원
-   Ethereum 중심
-   무료: 100,000 요청/일
-   신용 기반 가격 정책

**비교:**

| 기능      | Alchemy            | Infura           |
| --------- | ------------------ | ---------------- |
| 지원 체인 | 50+                | Ethereum/L2 중심 |
| 가격      | 무료 ~ $28,000/월  | 무료 ~ $1,000/월 |
| 특징      | MEV 보호, 모니터링 | MetaMask 통합    |
| 속도      | 빠름               | 빠름             |

### Testnet (테스트넷): Sepolia, Goerli

실제 자산을 위험하지 않고 스마트 계약을 테스트하는 블록체인입니다.

#### Sepolia

**권장 테스트넷 (2025년)**

-   Ethereum 재단의 공식 지원
-   안정적인 네트워크 상태
-   더 빠른 동기화 (Goerli보다 신규)
-   Chain ID: 11155111
-   통화: SepoliaETH
-   토큰 공급 제한 없음 (충분한 테스트 가능)

**주요 특징:**

-   권한 있는 검증자 세트 (기초 팀 운영)
-   예측 가능한 네트워크 상태
-   더 적은 저장 공간 필요

#### Goerli

**권장하지 않음 (Goerli 폐지 예정)**

-   2019년 출시
-   2023년 Q4에 폐지
-   토큰 공급 문제 (테스트 ETH 가치 상승)

**주요 차이점:**

| 측면      | Sepolia       | Goerli    |
| --------- | ------------- | --------- |
| 상태      | 권장          | 폐지 예정 |
| 지원      | Ethereum 재단 | 종료      |
| 동기화    | 빠름          | 느림      |
| 토큰 공급 | 무제한        | 제한적    |
| 용도      | 모든 개발     | 레거시    |

**테스트 ETH 획득:**

```
1. Ethereum Sepolia Faucet 방문
2. MetaMask 주소 입력
3. 일일 1 SepoliaETH 받기
```

**사용 시나리오:**

```
1. 로컬 개발 (Hardhat 시뮬레이션)
2. Testnet 배포 (Sepolia)
3. 보안 감사
4. Mainnet 배포
```

### Hardhat Scripts (배포 스크립트)

스마트 계약을 자동으로 배포하고 설정하는 자동화 스크립트입니다.

**예시:**

```javascript
// scripts/deploy.js
async function main() {
    const MyToken = await ethers.getContractFactory('MyToken');
    const myToken = await MyToken.deploy('MyToken', 'MTK');

    console.log('Token deployed to:', myToken.address);
}

main();
```

**실행:**

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## 학습 리소스 & 경험

### CryptoZombies

인터액티브 형식의 Solidity 학습 플랫폼입니다.

**특징:**

-   브라우저 기반 (설치 불필요)
-   게임처럼 진행되는 레슨
-   직접 작성하며 배움
-   무료

### UX/DX (사용자경험/개발자경험)

-   **UX**: 최종 사용자가 Dapp을 얼마나 쉽게 사용할 수 있는가
-   **DX**: 개발자가 Web3 도구를 얼마나 편하게 사용할 수 있는가

**Web3의 주요 UX 문제:**

-   Private Key 관리
-   Gas Fee 이해
-   지갑 주소의 복잡성
-   오류 메시지 이해 어려움

**개발자 기회:**

-   좋은 UX를 만드는 개발자에게 엄청난 수요
-   복잡성을 숨기고 추상화하는 것이 핵심
-   간단한 지갑 온보딩
-   자동 Gas 최적화

## 종합 정리 테이블

| 카테고리 | 용어           | 역할             | 복잡도   |
| -------- | -------------- | ---------------- | -------- |
| 언어     | Solidity       | 스마트 계약 개발 | ⭐⭐⭐   |
| 도구     | Hardhat        | 개발 프레임워크  | ⭐⭐     |
| 도구     | Foundry        | 고성능 테스팅    | ⭐⭐⭐   |
| 스케일   | Layer 1        | 기본 블록체인    | ⭐⭐     |
| 스케일   | Layer 2        | 성능 향상        | ⭐⭐⭐   |
| 스케일   | Optimistic     | L2 타입          | ⭐⭐⭐   |
| 스케일   | ZK-Rollup      | L2 타입 (고급)   | ⭐⭐⭐⭐ |
| 교차체인 | LayerZero      | 메시지 전송      | ⭐⭐⭐   |
| 교차체인 | Wormhole       | 메시지 전송      | ⭐⭐⭐   |
| 앱       | DeFi           | 금융 서비스      | ⭐⭐     |
| 앱       | NFT            | 디지털 자산      | ⭐⭐     |
| 앱       | SocialFi       | 소셜 금융        | ⭐⭐     |
| 앱       | DAO            | 자율 조직        | ⭐⭐⭐   |
| 인프라   | DePIN          | 물리 인프라      | ⭐⭐⭐   |
| 인프라   | The Graph      | 데이터 인덱싱    | ⭐⭐     |
| 비용     | Gas Fees       | 거래 비용        | ⭐       |
| 신원     | SSI            | 자가주권신원     | ⭐⭐⭐   |
| 자산     | RWA            | 현실자산 토큰화  | ⭐⭐     |
| 보안     | Reentrancy     | 공격 유형        | ⭐⭐⭐⭐ |
| 보안     | Access Control | 권한 관리        | ⭐⭐     |
| 테스트   | Testnet        | 개발 환경        | ⭐⭐     |
| RPC      | Alchemy        | 노드 제공자      | ⭐⭐     |

---

개발자로서 Web3에 입문할 때는 **Solidity → Hardhat → DeFi/NFT 프로젝트 → Layer 2 이해 → 보안 감사** 순서로 진행하시길 추천합니다. 모든 용어가 동시에 필요한 것은 아니며, 프로젝트 필요에 따라 점진적으로 깊이를 더하시면 됩니다.
