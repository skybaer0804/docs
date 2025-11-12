import { getMarkdownFiles } from '../utils/markdownLoader';
import { useSidebar } from '../contexts/SidebarContext';
import {
    handleBreadcrumbClick,
    getBreadcrumbLinkRoute,
    buildCategoryBreadcrumbItems,
    buildFileBreadcrumbItems,
    filterBreadcrumbItemsForMobile,
} from '../utils/breadcrumbUtils';
import { IconChevronsRight } from '@tabler/icons-preact';
import './Breadcrumb.scss';

/**
 * 브레드크럼 네비게이션 컴포넌트
 */
function BreadcrumbNav({ items, onNavigate, sidebarCollapsed, onToggleCollapse }) {
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
                    >
                        {item.label}
                    </a>
                ) : (
                    <span class="breadcrumb__current">{item.label}</span>
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

export function Breadcrumb({ currentRoute, onNavigate }) {
    const sidebar = useSidebar();
    const onToggleSidebar = sidebar?.toggleSidebar;
    const onToggleCollapse = sidebar?.toggleSidebarCollapse;
    const sidebarCollapsed = sidebar?.sidebarCollapsed;
    const { files } = getMarkdownFiles();

    // 홈일 때도 브레드크럼 표시
    if (!currentRoute || currentRoute === '/') {
        const homeItems = [{ label: '홈', route: '/', type: 'link' }];
        return (
            <div class="header__breadcrumb">
                <div class="header__title-wrapper">
                    <h1 class="header__title">Nodnjs Documentation</h1>
                </div>
                <BreadcrumbNav items={homeItems} onNavigate={onNavigate} sidebarCollapsed={sidebarCollapsed} onToggleCollapse={onToggleCollapse} />
            </div>
        );
    }

    // 카테고리/서브카테고리 경로인 경우
    if (currentRoute.startsWith('/category/')) {
        const parts = currentRoute.replace('/category/', '').split('/');
        const category = parts[0];
        const subcategory = parts[1];
        const breadcrumbItems = buildCategoryBreadcrumbItems(category, subcategory);

        return (
            <div class="header__breadcrumb">
                <div class="header__title-wrapper">
                    <h1 class="header__title">Nodnjs Documentation</h1>
                </div>
                {/* 데스크톱 브레드크럼 */}
                <BreadcrumbNav items={breadcrumbItems} onNavigate={onNavigate} sidebarCollapsed={sidebarCollapsed} onToggleCollapse={onToggleCollapse} />
            </div>
        );
    }

    const file = files.find((f) => f.route === currentRoute);

    if (!file) {
        return null;
    }

    const breadcrumbItems = buildFileBreadcrumbItems(file);

    return (
        <div class="header__breadcrumb">
            <div class="header__title-wrapper">
                <h1 class="header__title">Nodnjs Documentation</h1>
            </div>
            <BreadcrumbNav items={breadcrumbItems} onNavigate={onNavigate} sidebarCollapsed={sidebarCollapsed} onToggleCollapse={onToggleCollapse} />
        </div>
    );
}
