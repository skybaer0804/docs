import { IconDownload } from '@tabler/icons-preact';
import './MarkdownViewer.scss';

/**
 * MarkdownViewer Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
export function MarkdownViewerPresenter({ html, file, contentRef, onDownload }) {
    return (
        <div class="markdown-viewer">
            {file && (
                <button class="markdown-viewer__download-btn" onClick={onDownload} aria-label="파일 다운로드" title="파일 다운로드">
                    <IconDownload size={18} />
                </button>
            )}
            <div class="markdown-content" ref={contentRef} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
import { MarkdownViewerContainer } from '../containers/MarkdownViewerContainer';
export const MarkdownViewer = MarkdownViewerContainer;
