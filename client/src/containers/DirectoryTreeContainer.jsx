import { useDirectoryTree } from '../hooks/useDirectoryTree';
import { DirectoryTreePresenter } from '../components/DirectoryTree';
import { useState } from 'preact/hooks';
import { DirectoryCreateModal } from '../components/DirectoryCreateModal';
import { route } from 'preact-router';

/**
 * DirectoryTree Container 컴포넌트
 * 비즈니스 로직과 상태 관리를 담당
 * TDD 친화적: 로직을 분리하여 테스트 시 Mock으로 대체 가능
 */
export function DirectoryTreeContainer({ currentPath, onNavigate }) {
  const {
    categorized,
    followingUsers,
    followingTrees,
    loadingTrees,
    expandedPaths,
    handleFolderClick,
    handleUserClick,
    handleClick,
    loading,
  } = useDirectoryTree(currentPath, onNavigate);
  const [directoryModalOpen, setDirectoryModalOpen] = useState(false);
  const [directoryModalParentId, setDirectoryModalParentId] = useState(null);

  const handleCreateDocument = async (parentId) => {
    const url = parentId ? `/write?parent_id=${parentId}` : '/write';
    if (onNavigate) {
      onNavigate(url);
    } else {
      route(url);
    }
  };

  const handleCreateFolder = (parentId) => {
    setDirectoryModalParentId(parentId);
    setDirectoryModalOpen(true);
  };

  const handleFolderCreated = (folder) => {
    // ...
  };

  return (
    <>
      <DirectoryTreePresenter
        categorized={categorized}
        followingUsers={followingUsers}
        followingTrees={followingTrees}
        loadingTrees={loadingTrees}
        currentPath={currentPath}
        expandedPaths={expandedPaths}
        onFolderClick={handleFolderClick}
        onUserClick={handleUserClick}
        onFileClick={handleClick}
        onNavigate={onNavigate}
        onCreateDocument={handleCreateDocument}
        onCreateFolder={handleCreateFolder}
        loading={loading}
      />
      <DirectoryCreateModal
        isOpen={directoryModalOpen}
        onClose={() => setDirectoryModalOpen(false)}
        onSuccess={handleFolderCreated}
        parentId={directoryModalParentId}
      />
    </>
  );
}
