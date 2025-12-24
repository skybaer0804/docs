# Supabase 설정 가이드

## 1. users 테이블 생성

Supabase 대시보드에서 SQL Editor를 열고 다음 SQL을 실행하세요:

```sql
-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (이메일 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 2. RLS (Row Level Security) 설정

Supabase는 기본적으로 RLS를 활성화합니다. 백엔드에서 `SUPABASE_ANON_KEY`를 사용하므로, 서비스 역할 키를 사용하거나 RLS를 비활성화해야 합니다.

### 옵션 1: RLS 비활성화 (개발 환경)

```sql
-- users 테이블의 RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### 옵션 2: 서비스 역할 키 사용 (권장)

환경변수에서 `SUPABASE_ANON_KEY` 대신 `SUPABASE_SERVICE_ROLE_KEY`를 사용하도록 변경:

```env
# server/.env
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]  # Anon Key 대신 Service Role Key 사용
```

그리고 `server/src/config/supabase.js`를 수정:

```javascript
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
```

## 3. 테이블 생성 확인

SQL Editor에서 다음 쿼리로 테이블이 생성되었는지 확인:

```sql
SELECT * FROM users;
```

## 4. 서버 재시작

테이블 생성 후 서버를 재시작하세요:

```bash
cd server
npm run dev
```

## 문제 해결

### 404 에러가 계속 발생하는 경우

1. **서버가 재시작되었는지 확인**

   - 서버를 중지하고 다시 시작하세요
   - `nodemon`을 사용 중이라면 자동 재시작되지만, 수동으로 재시작해보세요

2. **라우트 등록 확인**

   - `server/src/app.js`에서 `/api/auth` 라우트가 등록되어 있는지 확인
   - `server/src/routes/authRoutes.js`에서 `/register` 라우트가 있는지 확인

3. **Supabase 연결 확인**

   - `server/.env` 파일에 `SUPABASE_URL`과 `SUPABASE_ANON_KEY` (또는 `SUPABASE_SERVICE_ROLE_KEY`)가 올바르게 설정되어 있는지 확인
   - 서버 콘솔에 Supabase 연결 관련 에러가 있는지 확인

4. **테이블 존재 확인**
   - Supabase 대시보드의 Table Editor에서 `users` 테이블이 보이는지 확인
   - SQL Editor에서 `SELECT * FROM users;` 실행하여 에러가 없는지 확인
