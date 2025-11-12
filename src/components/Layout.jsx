import { useState, useEffect } from 'preact/hooks';
import { DirectoryTree } from './DirectoryTree';
import { SidebarContext } from '../contexts/SidebarContext';

export function Layout({ children, currentPath, onNavigate }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    // 모바일에서 사이드바 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sidebarOpen && window.innerWidth <= 768) {
                const sidebar = document.querySelector('.sidebar');
                const toggle = document.querySelector('.mobile-menu-toggle-small');
                if (sidebar && !sidebar.contains(e.target) && !toggle?.contains(e.target)) {
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
        <SidebarContext.Provider value={{ toggleSidebar, closeSidebar }}>
            <div class="layout">
                <div class={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar}></div>
                <div class="container">
                    <div class="content-wrapper">
                        <aside class={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                            <button class="sidebar-close" onClick={closeSidebar} aria-label="사이드바 닫기">
                                ✕
                            </button>
                            <DirectoryTree currentPath={currentPath} onNavigate={handleNavigate} />
                        </aside>
                        <main class="main-content">{children}</main>
                    </div>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
