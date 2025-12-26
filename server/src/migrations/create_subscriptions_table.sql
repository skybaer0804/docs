-- Subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 구독을 하는 사람
    following_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 구독 대상자
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 동일한 사람을 중복 구독하는 것을 방지
    UNIQUE(follower_id, following_id)
);

-- 인덱스 추가 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_subscriptions_follower ON subscriptions(follower_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_following ON subscriptions(following_id);

