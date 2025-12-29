import { useQuery } from '@tanstack/react-query';
import { fetchDocContent } from '../utils/api';
import { docsKeys } from '../query/queryKeys';

export function useDocContentQuery(path, options = {}) {
  return useQuery({
    queryKey: docsKeys.content(path),
    queryFn: () => fetchDocContent(path),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}


