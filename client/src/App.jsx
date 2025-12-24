import { useState, useEffect } from 'preact/hooks';
import { ThemeProvider } from './contexts/ThemeContext';
import { LayoutContainer } from './containers/LayoutContainer';
import { DocPageContainer } from './containers/DocPageContainer';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EditorPage } from './pages/EditorPage';
import { ProfilePage } from './pages/ProfilePage';

/**
 * SPA 구조의 App 컴포넌트
 * 상태 기반 네비게이션으로 라우터 없이 동작
 */
export function App() {
  // 초기 경로는 URL에서 가져오거나 기본값 '/'
  const getInitialRoute = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return path === '/' ? '/' : path;
    }
    return '/';
  };

  const [currentRoute, setCurrentRoute] = useState(getInitialRoute());
  const [routeHistory, setRouteHistory] = useState([getInitialRoute()]);

  // 브라우저 히스토리와 동기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({ route: currentRoute }, '', currentRoute);
    }
  }, []);

  // 브라우저 뒤로가기/앞으로가기 지원
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (e) => {
      if (e.state && e.state.route) {
        setCurrentRoute(e.state.route);
      } else {
        const path = window.location.pathname;
        setCurrentRoute(path || '/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path, options = {}) => {
    // 같은 경로로 이동하는 경우 무시
    if (path === currentRoute && !options.force) {
      return;
    }

    // 슬라이드 애니메이션과 함께 네비게이션하는 경우
    if (options.animate && options.direction) {
      // 애니메이션 완료 후 콘텐츠가 이미 로드되어 있으므로
      // 약간의 지연 후 네비게이션하여 깜빡임 방지
      setTimeout(() => {
        setCurrentRoute(path);
        setRouteHistory((prev) => [...prev, path]);

        // 브라우저 히스토리 업데이트도 지연
        if (typeof window !== 'undefined') {
          window.history.pushState({ route: path }, '', path);
        }
      }, 50); // 애니메이션 완료 후 약간의 지연
    } else {
      // 즉시 네비게이션
      setCurrentRoute(path);
      setRouteHistory((prev) => [...prev, path]);

      // 브라우저 히스토리 업데이트
      if (typeof window !== 'undefined') {
        window.history.pushState({ route: path }, '', path);
      }
    }
  };

  // 경로에 따라 컴포넌트 렌더링
  const renderContent = () => {
    if (currentRoute === '/login') {
      return <LoginPage onNavigate={handleNavigate} />;
    }

    if (currentRoute === '/register') {
      return <RegisterPage onNavigate={handleNavigate} />;
    }

    if (currentRoute === '/profile') {
      return <ProfilePage onNavigate={handleNavigate} />;
    }

    // 문서 작성/수정 페이지
    if (currentRoute.startsWith('/write')) {
      return <EditorPage mode="create" onNavigate={handleNavigate} />;
    }

    if (currentRoute.startsWith('/edit')) {
      // /edit/docs/... 형식에서 실제 경로 추출
      const path = currentRoute.replace('/edit', '');
      return <EditorPage mode="edit" path={path} onNavigate={handleNavigate} />;
    }

    // 홈 페이지인 경우
    if (currentRoute === '/') {
      return <DocPageContainer currentRoute="/" onNavigate={handleNavigate} />;
    }

    // 모든 경로를 DocPageContainer로 처리
    return <DocPageContainer currentRoute={currentRoute} onNavigate={handleNavigate} />;
  };

  return (
    <ThemeProvider>
      <LayoutContainer currentPath={currentRoute} onNavigate={handleNavigate}>
        {renderContent()}
      </LayoutContainer>
    </ThemeProvider>
  );
}
