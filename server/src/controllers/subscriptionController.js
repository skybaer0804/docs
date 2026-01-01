const supabase = require('../config/supabase');

// 팔로우 (구독 시작)
exports.follow = async (req, res) => {
  try {
    const follower_id = req.user.id;
    const { following_id } = req.body;

    if (!following_id) {
      return res.status(400).json({ error: 'following_id is required' });
    }

    if (follower_id === following_id) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{ follower_id, following_id }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Already following this user' });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 언팔로우 (구독 취소)
exports.unfollow = async (req, res) => {
  try {
    const follower_id = req.user.id;
    const { following_id } = req.body;

    if (!following_id) {
      return res.status(400).json({ error: 'following_id is required' });
    }

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('follower_id', follower_id)
      .eq('following_id', following_id);

    if (error) throw error;

    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 특정 유저의 구독 통계 (팔로워/팔로잉 수)
exports.getSubscriptionStats = async (req, res) => {
  try {
    const { id: userId } = req.params;

    // 팔로워 수 조회
    const { count: followersCount, error: followerErr } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (followerErr) throw followerErr;

    // 팔로잉 수 조회
    const { count: followingCount, error: followingErr } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (followingErr) throw followingErr;

    res.json({
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 특정 유저의 구독 리스트 (팔로워 또는 팔로잉)
exports.getSubscriptions = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { type } = req.query; // 'followers' 또는 'following'

    let query;
    if (type === 'followers') {
      // 나를 구독하는 사람들 정보를 가져옴
      query = supabase
        .from('subscriptions')
        .select(
          `
          follower_id,
          users:follower_id (id, username, email, document_title)
        `,
        )
        .eq('following_id', userId);
    } else {
      // 내가 구독하는 사람들 정보를 가져옴
      query = supabase
        .from('subscriptions')
        .select(
          `
          following_id,
          users:following_id (id, username, email, document_title)
        `,
        )
        .eq('follower_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const list = data.map((item) => (type === 'followers' ? item.users : item.users));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 내가 구독한 유저들의 공개된 노드 조회
exports.getFollowingNodes = async (req, res) => {
  try {
    const follower_id = req.user.id;

    // 1. 내가 팔로잉하는 유저 ID 목록 가져오기
    const { data: subscriptions, error: subErr } = await supabase
      .from('subscriptions')
      .select('following_id')
      .eq('follower_id', follower_id);

    if (subErr) throw subErr;

    const followingIds = subscriptions.map((s) => s.following_id);

    if (followingIds.length === 0) {
      return res.json([]);
    }

    // 2. 해당 유저들의 공개된(visibility_type='public' 또는 'subscriber_only') 노드들 가져오기
    const { data: nodes, error: nodeErr } = await supabase
      .from('nodes')
      .select(
        `
        id, parent_id, name, type, visibility_type, author_id,
        users:author_id (username)
      `,
      )
      .in('author_id', followingIds)
      .in('visibility_type', ['public', 'subscriber_only'])
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (nodeErr) throw nodeErr;

    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
