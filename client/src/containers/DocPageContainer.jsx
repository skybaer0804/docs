import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { useMarkdownContent } from '../hooks/useMarkdownContent';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { useNotification } from '../hooks/useNotification';
import { useReadingTracker } from '../hooks/useReadingTracker';
import { useTimerNotification } from '../hooks/useTimerNotification';
import { navigationObserver } from '../observers/NavigationObserver';
import { DocPagePresenter } from '../pages/DocPage';
import { DirectoryCreateModal } from '../components/DirectoryCreateModal';

/**
 * DocPage Container 컴포넌트
 */
export function DocPageContainer({ currentRoute, id, onNavigate }) {
    const previousRouteRef = useRef(currentRoute);
    const [isNavigating, setIsNavigating] = useState(false);
    const [pendingRoute, setPendingRoute] = useState(null);
    const navigatingParentRouteRef = useRef(null);
    const [directoryModalOpen, setDirectoryModalOpen] = useState(false);
    const [directoryModalParentId, setDirectoryModalParentId] = useState(null);

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

    // Custom Hooks를 통한 로직 분리
    const { content, loading, fileExt, currentFile } = useMarkdownContent(currentRoute);

    // 상위 디렉토리 경로 계산 (ID 기반)
    const parentRoute = useMemo(() => {
        if (!currentRoute || currentRoute === '/') return null;

        if (currentFile && currentFile.parent_id) {
            return `/folder/${currentFile.parent_id}`;
        }
        
        // currentFile이 아직 로드되지 않았거나 루트인 경우
        if (currentRoute !== '/') return '/';

        return null;
    }, [currentRoute, currentFile]);

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

    const parentContent = useMarkdownContent(parentRoute || '');
    const { slideDirection, isSwiping, swipeOffset } = useSwipeNavigation(currentRoute, handleNavigate);

    // 네비게이션 중이고 상위 페이지로 이동하는 경우, 상위 페이지 콘텐츠 사용
    const isNavigatingToParent = isNavigating && pendingRoute && navigatingParentRouteRef.current === parentRoute;
    const displayContent = isNavigatingToParent && parentContent.content !== undefined ? parentContent.content : content;
    const displayLoading = isNavigatingToParent && parentContent.content !== undefined ? false : loading;
    const displayFileExt = isNavigatingToParent && parentContent.fileExt ? parentContent.fileExt : fileExt;
    const displayFile = isNavigatingToParent && parentContent.currentFile ? parentContent.currentFile : currentFile;

    // 알림 기능 관련 Hooks
    const contentRef = useRef(null);
    const { permission: notificationPermission, requestPermission, isGranted } = useNotification(false);

    // 타이머 알림
    const { resetTimer } = useTimerNotification({
        enabled: isGranted && !displayLoading && !!displayContent && !!displayFile,
    });

    // 회독 추적
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
    }, [displayFile?.id, displayLoading, displayContent, resetTimer]);

    // contentRef 콜백 함수
    const handleContentRef = (ref) => {
        contentRef.current = ref?.current || ref;
    };

    const handleCreateDocument = (parentId) => {
        const url = parentId ? `/write?parent_id=${parentId}` : '/write';
        onNavigate(url);
    };

    const handleCreateFolder = (parentId) => {
        setDirectoryModalParentId(parentId);
        setDirectoryModalOpen(true);
    };

    return (
        <>
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
                onCreateDocument={handleCreateDocument}
                onCreateFolder={handleCreateFolder}
            />
            <DirectoryCreateModal
                isOpen={directoryModalOpen}
                onClose={() => setDirectoryModalOpen(false)}
                parentId={directoryModalParentId}
            />
        </>
    );
}
