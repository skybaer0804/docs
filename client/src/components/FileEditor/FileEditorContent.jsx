import { useState, useEffect } from 'preact/hooks';
import { IconTrash } from '@tabler/icons-preact';
import { Button } from '../Button';
import { useDocContentQuery } from '../../hooks/useDocContentQuery';

/**
 * FileEditorContent 컴포넌트
 * 선택된 파일의 내용을 편집하는 영역
 */
export function FileEditorContent({ file, onUpdate, onDelete, loading }) {
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const { data: doc, isLoading: contentLoading } = useDocContentQuery(file?.id || '', {
    enabled: !!file?.id,
  });

  // 파일 내용 로드
  useEffect(() => {
    if (file) {
      setName(file.name || file.title || '');
      setIsPublic(file.is_public || false);
    }
  }, [file]);

  useEffect(() => {
    if (!file) return;
    setContent(doc?.content || '');
  }, [file?.id, doc?.content]);

  const handleSave = async () => {
    if (!file.id) return;

    await onUpdate(file, { name, content, is_public: isPublic });
  };

  const handleDelete = () => {
    if (!file.id) return;
    onDelete(file);
  };

  if (contentLoading) {
    return (
      <div className="file-editor-content">
        <div className="file-editor-content__loading">파일 내용을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="file-editor-content">
      <div className="file-editor-content__header">
        <input
          type="text"
          value={name}
          onInput={(e) => setName(e.target.value)}
          className="file-editor-content__name-input"
          placeholder="파일명"
        />
        <div className="file-editor-content__actions">
          <label className="file-editor-content__checkbox">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span>공개</span>
          </label>
          <Button variant="primary" onClick={handleSave} loading={loading} size="small">
            저장
          </Button>
          <button
            className="file-editor-content__delete-btn"
            onClick={handleDelete}
            title="삭제"
            disabled={loading}
          >
            <IconTrash size={18} />
          </button>
        </div>
      </div>
      <div className="file-editor-content__body">
        <textarea
          value={content}
          onInput={(e) => setContent(e.target.value)}
          className="file-editor-content__textarea"
          placeholder="파일 내용을 입력하세요..."
        />
      </div>
    </div>
  );
}

