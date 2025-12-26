import { useState, useCallback } from 'preact/hooks';
import { followUser, unfollowUser } from '../utils/api';
import { useToast } from '../contexts/ToastContext';

export function useSubscription() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleFollow = useCallback(async (userId, onComplete) => {
    setLoading(true);
    try {
      await followUser(userId);
      showToast('팔로우했습니다.', 'success');
      if (onComplete) onComplete();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleUnfollow = useCallback(async (userId, onComplete) => {
    setLoading(true);
    try {
      await unfollowUser(userId);
      showToast('언팔로우했습니다.', 'info');
      if (onComplete) onComplete();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    loading,
    handleFollow,
    handleUnfollow
  };
}

