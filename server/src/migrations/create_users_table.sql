-- 사용자 테이블 생성
-- Supabase PostgreSQL에서 실행

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

-- 초기 관리자 계정 생성 예시 (비밀번호: admin123)
-- 실제 사용 시 bcrypt로 해시된 비밀번호를 사용해야 함
-- Node.js에서 bcrypt.hash('admin123', 10) 실행 후 결과를 사용
-- 예: INSERT INTO users (email, password_hash) VALUES ('admin@example.com', '$2b$10$...');

