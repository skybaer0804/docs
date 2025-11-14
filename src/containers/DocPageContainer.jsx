import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useMarkdownContent } from '../hooks/useMarkdownContent';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { navigationObserver } from '../observers/NavigationObserver';
import { DocPagePresenter } from '../pages/DocPage';

/**
 * DocPage Container 컴포넌트
 * 비즈니스 로직과 상태 관리를 담당
 * TDD 친화적: 로직을 분리하여 테스트 시 Mock으로 대체 가능
 */
export function DocPageContainer({ url }) {
    const [currentRoute, setCurrentRoute] = useState('');

    useEffect(() => {
        const routePath = url || '/';
        setCurrentRoute(routePath);
    }, [url]);

    const handleNavigate = (path) => {
        route(path);
        // Observer 패턴: 네비게이션 이벤트 알림
        navigationObserver.notify(path, { from: currentRoute });
    };

    // Custom Hooks를 통한 로직 분리
    const { content, loading, fileExt, currentFile } = useMarkdownContent(url);
    const { slideDirection, isSwiping, swipeOffset } = useSwipeNavigation(currentRoute, handleNavigate);

    return (
        <DocPagePresenter
            content={content}
            loading={loading}
            fileExt={fileExt}
            currentFile={currentFile}
            currentRoute={currentRoute}
            slideDirection={slideDirection}
            isSwiping={isSwiping}
            swipeOffset={swipeOffset}
            onNavigate={handleNavigate}
        />
    );
}
