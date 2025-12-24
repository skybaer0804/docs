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
import { getParentDocsPath, routeToDocsPath } from '../utils/dndUtils';

/**
 * BreadcrumbNav Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
function BreadcrumbNavPresenter({ items, onNavigate, sidebarCollapsed, onToggleCollapse, upTargetDocsPath }) {
  const dnd = useDnd();
  const canDropUp = !!upTargetDocsPath && dnd.canDropTo(upTargetDocsPath);
  const isDragOverUp = !!upTargetDocsPath && dnd.dragOverPath === upTargetDocsPath;
  const isDropSuccessUp = !!upTargetDocsPath && dnd.dropSuccessPath === upTargetDocsPath;

  const renderBreadcrumbItem = (item, index, isCurrent, isLast = false) => {
    const linkRoute = getBreadcrumbLinkRoute(item);

    return (
      <span key={index} class="breadcrumb__item">
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
        {upTargetDocsPath && (
          <button
            class={`breadcrumb__drop-zone ${canDropUp ? 'breadcrumb__drop-zone--enabled' : ''} ${
              isDragOverUp ? 'breadcrumb__drop-zone--drag-over' : ''
            } ${isDropSuccessUp ? 'breadcrumb__drop-zone--drop-success' : ''}`}
            onDragEnter={(e) => {
              if (!canDropUp) return;
              e.preventDefault();
              dnd.markDragOver(upTargetDocsPath);
            }}
            onDragOver={(e) => {
              if (!canDropUp) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              dnd.markDragOver(upTargetDocsPath);
            }}
            onDragLeave={() => {
              if (isDragOverUp) dnd.clearDragOver();
            }}
            onDrop={(e) => {
              if (!canDropUp) return;
              e.preventDefault();
              dnd.dropTo(upTargetDocsPath, e.currentTarget);
            }}
            title="상위 폴더로 이동 (드롭)"
            aria-label="상위 폴더로 이동 드롭존"
          >
            ⬆
          </button>
        )}
        {items.map((item, index) => {
          const isCurrent = item.type === 'current' || index === items.length - 1;
          return renderBreadcrumbItem(item, index, isCurrent, index === items.length - 1);
        })}
      </nav>

      {/* 모바일 브레드크럼 */}
      <nav class="breadcrumb breadcrumb--mobile">
        {upTargetDocsPath && (
          <button
            class={`breadcrumb__drop-zone ${canDropUp ? 'breadcrumb__drop-zone--enabled' : ''} ${
              isDragOverUp ? 'breadcrumb__drop-zone--drag-over' : ''
            } ${isDropSuccessUp ? 'breadcrumb__drop-zone--drop-success' : ''}`}
            onDragEnter={(e) => {
              if (!canDropUp) return;
              e.preventDefault();
              dnd.markDragOver(upTargetDocsPath);
            }}
            onDragOver={(e) => {
              if (!canDropUp) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              dnd.markDragOver(upTargetDocsPath);
            }}
            onDragLeave={() => {
              if (isDragOverUp) dnd.clearDragOver();
            }}
            onDrop={(e) => {
              if (!canDropUp) return;
              e.preventDefault();
              dnd.dropTo(upTargetDocsPath, e.currentTarget);
            }}
            title="상위 폴더로 이동 (드롭)"
            aria-label="상위 폴더로 이동 드롭존"
          >
            ⬆
          </button>
        )}
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

  const currentDocsPath = routeToDocsPath(currentRoute || '');
  const upTargetDocsPath = currentDocsPath ? getParentDocsPath(currentDocsPath) : '';

  if (displayType === 'none') {
    return null;
  }

  return (
    <BreadcrumbNavPresenter
      items={items}
      onNavigate={onNavigate}
      sidebarCollapsed={sidebarCollapsed}
      onToggleCollapse={onToggleCollapse}
      upTargetDocsPath={upTargetDocsPath}
    />
  );
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
export const Breadcrumb = BreadcrumbContainer;
