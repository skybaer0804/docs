import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchFollowingNodes, fetchUserDocs } from '../utils/api';
import { subKeys, docsKeys } from '../query/queryKeys';

export function useFollowingNodes(options = {}) {
  return useQuery({
    queryKey: subKeys.followingNodes(),
    queryFn: fetchFollowingNodes,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * 특정 유저의 노드 데이터를 지연 로딩하기 위한 훅
 */
export function useUserNodes(userId, options = {}) {
  return useQuery({
    queryKey: docsKeys.userTree(userId),
    queryFn: () => fetchUserDocs(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

