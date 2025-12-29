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
  const [visibilityType, setVisibilityType] = useState('public');
  const createFolderMutation = useCreateFolderMutation();
  const loading = createFolderMutation.isPending;

  if (!isOpen) return null;

  // currentPath를 기반으로 부모 경로 계산 (이미 /docs 경로 변환 및 파일명 제거 처리됨)
  const parentPath = getParentPathFromCurrentPath(currentPath);

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
        visibility_type: visibilityType,
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
        </div>
        <div className="directory-create-modal__form-group">
          <label htmlFor="visibilityType">공개 범위</label>
          <select
            id="visibilityType"
            value={visibilityType}
            onChange={(e) => setVisibilityType(e.target.value)}
            className="directory-create-modal__input"
          >
            <option value="public">🌐 전체 공개</option>
            <option value="subscriber_only">👥 구독자 공개</option>
            <option value="private">🔒 나만 보기</option>
          </select>
          <span className="directory-create-modal__helper">현재 디렉토리: {parentPath}</span>
        </div>
      </form>
    </Modal>
  );
}
