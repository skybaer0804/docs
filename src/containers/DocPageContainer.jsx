import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { useMarkdownContent } from '../hooks/useMarkdownContent';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { navigationObserver } from '../observers/NavigationObserver';
import { getMarkdownFiles } from '../utils/markdownLoader';
import { DocPagePresenter } from '../pages/DocPage';

/**
 * DocPage Container 컴포넌트
 * 비즈니스 로직과 상태 관리를 담당
 * SPA 구조: 상태 기반 네비게이션으로 라우터 없이 동작
 * TDD 친화적: 로직을 분리하여 테스트 시 Mock으로 대체 가능
 */
export function DocPageContainer({ currentRoute, onNavigate }) {
    const previousRouteRef = useRef(currentRoute);
    const [isNavigating, setIsNavigating] = useState(false);
    const [pendingRoute, setPendingRoute] = useState(null);
    const navigatingParentRouteRef = useRef(null);

    useEffect(() => {
        if (currentRoute !== previousRouteRef.current) {
            previousRouteRef.current = currentRoute;
            // 네비게이션 완료 후 pendingRoute 리셋
            if (pendingRoute === currentRoute) {
                setPendingRoute(null);
                setIsNavigating(false);
                navigatingParentRouteRef.current = null;
            }
        }
    }, [currentRoute, pendingRoute]);

    // 상위 디렉토리 경로 계산
    const parentRoute = useMemo(() => {
        if (!currentRoute) return null;

        const { files } = getMarkdownFiles();
        const file = files.find((f) => f.route === currentRoute);

        if (file) {
            // 현재 파일의 상위 디렉토리 경로 계산
            if (file.directoryPath && file.directoryPath.length > 0) {
                const parentPath = file.directoryPath.slice(0, -1);
                if (parentPath.length > 0) {
                    return `/category/${parentPath.join('/')}`;
                } else {
                    return `/category/${file.category}`;
                }
            } else if (file.category) {
                return `/category/${file.category}`;
            }
        } else if (currentRoute.startsWith('/category/')) {
            // 카테고리 경로인 경우 상위로 이동
            const parts = currentRoute
                .replace('/category/', '')
                .split('/')
                .filter((p) => p);
            if (parts.length > 1) {
                return `/category/${parts[0]}`;
            } else if (parts.length === 1) {
                return '/';
            }
        }

        return null;
    }, [currentRoute]);

    const handleNavigate = (path, options = {}) => {
        // 슬라이드 애니메이션과 함께 네비게이션하는 경우
        if (options.animate && options.direction === 'right') {
            // 상위 페이지로 이동하는 경우, 현재 parentRoute를 저장
            setIsNavigating(true);
            setPendingRoute(path);
            navigatingParentRouteRef.current = parentRoute;
        }

        if (onNavigate) {
            onNavigate(path, options);
        }
        // Observer 패턴: 네비게이션 이벤트 알림
        navigationObserver.notify(path, { from: currentRoute, ...options });
    };

    // Custom Hooks를 통한 로직 분리
    const { content, loading, fileExt, currentFile } = useMarkdownContent(currentRoute);
    const parentContent = useMarkdownContent(parentRoute || '');
    const { slideDirection, isSwiping, swipeOffset } = useSwipeNavigation(currentRoute, handleNavigate);

    // 네비게이션 중이고 상위 페이지로 이동하는 경우, 상위 페이지 콘텐츠 사용
    // pendingRoute가 parentRoute와 일치하면 상위 페이지로 이동 중
    const isNavigatingToParent = isNavigating && pendingRoute && navigatingParentRouteRef.current === parentRoute;
    const displayContent = isNavigatingToParent && parentContent.content !== undefined ? parentContent.content : content;
    const displayLoading = isNavigatingToParent && parentContent.content !== undefined ? false : loading;
    const displayFileExt = isNavigatingToParent && parentContent.fileExt ? parentContent.fileExt : fileExt;
    const displayFile = isNavigatingToParent && parentContent.currentFile ? parentContent.currentFile : currentFile;

    return (
        <DocPagePresenter
            content={displayContent}
            loading={displayLoading}
            fileExt={displayFileExt}
            currentFile={displayFile}
            currentRoute={currentRoute}
            parentRoute={parentRoute}
            parentContent={parentContent.content}
            parentLoading={parentContent.loading}
            parentFileExt={parentContent.fileExt}
            parentFile={parentContent.currentFile}
            slideDirection={slideDirection}
            isSwiping={isSwiping}
            swipeOffset={swipeOffset}
            onNavigate={handleNavigate}
        />
    );
}
