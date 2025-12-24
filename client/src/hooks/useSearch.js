import { useMemo } from 'preact/hooks';
import { useDocsTreeQuery } from './useDocsTreeQuery';

/**
 * 검색 로직을 담당하는 Custom Hook
 * @param {string} query 검색어
 * @returns {Object} 검색 결과 { results: Array }
 */
export function useSearch(query) {
    const { data: allNodes = [], isLoading: loading } = useDocsTreeQuery();

    // 검색어에 따른 필터링
    const results = useMemo(() => {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const lowerQuery = query.toLowerCase();

        return allNodes
            .filter((node) => {
                const nameMatch = node.name.toLowerCase().includes(lowerQuery);
                const pathMatch = node.path.toLowerCase().includes(lowerQuery);
                return nameMatch || pathMatch;
            })
            .map((node) => ({
                id: node.id,
                title: node.name.replace(/\.md$/, ''),
                path: node.path,
                route: node.path,
                type: node.type === 'DIRECTORY' ? 'directory' : 'file',
            }))
            .sort((a, b) => {
                // 디렉토리 우선
                if (a.type !== b.type) {
                    return a.type === 'directory' ? -1 : 1;
                }
                return a.title.localeCompare(b.title);
            });
    }, [query, allNodes]);

    return { results, loading };
}
