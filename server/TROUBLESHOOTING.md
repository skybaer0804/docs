# 500 에러 해결 가이드

## 문제: POST /api/auth/register 500 (Internal Server Error)

### 가장 가능성 높은 원인: Supabase에 users 테이블이 없음

## 해결 방법

### 1단계: Supabase에 users 테이블 생성 (필수)

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard

2. **프로젝트 선택**

3. **SQL Editor 열기**
   - 왼쪽 메뉴에서 **SQL Editor** 클릭
   - **New query** 클릭

4. **다음 SQL 실행:**

```sql
-- users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- updated_at 자동 업데이트 함수
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

-- RLS 비활성화 (개발 환경)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

5. **RUN 버튼 클릭**

6. **확인**
   - 왼쪽 메뉴에서 **Table Editor** 클릭
   - `users` 테이블이 보이는지 확인

### 2단계: 서버 콘솔 확인

서버 콘솔에서 에러 메시지를 확인하세요:

```
Register error: ...
Error details: {
  message: '...',
  code: '42P01',  // 테이블이 없을 때 나타나는 코드
  ...
}
```

**에러 코드별 해결 방법:**

- `42P01`: 테이블이 없음 → 위의 SQL 실행
- `42501`: 권한 문제 → RLS 비활성화 또는 Service Role Key 사용
- `23505`: 중복 키 에러 → 정상 (이메일이 이미 존재)

### 3단계: 테이블 생성 확인

SQL Editor에서 다음 쿼리 실행:

```sql
SELECT * FROM users LIMIT 1;
```

에러가 없으면 테이블이 정상적으로 생성된 것입니다.

### 4단계: 다시 시도

브라우저에서 회원가입을 다시 시도하세요.

---

## 기타 확인 사항

### bcrypt 설치 확인

```bash
cd server
npm list bcrypt
```

설치되지 않았다면:

```bash
npm install bcrypt
```

### 환경변수 확인

`server/.env` 파일에 다음이 있는지 확인:

```env
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR-KEY]  # 또는 SUPABASE_ANON_KEY
JWT_SECRET=[YOUR-SECRET]
```

### 서버 재시작

테이블 생성 후 서버를 재시작하세요:

```bash
cd server
# Ctrl+C로 중지
npm run dev
```

---

## 여전히 500 에러가 발생하는 경우

서버 콘솔의 전체 에러 메시지를 확인하고, 다음 정보를 알려주세요:

1. 에러 메시지 전체
2. 에러 코드 (code 필드)
3. Supabase Table Editor에서 users 테이블이 보이는지 여부

