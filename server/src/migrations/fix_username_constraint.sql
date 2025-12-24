-- username 컬럼 제약조건 수정
-- users 테이블의 username을 NULL 허용으로 변경하거나 제거

-- 옵션 1: username을 NULL 허용으로 변경 (권장)
ALTER TABLE users 
ALTER COLUMN username DROP NOT NULL;

-- 옵션 2: username 컬럼을 완전히 제거하고 email만 사용 (더 깔끔함)
-- 주의: 기존 데이터가 있다면 먼저 백업하세요
-- ALTER TABLE users DROP COLUMN IF EXISTS username;

-- 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('username', 'email');

