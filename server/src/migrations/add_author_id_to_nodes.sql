-- nodes 테이블에 author_id 필수 제약조건 추가
-- Supabase PostgreSQL에서 실행

-- 1. author_id 컬럼이 없으면 추가 (이미 있으면 무시)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'nodes' AND column_name = 'author_id'
    ) THEN
        ALTER TABLE nodes ADD COLUMN author_id UUID;
    END IF;
END $$;

-- 2. author_id를 NOT NULL로 변경 (기존 NULL 값이 있으면 먼저 처리 필요)
-- 주의: 기존 데이터가 있으면 먼저 기본값을 설정해야 함
-- 예: UPDATE nodes SET author_id = (SELECT id FROM users LIMIT 1) WHERE author_id IS NULL;
-- NOT NULL 제약조건 추가 (이미 있으면 무시)
DO $$
BEGIN
    -- 기존 NULL 값이 있으면 기본 사용자로 설정 (필요시 수정)
    -- UPDATE nodes SET author_id = (SELECT id FROM users ORDER BY created_at LIMIT 1) WHERE author_id IS NULL;
    
    -- NOT NULL 제약조건 추가
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'nodes' 
        AND column_name = 'author_id' 
        AND is_nullable = 'YES'
    ) THEN
        -- NULL 값이 없을 때만 NOT NULL 제약조건 추가
        ALTER TABLE nodes ALTER COLUMN author_id SET NOT NULL;
    END IF;
END $$;

-- 3. users 테이블과의 외래키 제약조건 추가 (이미 있으면 무시)
-- NOT NULL 제약조건이 있으므로 ON DELETE SET NULL 대신 CASCADE 또는 RESTRICT 사용
DO $$
BEGIN
    -- 기존 외래키 제약조건이 있으면 삭제 후 재생성
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'nodes_author_id_fkey'
    ) THEN
        ALTER TABLE nodes DROP CONSTRAINT nodes_author_id_fkey;
    END IF;
    
    -- NOT NULL 제약조건과 호환되는 외래키 제약조건 추가
    -- ON DELETE RESTRICT: 사용자 삭제 시 해당 사용자가 작성한 노드가 있으면 삭제 방지
    -- 또는 ON DELETE CASCADE: 사용자 삭제 시 해당 사용자가 작성한 노드도 함께 삭제
    ALTER TABLE nodes 
    ADD CONSTRAINT nodes_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT;
END $$;

-- 4. author_id 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_nodes_author_id ON nodes(author_id);

-- 5. RLS 정책 추가 (선택사항 - 필요시 활성화)
-- 사용자는 자신이 생성한 노드만 수정/삭제할 수 있도록 제한
-- CREATE POLICY "Users can only update their own nodes"
--     ON nodes FOR UPDATE
--     USING (author_id = auth.uid());
--
-- CREATE POLICY "Users can only delete their own nodes"
--     ON nodes FOR DELETE
--     USING (author_id = auth.uid());

