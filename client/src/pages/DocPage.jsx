import { useState, useEffect } from 'preact/hooks';
import { MarkdownViewerContainer } from '../containers/MarkdownViewerContainer';
import { TemplateViewer } from '../components/TemplateViewer';
import { DirectoryView } from '../components/DirectoryView';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { NotificationPermissionBanner } from '../components/NotificationPermissionBanner';
import './DocPage.scss';

/**
 * DocPage Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
export function DocPagePresenter({
    content,
    loading,
    fileExt,
    currentFile,
    currentRoute,
    parentRoute,
    parentContent,
    parentLoading,
    parentFileExt,
    parentFile,
    slideDirection,
    isSwiping,
    swipeOffset,
    onNavigate,
    onContentRef,
    notificationPermission,
    onRequestNotificationPermission,
}) {
    const [bannerDismissed, setBannerDismissed] = useState(false);
    
    // localStorage에서 배너 닫기 상태 확인
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const dismissed = localStorage.getItem('notificationBannerDismissed');
            setBannerDismissed(dismissed === 'true');
        }
    }, []);
    
    const handleDismissBanner = () => {
        setBannerDismissed(true);
        if (typeof window !== 'undefined') {
            localStorage.setItem('notificationBannerDismissed', 'true');
        }
    };
    
    const handleRequestPermission = async () => {
        await onRequestNotificationPermission();
        // 권한 요청 후 배너 닫기
        handleDismissBanner();
    };
    
    const isSlidingRight = slideDirection === 'right';
    const showParentPage = (isSlidingRight || (isSwiping && swipeOffset > 0)) && parentRoute && window.innerWidth <= 768;
    // 슬라이드 애니메이션 중이거나 스와이프 중일 때만 애니메이션 적용
    const shouldAnimateCurrent = slideDirection !== 'none' && (isSwiping || isSlidingRight);

    // 현재 페이지 렌더링
    const renderCurrentPage = () => {
        const pageClass = `page page--current ${shouldAnimateCurrent ? `page--slide-${slideDirection}` : ''} ${isSwiping ? 'page--swiping' : ''}`;
        const pageStyle = isSwiping && swipeOffset > 0 ? { transform: `translateX(${swipeOffset}px)` } : {};

        if (loading) {
            return (
                <div class={pageClass} style={pageStyle}>
                    <LoadingSpinner />
                </div>
            );
        }

        if (!content) {
            return (
                <div class={pageClass} style={pageStyle}>
                    <DirectoryView currentRoute={currentRoute} onNavigate={onNavigate} />
                </div>
            );
        }

        // .template 파일인 경우 TemplateViewer 사용
        if (fileExt === '.template') {
            return (
                <div class={pageClass} style={pageStyle}>
                    <TemplateViewer content={content} file={currentFile} />
                </div>
            );
        }

        return (
            <div class={pageClass} style={pageStyle}>
                <MarkdownViewerContainer 
                    content={content} 
                    file={currentFile} 
                    onNavigate={onNavigate}
                    onContentRef={onContentRef}
                />
            </div>
        );
    };

    // 상위 페이지 렌더링 (좌에서 우로 스와이프 시)
    const renderParentPage = () => {
        if (!showParentPage) return null;

        // 스와이프 중일 때는 현재 위치에서 보이도록, 애니메이션 중일 때는 왼쪽에서 들어오도록
        const parentPageStyle = isSwiping && swipeOffset > 0 ? { transform: `translateX(${-window.innerWidth + swipeOffset}px)` } : {};
        // 슬라이드 애니메이션이 진행 중일 때만 애니메이션 클래스 적용
        const pageClass = `page page--parent ${shouldAnimateCurrent && !isSwiping ? 'page--slide-from-left' : ''}`;

        if (parentLoading) {
            return (
                <div class={pageClass} style={parentPageStyle}>
                    <LoadingSpinner />
                </div>
            );
        }

        if (!parentContent) {
            return (
                <div class={pageClass} style={parentPageStyle}>
                    <DirectoryView currentRoute={parentRoute} onNavigate={onNavigate} />
                </div>
            );
        }

        // .template 파일인 경우 TemplateViewer 사용
        if (parentFileExt === '.template') {
            return (
                <div class={pageClass} style={parentPageStyle}>
                    <TemplateViewer content={parentContent} file={parentFile} />
                </div>
            );
        }

        return (
            <div class={pageClass} style={parentPageStyle}>
                <MarkdownViewerContainer 
                    content={parentContent} 
                    file={parentFile} 
                    onNavigate={onNavigate}
                    onContentRef={null}
                />
            </div>
        );
    };

    return (
        <>
            <div class="slide-container">
                {renderParentPage()}
                {renderCurrentPage()}
            </div>
            {!bannerDismissed && notificationPermission === 'default' && (
                <NotificationPermissionBanner
                    permission={notificationPermission}
                    onRequestPermission={handleRequestPermission}
                    onDismiss={handleDismissBanner}
                />
            )}
        </>
    );
}
