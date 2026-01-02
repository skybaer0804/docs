-- 순공부 시간 측정을 위한 study_sessions 테이블 생성

-- ============================================
-- 1. Study Sessions 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_at TIMESTAMP WITH TIME ZONE,
    pure_duration INTEGER DEFAULT 0, -- 초 단위
    status VARCHAR(20) DEFAULT 'recording', -- 'recording', 'paused', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 인덱스 생성
-- ============================================
-- 사용자별 조회 및 진행 중인 세션 검색 최적화
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_status ON study_sessions(user_id, status);

-- ============================================
-- 3. 트리거 설정
-- ============================================
-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_study_sessions_updated_at ON study_sessions;
CREATE TRIGGER update_study_sessions_updated_at 
    BEFORE UPDATE ON study_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS 정책 (Supabase 직접 접근 시 유효)
-- ============================================
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- 자신의 공부 세션만 관리 가능
DROP POLICY IF EXISTS "Users can manage their own study sessions" ON study_sessions;
CREATE POLICY "Users can manage their own study sessions" 
ON study_sessions FOR ALL USING (auth.uid() = user_id);

