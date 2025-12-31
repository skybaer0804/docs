import { useState, useCallback, useEffect } from 'preact/hooks';
import { searchDocs } from '../utils/api';

/**
 * 검색 로직을 담당하는 Custom Hook (서버 사이드 검색으로 전환)
 * @param {string} query 검색어
 * @param {boolean} includeFollowing 구독 유저 포함 여부
 * @param {boolean} searchBySubscriber 구독자 이름 검색 여부
 */
export function useSearch(query, includeFollowing = false, searchBySubscriber = false) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const data = await searchDocs(searchQuery, includeFollowing, searchBySubscriber);
            const mappedResults = data.map((node) => ({
                id: node.id,
                title: node.name.replace(/\.md$/, ''),
                route: node.type === 'DIRECTORY' ? `/folder/${node.id}` : `/doc/${node.id}`,
                type: node.type === 'DIRECTORY' ? 'directory' : 'file',
                authorName: node.users?.username,
                isMyDoc: node.author_id === data.userId, // 백엔드에서 userId를 주거나 비교 로직 필요
            }));
            setResults(mappedResults);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    }, [includeFollowing, searchBySubscriber]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) handleSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    return { results, loading };
}
