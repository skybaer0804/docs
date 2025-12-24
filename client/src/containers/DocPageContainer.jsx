import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { useMarkdownContent } from '../hooks/useMarkdownContent';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { useNotification } from '../hooks/useNotification';
import { useReadingTracker } from '../hooks/useReadingTracker';
import { useTimerNotification } from '../hooks/useTimerNotification';
import { navigationObserver } from '../observers/NavigationObserver';
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

        if (currentRoute === '/') return null;

        if (currentRoute.startsWith('/category/')) {
            const parts = currentRoute
                .replace('/category/', '')
                .split('/')
                .filter((p) => p);
            if (parts.length > 1) {
                return `/category/${parts.slice(0, -1).join('/')}`;
            } else if (parts.length === 1) {
                return '/';
            }
        } else {
            // 파일 경로인 경우 (예: /docs/Platform/Web/guide)
            const parts = currentRoute.split('/').filter(Boolean);
            if (parts.length > 1) {
                // parts[0] === 'docs' 가정
                let categoryPath = '';
                if (parts[0] === 'docs') {
                    categoryPath = parts.slice(1, -1).join('/');
                } else {
                    categoryPath = parts.slice(0, -1).join('/');
                }
                
                if (categoryPath) {
                    return `/category/${categoryPath}`;
                } else {
                    return '/';
                }
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

    // 알림 기능 관련 Hooks
    const contentRef = useRef(null);
    const { permission: notificationPermission, requestPermission, isGranted } = useNotification(false);

    // 타이머 알림 (문서가 보이고 로딩이 완료되었을 때만 활성화)
    const { resetTimer } = useTimerNotification({
        enabled: isGranted && !displayLoading && !!displayContent && !!displayFile,
    });

    // 회독 추적 (마크다운 파일일 때만 활성화)
    useReadingTracker({
        contentRef: contentRef,
        file: displayFile,
        enabled: isGranted && !displayLoading && !!displayContent && !!displayFile && displayFileExt !== '.template',
    });

    // 문서 변경 시 타이머 리셋
    useEffect(() => {
        if (displayFile && !displayLoading && displayContent) {
            resetTimer();
        }
    }, [displayFile?.path, displayLoading, displayContent, resetTimer]);

    // 페이지 가시성 변경 감지 (탭 전환 시 타이머 일시정지/재개)
    useEffect(() => {
        if (typeof document === 'undefined') return;

        const handleVisibilityChange = () => {
            // 탭이 다시 보이면 타이머 리셋하지 않고 계속 진행
            // (useTimerNotification에서 isDocumentVisible로 처리)
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // contentRef 콜백 함수
    const handleContentRef = (ref) => {
        contentRef.current = ref?.current || ref;
    };

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
            onContentRef={handleContentRef}
            notificationPermission={notificationPermission}
            onRequestNotificationPermission={requestPermission}
        />
    );
}
