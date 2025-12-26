import { useQuery } from '@tanstack/react-query';
import { fetchFollowingNodes } from '../utils/api';
import { subKeys } from '../query/queryKeys';

export function useFollowingNodes(options = {}) {
  return useQuery({
    queryKey: subKeys.followingNodes(),
    queryFn: fetchFollowingNodes,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

