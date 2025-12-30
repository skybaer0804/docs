import { useQuery } from '@tanstack/react-query';
import { fetchDocContent, fetchDocById } from '../utils/api';
import { docsKeys } from '../query/queryKeys';

/**
 * 문서 내용을 가져오는 Hook
 * @param {string} identifier - path 또는 id
 * @param {Object} options - react-query 옵션
 */
export function useDocContentQuery(identifier, options = {}) {
  // identifier가 null이거나 빈 문자열인 경우 처리
  if (!identifier) {
    return useQuery({
      queryKey: docsKeys.content('root'),
      queryFn: () => null,
      enabled: false,
      ...options,
    });
  }

  // identifier가 UUID 형식인지 확인 (간단한 체크)
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  return useQuery({
    queryKey: isId ? docsKeys.detail(identifier) : docsKeys.content(identifier),
    queryFn: () => (isId ? fetchDocById(identifier) : fetchDocContent(identifier)),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}


