import { useState, useEffect, useRef } from 'preact/hooks';
import {
  IconSearch,
  IconX,
  IconFileText,
  IconFolder,
  IconHistory,
  IconLoader2,
  IconUser,
} from '@tabler/icons-preact';
import './SearchModal.scss';

export function SearchModal({
  isOpen,
  onClose,
  query,
  onQueryChange,
  includeFollowing,
  onIncludeFollowingChange,
  selectedUser,
  onRemoveSelectedUser,
  results,
  loading,
  onSelect,
  recentSearches = [],
}) {
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const resultListRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 표시할 목록 결정 (검색어가 없으면 최근 검색어, 있으면 검색 결과)
  const displayItems = !query ? recentSearches : results;

  // 모달이 열릴 때 input에 포커스 및 초기화
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      if (inputRef.current) {
        // 애니메이션 딜레이 고려하여 약간 늦게 포커스
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 100);
      }
    }
  }, [isOpen]);

  // 검색어나 결과가 바뀌면 선택 인덱스 초기화
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, results]);

  // 외부 클릭 시 닫기
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('search-modal__overlay')) {
      onClose();
    }
  };

  // 키보드 네비게이션
  useEffect(() => {
    if (!isOpen) return;

    const scrollSelectedIntoView = (index) => {
      if (resultListRef.current) {
        const items = resultListRef.current.children;
        if (items[index]) {
          items[index].scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          });
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const newIndex = prev < displayItems.length - 1 ? prev + 1 : prev;
          setTimeout(() => scrollSelectedIntoView(newIndex), 0);
          return newIndex;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : prev;
          setTimeout(() => scrollSelectedIntoView(newIndex), 0);
          return newIndex;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (displayItems.length > 0 && selectedIndex >= 0 && selectedIndex < displayItems.length) {
          handleItemSelect(displayItems[selectedIndex]);
        }
      } else if (e.key === 'Backspace' && !query && selectedUser) {
        onRemoveSelectedUser();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, displayItems, selectedIndex, query, selectedUser, onRemoveSelectedUser]);

  // 결과 선택 핸들러 보정 (유저 선택 시 인풋 포커스 유지 및 모달 유지)
  const handleItemSelect = (item) => {
    onSelect(item);
    if (item.type === 'user' && inputRef.current) {
      // 조금 뒤에 포커스를 주어 리렌더링 후에도 포커스가 유지되도록 함
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  };

  if (!isOpen) return null;

  return (
    <div class="search-modal__overlay" onClick={handleOverlayClick}>
      <div class="search-modal__container" ref={modalRef}>
        <div class="search-modal__header">
          <div className="search-modal__input-wrapper">
            <div class="search-modal__search-icon">
              {loading ? <IconLoader2 className="search-modal__spinner" size={20} /> : <IconSearch size={20} />}
            </div>
            {selectedUser && (
              <div className="search-modal__user-tag">
                @{selectedUser.username}
                <button className="search-modal__user-tag-close" onClick={onRemoveSelectedUser}>
                  <IconX size={14} />
                </button>
              </div>
            )}
            <input
              ref={inputRef}
              type="text"
              class="search-modal__input"
              placeholder={selectedUser ? `${selectedUser.username}의 문서 검색...` : "무엇을 찾고 계신가요? (@이름으로 유저 검색)"}
              value={query}
              onInput={(e) => onQueryChange(e.target.value)}
            />
            <button
              class="search-modal__close-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              aria-label="닫기"
            >
              <IconX size={20} />
            </button>
          </div>

          <div className="search-modal__header-options">
            <label className="search-modal__checkbox-label">
              <input
                type="checkbox"
                checked={includeFollowing}
                onChange={(e) => onIncludeFollowingChange(e.target.checked)}
              />
              <span>구독 문서 포함</span>
            </label>
          </div>
        </div>

        <div class="search-modal__body">
          {/* 타이틀 (선택 사항) */}
          {!query && recentSearches.length > 0 && <div class="search-modal__section-title">최근 검색</div>}

          {displayItems.length > 0 ? (
            <ul class="search-modal__result-list" ref={resultListRef}>
              {displayItems.map((item, index) => (
                <li
                  key={item.route || item.id}
                  class={`search-modal__result-item ${index === selectedIndex ? 'search-modal__result-item--active' : ''
                    }`}
                  onClick={() => handleItemSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div class={`search-modal__result-item-icon search-modal__result-item-icon--${item.type}`}>
                    {/* 최근 검색어일 경우 시계 아이콘, 아니면 타입별 아이콘 */}
                    {!query ? (
                      <IconHistory size={20} />
                    ) : item.type === 'directory' ? (
                      <IconFolder size={20} />
                    ) : item.type === 'user' ? (
                      <IconUser size={20} />
                    ) : (
                      <IconFileText size={20} />
                    )}
                  </div>
                  <div class="search-modal__result-item-content">
                    <div class="search-modal__result-item-title">
                      {item.title}
                      {item.authorName && (
                        <span className="search-modal__result-item-author">
                          <IconUser size={12} /> {item.authorName}
                        </span>
                      )}
                    </div>
                    {item.subtitle && <div class="search-modal__result-item-subtitle">{item.subtitle}</div>}
                  </div>
                  {/* Enter 키 안내 (선택된 항목에만 표시) */}
                  {index === selectedIndex && <div class="search-modal__result-item-enter">⏎</div>}
                </li>
              ))}
            </ul>
          ) : (
            <div class="search-modal__empty">
              {query ? (
                query.startsWith('@') ? '해당 이름의 구독자를 찾을 수 없습니다.' : '검색 결과가 없습니다.'
              ) : (
                '최근 검색 기록이 없습니다.'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
