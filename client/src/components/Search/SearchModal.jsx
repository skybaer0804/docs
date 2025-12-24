import { useEffect, useRef, useState } from 'preact/hooks';
import { IconSearch, IconFileText, IconFolder, IconHistory, IconX } from '@tabler/icons-preact';
import './SearchModal.scss';

/**
 * SearchModal Presenter 컴포넌트
 * 검색창 UI와 결과 리스트를 렌더링합니다.
 */
export function SearchModal({ isOpen, onClose, query, onQueryChange, results, onSelect, recentSearches = [] }) {
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
          onSelect(displayItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, displayItems, selectedIndex, onSelect]);

  if (!isOpen) return null;

  return (
    <div class="search-modal__overlay" onClick={handleOverlayClick}>
      <div class="search-modal__container" ref={modalRef}>
        <div class="search-modal__header">
          <div class="search-modal__search-icon">
            <IconSearch size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            class="search-modal__input"
            placeholder="무엇을 찾고 계신가요?"
            value={query}
            onInput={(e) => onQueryChange(e.target.value)}
          />
          <button class="search-modal__close-btn" onClick={onClose} aria-label="닫기">
            <IconX size={20} />
          </button>
        </div>

        <div class="search-modal__body">
          {/* 타이틀 (선택 사항) */}
          {!query && recentSearches.length > 0 && <div class="search-modal__section-title">최근 검색</div>}

          {displayItems.length > 0 ? (
            <ul class="search-modal__result-list" ref={resultListRef}>
              {displayItems.map((item, index) => (
                <li
                  key={item.route}
                  class={`search-modal__result-item ${
                    index === selectedIndex ? 'search-modal__result-item--active' : ''
                  }`}
                  onClick={() => onSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div class={`search-modal__result-item-icon search-modal__result-item-icon--${item.type}`}>
                    {/* 최근 검색어일 경우 시계 아이콘, 아니면 타입별 아이콘 */}
                    {!query ? (
                      <IconHistory size={20} />
                    ) : item.type === 'directory' ? (
                      <IconFolder size={20} />
                    ) : (
                      <IconFileText size={20} />
                    )}
                  </div>
                  <div class="search-modal__result-item-content">
                    <div class="search-modal__result-item-title">{item.title}</div>
                    <div class="search-modal__result-item-path">{item.path}</div>
                  </div>
                  {/* Enter 키 안내 (선택된 항목에만 표시) */}
                  {index === selectedIndex && <div class="search-modal__result-item-enter">⏎</div>}
                </li>
              ))}
            </ul>
          ) : (
            <div class="search-modal__empty">{query ? '검색 결과가 없습니다.' : '최근 검색 기록이 없습니다.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
