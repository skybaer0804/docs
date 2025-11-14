import { MarkdownViewerContainer } from '../containers/MarkdownViewerContainer';
import { TemplateViewer } from '../components/TemplateViewer';
import { DirectoryView } from '../components/DirectoryView';
import { LoadingSpinner } from '../components/LoadingSpinner';
import './DocPage.scss';

/**
 * DocPage Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
export function DocPagePresenter({ content, loading, fileExt, currentFile, currentRoute, slideDirection, isSwiping, swipeOffset, onNavigate }) {
    const pageClass = `page ${slideDirection !== 'none' ? `page--slide-${slideDirection}` : ''} ${isSwiping ? 'page--swiping' : ''}`;
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
            <MarkdownViewerContainer content={content} file={currentFile} />
        </div>
    );
}
