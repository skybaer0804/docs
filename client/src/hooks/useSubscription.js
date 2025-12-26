import { useState, useCallback } from 'preact/hooks';
import { followUser, unfollowUser } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { subKeys } from '../query/queryKeys';

export function useSubscription() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const handleFollow = useCallback(
    async (userId, onComplete) => {
      setLoading(true);
      try {
        await followUser(userId);
        showToast('팔로우했습니다.', 'success');
        queryClient.invalidateQueries({ queryKey: subKeys.all });
        if (onComplete) onComplete();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast, queryClient],
  );

  const handleUnfollow = useCallback(
    async (userId, onComplete) => {
      setLoading(true);
      try {
        await unfollowUser(userId);
        showToast('언팔로우했습니다.', 'info');
        queryClient.invalidateQueries({ queryKey: subKeys.all });
        if (onComplete) onComplete();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast, queryClient],
  );

  return {
    loading,
    handleFollow,
    handleUnfollow
  };
}

