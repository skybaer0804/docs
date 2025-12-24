-- users 테이블에 email 컬럼 추가
-- 기존 테이블에 username만 있는 경우 실행

-- email 컬럼 추가 (UNIQUE 제약조건 포함)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 기존 username을 email로 복사 (username이 이메일 형식인 경우)
-- 주의: username이 이메일이 아닌 경우 이 부분을 수정하거나 제거하세요
UPDATE users 
SET email = username 
WHERE email IS NULL AND username LIKE '%@%';

-- email에 UNIQUE 제약조건 추가
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) 
WHERE email IS NOT NULL;

-- email을 NOT NULL로 변경하려면 먼저 모든 행에 값이 있어야 함
-- 필요시 아래 주석을 해제하여 실행
-- ALTER TABLE users ALTER COLUMN email SET NOT NULL;

