import { useState, useEffect, useRef } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { route } from 'preact-router';
import { Button } from '../components/Button';
import { FileLocationModal } from '../components/FileEditor/FileLocationModal';
import { IconFolder, IconEye, IconEyeOff, IconTrash, IconFileUpload, IconX, IconCheck } from '@tabler/icons-preact';
import { navigationObserver } from '../observers/NavigationObserver';
import { useDocContentQuery } from '../hooks/useDocContentQuery';
import { useCreateDocMutation, useUpdateDocMutation, useDeleteDocMutation } from '../hooks/useDocMutations';
import './EditorPage.scss';

/**
 * 문서 작성/수정 페이지
 * props:
 *  - mode: 'create' | 'edit'
 *  - id: 수정 시 문서 ID (UUID)
 *  - parentId: 생성 시 부모 폴더 ID
 */
export function EditorPage({ mode = 'create', id, parentId: propParentId, onNavigate }) {
  const { user, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef(null);

  // URL 쿼리 파라미터에서 parent_id 가져오기
  const getParentIdFromQuery = () => {
    if (typeof window === 'undefined') return propParentId || null;
    const params = new URLSearchParams(window.location.search);
    return params.get('parent_id') || propParentId || null;
  };

  // 폼 상태
  const [title, setTitle] = useState('');
  const [parentId, setParentId] = useState(getParentIdFromQuery());
  const [content, setContent] = useState('# 제목\n\n내용을 입력하세요.');
  const [visibilityType, setVisibilityType] = useState('public');
  const [docId, setDocId] = useState(id || null);

  const [error, setError] = useState('');
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // 파일 첨부 핸들러
  const handleFileAttach = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      showError('.md 확장자 파일만 첨부 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setContent(text);
        const fileName = file.name.replace(/\.md$/i, '');
        if (!title) setTitle(fileName);
        showSuccess('파일 내용을 불러왔습니다.');
      }
    };
    reader.onerror = () => showError('파일을 읽는 중 오류가 발생했습니다.');
    reader.readAsText(file);
    e.target.value = '';
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // 생성 모드일 때 초기화
  useEffect(() => {
    if (mode === 'create') {
      setParentId(getParentIdFromQuery());
      setTitle('');
      setContent('# 제목\n\n내용을 입력하세요.');
      setVisibilityType('public');
      setDocId(null);
      setError('');
    }
  }, [mode, propParentId]);

  const isEditMode = mode === 'edit' && !!id;
  const { data: doc, isLoading: docLoading, error: docError } = useDocContentQuery(id || '', { enabled: isEditMode });

  // 수정 모드일 때 데이터 로드
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
      setTitle((doc.name || '').replace(/\.md$/, ''));
      setContent(doc.content || '');
      setVisibilityType(doc.visibility_type || 'public');
      setParentId(doc.parent_id);
    }
  }, [isEditMode, doc, docError]);

  const createDocMutation = useCreateDocMutation();
  const updateDocMutation = useUpdateDocMutation();
  const deleteDocMutation = useDeleteDocMutation();

  const loading = docLoading || createDocMutation.isPending || updateDocMutation.isPending || deleteDocMutation.isPending;

  if (authLoading) return <div>Loading auth...</div>;
  if (!user) {
    return <div className="editor-error">권한이 없습니다. 로그인 후 이용해주세요.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'create') {
        const name = `${title}.md`;
        const result = await createDocMutation.mutateAsync({
          type: 'FILE',
          parent_id: parentId,
          name,
          content,
          visibility_type: visibilityType,
        });

        showSuccess('문서가 생성되었습니다.');
        const newRoute = `/doc/${result.id}`;

        navigationObserver.notify(newRoute, { type: 'file', action: 'create', file: result });

        if (onNavigate) {
          onNavigate(newRoute);
        } else {
          route(newRoute);
        }
      } else {
        const result = await updateDocMutation.mutateAsync({
          id: docId,
          data: {
            content,
            visibility_type: visibilityType,
            name: `${title}.md`,
          },
        });

        showSuccess('문서가 수정되었습니다.');
        const currentRoute = `/doc/${docId}`;

        navigationObserver.notify(currentRoute, { type: 'file', action: 'update', file: result });

        if (onNavigate) {
          onNavigate(currentRoute);
        } else {
          route(currentRoute);
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
      if (mode === 'edit' && docId) {
        onNavigate(`/doc/${docId}`);
      } else {
        onNavigate('/');
      }
    } else {
      window.history.back();
    }
  };

  const handleDelete = async () => {
    if (!docId) return;
    if (!confirm('정말 이 문서를 삭제하시겠습니까?')) return;

    setError('');
    try {
      await deleteDocMutation.mutateAsync({ id: docId });
      showSuccess('문서가 삭제되었습니다.');
      navigationObserver.notify('/', { type: 'file', action: 'delete' });

      if (onNavigate) onNavigate('/');
      else route('/');
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
        <div className="form-row">
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="title">제목</label>
              <select
                className="editor-page__visibility-select"
                value={visibilityType}
                onChange={(e) => setVisibilityType(e.target.value)}
                title="공개 범위 설정"
              >
                <option value="public">🌐 전체 공개</option>
                <option value="subscriber_only">👥 구독자 공개</option>
                <option value="private">🔒 나만 보기</option>
              </select>
            </div>
            <input
              id="title"
              type="text"
              value={title}
              onInput={(e) => setTitle(e.target.value)}
              required
              placeholder="제목을 입력하세요"
            />
          </div>
        </div>

        <div className="form-group editor-area">
          <div className="form-label-row">
            <label htmlFor="content">내용</label>
            <button
              type="button"
              className="editor-page__toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                triggerFileUpload();
              }}
              title="마크다운 파일 첨부 (.md)"
            >
              <IconFileUpload size={18} />
            </button>
          </div>
          <textarea id="content" value={content} onInput={(e) => setContent(e.target.value)} required></textarea>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".md" onInput={handleFileAttach} />
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
                <span className="btn-text">삭제</span>
              </Button>
            )}
          </div>
          <div className="button-group">
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>
              <IconX size={18} />
              <span className="btn-text">취소</span>
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              <IconCheck size={18} />
              <span className="btn-text">저장</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
