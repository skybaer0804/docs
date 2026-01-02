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

