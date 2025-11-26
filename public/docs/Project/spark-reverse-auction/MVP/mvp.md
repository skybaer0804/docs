# 역경매 MVP 문서 (TDD + 패키지화 + 영상 스트리밍 통합)

## 목차

1. [개요](#개요)
2. [기술 스택](#기술-스택)
3. [주요 데이터 흐름 및 메시지 타입](#주요-데이터-흐름-및-메시지-타입)
4. [주요 패키지화 모듈 설계](#주요-패키지화-모듈-설계)
5. [TDD 적용 예시 시나리오](#tdd-적용-예시-시나리오)
6. [폴더 구조 예시](#폴더-구조-예시)

---

## 개요

### 서비스 유형

**실시간 역경매 웹 애플리케이션**

### 목적

구매자가 조건을 올리고, 판매자가 실시간으로 가격 경쟁하는 역경매 플랫폼

### 주요 기능

-   **실시간 통신**: WebSocket SDK `[@skybaer0804/spark-messaging-client]` 사용
-   **영상 스트리밍**: LL-HLS 기반 실시간 영상 재생 기능 패키지화 포함
-   **개발 방식**: TDD(테스트 주도 개발)
-   **구조**: 기능 단위 별 패키지 모듈화 (컴포넌트, 서비스, 훅 등)

---

## 기술 스택

### 프론트엔드

-   **프레임워크**: React + TypeScript
-   **스타일링**: SCSS (BEM 방식) + 필요 시 MUI v7 이상 컴포넌트 사용
-   **상태 관리**: Zustand 또는 React Context

### 실시간 통신

-   **WebSocket**: Socket.IO 기반 웹소켓
-   **SDK**: npm 패키지 `[@skybaer0804/spark-messaging-client]`

### 영상 스트리밍

-   **프로토콜**: LL-HLS (Low-Latency HLS)
-   **구현**: LL-HLS 재생용 React 훅/컴포넌트 패키지화 (예: `useLlHlsPlayer`)

### 테스트

-   **프레임워크**: Jest, React Testing Library
-   **목표**: 테스트 커버리지 100%

### 빌드/개발 환경

-   **빌드 도구**: Vite 또는 Next.js (프론트엔드 패키징)

---

## 주요 데이터 흐름 및 메시지 타입

### WebSocket 메시지 타입

| 메시지 타입     | 역할 및 설명                                      | 예시 페이로드                                       |
| --------------- | ------------------------------------------------- | --------------------------------------------------- |
| `join_room`     | 역경매 방(WebSocket Room) 입장 요청               | `{ roomId: 'auction_1234' }`                        |
| `new_bid`       | 판매자의 새로운 입찰 제안                         | `{ bidId, userId, price, timestamp }`               |
| `bid_update`    | 기존 입찰 가격이나 상태 변경                      | `{ bidId, price, status }`                          |
| `auction_state` | 경매 상태 동기화 (남은 시간, 현재 최저가 등 제공) | `{ auctionId, status, remainingTime, lowestPrice }` |
| `select_bid`    | 구매자가 판매자 선택 시 알림                      | `{ bidId, userId }`                                 |
| `error`         | 입찰 실패 등 오류 메시지                          | `{ code, message }`                                 |

### 영상 스트리밍 데이터 흐름

1. **서버 측**

    - LL-HLS 스트리밍 서버에서 세그먼트와 플레이리스트 생성

2. **전송**

    - CDN을 통해 클라이언트로 전달

3. **클라이언트 측**
    - React 컴포넌트 내 `useLlHlsPlayer` 훅이 `<video>` 엘리먼트에 LL-HLS 스트림 연결 및 재생 제어
    - 영상 지연(latency) 감안한 UI 시간 동기화 (입찰 남은 시간과 영상 재생 상태 동기화)

---

## 주요 패키지화 모듈 설계

### 4.1. WebSocket SDK 래퍼 훅 (`useReverseAuctionSocket.ts`)

**기능**:

-   SDK 초기화, room join/leave 관리
-   메시지 이벤트 타입별 핸들러 등록 및 상태 업데이트
-   재연결 및 에러 처리 로직 포함

**테스트**:

-   테스트 커버리지 100% 목표

### 4.2. LL-HLS 영상 스트리밍 훅/컴포넌트 (`useLlHlsPlayer.tsx`)

**기능**:

-   LL-HLS 스트림 URL 받아 `<video>`에 연결
-   HLS.js 또는 브라우저 네이티브 API 활용 재생 및 버퍼링 상태 관리
-   지연 시간 고려한 사용자 영상 상태 UI를 관리
-   여러 재생 품질, 에러 이벤트 처리 포함

**테스트**:

-   단위 테스트 및 재생 시뮬레이션 테스트 포함

### 4.3. Auction 관련 비즈니스 로직 서비스

**기능**:

-   입찰 관리, 상태 업데이트 함수 모듈화
-   메시지 포맷 검증 및 변환
-   엣지 케이스 처리 (동시 입찰, 마감 처리 등)

**테스트**:

-   단위 테스트 엄격 적용

### 4.4. 재사용 UI 컴포넌트

**컴포넌트 목록**:

-   `BidCard`: 입찰 카드 컴포넌트
-   `CountdownTimer`: 경매 남은 시간 타이머
-   `BidList`: 입찰 목록 컴포넌트
-   `LiveVideoPlayer`: LL-HLS 영상 재생 컴포넌트

**스타일링**:

-   SCSS + BEM 스타일링
-   필요 시 MUI 컴포넌트 활용 및 래핑

**테스트**:

-   스냅샷 및 유닛 테스트 포함

---

## TDD 적용 예시 시나리오

### 테스트 시나리오 목록

1. **WebSocket 메시지 처리**

    - WebSocket 메시지 입출력 모킹 후 입찰 데이터 처리 테스트

2. **영상 스트리밍**

    - LL-HLS 스트림 정상 재생 및 오류 핸들링 테스트

3. **UI 반응성**

    - 입찰 가격 변화 시 UI 애니메이션 검증

4. **상태 동기화**

    - 경매 상태 변경 반영 및 영상 재생 연동 확인

5. **네트워크 복원력**
    - 네트워크 오류 및 재연결 처리 테스트

---

## 폴더 구조 예시

```
src/
├── components/
│   ├── ReverseAuctionRoom/          # 역경매 방 컴포넌트
│   └── LiveVideoPlayer/              # LL-HLS 영상 재생 컴포넌트
├── hooks/
│   ├── useReverseAuctionSocket.ts   # WebSocket SDK 래퍼 훅
│   └── useLlHlsPlayer.ts            # LL-HLS 영상 스트리밍 훅
├── services/
│   ├── websocket/                   # WebSocket 관련 서비스
│   ├── auction/                     # 경매 비즈니스 로직
│   └── streaming/                   # 영상 스트리밍 관련 서비스 (필요 시)
├── stores/                          # 상태 관리 (Zustand 또는 Context)
├── styles/                          # SCSS 스타일 파일
├── tests/
│   ├── components/                  # 컴포넌트 테스트
│   ├── hooks/                       # Hook 테스트
│   └── services/                    # 서비스 테스트
└── utils/                           # 유틸리티 함수
```

---

## 결론

이 문서는 역경매 MVP에 실시간 LL-HLS 영상 스트리밍 기능 패키지화를 성공적으로 통합한 개발 가이드로, TDD와 모듈화된 아키텍처까지 포함한 설계 방향을 담고 있습니다.

모든 기능은 모듈화되어 독립적으로 테스트 가능하며, 재사용성을 높이기 위해 패키지 형태로 구성됩니다.
