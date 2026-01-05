const supabase = require('../config/supabase');

/**
 * 푸시 구독 정보 저장
 */
exports.subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.id;

    if (!subscription || !userId) {
      return res.status(400).json({ error: '구독 정보 또는 사용자 ID 누락' });
    }

    // Upsert: 동일한 endpoint가 있으면 업데이트, 없으면 삽입
    const { data, error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: 'endpoint' },
    );

    if (error) throw error;

    res.status(201).json({ message: '구독 성공' });
  } catch (error) {
    console.error('구독 저장 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

/**
 * 테스트용 푸시 발송 (선택사항)
 */
exports.sendTestNotification = async (req, res) => {
  const webpush = require('../config/webpush');
  try {
    const { userId, title, body } = req.body;

    const { data: subs, error } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return res.status(404).json({ error: '구독 정보 없음' });
    }

    const payload = JSON.stringify({ title, body });

    const sendPromises = subs.map((sub) =>
      webpush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        )
        .catch((err) => {
          if (err.statusCode === 410) {
            // 만료된 구독 삭제
            return supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
          throw err;
        }),
    );

    await Promise.all(sendPromises);
    res.json({ message: '테스트 알림 발송 완료' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
