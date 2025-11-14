import { useState, useEffect } from 'preact/hooks';
import { sidebarObserver } from '../observers/SidebarObserver';

/**
 * Layout의 사이드바 상태 관리를 담당하는 Custom Hook
 * TDD 친화적: 상태 관리 로직을 분리하여 테스트 용이
 */
export function useLayout() {
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
    }, []);

    const handleSidebarResize = (width) => {
        setSidebarWidth(width);
        localStorage.setItem('sidebarWidth', width.toString());
        sidebarObserver.setState({ width });
    };

    const toggleSidebar = () => {
        const newOpen = !sidebarOpen;
        setSidebarOpen(newOpen);
        sidebarObserver.setState({ isOpen: newOpen });
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
        sidebarObserver.setState({ isOpen: false });
    };

    const toggleSidebarCollapse = () => {
        const newCollapsed = !sidebarCollapsed;
        setSidebarCollapsed(newCollapsed);
        localStorage.setItem('sidebarCollapsed', newCollapsed.toString());
        sidebarObserver.setState({ isCollapsed: newCollapsed });
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

    return {
        sidebarOpen,
        sidebarCollapsed,
        sidebarWidth,
        isDesktop,
        handleSidebarResize,
        toggleSidebar,
        closeSidebar,
        toggleSidebarCollapse,
    };
}
