import { useState, useEffect } from 'preact/hooks';
import { DirectoryTree } from './DirectoryTree';
import { Breadcrumb } from './Breadcrumb';
import { Resizer } from './Resizer';
import { SidebarContext } from '../contexts/SidebarContext';
import { IconChevronsLeft } from '@tabler/icons-preact';
import './Layout.scss';

export function Layout({ children, currentPath, onNavigate }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true';
    });
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('sidebarWidth');
        return saved ? parseInt(saved, 10) : 250;
    });
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth > 768);
        };

        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    useEffect(() => {
        const updateHeaderHeight = () => {
            const header = document.querySelector('.header');
            if (header) {
                const height = header.offsetHeight;
                document.documentElement.style.setProperty('--header-height', `${height}px`);
            }
        };

        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);
        const observer = new MutationObserver(updateHeaderHeight);
        const header = document.querySelector('.header');
        if (header) {
            observer.observe(header, { childList: true, subtree: true, attributes: true });
        }

        return () => {
            window.removeEventListener('resize', updateHeaderHeight);
            observer.disconnect();
        };
    }, [currentPath]);

    const handleSidebarResize = (width) => {
        setSidebarWidth(width);
        localStorage.setItem('sidebarWidth', width.toString());
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const toggleSidebarCollapse = () => {
        const newCollapsed = !sidebarCollapsed;
        setSidebarCollapsed(newCollapsed);
        localStorage.setItem('sidebarCollapsed', newCollapsed.toString());
    };

    // 모바일에서 사이드바 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sidebarOpen && window.innerWidth <= 768) {
                const sidebar = document.querySelector('.layout__sidebar');
                if (sidebar && !sidebar.contains(e.target)) {
                    closeSidebar();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen]);

    // 라우트 변경 시 모바일에서 사이드바 닫기
    useEffect(() => {
        if (sidebarOpen && window.innerWidth <= 768) {
            closeSidebar();
        }
    }, [currentPath]);

    const handleNavigate = (path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        // 모바일에서 네비게이션 시 사이드바 닫기
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    };

    return (
        <SidebarContext.Provider value={{ toggleSidebar, closeSidebar, toggleSidebarCollapse, sidebarCollapsed }}>
            <div class="layout">
                <div class={`layout__overlay ${sidebarOpen ? 'layout__overlay--open' : ''}`} onClick={closeSidebar}></div>
                <div class="layout__container">
                    <header class="header">
                        <Breadcrumb currentRoute={currentPath} onNavigate={handleNavigate} />
                    </header>
                    <div class="layout__content-wrapper">
                        <aside
                            class={`layout__sidebar ${sidebarOpen ? 'layout__sidebar--open' : ''} ${
                                sidebarCollapsed && isDesktop ? 'layout__sidebar--collapsed' : ''
                            }`}
                            style={{ width: sidebarCollapsed && isDesktop ? '0px' : `${sidebarWidth}px` }}
                        >
                            {isDesktop && !sidebarCollapsed && (
                                <button class="layout__sidebar-collapse" onClick={toggleSidebarCollapse} aria-label="사이드바 접기">
                                    <IconChevronsLeft size={16} />
                                </button>
                            )}
                            <button class="layout__sidebar-close" onClick={closeSidebar} aria-label="사이드바 닫기">
                                ✕
                            </button>
                            {(!sidebarCollapsed || !isDesktop) && <DirectoryTree currentPath={currentPath} onNavigate={handleNavigate} />}
                        </aside>
                        {isDesktop && !sidebarCollapsed && <Resizer onResize={handleSidebarResize} minSidebarWidth={200} minContentWidth={300} />}
                        <main class="layout__main">{children}</main>
                    </div>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
