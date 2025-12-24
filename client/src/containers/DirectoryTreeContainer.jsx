import { useDirectoryTree } from '../hooks/useDirectoryTree';
import { DirectoryTreePresenter } from '../components/DirectoryTree';

/**
 * DirectoryTree Container 컴포넌트
 * 비즈니스 로직과 상태 관리를 담당
 * TDD 친화적: 로직을 분리하여 테스트 시 Mock으로 대체 가능
 */
export function DirectoryTreeContainer({ currentPath, onNavigate }) {
    const { categorized, expandedPaths, handleFolderClick, handleClick, loading } = useDirectoryTree(currentPath, onNavigate);

    return (
        <DirectoryTreePresenter
            categorized={categorized}
            currentPath={currentPath}
            expandedPaths={expandedPaths}
            onFolderClick={handleFolderClick}
            onFileClick={handleClick}
            loading={loading}
        />
    );
}
