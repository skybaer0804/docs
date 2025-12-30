import { useDirectoryView } from '../hooks/useDirectoryView';
import { DirectoryViewPresenter } from '../components/DirectoryView';
import { useState } from 'preact/hooks';
import { DirectoryCreateModal } from '../components/DirectoryCreateModal';
import { route } from 'preact-router';
import { downloadFile } from '../utils/downloadUtils';

/**
 * DirectoryView Container 컴포넌트
 */
export function DirectoryViewContainer({ currentRoute, onNavigate }) {
    const { categorized, files, displayType, displayData, handleFolderClick, handleFileClick } = useDirectoryView(currentRoute, onNavigate);
    
    const [directoryModalOpen, setDirectoryModalOpen] = useState(false);
    const [directoryModalParentId, setDirectoryModalParentId] = useState(null);

    const handleCreateDocument = (parentId) => {
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

    const handleEditDocument = (id) => {
        const url = `/edit/${id}`;
        if (onNavigate) {
            onNavigate(url);
        } else {
            route(url);
        }
    };

    const handleDownloadDocument = async (file) => {
        if (!file?.id) return;
        const fileName = file.title.endsWith('.md') ? file.title : `${file.title}.md`;
        // ID 기반 API 주소를 filePath 대신 전달하여 다운로드 유틸리티가 해당 내용을 fetch 하도록 함
        await downloadFile(`/api/docs/id/${file.id}`, fileName);
    };

    return (
        <>
            <DirectoryViewPresenter
                categorized={categorized}
                displayType={displayType}
                displayData={displayData}
                currentRoute={currentRoute}
                onNavigate={onNavigate}
                onFolderClick={handleFolderClick}
                onFileClick={handleFileClick}
                onCreateDocument={handleCreateDocument}
                onCreateFolder={handleCreateFolder}
                onEditDocument={handleEditDocument}
                onDownloadDocument={handleDownloadDocument}
            />
            <DirectoryCreateModal
                isOpen={directoryModalOpen}
                onClose={() => setDirectoryModalOpen(false)}
                parentId={directoryModalParentId}
            />
        </>
    );
}
