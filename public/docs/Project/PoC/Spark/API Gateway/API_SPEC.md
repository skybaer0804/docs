# API 스펙 문서

## 1. 기본 정보

- **Base URL**: `https://api-gateway.example.com`
- **API Version**: `v1`
- **인증 방식**: API Key 또는 JWT Bearer Token

## 2. 인증 헤더

### API Key 방식
```
X-API-Key: <your-api-key>
```

### JWT 방식
```
Authorization: Bearer <jwt-token>
```

## 3. REST API 엔드포인트

### 3.1 인증 API

#### POST /api/v1/auth/token
API Key를 사용하여 JWT 토큰을 발급받습니다.

**Request Headers:**
```
X-API-Key: <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "clientId": "string",
  "permissions": ["chat", "notification"] // 선택적
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "API Key가 유효하지 않습니다."
  }
}
```

#### GET /api/v1/auth/validate
토큰의 유효성을 검증합니다.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "clientId": "client-123",
    "permissions": ["chat", "notification"],
    "expiresAt": "2024-01-01T12:00:00Z"
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "토큰이 유효하지 않거나 만료되었습니다."
  }
}
```

### 3.2 키 관리 API

#### POST /api/v1/keys/rotate
API Key를 회전(재발급)합니다.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "revokeOldKey": true // 기존 키 즉시 회수 여부
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "newApiKey": "new-api-key-12345",
    "oldApiKey": "old-api-key-67890",
    "revoked": true,
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

#### DELETE /api/v1/keys/:keyId
특정 API Key를 회수합니다.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "keyId": "key-123",
    "revoked": true,
    "revokedAt": "2024-01-01T12:00:00Z"
  }
}
```

#### GET /api/v1/keys
사용자의 모든 API Key 목록을 조회합니다.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "keys": [
      {
        "keyId": "key-123",
        "name": "Production Key",
        "createdAt": "2024-01-01T00:00:00Z",
        "expiresAt": "2024-12-31T23:59:59Z",
        "permissions": ["chat", "notification"],
        "active": true
      }
    ]
  }
}
```

### 3.3 로깅 API

#### GET /api/v1/logs/auth
인증 로그를 조회합니다.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `startDate` (optional): 시작 날짜 (ISO 8601)
- `endDate` (optional): 종료 날짜 (ISO 8601)
- `status` (optional): `success` | `failure`
- `limit` (optional): 페이지 크기 (기본값: 50)
- `offset` (optional): 페이지 오프셋 (기본값: 0)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-123",
        "timestamp": "2024-01-01T12:00:00Z",
        "clientId": "client-123",
        "ipAddress": "192.168.1.1",
        "status": "success",
        "eventType": "token_issued",
        "details": {}
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0
    }
  }
}
```

#### GET /api/v1/logs/access
접근 로그를 조회합니다.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:** (auth 로그와 동일)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-456",
        "timestamp": "2024-01-01T12:00:00Z",
        "clientId": "client-123",
        "ipAddress": "192.168.1.1",
        "endpoint": "/socket/connect",
        "method": "WS",
        "status": "success",
        "duration": 150
      }
    ],
    "pagination": {
      "total": 200,
      "limit": 50,
      "offset": 0
    }
  }
}
```

### 3.4 모니터링 API

#### GET /api/v1/monitoring/stats
통계 정보를 조회합니다.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `period` (optional): `hour` | `day` | `week` | `month` (기본값: `day`)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "period": "day",
    "totalRequests": 10000,
    "successfulRequests": 9800,
    "failedRequests": 200,
    "activeConnections": 500,
    "eventsByType": {
      "chat": 5000,
      "notification": 3000,
      "system": 1500,
      "error": 500
    },
    "topClients": [
      {
        "clientId": "client-123",
        "requestCount": 2000
      }
    ]
  }
}
```

#### GET /api/v1/monitoring/health
Health Check 엔드포인트입니다.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00Z",
    "services": {
      "apiGateway": "healthy",
      "socketIO": "healthy",
      "redis": "healthy",
      "database": "healthy"
    }
  }
}
```

## 4. WebSocket API

### 4.1 Socket.IO 연결

**Endpoint:** `wss://api-gateway.example.com/socket`

**Connection Options:**
```javascript
{
  auth: {
    token: "<jwt-token>"
  },
  query: {
    namespace: "chat" // chat | notification | system | error
  }
}
```

**연결 성공 이벤트:**
```json
{
  "event": "connected",
  "data": {
    "sessionId": "session-123",
    "namespace": "chat",
    "permissions": ["chat"]
  }
}
```

**연결 실패 이벤트:**
```json
{
  "event": "error",
  "error": {
    "code": "AUTH_FAILED",
    "message": "인증에 실패했습니다."
  }
}
```

### 4.2 이벤트 타입

#### 채팅 이벤트 (namespace: `/chat`)
- `chat:message` - 메시지 전송
- `chat:join` - 룸 참가
- `chat:leave` - 룸 나가기
- `chat:typing` - 타이핑 상태

#### 알림 이벤트 (namespace: `/notification`)
- `notification:send` - 알림 전송
- `notification:read` - 알림 읽음 처리
- `notification:subscribe` - 알림 구독

#### 시스템 이벤트 (namespace: `/system`)
- `system:status` - 시스템 상태
- `system:update` - 시스템 업데이트

#### 에러 이벤트 (namespace: `/error`)
- `error:report` - 에러 리포트
- `error:log` - 에러 로그

## 5. 에러 코드

| 코드 | HTTP 상태 | 설명 |
|------|-----------|------|
| `INVALID_API_KEY` | 401 | API Key가 유효하지 않음 |
| `INVALID_TOKEN` | 401 | JWT 토큰이 유효하지 않음 |
| `TOKEN_EXPIRED` | 401 | JWT 토큰이 만료됨 |
| `INSUFFICIENT_PERMISSIONS` | 403 | 권한이 부족함 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 한도 초과 |
| `IP_NOT_ALLOWED` | 403 | 허용되지 않은 IP |
| `NAMESPACE_NOT_ALLOWED` | 403 | 허용되지 않은 네임스페이스 |
| `INTERNAL_ERROR` | 500 | 내부 서버 오류 |
| `SERVICE_UNAVAILABLE` | 503 | 서비스 사용 불가 |

## 6. Rate Limiting

- **인증 API**: 10 requests/minute per IP
- **키 관리 API**: 5 requests/minute per client
- **로깅 API**: 30 requests/minute per client
- **Socket.IO 연결**: 5 connections/minute per client

## 7. 버전 관리

API 버전은 URL 경로에 포함됩니다 (`/api/v1/`). 새로운 버전이 추가되면 `/api/v2/` 형태로 제공됩니다.

