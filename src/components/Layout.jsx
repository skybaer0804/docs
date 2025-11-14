import { LayoutContainer } from '../containers/LayoutContainer';
import { DirectoryTree } from './DirectoryTree';
import { Breadcrumb } from './Breadcrumb';
import { Resizer } from './Resizer';
import { IconChevronsLeft } from '@tabler/icons-preact';
import './Layout.scss';

/**
 * Layout Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
export function LayoutPresenter({
    children,
    sidebarOpen,
    sidebarCollapsed,
    sidebarWidth,
    isDesktop,
    currentPath,
    onSidebarResize,
    onToggleSidebar,
    onCloseSidebar,
    onToggleSidebarCollapse,
    onNavigate,
}) {
    return (
        <div class="layout">
            <div class={`layout__overlay ${sidebarOpen ? 'layout__overlay--open' : ''}`} onClick={onCloseSidebar}></div>
            <div class="layout__container">
                <header class="header">
                    <Breadcrumb currentRoute={currentPath} onNavigate={onNavigate} />
                </header>
                <div class="layout__content-wrapper">
                    <aside
                        class={`layout__sidebar ${sidebarOpen ? 'layout__sidebar--open' : ''} ${
                            sidebarCollapsed && isDesktop ? 'layout__sidebar--collapsed' : ''
                        }`}
                        style={{ width: sidebarCollapsed && isDesktop ? '0px' : `${sidebarWidth}px` }}
                    >
                        {isDesktop && !sidebarCollapsed && (
                            <button class="layout__sidebar-collapse" onClick={onToggleSidebarCollapse} aria-label="사이드바 접기">
                                <IconChevronsLeft size={16} />
                            </button>
                        )}
                        <button class="layout__sidebar-close" onClick={onCloseSidebar} aria-label="사이드바 닫기">
                            ✕
                        </button>
                        {(!sidebarCollapsed || !isDesktop) && <DirectoryTree currentPath={currentPath} onNavigate={onNavigate} />}
                    </aside>
                    {isDesktop && !sidebarCollapsed && <Resizer onResize={onSidebarResize} minSidebarWidth={170} minContentWidth={300} />}
                    <main class="layout__main">{children}</main>
                </div>
            </div>
        </div>
    );
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
export const Layout = LayoutContainer;
