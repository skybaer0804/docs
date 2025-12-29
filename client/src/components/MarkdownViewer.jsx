import { IconDownload, IconEdit } from '@tabler/icons-preact';
import { useAuth } from '../contexts/AuthContext';
import './MarkdownViewer.scss';

/**
 * MarkdownViewer Presenter 컴포넌트
 */
export function MarkdownViewerPresenter({ html, file, contentRef, onDownload, onEdit }) {
  const { user } = useAuth();

  return (
    <div class="markdown-viewer">
      <div class="markdown-viewer__actions">
        {user && file && user.id === file.author_id && (
          <button
            class="markdown-viewer__action-btn"
            onClick={() => onEdit && onEdit(file.path)}
            aria-label="문서 수정"
            title="문서 수정"
          >
            <IconEdit size={18} />
          </button>
        )}
        {file && (
          <button
            class="markdown-viewer__action-btn"
            onClick={onDownload}
            aria-label="파일 다운로드"
            title="파일 다운로드"
          >
            <IconDownload size={18} />
          </button>
        )}
      </div>
      <div class="markdown-content" ref={contentRef} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
import { MarkdownViewerContainer } from '../containers/MarkdownViewerContainer';
export const MarkdownViewer = MarkdownViewerContainer;
