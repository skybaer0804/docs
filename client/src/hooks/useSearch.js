import { useState, useCallback, useEffect } from 'preact/hooks';
import { searchDocs, searchUsers } from '../utils/api';

/**
 * 검색 로직을 담당하는 Custom Hook (서버 사이드 검색으로 전환)
 * @param {string} query 검색어
 * @param {boolean} includeFollowing 구독 유저 포함 여부
 * @param {string} authorId 특정 유저 ID (필터링용)
 */
export function useSearch(query, includeFollowing = false, authorId = null) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.trim().length < 1) {
            setResults([]);
            return;
        }

        const trimmedQuery = searchQuery.trim();

        // 1. 유저 멘션 검색 (@이름)
        if (trimmedQuery.startsWith('@')) {
            const userKeyword = trimmedQuery.slice(1);
            if (userKeyword.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const users = await searchUsers(userKeyword);
                const mappedUsers = users.map(user => ({
                    id: user.id,
                    title: user.username,
                    subtitle: user.document_title || '문서 제목 없음',
                    type: 'user',
                    username: user.username
                }));
                setResults(mappedUsers);
            } catch (err) {
                console.error('User search failed:', err);
            } finally {
                setLoading(false);
            }
            return;
        }

        // 2. 문서 검색
        if (trimmedQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const data = await searchDocs(trimmedQuery, includeFollowing, authorId);
            const mappedResults = data.map((node) => ({
                id: node.id,
                title: node.name.replace(/\.md$/, ''),
                route: node.type === 'DIRECTORY' ? `/folder/${node.id}` : `/doc/${node.id}`,
                type: node.type === 'DIRECTORY' ? 'directory' : 'file',
                authorName: node.users?.username,
                isMyDoc: node.author_id === data.userId, 
            }));
            setResults(mappedResults);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    }, [includeFollowing, authorId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) handleSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    return { results, loading };
}
