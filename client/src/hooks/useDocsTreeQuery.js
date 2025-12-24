import { useQuery } from '@tanstack/react-query';
import { fetchAllDocs } from '../utils/api';
import { docsKeys } from '../query/queryKeys';

/**
 * 전체 문서 노드 목록을 TanStack Query로 가져옵니다.
 * - 여러 훅/컴포넌트에서 중복 호출되는 fetchAllDocs()를 단일 캐시로 통합
 */
export function useDocsTreeQuery(options = {}) {
  return useQuery({
    queryKey: docsKeys.tree(),
    queryFn: fetchAllDocs,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}


