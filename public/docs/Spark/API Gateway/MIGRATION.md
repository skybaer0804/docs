# 데이터베이스 마이그레이션 가이드

## 마이그레이션 실행

### 수동 실행

PostgreSQL에 직접 연결하여 마이그레이션 파일을 실행할 수 있습니다:

```bash
# 마이그레이션 파일 실행
psql -U your_user -d spark_gateway -f migrations/001_create_api_keys_table.sql
psql -U your_user -d spark_gateway -f migrations/002_create_auth_logs_table.sql
psql -U your_user -d spark_gateway -f migrations/003_create_access_logs_table.sql
```

### node-pg-migrate 사용 (권장)

`package.json`에 마이그레이션 스크립트가 포함되어 있습니다:

```bash
# 마이그레이션 실행
npm run migrate:up

# 마이그레이션 롤백
npm run migrate:down

# 새 마이그레이션 생성
npm run migrate:create -- --name your_migration_name
```

## 테이블 구조

### api_keys
- `id`: UUID (Primary Key)
- `key`: API Key 문자열 (Unique)
- `client_id`: 클라이언트 ID
- `name`: 키 이름 (선택)
- `permissions`: 권한 배열 (JSONB)
- `created_at`: 생성 시간
- `expires_at`: 만료 시간 (선택)
- `revoked`: 회수 여부
- `revoked_at`: 회수 시간

### auth_logs
- `id`: UUID (Primary Key)
- `client_id`: 클라이언트 ID
- `ip_address`: IP 주소
- `status`: 상태 (success/failure)
- `event_type`: 이벤트 타입
- `details`: 상세 정보 (JSONB)
- `timestamp`: 로그 시간

### access_logs
- `id`: UUID (Primary Key)
- `client_id`: 클라이언트 ID
- `ip_address`: IP 주소
- `endpoint`: 엔드포인트 경로
- `method`: HTTP 메서드
- `status`: HTTP 상태 코드
- `duration`: 요청 처리 시간 (ms)
- `timestamp`: 로그 시간

## 초기 데이터

필요한 경우 초기 API Key를 생성할 수 있습니다:

```sql
INSERT INTO api_keys (id, key, client_id, name, permissions, revoked)
VALUES (
  gen_random_uuid(),
  'sk_your_api_key_here',
  'test-client',
  'Test Key',
  '["chat", "notification"]'::jsonb,
  false
);
```

