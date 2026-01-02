import { useEffect } from 'preact/hooks';
import { useLayout } from '../hooks/useLayout';
import { useStudyTimer } from '../hooks/useStudyTimer';
import { LayoutPresenter } from '../components/Layout';
import { SidebarContext } from '../contexts/SidebarContext';
import { SearchContainer } from './SearchContainer';
import { DndProvider } from '../contexts/DndContext';

/**
 * Layout Container 컴포넌트
 * 비즈니스 로직과 상태 관리를 담당
 * TDD 친화적: 로직을 분리하여 테스트 시 Mock으로 대체 가능
 */
export function LayoutContainer({ children, currentPath, onNavigate }) {
    const {
        sidebarOpen,
        sidebarCollapsed,
        sidebarWidth,
        isDesktop,
        searchOpen,
        handleSidebarResize,
        toggleSidebar,
        closeSidebar,
        toggleSidebarCollapse,
        openSearch,
        closeSearch,
    } = useLayout();

    const { formattedTime, status: timerStatus } = useStudyTimer();

    // 라우트 변경 시 모바일에서 사이드바 닫기
    useEffect(() => {
        if (sidebarOpen && window.innerWidth <= 768) {
            closeSidebar();
        }
    }, [currentPath, sidebarOpen, closeSidebar]);

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
            <DndProvider currentRoute={currentPath} onNavigate={handleNavigate}>
                <LayoutPresenter
                    sidebarOpen={sidebarOpen}
                    sidebarCollapsed={sidebarCollapsed}
                    sidebarWidth={sidebarWidth}
                    isDesktop={isDesktop}
                    currentPath={currentPath}
                    timerTime={formattedTime}
                    timerStatus={timerStatus}
                    onSidebarResize={handleSidebarResize}
                    onToggleSidebar={toggleSidebar}
                    onCloseSidebar={closeSidebar}
                    onToggleSidebarCollapse={toggleSidebarCollapse}
                    onNavigate={handleNavigate}
                    onOpenSearch={openSearch}
                >
                    {children}
                    <SearchContainer isOpen={searchOpen} onClose={closeSearch} onNavigate={handleNavigate} />
                </LayoutPresenter>
            </DndProvider>
        </SidebarContext.Provider>
    );
}
