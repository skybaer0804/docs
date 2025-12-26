import { BreadcrumbContainer } from '../containers/BreadcrumbContainer';
import { useSidebar } from '../contexts/SidebarContext';
import {
  handleBreadcrumbClick,
  getBreadcrumbLinkRoute,
  filterBreadcrumbItemsForMobile,
} from '../utils/breadcrumbUtils';
import { IconChevronsRight } from '@tabler/icons-preact';
import './Breadcrumb.scss';
import { useDnd } from '../contexts/DndContext';

/**
 * BreadcrumbNav Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
function BreadcrumbNavPresenter({ items, onNavigate, sidebarCollapsed, onToggleCollapse, currentRoute }) {
  const dnd = useDnd();

  // 브레드크럼 아이템의 docs path 계산
  const getItemDocsPath = (item) => {
    if (item.path) {
      // path가 /docs/로 시작하지 않으면 /docs/ 추가
      if (item.path.startsWith('/docs')) {
        return item.path;
      }
      return `/docs/${item.path}`;
    }
    if (item.type === 'category' && item.category) {
      return `/docs/${item.category}`;
    }
    if (item.type === 'subcategory' && item.category && item.subcategory) {
      return `/docs/${item.category}/${item.subcategory}`;
    }
    if (item.type === 'link' && item.route === '/') {
      return '/docs';
    }
    return null;
  };

  const renderBreadcrumbItem = (item, index, isCurrent, isLast = false) => {
    const linkRoute = getBreadcrumbLinkRoute(item);
    const itemDocsPath = getItemDocsPath(item);
    // Breadcrumb는 path 기반이므로, id는 나중에 path로 조회하도록 함
    // 일단 path를 그대로 사용하되, DIRECTORY 타입으로 가정
    const itemId = item.nodeId || null; // 나중에 path로 조회해서 설정
    const itemType = 'DIRECTORY';
    // itemId가 null이면 루트(Home)를 의미하며, 'null' 문자열로 취급하여 DnD 가능하게 함
    const effectiveId = itemId === null && item.type === 'link' && item.route === '/' ? 'null' : itemId;
    const normalizedTargetId = effectiveId === 'null' ? null : effectiveId;
    
    const canDrop = effectiveId !== null && dnd.canDropTo(effectiveId, itemType);
    const isDragOver = effectiveId !== null && dnd.dragOverId === normalizedTargetId;
    const isDropSuccess = effectiveId !== null && dnd.dropSuccessId === normalizedTargetId;

    return (
      <span
        key={index}
        class={`breadcrumb__item ${isDragOver ? 'breadcrumb__item--drag-over' : ''} ${
          isDropSuccess ? 'breadcrumb__item--drop-success' : ''
        } ${canDrop && dnd.isDragging ? 'breadcrumb__item--droppable' : ''}`}
        {...(effectiveId !== null ? {
          'data-dnd-drop-id': effectiveId,
          'data-dnd-drop-type': itemType,
        } : {})}
      >
        {!isCurrent && linkRoute ? (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleBreadcrumbClick(item, onNavigate);
            }}
            class="breadcrumb__link"
            title={item.label}
          >
            {item.label}
          </a>
        ) : (
          <span class="breadcrumb__current" title={item.label}>
            {item.label}
          </span>
        )}
        {!isLast && <span class="breadcrumb__separator"> &gt; </span>}
      </span>
    );
  };

  return (
    <>
      {/* 데스크톱 브레드크럼 */}
      <nav class="breadcrumb breadcrumb--desktop">
        {sidebarCollapsed && onToggleCollapse && (
          <button class="breadcrumb__expand-btn" onClick={onToggleCollapse} aria-label="사이드바 펼치기">
            <IconChevronsRight size={16} />
          </button>
        )}
        {items.map((item, index) => {
          const isCurrent = item.type === 'current' || index === items.length - 1;
          return renderBreadcrumbItem(item, index, isCurrent, index === items.length - 1);
        })}
      </nav>

      {/* 모바일 브레드크럼 */}
      <nav class="breadcrumb breadcrumb--mobile">
        {(() => {
          const displayItems = filterBreadcrumbItemsForMobile(items);
          return displayItems.map(({ item, index, isEllipsis }, displayIndex) => {
            if (isEllipsis) {
              return (
                <span key="ellipsis" class="breadcrumb__separator">
                  ...
                </span>
              );
            }

            const isCurrent = item.type === 'current' || index === items.length - 1;
            const isLastDisplayItem = displayIndex === displayItems.length - 1;
            return renderBreadcrumbItem(item, index, isCurrent, isLastDisplayItem);
          });
        })()}
      </nav>
    </>
  );
}

/**
 * Breadcrumb Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
export function BreadcrumbPresenter({ items, displayType, currentRoute, onNavigate }) {
  const sidebar = useSidebar();
  const onToggleSidebar = sidebar?.toggleSidebar;
  const onToggleCollapse = sidebar?.toggleSidebarCollapse;
  const sidebarCollapsed = sidebar?.sidebarCollapsed;

  if (displayType === 'none') {
    return null;
  }

  return (
    <BreadcrumbNavPresenter
      items={items}
      onNavigate={onNavigate}
      sidebarCollapsed={sidebarCollapsed}
      onToggleCollapse={onToggleCollapse}
      currentRoute={currentRoute}
    />
  );
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
export const Breadcrumb = BreadcrumbContainer;
