# 404 에러 빠른 해결 가이드

## 문제: `/api/auth/register` 404 에러

### 해결 방법 (순서대로 시도)

#### 1단계: Supabase에 users 테이블 생성

1. Supabase 대시보드 접속
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. **New query** 클릭
4. 다음 SQL 실행:

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화 (개발 환경)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

5. **RUN** 버튼 클릭하여 실행

#### 2단계: 환경변수 설정

`server/.env` 파일에 다음 추가:

```env
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```

**Service Role Key 찾는 방법:**
- Supabase 대시보드 → **Settings** → **API**
- **service_role** 키 복사 (⚠️ 절대 공개하지 마세요!)

#### 3단계: 서버 재시작

```bash
cd server
# 서버가 실행 중이면 중지 (Ctrl+C)
npm run dev
```

#### 4단계: 테스트

브라우저에서 회원가입 페이지로 다시 시도하세요.

---

## 여전히 404가 발생하는 경우

### 체크리스트

- [ ] `server/.env` 파일에 `SUPABASE_URL`이 올바르게 설정되어 있나요?
- [ ] `server/.env` 파일에 `SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_ANON_KEY`가 설정되어 있나요?
- [ ] Supabase 대시보드의 Table Editor에서 `users` 테이블이 보이나요?
- [ ] 서버 콘솔에 에러 메시지가 있나요?
- [ ] 서버가 실제로 실행 중인가요? (`http://localhost:5000` 접속 확인)

### 서버 로그 확인

서버 콘솔에서 다음과 같은 메시지가 보여야 합니다:
```
Server is running on port 5000
```

만약 다음과 같은 경고가 보이면:
```
⚠️ Supabase URL or Key is missing in .env file
```

→ `.env` 파일을 확인하세요.

### 라우트 테스트

브라우저나 Postman에서 직접 테스트:

```bash
# POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123"
}
```

404가 계속 발생하면 서버가 재시작되지 않았을 가능성이 높습니다.

