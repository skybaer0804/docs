import { LayoutContainer } from '../containers/LayoutContainer';
import { DirectoryTree } from './DirectoryTree';
import { Breadcrumb } from './Breadcrumb';
import { Resizer } from './Resizer';
import { IconChevronsLeft, IconLogin, IconLogout, IconFilePlus, IconSun, IconMoon } from '@tabler/icons-preact';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { route } from 'preact-router';
import './Layout.scss';

/**
 * Layout Presenter 컴포넌트
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
  onOpenSearch,
}) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogin = () => {
    onNavigate('/login');
  };

  const handleNewDoc = () => {
    onNavigate('/write');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onNavigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div class="layout">
      <div class={`layout__overlay ${sidebarOpen ? 'layout__overlay--open' : ''}`} onClick={onCloseSidebar}></div>
      <div class="layout__container">
        <header class="header">
          <Breadcrumb currentRoute={currentPath} onNavigate={onNavigate} onOpenSearch={onOpenSearch} />
          <div class="header__actions">
            <button
              class="header__theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
            </button>
            {user && (
              <button class="header__auth-btn" onClick={handleNewDoc} title="새 문서 작성">
                <IconFilePlus size={20} />
              </button>
            )}
            {user ? (
              <button class="header__auth-btn" onClick={handleLogout} title="로그아웃">
                <IconLogout size={20} />
              </button>
            ) : (
              <button class="header__auth-btn" onClick={handleLogin} title="관리자 로그인">
                <IconLogin size={20} />
              </button>
            )}
          </div>
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
          {isDesktop && !sidebarCollapsed && (
            <Resizer onResize={onSidebarResize} minSidebarWidth={170} minContentWidth={300} />
          )}
          <main class="layout__main">{children}</main>
        </div>
      </div>
    </div>
  );
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
export const Layout = LayoutContainer;
