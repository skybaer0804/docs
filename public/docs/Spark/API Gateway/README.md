# Spark Messaging API Gateway

Socket.IO 기반 백엔드 서비스와 클라이언트 간의 안전한 통신을 위한 API Gateway입니다.

## 주요 기능

- 🔐 **인증 및 권한 관리**: API Key 및 JWT 기반 인증, 이벤트 타입별 접근 제어
- 🔌 **Socket.IO 연동**: 실시간 메시지 송수신을 위한 안전한 연결 관리
- 🔑 **키 관리**: API Key 발급, 회수, 회전 기능
- 📊 **로깅 및 모니터링**: 인증 로그, 접근 로그, 통계 정보 제공
- 🛡️ **보안**: Rate Limiting, IP 화이트리스트, TLS/SSL 지원

## 아키텍처

```
클라이언트 → API Gateway → Socket.IO 백엔드
                ↓
          Auth & Key 관리 MSA
```

자세한 내용은 [아키텍처 문서](./docs/ARCHITECTURE.md)를 참조하세요.

## 빠른 시작

### 필수 요구사항

- Node.js 18.x 이상
- PostgreSQL 14.x 이상
- Redis 6.x 이상

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# 데이터베이스 마이그레이션
npm run migrate

# 개발 서버 실행
npm run dev
```

## 문서

- [아키텍처 문서](./docs/ARCHITECTURE.md)
- [API 스펙](./docs/API_SPEC.md)
- [개발 가이드](./docs/DEVELOPMENT.md)

## API 엔드포인트

### 인증
- `POST /api/v1/auth/token` - JWT 토큰 발급
- `GET /api/v1/auth/validate` - 토큰 유효성 검증

### 키 관리
- `POST /api/v1/keys/rotate` - API Key 회전
- `DELETE /api/v1/keys/:keyId` - API Key 회수
- `GET /api/v1/keys` - API Key 목록 조회

### 로깅
- `GET /api/v1/logs/auth` - 인증 로그 조회
- `GET /api/v1/logs/access` - 접근 로그 조회

### 모니터링
- `GET /api/v1/monitoring/stats` - 통계 정보 조회
- `GET /api/v1/monitoring/health` - Health Check

자세한 API 스펙은 [API 스펙 문서](./docs/API_SPEC.md)를 참조하세요.

## 개발

개발 가이드는 [개발 가이드](./docs/DEVELOPMENT.md)를 참조하세요.

## 라이선스

MIT
