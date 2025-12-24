import { DirectoryViewContainer } from '../containers/DirectoryViewContainer';
import './DirectoryView.scss';

/**
 * DirectoryView Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
export function DirectoryViewPresenter({ categorized, displayType, displayData, onFolderClick, onFileClick }) {
    // 루트 레벨: 모든 카테고리 표시
    if (displayType === 'root') {
        // 정렬 제거: 원본 순서 유지 (대소문자, 한글 그대로 표시)
        const categoryKeys = Object.keys(categorized).filter((key) => key !== '_files');
        if (categoryKeys.length === 0) {
            return (
                <div class="directory-view">
                    <div style="text-align: center; padding: 40px;">
                        <p style="color: #666;">문서가 없습니다.</p>
                    </div>
                </div>
            );
        }

        return (
            <div class="directory-view">
                <div class="directory-grid">
                    {categoryKeys.map((category) => {
                        return (
                            <div key={category} class="directory-item folder-item" onClick={() => onFolderClick(category)} title={category}>
                                <span class="item-icon">📁</span>
                                <span class="item-name">{category}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // 디렉토리 레벨: 해당 디렉토리의 하위 항목 표시
    if (displayType === 'directory' && displayData) {
        const { path, pathParts, node } = displayData;
        // 정렬 제거: 원본 순서 유지 (대소문자, 한글 그대로 표시)
        const subdirectories = Object.keys(node).filter((key) => key !== '_files');
        const directFiles = node._files || [];

        return (
            <div class="directory-view">
                <div class="directory-grid">
                    {/* 하위 디렉토리들 */}
                    {subdirectories.map((subdir) => {
                        const subPath = path ? `${path}/${subdir}` : subdir;
                        return (
                            <div key={subdir} class="directory-item folder-item" onClick={() => onFolderClick(subPath)} title={subPath}>
                                <span class="item-icon">📁</span>
                                <span class="item-name">{subdir}</span>
                            </div>
                        );
                    })}
                    {/* 직접 파일들 */}
                    {directFiles.map((file) => (
                        <div key={file.path} class="directory-item file-item" onClick={() => onFileClick(file)} title={file.path}>
                            <span class="item-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
                            <span class="item-name">{file.title}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
export const DirectoryView = DirectoryViewContainer;
