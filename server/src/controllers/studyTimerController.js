const supabase = require('../config/supabase');

/**
 * 공부 세션 시작
 * POST /api/study-timer/start
 */
exports.startSession = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('study_sessions')
            .insert({
                user_id: userId,
                start_at: new Date().toISOString(),
                status: 'recording'
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (err) {
        console.error('Start session error:', err);
        res.status(500).json({ error: 'Failed to start study session' });
    }
};

/**
 * 공부 세션 종료
 * PUT /api/study-timer/end/:id
 */
exports.endSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { end_at, pure_duration } = req.body;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('study_sessions')
            .update({
                end_at,
                pure_duration,
                status: 'completed'
            })
            .eq('id', id)
            .eq('user_id', userId) // 소유권 확인
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error('End session error:', err);
        res.status(500).json({ error: 'Failed to end study session' });
    }
};

/**
 * 공부 통계 조회 (날짜별 합계)
 * GET /api/study-timer/stats?days=14
 */
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const days = parseInt(req.query.days) || 14;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('study_sessions')
            .select('start_at, pure_duration')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('start_at', startDate.toISOString())
            .order('start_at', { ascending: true });

        if (error) throw error;

        // 날짜별로 그룹화
        const stats = {};
        data.forEach(session => {
            const date = session.start_at.split('T')[0];
            stats[date] = (stats[date] || 0) + (session.pure_duration || 0);
        });

        res.json(stats);
    } catch (err) {
        console.error('Get stats error:', err);
        res.status(500).json({ error: 'Failed to fetch study stats' });
    }
};

/**
 * 공부 세션 목록 조회 (최근순)
 * GET /api/study-timer/sessions?limit=20&offset=0
 */
exports.getSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const { data, error } = await supabase
            .from('study_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('start_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error('Get sessions error:', err);
        res.status(500).json({ error: 'Failed to fetch study sessions' });
    }
};

