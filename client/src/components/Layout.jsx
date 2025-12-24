import { LayoutContainer } from '../containers/LayoutContainer';
import { DirectoryTree } from './DirectoryTree';
import { Breadcrumb } from './Breadcrumb';
import { Resizer } from './Resizer';
import { useState, useRef } from 'preact/hooks';
import {
  IconChevronsLeft,
  IconLogin,
  IconLogout,
  IconFilePlus,
  IconFile,
  IconSun,
  IconMoon,
  IconSearch,
  IconSettings,
  IconUser,
  IconUserCircle,
} from '@tabler/icons-preact';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Popover } from './Popover';
import { List } from './List';
import { ListItem } from './ListItem';
import { DirectoryCreateModal } from './DirectoryCreateModal';
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsButtonRef = useRef(null);

  const handleLogout = async () => {
    try {
      await signOut();
      setSettingsOpen(false);
      onNavigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleCreateDocument = () => {
    setSettingsOpen(false);
    // 현재 경로를 기반으로 문서 생성 페이지로 이동
    const currentDir = currentPath.startsWith('/category/')
      ? currentPath.replace('/category/', '/docs/')
      : currentPath === '/'
      ? '/docs'
      : currentPath;
    onNavigate(`/write?parent=${encodeURIComponent(currentDir)}`);
  };

  const [directoryModalOpen, setDirectoryModalOpen] = useState(false);

  const handleCreateFolder = () => {
    setSettingsOpen(false);
    setDirectoryModalOpen(true);
  };

  const handleLogin = () => {
    setSettingsOpen(false);
    onNavigate('/login');
  };

  const handleProfile = () => {
    setSettingsOpen(false);
    onNavigate('/profile');
  };

  return (
    <div class="layout">
      <div class={`layout__overlay ${sidebarOpen ? 'layout__overlay--open' : ''}`} onClick={onCloseSidebar}></div>
      <div class="layout__container">
        <header class="header">
          <Breadcrumb currentRoute={currentPath} onNavigate={onNavigate} />
          <div class="header__actions">
            {user && (
              <button class="header__profile" onClick={handleProfile} title={user.username || user.email}>
                <IconUser size={20} />
              </button>
            )}
            <button class="header__search-btn" onClick={onOpenSearch} aria-label="검색 (Ctrl+K)" title="검색 (Ctrl+K)">
              <IconSearch size={20} />
            </button>
            <button
              class="header__theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
            </button>
            <button
              ref={settingsButtonRef}
              class="header__settings-btn"
              onClick={handleSettingsToggle}
              aria-label="설정"
              title="설정"
            >
              <IconSettings size={20} />
            </button>
            <Popover isOpen={settingsOpen} onClose={handleSettingsClose} anchorRef={settingsButtonRef}>
              <List>
                {user && (
                  <>
                    <ListItem icon={<IconFilePlus size={18} />} onClick={handleCreateDocument}>
                      문서생성
                    </ListItem>
                    <ListItem icon={<IconFile size={18} />} onClick={handleCreateFolder}>
                      폴더생성
                    </ListItem>
                    <ListItem icon={<IconUserCircle size={18} />} onClick={handleProfile}>
                      프로필
                    </ListItem>
                  </>
                )}
                {user ? (
                  <ListItem icon={<IconLogout size={18} />} onClick={handleLogout}>
                    로그아웃
                  </ListItem>
                ) : (
                  <ListItem icon={<IconLogin size={18} />} onClick={handleLogin}>
                    로그인
                  </ListItem>
                )}
              </List>
            </Popover>
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
      <DirectoryCreateModal
        isOpen={directoryModalOpen}
        onClose={() => setDirectoryModalOpen(false)}
        currentPath={currentPath}
      />
    </div>
  );
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
export const Layout = LayoutContainer;
