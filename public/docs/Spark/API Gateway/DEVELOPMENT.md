# 개발 가이드

## 1. 프로젝트 구조

```
spark-messaging-apigateway/
├── src/
│   ├── server.ts                 # 메인 서버 진입점
│   ├── config/                   # 설정 파일
│   │   ├── index.ts
│   │   ├── database.ts
│   │   └── redis.ts
│   ├── middleware/               # Express 미들웨어
│   │   ├── auth.ts
│   │   ├── permissions.ts
│   │   ├── rateLimit.ts
│   │   └── logging.ts
│   ├── routes/                   # API 라우트
│   │   ├── auth.ts
│   │   ├── keys.ts
│   │   ├── logs.ts
│   │   └── monitoring.ts
│   ├── services/                 # 비즈니스 로직
│   │   ├── auth.service.ts
│   │   ├── key.service.ts
│   │   ├── socket.service.ts
│   │   └── logging.service.ts
│   ├── models/                   # 데이터 모델
│   │   ├── apiKey.model.ts
│   │   ├── token.model.ts
│   │   └── log.model.ts
│   ├── utils/                    # 유틸리티
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   └── validator.ts
│   └── types/                    # TypeScript 타입 정의
│       ├── auth.types.ts
│       ├── socket.types.ts
│       └── api.types.ts
├── tests/                        # 테스트 파일
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                         # 문서
│   ├── ARCHITECTURE.md
│   ├── API_SPEC.md
│   └── DEVELOPMENT.md
├── .cursorrules                  # Cursor 규칙
├── .env.example                  # 환경 변수 예시
├── package.json
├── tsconfig.json
└── README.md
```

## 2. 개발 환경 설정

### 2.1 필수 요구사항
- Node.js 18.x 이상
- npm 또는 yarn
- PostgreSQL 14.x 이상
- Redis 6.x 이상

### 2.2 설치 및 실행

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

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start
```

### 2.3 환경 변수

```env
# 서버 설정
NODE_ENV=development
PORT=3000
API_VERSION=v1

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/spark_gateway
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=3600

# Socket.IO 백엔드
SOCKETIO_BACKEND_URL=http://localhost:3001
SOCKETIO_BACKEND_NAMESPACES=chat,notification,system,error

# 보안
ALLOWED_ORIGINS=http://localhost:3000,https://example.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# 로깅
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## 3. 코딩 컨벤션

### 3.1 TypeScript
- strict 모드 사용
- 모든 함수에 타입 명시
- 인터페이스 우선 사용
- `any` 타입 사용 금지

### 3.2 네이밍 규칙
- 파일명: kebab-case (예: `auth.service.ts`)
- 클래스명: PascalCase (예: `AuthService`)
- 함수/변수명: camelCase (예: `validateToken`)
- 상수명: UPPER_SNAKE_CASE (예: `MAX_RETRY_COUNT`)

### 3.3 모듈화 원칙
- UI 컴포넌트와 로직을 함께 모듈화
- prop 전달 최소화
- 레이아웃 모듈화 시 children 및 이벤트 prop으로 전달

### 3.4 에러 처리
- 모든 비동기 함수에 try-catch 사용
- 커스텀 에러 클래스 사용
- 에러 로깅 필수

```typescript
// 예시
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new CustomError('OPERATION_FAILED', error);
}
```

## 4. 테스트

### 4.1 테스트 구조
- Unit 테스트: 개별 함수/클래스 테스트
- Integration 테스트: 모듈 간 통합 테스트
- E2E 테스트: 전체 플로우 테스트

### 4.2 테스트 실행

```bash
# 모든 테스트 실행
npm test

# Unit 테스트만 실행
npm run test:unit

# Integration 테스트만 실행
npm run test:integration

# E2E 테스트만 실행
npm run test:e2e

# 커버리지 확인
npm run test:coverage
```

### 4.3 테스트 작성 예시

```typescript
describe('AuthService', () => {
  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      const token = await generateValidToken();
      const result = await authService.validateToken(token);
      expect(result).toBe(true);
    });

    it('should throw error for invalid token', async () => {
      await expect(
        authService.validateToken('invalid-token')
      ).rejects.toThrow('INVALID_TOKEN');
    });
  });
});
```

## 5. 로깅

### 5.1 로그 레벨
- `error`: 에러 발생 시
- `warn`: 경고 상황
- `info`: 일반 정보
- `debug`: 디버깅 정보

### 5.2 로그 포맷
```typescript
logger.info('User authenticated', {
  clientId: 'client-123',
  ipAddress: '192.168.1.1',
  timestamp: new Date().toISOString()
});
```

## 6. 데이터베이스

### 6.1 마이그레이션
```bash
# 마이그레이션 생성
npm run migrate:create -- --name create_api_keys_table

# 마이그레이션 실행
npm run migrate:up

# 마이그레이션 롤백
npm run migrate:down
```

### 6.2 쿼리 작성
- Prepared Statement 사용 필수 (SQL Injection 방지)
- 트랜잭션 사용 권장
- 인덱스 최적화 고려

## 7. 배포

### 7.1 빌드
```bash
npm run build
```

### 7.2 Docker
```bash
# 이미지 빌드
docker build -t spark-gateway:latest .

# 컨테이너 실행
docker run -p 3000:3000 --env-file .env spark-gateway:latest
```

### 7.3 CI/CD
- GitHub Actions 사용
- 자동 테스트 실행
- 자동 배포 (staging/production)

## 8. 모니터링

### 8.1 Health Check
- `/api/v1/monitoring/health` 엔드포인트 구현
- 데이터베이스, Redis 연결 상태 확인

### 8.2 메트릭 수집
- 요청 수
- 응답 시간
- 에러율
- 활성 연결 수

## 9. 보안 체크리스트

- [ ] 환경 변수로 민감 정보 관리
- [ ] SQL Injection 방지 (Prepared Statement)
- [ ] XSS 방지 (입력 검증)
- [ ] CSRF 방지 (토큰 사용)
- [ ] Rate Limiting 구현
- [ ] IP 화이트리스트 (선택)
- [ ] TLS/SSL 적용
- [ ] 정기적인 보안 업데이트

## 10. 성능 최적화

- Redis 캐싱 활용
- 연결 풀링
- 비동기 처리
- 데이터베이스 쿼리 최적화
- 로그 레벨 조정 (프로덕션)

