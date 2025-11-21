# Spark Messaging Client SDK - 개발자 가이드

## 목차

1. [기술 스택](#기술-스택)
2. [아키텍처](#아키텍처)
3. [개발 환경 설정](#개발-환경-설정)
4. [API 레퍼런스](#api-레퍼런스)
5. [이벤트 시스템](#이벤트-시스템)
6. [개발 가이드](#개발-가이드)

---

## 기술 스택

### 핵심 라이브러리

-   **Socket.IO Client** (`^4.7.2`): 실시간 양방향 통신
-   **TypeScript** (`^5.3.3`): 타입 안정성 및 개발 경험 향상

### 빌드 도구

-   **Rollup** (`^4.6.0`): 번들러 (CommonJS + ESM)
-   **@rollup/plugin-typescript**: TypeScript 컴파일
-   **@rollup/plugin-node-resolve**: Node.js 모듈 해석
-   **@rollup/plugin-commonjs**: CommonJS 모듈 변환

### 출력 형식

-   **CommonJS** (`dist/index.js`): Node.js 환경
-   **ES Module** (`dist/index.esm.js`): 브라우저 및 모던 Node.js
-   **TypeScript 타입 정의** (`dist/*.d.ts`)

---

## 아키텍처

### 전체 구조

```
SparkMessaging (Public API)
    ├── Connection (Socket.IO 연결 관리)
    ├── MessageHandler (메시지 송수신)
    ├── RoomHandler (방 관리)
    └── ErrorHandler (에러 처리)
```

### 설계 원칙

1. **단일 책임 원칙**: 각 클래스는 하나의 책임만 가짐
2. **Facade 패턴**: `SparkMessaging` 클래스가 내부 복잡성을 숨김
3. **Observer 패턴**: 이벤트 콜백을 통한 구독/발행
4. **Promise 패턴**: 비동기 작업을 Promise로 처리

### 프로젝트 구조

```
src/
├── index.ts              # 메인 진입점
├── core/
│   ├── connection.ts     # Socket 연결 관리
│   ├── messageHandler.ts # 메시지 송수신
│   └── roomHandler.ts    # 방 관리
├── utils/
│   └── errorHandler.ts   # 에러 처리
├── config/
│   └── index.ts         # 설정 관리
└── types/
    ├── index.ts         # 타입 정의
    └── globals.d.ts     # 전역 타입
```

---

## 개발 환경 설정

### 필수 요구사항

-   **Node.js**: v18 이상
-   **npm**: v9 이상

### 초기 설정

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 개발 모드 (watch)
npm run dev

# 테스트
npm run test:sdk
```

### 빌드 프로세스

```bash
npm run build
```

**빌드 단계**:

1. TypeScript 컴파일
2. 타입 정의 생성 (`*.d.ts`)
3. 소스맵 생성 (`*.map`)
4. CommonJS 및 ESM 번들 생성

---

## API 레퍼런스

### SparkMessaging 클래스

#### 생성자

```typescript
new SparkMessaging(options?: Partial<SparkMessagingOptions>)
```

**설정 우선순위**: 사용자 옵션 > 환경 변수 > 기본값

#### 연결 관리

-   `connect(): Promise<void>` - 서버에 연결
-   `disconnect(): void` - 연결 종료
-   `isConnected(): boolean` - 연결 상태 확인
-   `getSocketId(): string | undefined` - Socket ID 가져오기

#### 메시지 API

-   `sendMessage(type, content, user?): void` - 일반 메시지 전송
-   `onMessage(callback): () => void` - 메시지 수신 콜백 등록
-   `sendRoomMessage(room, type, content, user?): void` - 방 메시지 전송
-   `onRoomMessage(callback): () => void` - 방 메시지 수신 콜백 등록
-   `onConnected(callback): () => void` - 연결 성공 콜백 등록

#### 방 API

-   `joinRoom(roomName): Promise<void>` - 방 입장
-   `leaveRoom(roomName): Promise<void>` - 방 나가기
-   `getJoinedRooms(): string[]` - 참여 중인 방 목록
-   `isInRoom(roomName): boolean` - 방 참여 여부 확인

#### 에러 처리

-   `onError(callback): () => void` - 에러 콜백 등록

### 타입 정의

```typescript
interface SparkMessagingOptions {
    serverUrl: string; // 서버 URL (필수)
    projectKey: string; // 프로젝트 키 (필수)
    autoConnect?: boolean; // 자동 연결 (기본값: true)
    reconnection?: boolean; // 자동 재연결 (기본값: true)
    reconnectionAttempts?: number; // 재연결 시도 횟수 (기본값: 5)
    reconnectionDelay?: number; // 재연결 지연 시간(ms) (기본값: 1000)
}

interface MessageData {
    type: MessageType;
    content: string;
    user?: string;
    timestamp?: number;
}

interface RoomMessageData {
    room: string;
    type: MessageType;
    content: string;
    user?: string;
    timestamp?: number;
}

type MessageType = 'chat' | 'notification' | 'system' | 'test';
```

---

## 이벤트 시스템

### 클라이언트 → 서버 이벤트

1. **연결 시 인증**: `auth.key`로 프로젝트 키 전달
2. **메시지 전송**: `message` 이벤트
3. **방 메시지 전송**: `room-message` 이벤트
4. **방 입장**: `join-room` 이벤트
5. **방 나가기**: `leave-room` 이벤트

### 서버 → 클라이언트 이벤트

1. **연결 성공**: `connected` 이벤트
2. **일반 메시지 수신**: `message` 이벤트
3. **방 메시지 수신**: `room-message` 이벤트

### 이벤트 등록

**연결 전에도 등록 가능**:

```typescript
const client = new SparkMessaging({
    autoConnect: false,
});

// 연결 전 등록
client.onMessage((data) => {
    console.log(data);
});

// 나중에 연결
await client.connect();
```

**구독 해제**:

```typescript
const unsubscribe = client.onMessage((data) => {
    console.log(data);
});

// 나중에 해제
unsubscribe();
```

---

## 개발 가이드

### 코딩 컨벤션

**TypeScript 스타일**:

-   인터페이스/타입: PascalCase
-   클래스: PascalCase
-   함수/변수: camelCase
-   private 필드: camelCase (접두사 없음)

**주석 규칙**:

-   JSDoc 스타일 사용
-   Public API는 반드시 주석 작성

### 새 모듈 추가하기

1. **핵심 모듈 생성** (`src/core/newHandler.ts`)
2. **타입 정의 추가** (`src/types/index.ts`)
3. **메인 클래스에 통합** (`src/index.ts`)

### 이벤트 핸들러 추가하기

1. `MessageHandler`에 이벤트 리스너 추가
2. 콜백 관리 메서드 추가
3. `SparkMessaging`에 Public API 추가
4. 연결 전 대기 큐 지원 (선택)

### 테스트

**SDK 테스트 실행**:

```bash
# 백엔드 서버 실행 (다른 터미널)
cd ../spark-messaging-server
npm start

# SDK 테스트 실행
npm run test:sdk
```

**테스트 시나리오**:

1. SDK 초기화
2. 연결 확인
3. 메시지 전송/수신
4. 방 입장/메시지/나가기
5. 연결 종료

### 디버깅

**소스맵 활용**:

-   빌드된 파일에 소스맵 포함
-   브라우저 DevTools에서 원본 소스 확인 가능

**로깅**:

```typescript
client.onError((error) => {
    console.error('SDK Error:', error);
});
```

**연결 상태 확인**:

```typescript
if (client.isConnected()) {
    console.log('Socket ID:', client.getSocketId());
}
```

### 성능 최적화

1. **메모리 관리**: `disconnect()` 시 모든 리소스 정리
2. **콜백 배열**: 일반적으로 콜백 수가 적어 배열 사용
3. **Set 사용**: 방 목록 조회 O(1)
4. **이벤트 리스너**: Socket.IO 네이티브 이벤트 활용

### 문제 해결

**연결 실패**:

-   서버가 실행 중인지 확인
-   `serverUrl`과 `projectKey` 확인

**타입 에러**:

-   `npm run build` 실행하여 타입 정의 생성 확인
-   TypeScript 버전 확인

**빌드 에러**:

-   `node_modules` 삭제 후 재설치
-   TypeScript 버전 확인

---

이 가이드를 통해 SDK의 구조와 사용법을 완전히 이해하고 개발할 수 있습니다.
