# 스키마 불일치 해결 가이드

## 문제
ERD에서 `users` 테이블에 `username` 컬럼만 있고 `email` 컬럼이 없습니다.
하지만 코드는 `email` 컬럼을 사용하고 있어서 500 에러가 발생합니다.

## 해결 방법

### 옵션 1: email 컬럼 추가 (권장)

Supabase SQL Editor에서 다음 SQL 실행:

```sql
-- email 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 기존 username을 email로 복사 (username이 이메일 형식인 경우)
UPDATE users 
SET email = username 
WHERE email IS NULL AND username LIKE '%@%';

-- email에 UNIQUE 인덱스 추가
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) 
WHERE email IS NOT NULL;
```

### 옵션 2: 코드를 username 사용하도록 변경

만약 `username`을 이메일로 사용하고 싶다면, 코드를 수정해야 합니다.

## 확인

SQL Editor에서 다음 쿼리로 확인:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';
```

`email` 컬럼이 보여야 합니다.

## 테이블 재생성 (필요시)

기존 테이블을 삭제하고 새로 만들고 싶다면:

```sql
-- 주의: 기존 데이터가 모두 삭제됩니다!
DROP TABLE IF EXISTS users CASCADE;

-- 새로 생성
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

