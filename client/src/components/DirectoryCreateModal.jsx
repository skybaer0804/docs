import { useState } from 'preact/hooks';
import { IconCheck } from '@tabler/icons-preact';
import { Button } from './Button';
import { Modal } from './Modal';
import { getParentPathFromCurrentPath } from '../utils/docManagement';
import { useToast } from '../contexts/ToastContext';
import { useCreateFolderMutation } from '../hooks/useDocMutations';
import { navigationObserver } from '../observers/NavigationObserver';
import './DirectoryCreateModal.scss';

/**
 * DirectoryCreateModal 컴포넌트
 * 폴더 생성 모달 (디렉토리 네임만 받기)
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 여부
 * @param {Function} props.onClose - 모달 닫기 핸들러
 * @param {Function} props.onSuccess - 생성 성공 핸들러 (생성된 폴더 정보 전달)
 * @param {string} props.currentPath - 현재 경로 (기본값: 현재 경로)
 */
export function DirectoryCreateModal({ isOpen, onClose, onSuccess, currentPath }) {
  const { showSuccess, showError } = useToast();
  const [folderName, setFolderName] = useState('');
  const createFolderMutation = useCreateFolderMutation();
  const loading = createFolderMutation.isPending;

  if (!isOpen) return null;

  // currentPath가 이미 /docs/로 시작하는 경로이면 그대로 사용, 아니면 변환
  let parentPath = '/docs';
  if (currentPath) {
    if (currentPath.startsWith('/docs')) {
      parentPath = currentPath; // 이미 /docs 경로면 그대로 사용
    } else if (currentPath.startsWith('/category/')) {
      parentPath = currentPath.replace('/category/', '/docs/');
    } else {
      parentPath = getParentPathFromCurrentPath(currentPath);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!folderName.trim()) {
      showError('폴더명을 입력해주세요.');
      return;
    }

    try {
      const name = folderName.trim();
      const result = await createFolderMutation.mutateAsync({
        name,
        parentPath,
        isPublic: true,
      });

      showSuccess('폴더가 생성되었습니다.');
      setFolderName('');

      const newPath = `${parentPath}/${name}`.replace('//', '/');
      navigationObserver.notify(newPath, { type: 'directory', action: 'create', folder: result });

      if (onSuccess) {
        onSuccess({ ...result, path: newPath });
      }

      onClose();
    } catch (error) {
      console.error('폴더 생성 실패:', error);
      showError(error.message || '폴더 생성에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setFolderName('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="폴더 생성"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>
            취소
          </Button>
          <Button type="submit" form="directory-create-form" variant="primary" loading={loading}>
            <IconCheck size={16} />
            생성
          </Button>
        </>
      }
    >
      <form id="directory-create-form" onSubmit={handleSubmit} className="directory-create-modal__form">
        <div className="directory-create-modal__form-group">
          <label htmlFor="folderName">폴더명</label>
          <input
            id="folderName"
            type="text"
            value={folderName}
            onInput={(e) => setFolderName(e.target.value)}
            placeholder="예: 새폴더"
            required
            autoFocus
            disabled={loading}
            className="directory-create-modal__input"
          />
          <span className="directory-create-modal__helper">현재 디렉토리: {parentPath}</span>
        </div>
      </form>
    </Modal>
  );
}
