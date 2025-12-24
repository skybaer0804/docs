import { BreadcrumbContainer } from '../containers/BreadcrumbContainer';
import { useSidebar } from '../contexts/SidebarContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  handleBreadcrumbClick,
  getBreadcrumbLinkRoute,
  filterBreadcrumbItemsForMobile,
} from '../utils/breadcrumbUtils';
import { IconChevronsRight, IconExternalLink } from '@tabler/icons-preact';
import './Breadcrumb.scss';

/**
 * BreadcrumbNav Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
function BreadcrumbNavPresenter({ items, onNavigate, sidebarCollapsed, onToggleCollapse }) {
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
  const theme = useTheme();
  const onToggleSidebar = sidebar?.toggleSidebar;
  const onToggleCollapse = sidebar?.toggleSidebarCollapse;
  const sidebarCollapsed = sidebar?.sidebarCollapsed;

  const handleExternalLinkClick = (e) => {
    e.preventDefault();
    window.open(
      'https://skybear.notion.site/Web-Developer-91775e3d66dd4b0893b871bce56894db?pvs=74',
      '_blank',
      'noopener,noreferrer',
    );
  };

  if (displayType === 'none') {
    return null;
  }

  return (
    <div class="header__breadcrumb">
      <div class="header__title-wrapper">
        <h1 class="header__title">
          Nodnjs Documentation
          <a
            href="https://skybear.notion.site/Web-Developer-91775e3d66dd4b0893b871bce56894db?pvs=74"
            onClick={handleExternalLinkClick}
            class="header__external-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="외부 링크 열기"
          >
            <IconExternalLink size={16} />
          </a>
        </h1>
      </div>
      <BreadcrumbNavPresenter
        items={items}
        onNavigate={onNavigate}
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </div>
  );
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
export const Breadcrumb = BreadcrumbContainer;
