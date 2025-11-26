# Spark Messaging Client SDK - 프론트엔드 설정 가이드

## 목차

1. [설치](#설치)
2. [기본 설정](#기본-설정)
3. [환경 변수 설정](#환경-변수-설정)
4. [설정 파일 예시](#설정-파일-예시)
5. [API 키 관리](#api-키-관리)
6. [보안 주의사항](#보안-주의사항)
7. [사용 예제](#사용-예제)

---

## 설치

### npm 설치

```bash
npm install @skybaer0804/spark-messaging-client
```

### yarn 설치

```bash
yarn add @skybaer0804/spark-messaging-client
```

### pnpm 설치

```bash
pnpm add @skybaer0804/spark-messaging-client
```

---

## 기본 설정

### 1. SDK 초기화

**TypeScript/JavaScript (ES Module)**:

**방법 1: 옵션 객체로 초기화** (권장):

```typescript
import SparkMessaging from '@skybaer0804/spark-messaging-client';

const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'default-project-key-12345', // API 키
    autoConnect: true, // 기본값: true (자동 연결)
    debug: false, // 기본값: false (디버그 모드)
});
```

**방법 2: 생성자 오버로드 (간단한 사용)**:

```typescript
import SparkMessaging from '@skybaer0804/spark-messaging-client';

// serverUrl과 projectKey를 직접 전달
const client = new SparkMessaging('http://localhost:3000', 'default-project-key-12345');
```

**CommonJS**:

```javascript
const SparkMessaging = require('@skybaer0804/spark-messaging-client').default;

// 옵션 객체로 초기화
const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'default-project-key-12345',
});

// 또는 생성자 오버로드
const client = new SparkMessaging('http://localhost:3000', 'default-project-key-12345');
```

### 초기화 옵션

```typescript
interface SparkMessagingOptions {
    serverUrl: string; // 서버 URL (필수)
    projectKey: string; // 프로젝트 키 (필수)
    autoConnect?: boolean; // 자동 연결 (기본값: true)
    reconnection?: boolean; // 자동 재연결 (기본값: true)
    reconnectionAttempts?: number; // 재연결 시도 횟수 (기본값: 5)
    reconnectionDelay?: number; // 재연결 지연 시간(ms) (기본값: 1000)
    debug?: boolean; // 디버그 모드 (기본값: false)
}
```

### 2. 연결 관리

```typescript
// 수동 연결 (autoConnect: false인 경우)
await client.connect();

// 연결 상태 확인
const isConnected = client.isConnected();

// 연결 상태 정보 가져오기
const status = client.getConnectionStatus();
console.log('연결 상태:', status);
// {
//   isConnected: true,
//   socketId: 'abc123',
//   connectedAt: Date
// }

// Socket ID 가져오기
const socketId = client.getSocketId();

// 연결 완료까지 대기 (이미 연결되어 있으면 즉시 반환)
const connectionData = await client.waitForConnection();
console.log('연결 완료:', connectionData.socketId);

// 연결 종료
client.disconnect();
```

### 3. 이벤트 핸들링

```typescript
// 연결 성공 (이미 연결되어 있으면 즉시 콜백 호출)
client.onConnected((data) => {
    console.log('연결 성공:', data.socketId);
    console.log('연결 시간:', data.connectedAt);
});

// 연결 상태 변경 이벤트
client.onConnectionStateChange((isConnected) => {
    console.log('연결 상태 변경:', isConnected ? '연결됨' : '연결 끊김');
});

// 메시지 수신
client.onMessage((data) => {
    console.log('메시지:', data);
});

// 방 메시지 수신
client.onRoomMessage((data) => {
    console.log('방 메시지:', data);
});

// Room 입장 이벤트
client.onRoomJoined((roomId) => {
    console.log('Room 입장:', roomId);
});

// Room 나가기 이벤트
client.onRoomLeft((roomId) => {
    console.log('Room 나가기:', roomId);
});

// 에러 처리 (SparkMessagingError 또는 ErrorData)
client.onError((error) => {
    if (error instanceof SparkMessagingError) {
        console.error('에러 코드:', error.code);
        console.error('에러 메시지:', error.message);
    } else {
        console.error('에러:', error.message);
    }
});
```

---

## 환경 변수 설정

### Vite (Vue/React)

**1. `.env` 파일 생성**:

```env
VITE_SERVER_URL=http://localhost:3000
VITE_PROJECT_KEY=default-project-key-12345
```

**2. 설정 파일에서 사용**:

```typescript
// config/sparkMessaging.ts
import SparkMessaging from '@skybaer0804/spark-messaging-client';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl: import.meta.env.VITE_SERVER_URL,
    projectKey: import.meta.env.VITE_PROJECT_KEY,
});
```

**3. `.env.example` 파일** (Git에 포함):

```env
VITE_SERVER_URL=http://localhost:3000
VITE_PROJECT_KEY=your-project-key-here
```

**4. `.gitignore`에 `.env` 추가**:

```
.env
.env.local
.env.*.local
```

---

### Create React App

**1. `.env` 파일 생성**:

```env
REACT_APP_SERVER_URL=http://localhost:3000
REACT_APP_PROJECT_KEY=default-project-key-12345
```

**2. 설정 파일에서 사용**:

```typescript
// config/sparkMessaging.ts
import SparkMessaging from '@skybaer0804/spark-messaging-client';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl: process.env.REACT_APP_SERVER_URL!,
    projectKey: process.env.REACT_APP_PROJECT_KEY!,
});
```

---

### Next.js

**1. `.env.local` 파일 생성**:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_PROJECT_KEY=default-project-key-12345
```

**2. 설정 파일에서 사용**:

```typescript
// lib/sparkMessaging.ts
import SparkMessaging from '@skybaer0804/spark-messaging-client';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl: process.env.NEXT_PUBLIC_SERVER_URL!,
    projectKey: process.env.NEXT_PUBLIC_PROJECT_KEY!,
});
```

---

### Preact

**1. `.env` 파일 생성**:

```env
VITE_SERVER_URL=http://localhost:3000
VITE_PROJECT_KEY=default-project-key-12345
```

**2. 설정 파일에서 사용**:

```typescript
// config/sparkMessaging.ts
import SparkMessaging from '@skybaer0804/spark-messaging-client';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl: import.meta.env.VITE_SERVER_URL,
    projectKey: import.meta.env.VITE_PROJECT_KEY,
});
```

---

## 설정 파일 예시

### 예시 1: Vite + TypeScript

**파일 구조**:

```
src/
├── config/
│   └── sparkMessaging.ts
└── main.ts
```

**`src/config/sparkMessaging.ts`**:

```typescript
import SparkMessaging from '@skybaer0804/spark-messaging-client';
import type { SparkMessagingError } from '@skybaer0804/spark-messaging-client';

// 환경 변수에서 로드
const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

// SDK 인스턴스 생성 (디버그 모드 활성화)
export const sparkMessagingClient = new SparkMessaging({
    serverUrl,
    projectKey,
    debug: import.meta.env.DEV, // 개발 환경에서만 디버그 모드
    autoConnect: true,
});

// 이벤트 핸들링
sparkMessagingClient.onConnected((data) => {
    console.log('✅ Spark Messaging 연결 성공:', data.socketId);
    console.log('연결 시간:', data.connectedAt);
});

sparkMessagingClient.onConnectionStateChange((isConnected) => {
    console.log('연결 상태:', isConnected ? '연결됨' : '연결 끊김');
});

sparkMessagingClient.onError((error) => {
    if (error instanceof SparkMessagingError) {
        console.error('❌ Spark Messaging 에러:', error.code, error.message);
    } else {
        console.error('❌ Spark Messaging 에러:', error.message);
    }
});

export default sparkMessagingClient;
```

**`.env`** (로컬 개발용):

```env
VITE_SERVER_URL=http://localhost:3000
VITE_PROJECT_KEY=default-project-key-12345
```

**`.env.example`** (Git에 포함):

```env
# Spark Messaging Server URL
VITE_SERVER_URL=http://localhost:3000

# Spark Messaging Project Key (API Key)
# ⚠️ 실제 프로덕션에서는 안전한 키 관리 시스템 사용 권장
VITE_PROJECT_KEY=your-project-key-here
```

---

### 예시 2: React + Create React App

**`src/config/sparkMessaging.js`**:

```javascript
import SparkMessaging from '@skybaer0804/spark-messaging-client';

const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';
const projectKey = process.env.REACT_APP_PROJECT_KEY || 'default-project-key-12345';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl,
    projectKey,
});

sparkMessagingClient.onConnected((data) => {
    console.log('✅ 연결 성공:', data.socketId);
});

sparkMessagingClient.onError((error) => {
    console.error('❌ 에러:', error.message);
});

export default sparkMessagingClient;
```

**`.env`**:

```env
REACT_APP_SERVER_URL=http://localhost:3000
REACT_APP_PROJECT_KEY=default-project-key-12345
```

---

### 예시 3: Next.js

**`lib/sparkMessaging.ts`**:

```typescript
import SparkMessaging from '@skybaer0804/spark-messaging-client';

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
const projectKey = process.env.NEXT_PUBLIC_PROJECT_KEY || 'default-project-key-12345';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl,
    projectKey,
});

sparkMessagingClient.onConnected((data) => {
    console.log('✅ 연결 성공:', data.socketId);
});

sparkMessagingClient.onError((error) => {
    console.error('❌ 에러:', error.message);
});

export default sparkMessagingClient;
```

**`.env.local`**:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_PROJECT_KEY=default-project-key-12345
```

---

### 예시 4: Preact + Vite

**`src/config/sparkMessaging.ts`**:

```typescript
import SparkMessaging from '@skybaer0804/spark-messaging-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl,
    projectKey,
});

sparkMessagingClient.onConnected((data) => {
    console.log('✅ 연결 성공:', data.socketId);
});

sparkMessagingClient.onError((error) => {
    console.error('❌ 에러:', error.message);
});

export default sparkMessagingClient;
```

**`.env`**:

```env
VITE_SERVER_URL=http://localhost:3000
VITE_PROJECT_KEY=default-project-key-12345
```

---

### 예시 5: 브라우저 전역 설정 (HTML)

**`index.html`**:

```html
<!DOCTYPE html>
<html lang="ko">
    <head>
        <meta charset="UTF-8" />
        <title>Spark Messaging Demo</title>
        <script>
            // 전역 설정 (SDK 로드 전에 설정)
            window.SPARK_MESSAGING_CONFIG = {
                SERVER_URL: 'http://localhost:3000',
                PROJECT_KEY: 'default-project-key-12345',
            };
        </script>
    </head>
    <body>
        <div id="app"></div>
        <script type="module" src="/src/main.ts"></script>
    </body>
</html>
```

**SDK 사용**:

```typescript
import SparkMessaging from '@skybaer0804/spark-messaging-client';

// 환경 변수에서 자동으로 로드됨
const client = new SparkMessaging();
```

---

## API 키 관리

### SDK의 역할

SDK는 **API 키를 받아 백엔드로 전달하는 역할만** 수행합니다:

1. **SDK 초기화 시 API 키 받기**
2. **Socket.IO 연결 시 `auth.key`로 전달**
3. **실제 인증은 백엔드에서 처리**

### 키 전달 흐름

```
프론트엔드
  │
  ├─> SDK 초기화 (API 키 포함)
  │     │
  │     └─> new SparkMessaging({
  │           projectKey: 'your-api-key'
  │         })
  │
  └─> Socket.IO 연결
        │
        └─> auth: { key: 'your-api-key' }
              │
              └─> 백엔드 서버
                    │
                    └─> socket.handshake.auth?.key 확인
                          │
                          └─> 인증 처리 (백엔드에서 수행)
```

---

## 보안 주의사항

### ⚠️ 중요: API 키 보안

**절대 하지 말아야 할 것**:

1. ❌ **소스 코드에 키 하드코딩**

    ```typescript
    // 나쁜 예
    const client = new SparkMessaging({
        projectKey: 'secret-key-12345', // 절대 하지 말 것!
    });
    ```

2. ❌ **Git에 `.env` 파일 커밋**

    ```
    # .gitignore에 반드시 포함
    .env
    .env.local
    .env.*.local
    ```

3. ❌ **공개 저장소에 키 노출**

**권장 사항**:

1. ✅ **환경 변수 사용**

    ```typescript
    const projectKey = process.env.VITE_PROJECT_KEY;
    ```

2. ✅ **`.env.example` 파일 제공** (키 없이)

    ```env
    VITE_PROJECT_KEY=your-project-key-here
    ```

3. ✅ **프로덕션에서는 안전한 키 관리 시스템 사용**
    - 환경 변수 관리 서비스 (Vercel, Netlify 등)
    - 시크릿 관리 도구
    - 백엔드 프록시를 통한 키 전달

---

## 사용 예제

### React Hook 예제

**`src/hooks/useSparkMessaging.ts`**:

```typescript
import { useEffect, useState } from 'react';
import SparkMessaging, { SparkMessagingError } from '@skybaer0804/spark-messaging-client';
import type { MessageData, RoomMessageData, ConnectionStatus } from '@skybaer0804/spark-messaging-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

export function useSparkMessaging() {
    const [client] = useState(
        () =>
            new SparkMessaging({
                serverUrl,
                projectKey,
                autoConnect: true,
                debug: import.meta.env.DEV,
            })
    );
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
        isConnected: false,
        socketId: null,
        connectedAt: null,
    });
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [roomMessages, setRoomMessages] = useState<RoomMessageData[]>([]);
    const [joinedRooms, setJoinedRooms] = useState<string[]>([]);

    useEffect(() => {
        // 연결 성공 (이미 연결되어 있으면 즉시 호출됨)
        const unsubscribeConnected = client.onConnected((data) => {
            setIsConnected(true);
            setConnectionStatus(client.getConnectionStatus());
            console.log('연결 성공:', data.socketId, data.connectedAt);
        });

        // 연결 상태 변경
        const unsubscribeStateChange = client.onConnectionStateChange((connected) => {
            setIsConnected(connected);
            setConnectionStatus(client.getConnectionStatus());
        });

        // 메시지 수신
        const unsubscribeMessage = client.onMessage((data) => {
            setMessages((prev) => [...prev, data]);
        });

        // 방 메시지 수신
        const unsubscribeRoomMessage = client.onRoomMessage((data) => {
            setRoomMessages((prev) => [...prev, data]);
        });

        // Room 입장
        const unsubscribeRoomJoined = client.onRoomJoined((roomId) => {
            setJoinedRooms((prev) => [...prev, roomId]);
        });

        // Room 나가기
        const unsubscribeRoomLeft = client.onRoomLeft((roomId) => {
            setJoinedRooms((prev) => prev.filter((id) => id !== roomId));
        });

        // 에러 처리
        const unsubscribeError = client.onError((error) => {
            setIsConnected(false);
            setConnectionStatus(client.getConnectionStatus());
            if (error instanceof SparkMessagingError) {
                console.error('에러 코드:', error.code, error.message);
            } else {
                console.error('에러:', error.message);
            }
        });

        return () => {
            unsubscribeConnected();
            unsubscribeStateChange();
            unsubscribeMessage();
            unsubscribeRoomMessage();
            unsubscribeRoomJoined();
            unsubscribeRoomLeft();
            unsubscribeError();
            client.disconnect();
        };
    }, [client]);

    return {
        client,
        isConnected,
        connectionStatus,
        messages,
        roomMessages,
        joinedRooms,
    };
}
```

**사용**:

```typescript
import { useSparkMessaging } from './hooks/useSparkMessaging';

function App() {
    const { client, isConnected, messages } = useSparkMessaging();

    const handleSend = async () => {
        try {
            // Promise 기반 메시지 전송
            await client.sendMessage('chat', 'Hello!', 'user123');
            console.log('메시지 전송 성공');
        } catch (error) {
            console.error('메시지 전송 실패:', error);
        }
    };

    const handleJoinRoom = async () => {
        try {
            await client.joinRoom('room-123');
            console.log('Room 입장 성공');
        } catch (error) {
            console.error('Room 입장 실패:', error);
        }
    };

    return (
        <div>
            <p>연결 상태: {isConnected ? '연결됨' : '연결 안됨'}</p>
            <p>Socket ID: {client.getSocketId() || '없음'}</p>
            <button onClick={handleSend} disabled={!isConnected}>
                메시지 전송
            </button>
            <button onClick={handleJoinRoom} disabled={!isConnected}>
                Room 입장
            </button>
            <div>
                {messages.map((msg, i) => (
                    <div key={i}>{msg.content}</div>
                ))}
            </div>
        </div>
    );
}
```

---

### Vue 3 Composition API 예제

**`src/composables/useSparkMessaging.ts`**:

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import SparkMessaging from '@skybaer0804/spark-messaging-client';
import type { MessageData } from '@skybaer0804/spark-messaging-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

export function useSparkMessaging() {
    const client = new SparkMessaging({
        serverUrl,
        projectKey,
    });
    const isConnected = ref(false);
    const messages = ref<MessageData[]>([]);

    onMounted(() => {
        client.onConnected((data) => {
            isConnected.value = true;
            console.log('연결 성공:', data.socketId);
        });

        client.onMessage((data) => {
            messages.value.push(data);
        });

        client.onError((error) => {
            isConnected.value = false;
            console.error('에러:', error.message);
        });
    });

    onUnmounted(() => {
        client.disconnect();
    });

    return {
        client,
        isConnected,
        messages,
    };
}
```

---

### Preact Hook 예제

**`src/hooks/useSparkMessaging.ts`**:

```typescript
import { useEffect, useState } from 'preact/hooks';
import SparkMessaging from '@skybaer0804/spark-messaging-client';
import type { MessageData } from '@skybaer0804/spark-messaging-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

export function useSparkMessaging() {
    const [client] = useState(
        () =>
            new SparkMessaging({
                serverUrl,
                projectKey,
            })
    );
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<MessageData[]>([]);

    useEffect(() => {
        const unsubscribeConnected = client.onConnected((data) => {
            setIsConnected(true);
        });

        const unsubscribeMessage = client.onMessage((data) => {
            setMessages((prev) => [...prev, data]);
        });

        const unsubscribeError = client.onError((error) => {
            setIsConnected(false);
            console.error('에러:', error.message);
        });

        return () => {
            unsubscribeConnected();
            unsubscribeMessage();
            unsubscribeError();
            client.disconnect();
        };
    }, [client]);

    return { client, isConnected, messages };
}
```

---

## 프로덕션 배포 시 주의사항

### 1. 환경 변수 설정

**Vercel**:

```
Settings → Environment Variables
- VITE_SERVER_URL: https://your-server.com
- VITE_PROJECT_KEY: your-production-key
```

**Netlify**:

```
Site settings → Environment variables
- VITE_SERVER_URL: https://your-server.com
- VITE_PROJECT_KEY: your-production-key
```

### 2. 빌드 시 환경 변수 확인

```bash
# 빌드 전 확인
echo $VITE_SERVER_URL
echo $VITE_PROJECT_KEY

# 빌드
npm run build
```

### 3. 키 노출 방지

-   ✅ 환경 변수 사용
-   ✅ `.env` 파일을 `.gitignore`에 추가
-   ✅ 빌드된 파일에 키가 포함되지 않도록 확인
-   ✅ 브라우저 DevTools에서 키가 노출되지 않도록 주의

---

## API 레퍼런스

### 연결 관리

```typescript
// 연결
await client.connect(): Promise<void>

// 연결 종료
client.disconnect(): void

// 연결 상태 확인
client.isConnected(): boolean

// Socket ID 가져오기
client.getSocketId(): string | null

// 연결 상태 정보 가져오기
client.getConnectionStatus(): ConnectionStatus

// 연결 완료까지 대기
client.waitForConnection(): Promise<ConnectionData | null>
```

### 메시지 전송

```typescript
// 일반 메시지 전송 (Promise 기반)
await client.sendMessage(
    type: 'chat' | 'notification' | 'system' | 'test',
    content: string,
    user?: string
): Promise<void>

// 방 메시지 전송 (Promise 기반)
await client.sendRoomMessage(
    room: string,
    type: 'chat' | 'notification' | 'system' | 'test',
    content: string,
    user?: string
): Promise<void>
```

### Room 관리

```typescript
// Room 입장
await client.joinRoom(roomName: string): Promise<void>

// Room 나가기
await client.leaveRoom(roomName: string): Promise<void>

// 참여 중인 Room 목록
client.getJoinedRooms(): string[]

// Room 참여 여부 확인
client.isInRoom(roomName: string): boolean
```

### 이벤트 리스너

```typescript
// 연결 성공 (이미 연결되어 있으면 즉시 호출)
client.onConnected(callback: (data: ConnectedData) => void): () => void

// 연결 상태 변경
client.onConnectionStateChange(callback: (isConnected: boolean) => void): () => void

// 메시지 수신
client.onMessage(callback: (data: MessageData) => void): () => void

// 방 메시지 수신
client.onRoomMessage(callback: (data: RoomMessageData) => void): () => void

// Room 입장
client.onRoomJoined(callback: (roomId: string) => void): () => void

// Room 나가기
client.onRoomLeft(callback: (roomId: string) => void): () => void

// 에러 처리
client.onError(callback: (error: ErrorData | SparkMessagingError) => void): () => void
```

### 타입 정의

```typescript
// 타입 import
import type {
    SparkMessagingOptions,
    MessageData,
    RoomMessageData,
    ConnectedData,
    ConnectionStatus,
    ConnectionData,
    ErrorData,
    SparkMessagingError,
} from '@skybaer0804/spark-messaging-client';

// 에러 클래스 import
import { SparkMessagingError } from '@skybaer0804/spark-messaging-client';
```

## 트러블슈팅

### 환경 변수가 로드되지 않음

**문제**: `undefined` 값이 전달됨

**해결**:

1. 환경 변수 이름 확인 (Vite는 `VITE_` 접두사 필요)
2. `.env` 파일 위치 확인 (프로젝트 루트)
3. 개발 서버 재시작

### 키가 노출됨

**문제**: 브라우저에서 키가 보임

**해결**:

1. 환경 변수 사용 (빌드 시 주입)
2. 백엔드 프록시 사용 고려
3. 키를 서버에서 관리하는 방식으로 전환

### 연결이 안 됨

**문제**: `onConnected` 콜백이 호출되지 않음

**해결**:

```typescript
// 방법 1: waitForConnection 사용
const connectionData = await client.waitForConnection();
console.log('연결 완료:', connectionData);

// 방법 2: 연결 상태 확인
const status = client.getConnectionStatus();
if (status.isConnected) {
    console.log('이미 연결됨:', status.socketId);
}

// 방법 3: autoConnect: false로 설정 후 수동 연결
const client = new SparkMessaging({
    serverUrl: '...',
    projectKey: '...',
    autoConnect: false,
});

// 이벤트 리스너 등록 후 연결
client.onConnected((data) => {
    console.log('연결됨:', data);
});
await client.connect();
```

### 메시지 전송 실패

**문제**: `sendMessage`에서 에러 발생

**해결**:

```typescript
try {
    await client.sendMessage('chat', 'Hello');
} catch (error) {
    if (error instanceof SparkMessagingError) {
        switch (error.code) {
            case 'NOT_CONNECTED':
                console.error('연결되지 않음');
                await client.connect();
                break;
            case 'NOT_INITIALIZED':
                console.error('SDK 초기화 필요');
                break;
            default:
                console.error('에러:', error.message);
        }
    }
}
```

### 디버깅

**디버그 모드 활성화**:

```typescript
const client = new SparkMessaging({
    serverUrl: '...',
    projectKey: '...',
    debug: true, // 상세한 로그 출력
});
```

디버그 모드를 활성화하면 연결, 메시지 전송, 에러 등에 대한 상세한 로그가 콘솔에 출력됩니다.

---

이 가이드를 따라 프론트엔드 프로젝트에 SDK를 설정하고 사용할 수 있습니다.
