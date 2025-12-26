import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { route } from 'preact-router';
import { Button } from '../components/Button';
import { FileLocationModal } from '../components/FileEditor/FileLocationModal';
import { IconFolder, IconEye, IconEyeOff, IconTrash } from '@tabler/icons-preact';
import { navigationObserver } from '../observers/NavigationObserver';
import { useDocContentQuery } from '../hooks/useDocContentQuery';
import { useCreateDocMutation, useUpdateDocMutation, useDeleteDocMutation } from '../hooks/useDocMutations';
import './EditorPage.scss';

/**
 * 문서 작성/수정 페이지
 * props:
 *  - mode: 'create' | 'edit'
 *  - path: 수정 시 문서 경로 (URL)
 */
export function EditorPage({ mode = 'create', path, onNavigate }) {
  const { user, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useToast();

  // URL 쿼리 파라미터에서 parent 경로 가져오기
  const getParentPathFromQuery = () => {
    if (typeof window === 'undefined') return '/docs';
    const params = new URLSearchParams(window.location.search);
    const parent = params.get('parent');
    if (parent) {
      return decodeURIComponent(parent);
    }
    // 기본값: 항상 /docs (현재 문서 경로가 적용되지 않도록)
    return '/docs';
  };

  // 폼 상태
  const [title, setTitle] = useState('');
  const [parentPath, setParentPath] = useState(getParentPathFromQuery());
  const [content, setContent] = useState('# 제목\n\n내용을 입력하세요.');
  const [isPublic, setIsPublic] = useState(true);
  const [docId, setDocId] = useState(null);

  const [error, setError] = useState('');
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // 파일 타입 확인 (쿼리 파라미터)
  const isFileType = () => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('type') === 'file';
  };

  // 생성 모드일 때 URL 쿼리 파라미터에서 parent 경로 읽기 및 초기화
  useEffect(() => {
    if (mode === 'create') {
      const newParentPath = getParentPathFromQuery();
      setParentPath(newParentPath);
      // 생성 모드일 때 폼 초기화
      setTitle('');
      setContent('# 제목\n\n내용을 입력하세요.');
      setIsPublic(true);
      setDocId(null);
      setError('');
    }
  }, [mode]);

  const isEditMode = mode === 'edit' && !!path;
  const { data: doc, isLoading: docLoading, error: docError } = useDocContentQuery(path || '', { enabled: isEditMode });

  // 수정 모드일 때 데이터 로드 (Query 결과를 폼 상태로 반영)
  useEffect(() => {
    if (!isEditMode) return;

    if (docError) {
      setError(docError.message);
      return;
    }

    if (doc === null) {
      setError('문서를 찾을 수 없습니다.');
      return;
    }

    if (doc) {
      setDocId(doc.id);
      setTitle((doc.name || '').replace('.md', ''));
      setContent(doc.content || '');
      setIsPublic(!!doc.is_public);
      // 부모 경로는 path에서 추출
      const parts = (doc.path || '').split('/');
      parts.pop(); // 파일명 제거
      setParentPath(parts.join('/'));
    }
  }, [isEditMode, doc, docError]);

  const createDocMutation = useCreateDocMutation();
  const updateDocMutation = useUpdateDocMutation();
  const deleteDocMutation = useDeleteDocMutation();

  const loading =
    docLoading || createDocMutation.isPending || updateDocMutation.isPending || deleteDocMutation.isPending;

  // 인증 체크
  if (authLoading) return <div>Loading auth...</div>;
  if (!user) {
    return <div className="editor-error">권한이 없습니다. 관리자만 접근 가능합니다.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'create') {
        const name = `${title}.md`;
        const result = await createDocMutation.mutateAsync({
          type: 'FILE',
          parent_path: parentPath,
          name,
          content,
          is_public: isPublic,
        });

        showSuccess('문서가 생성되었습니다.');
        const newPath = `${parentPath}/${name}`.replace('//', '/');

        // 트리 업데이트를 위한 이벤트 발생
        navigationObserver.notify(newPath, { type: 'file', action: 'create', file: result });

        if (onNavigate) {
          onNavigate(newPath);
        } else {
          route(newPath);
        }
      } else {
        const result = await updateDocMutation.mutateAsync({
          id: docId,
          path,
          data: {
            content,
            is_public: isPublic,
            name: `${title}.md`, // 제목 수정 시 이름도 변경
          },
        });

        showSuccess('문서가 수정되었습니다.');

        // 트리 업데이트를 위한 이벤트 발생
        navigationObserver.notify(path, { type: 'file', action: 'update', file: result });

        if (onNavigate) {
          onNavigate(path);
        } else {
          route(path);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      showError(err.message || '작업에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      if (mode === 'edit' && path) {
        onNavigate(path);
      } else {
        onNavigate('/');
      }
    } else {
      window.history.back();
    }
  };

  const handleLocationSelect = (selectedPath) => {
    setParentPath(selectedPath);
  };

  const handleDelete = async () => {
    if (!docId) return;

    if (!confirm('정말 이 문서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setError('');

    try {
      await deleteDocMutation.mutateAsync({ id: docId, path });
      showSuccess('문서가 삭제되었습니다.');

      // 트리 업데이트를 위한 이벤트 발생
      navigationObserver.notify(path, { type: 'file', action: 'delete' });

      if (onNavigate) {
        onNavigate('/');
      } else {
        route('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      showError(err.message || '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="editor-page">
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="editor-form">
        {/* 전체 공개 토글 - 우상단 */}
        <div className="editor-page__public-toggle">
          <button
            type="button"
            className={`editor-page__toggle-btn ${isPublic ? 'editor-page__toggle-btn--active' : ''}`}
            onClick={() => setIsPublic(!isPublic)}
            aria-label={isPublic ? '전체 공개' : '비공개'}
            title={isPublic ? '전체 공개 (로그인 없이 열람 가능)' : '비공개 (로그인 필요)'}
          >
            {isPublic ? <IconEye size={20} /> : <IconEyeOff size={20} />}
          </button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              value={title}
              onInput={(e) => setTitle(e.target.value)}
              required
              placeholder="예: guide"
            />
            <span className="helper">문서를 직접 작성 추가하면 .md 파일로 저장됩니다.</span>
          </div>

          {mode === 'create' && (
            <div className="form-group">
              <label>상위 폴더 경로</label>
              <div className="form-group__path-input-wrapper">
                <input
                  type="text"
                  value={parentPath}
                  onInput={(e) => setParentPath(e.target.value)}
                  required
                  placeholder="예: /docs/api"
                  className="form-group__path-input"
                />
                <button
                  type="button"
                  className="form-group__path-button"
                  onClick={() => setLocationModalOpen(true)}
                  title="파일 위치 선택"
                >
                  <IconFolder size={18} />
                </button>
              </div>
              <span className="helper">현재 디렉토리: {parentPath}</span>
            </div>
          )}
        </div>

        <div className="form-group editor-area">
          <label>내용</label>
          <textarea value={content} onInput={(e) => setContent(e.target.value)} required></textarea>
        </div>

        <div className="editor-footer">
          <div className="editor-footer__left">
            {mode === 'edit' && docId && (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={loading}
                className="editor-footer__delete-btn"
              >
                <IconTrash size={18} />
                삭제
              </Button>
            )}
          </div>
          <div className="button-group">
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>
              취소
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              저장하기
            </Button>
          </div>
        </div>
      </form>

      {/* 파일 위치 선택 모달 */}
      {mode === 'create' && (
        <FileLocationModal
          isOpen={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          onSelect={handleLocationSelect}
          currentPath={parentPath}
        />
      )}
    </div>
  );
}
