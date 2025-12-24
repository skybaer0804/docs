-- 데이터베이스 초기화 마이그레이션
-- Supabase PostgreSQL에서 실행
-- 모든 테이블과 제약조건을 하나의 파일로 통합

-- ============================================
-- 1. Users 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    document_title TEXT,
    personal_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (이메일 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- 2. Nodes 테이블 생성
-- ============================================
CREATE TYPE IF NOT EXISTS node_type AS ENUM ('FILE', 'DIRECTORY');

CREATE TABLE IF NOT EXISTS nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    type node_type NOT NULL,
    name TEXT NOT NULL,
    content TEXT,
    path TEXT UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT true,
    author_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- 같은 폴더 내 이름 중복 방지
    UNIQUE(parent_id, name)
);

-- 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_path ON nodes(path);
CREATE INDEX IF NOT EXISTS idx_nodes_author_id ON nodes(author_id);

-- ============================================
-- 3. 트리거 함수 생성
-- ============================================
-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- users 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- nodes 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_nodes_updated_at ON nodes;
CREATE TRIGGER update_nodes_updated_at 
    BEFORE UPDATE ON nodes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. 기존 마이그레이션 호환성 처리
-- ============================================
-- username 컬럼이 없으면 추가 (NULL 허용)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(255);
    END IF;
END $$;

-- username을 NULL 허용으로 변경 (이미 NOT NULL인 경우)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'username' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
    END IF;
END $$;

-- email 컬럼이 없으면 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
    ) THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

-- email에 UNIQUE 제약조건 추가 (없는 경우)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_email_key' 
        OR constraint_name = 'idx_users_email'
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL;
    END IF;
END $$;

-- document_title 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'document_title'
    ) THEN
        ALTER TABLE users ADD COLUMN document_title TEXT;
    END IF;
END $$;

-- personal_link 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'personal_link'
    ) THEN
        ALTER TABLE users ADD COLUMN personal_link TEXT;
    END IF;
END $$;

-- nodes 테이블 author_id 컬럼 추가 및 제약조건 설정
DO $$
BEGIN
    -- author_id 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'nodes' AND column_name = 'author_id'
    ) THEN
        ALTER TABLE nodes ADD COLUMN author_id UUID;
    END IF;
    
    -- 기존 NULL 값이 있으면 기본 사용자로 설정 (필요시 수정)
    -- UPDATE nodes SET author_id = (SELECT id FROM users ORDER BY created_at LIMIT 1) WHERE author_id IS NULL;
    
    -- NOT NULL 제약조건 추가 (NULL 값이 없을 때만)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'nodes' 
        AND column_name = 'author_id' 
        AND is_nullable = 'YES'
    ) THEN
        -- NULL 값이 없을 때만 NOT NULL 제약조건 추가
        -- 주의: 기존 데이터가 있으면 먼저 기본값을 설정해야 함
        -- ALTER TABLE nodes ALTER COLUMN author_id SET NOT NULL;
    END IF;
END $$;

-- author_id 외래키 제약조건 추가
DO $$
BEGIN
    -- 기존 외래키 제약조건이 있으면 삭제 후 재생성
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'nodes_author_id_fkey'
    ) THEN
        ALTER TABLE nodes DROP CONSTRAINT nodes_author_id_fkey;
    END IF;
    
    -- 외래키 제약조건 추가
    ALTER TABLE nodes 
    ADD CONSTRAINT nodes_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 완료 메시지
-- ============================================
-- 마이그레이션 완료
-- 다음 명령으로 확인:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'nodes');
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'nodes' ORDER BY ordinal_position;

