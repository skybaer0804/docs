import { useState, useEffect, useCallback } from 'preact/hooks';
import { fetchSubscriptionStats, fetchSubscriptionList } from '../utils/api';

export function useUserSubscriptions(userId) {
  const [stats, setStats] = useState({ followers_count: 0, following_count: 0 });
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchSubscriptionStats(userId);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [userId]);

  const loadList = useCallback(
    async (type) => {
      if (!userId) return;
      setLoading(true);
      try {
        const data = await fetchSubscriptionList(userId, type);
        if (type === 'followers') {
          setFollowers(data);
        } else {
          setFollowing(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId, loadStats]);

  return {
    stats,
    followers,
    following,
    loading,
    error,
    loadStats,
    loadList
  };
}

