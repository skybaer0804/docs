import { useState, useCallback, useEffect } from 'preact/hooks';
import { Modal } from './Modal';
import { Button } from './Button';
import { searchUsers } from '../utils/api';
import { useSubscription } from '../hooks/useSubscription';
import { IconSearch, IconUserPlus, IconUserCheck, IconLoader2 } from '@tabler/icons-preact';
import './UserSearchModal.scss';

export function UserSearchModal({ isOpen, onClose, onFollowSuccess }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { handleFollow, handleUnfollow, loading: subLoading } = useSubscription();

  const handleSearch = useCallback(async (searchQuery) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await searchUsers(searchQuery);
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) handleSearch(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const toggleFollow = async (user) => {
    if (user.is_following) {
      await handleUnfollow(user.id, () => {
        setResults(prev => prev.map(u => u.id === user.id ? { ...u, is_following: false } : u));
        if (onFollowSuccess) onFollowSuccess();
      });
    } else {
      await handleFollow(user.id, () => {
        setResults(prev => prev.map(u => u.id === user.id ? { ...u, is_following: true } : u));
        if (onFollowSuccess) onFollowSuccess();
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="유저 찾기" maxWidth="600px">
      <div className="user-search">
        <div className="user-search__input-wrapper">
          <IconSearch className="user-search__icon" size={20} />
          <input
            type="text"
            className="user-search__input"
            placeholder="유저 이름 또는 문서 제목으로 검색..."
            value={query}
            onInput={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading && <IconLoader2 className="user-search__spinner" size={20} />}
        </div>

        <div className="user-search__results">
          {query.trim().length < 2 ? (
            <p className="user-search__hint">2글자 이상 입력하여 검색하세요.</p>
          ) : results.length === 0 && !loading ? (
            <p className="user-search__empty">검색 결과가 없습니다.</p>
          ) : (
            <ul className="user-search__list">
              {results.map((u) => (
                <li key={u.id} className="user-search__item">
                  <div className="user-search__user-info">
                    <span className="user-search__username">{u.username}</span>
                    <span className="user-search__doc-title">{u.document_title || '문서 제목 없음'}</span>
                  </div>
                  <Button
                    variant={u.is_following ? 'secondary' : 'primary'}
                    size="small"
                    onClick={() => toggleFollow(u)}
                    disabled={subLoading}
                  >
                    {u.is_following ? (
                      <><IconUserCheck size={16} /> 팔로잉</>
                    ) : (
                      <><IconUserPlus size={16} /> 팔로우</>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

