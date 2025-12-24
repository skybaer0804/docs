import { useDirectoryView } from '../hooks/useDirectoryView';
import { DirectoryViewPresenter } from '../components/DirectoryView';

/**
 * DirectoryView Container 컴포넌트
 * 비즈니스 로직과 상태 관리를 담당
 * TDD 친화적: 로직을 분리하여 테스트 시 Mock으로 대체 가능
 */
export function DirectoryViewContainer({ currentRoute, onNavigate }) {
    const { categorized, files, displayType, displayData, handleFolderClick, handleFileClick } = useDirectoryView(currentRoute, onNavigate);

    return (
        <DirectoryViewPresenter
            categorized={categorized}
            displayType={displayType}
            displayData={displayData}
            currentRoute={currentRoute}
            onNavigate={onNavigate}
            onFolderClick={handleFolderClick}
            onFileClick={handleFileClick}
        />
    );
}
