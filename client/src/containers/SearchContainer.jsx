import { useState, useCallback, useEffect } from 'preact/hooks';
import { SearchModal } from '../components/Search/SearchModal';
import { useSearch } from '../hooks/useSearch';

const MAX_RECENT_SEARCHES = 5;
const RECENT_SEARCHES_KEY = 'docs_recent_searches';

/**
 * Search Container 컴포넌트
 * 검색 상태 관리 및 로직 처리
 */
export function SearchContainer({ isOpen, onClose, onNavigate }) {
    const [query, setQuery] = useState('');
    const [includeFollowing, setIncludeFollowing] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const { results, loading } = useSearch(query, includeFollowing, selectedUser?.id);
    const [recentSearches, setRecentSearches] = useState([]);

    // 최근 검색어 불러오기
    useEffect(() => {
        try {
            const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (saved) {
                setRecentSearches(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load recent searches', e);
        }
    }, []);

    // 검색어 변경 핸들러
    const handleQueryChange = (newQuery) => {
        setQuery(newQuery);
        // @로 시작하면 자동으로 구독 문서 포함 체크
        if (newQuery.startsWith('@')) {
            setIncludeFollowing(true);
        }
    };

    // 최근 검색어 저장
    const saveRecentSearch = (item) => {
        const newItem = {
            id: item.id,
            title: item.title,
            route: item.route,
            type: item.type,
        };

        setRecentSearches((prev) => {
            // 중복 제거 및 최신 항목 맨 앞으로
            const filtered = prev.filter((p) => p.id !== newItem.id);
            const updated = [newItem, ...filtered].slice(0, MAX_RECENT_SEARCHES);

            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    // 결과 선택 핸들러
    const handleSelect = (item) => {
        if (item.type === 'user') {
            setSelectedUser({ id: item.id, username: item.username });
            setQuery(''); // 유저 선택 후 검색어 초기화
            return;
        }

        saveRecentSearch(item);

        if (onNavigate) {
            onNavigate(item.route);
        }
        onClose();
        setQuery(''); // 검색어 초기화
        setSelectedUser(null); // 네비게이션 후 유저 필터 초기화
    };

    // 모달 닫힐 때 검색어 초기화
    const handleClose = useCallback(() => {
        onClose();
        // 애니메이션 후 초기화 (선택적)
        setTimeout(() => {
            setQuery('');
            setSelectedUser(null);
        }, 200);
    }, [onClose]);

    return (
        <SearchModal
            isOpen={isOpen}
            onClose={handleClose}
            query={query}
            onQueryChange={handleQueryChange}
            includeFollowing={includeFollowing}
            onIncludeFollowingChange={setIncludeFollowing}
            selectedUser={selectedUser}
            onRemoveSelectedUser={() => setSelectedUser(null)}
            results={results}
            loading={loading}
            onSelect={handleSelect}
            recentSearches={recentSearches}
        />
    );
}
