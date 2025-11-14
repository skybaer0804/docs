import { getMarkdownFiles } from '../utils/markdownLoader';
import { route } from 'preact-router';
import './DirectoryView.scss';

export function DirectoryView({ currentRoute, onNavigate }) {
    const { categorized, files } = getMarkdownFiles();

    const handleFolderClick = (path) => {
        // 폴더 뷰를 보여주기 위해 특별한 경로로 이동
        const folderRoute = `/category/${path}`;
        if (onNavigate) {
            onNavigate(folderRoute);
        } else {
            route(folderRoute);
        }
    };

    const handleFileClick = (file) => {
        if (onNavigate) {
            onNavigate(file.route);
        } else {
            route(file.route);
        }
    };

    // 트리에서 경로에 해당하는 노드 찾기
    function getNodeByPath(tree, pathParts) {
        let current = tree;
        for (const part of pathParts) {
            if (current && current[part]) {
                current = current[part];
            } else {
                return null;
            }
        }
        return current;
    }

    // 현재 경로에 따라 표시할 내용 결정
    let displayData = null;
    let displayType = 'root';

    if (!currentRoute || currentRoute === '/') {
        // 루트: 모든 카테고리 표시
        displayType = 'root';
    } else if (currentRoute.startsWith('/category/')) {
        // 무제한 중첩 경로 파싱
        const pathParts = currentRoute
            .replace('/category/', '')
            .split('/')
            .filter((p) => p);
        if (pathParts.length > 0) {
            const node = getNodeByPath(categorized, pathParts);
            if (node) {
                displayType = 'directory';
                displayData = {
                    path: pathParts.join('/'),
                    pathParts: pathParts,
                    node: node,
                };
            }
        }
    } else {
        // 파일 경로인 경우 해당 파일의 디렉토리 표시
        const currentFile = files.find((f) => f.route === currentRoute);
        if (currentFile && currentFile.directoryPath && currentFile.directoryPath.length > 0) {
            const node = getNodeByPath(categorized, currentFile.directoryPath);
            if (node) {
                displayType = 'directory';
                displayData = {
                    path: currentFile.directoryPath.join('/'),
                    pathParts: currentFile.directoryPath,
                    node: node,
                };
            }
        } else if (currentFile && currentFile.category) {
            // 하위 호환성: category/subcategory 구조
            const node = categorized[currentFile.category];
            if (node) {
                displayType = 'directory';
                const pathParts = currentFile.subcategory ? [currentFile.category, currentFile.subcategory] : [currentFile.category];
                displayData = {
                    path: pathParts.join('/'),
                    pathParts: pathParts,
                    node: currentFile.subcategory ? node[currentFile.subcategory] : node,
                };
            }
        }
    }

    // 루트 레벨: 모든 카테고리 표시
    if (displayType === 'root') {
        const categoryKeys = Object.keys(categorized).sort();
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
                            <div key={category} class="directory-item folder-item" onClick={() => handleFolderClick(category)} title={category}>
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
        const subdirectories = Object.keys(node)
            .filter((key) => key !== '_files')
            .sort();
        const directFiles = node._files || [];

        return (
            <div class="directory-view">
                <div class="directory-grid">
                    {/* 하위 디렉토리들 */}
                    {subdirectories.map((subdir) => {
                        const subPath = path ? `${path}/${subdir}` : subdir;
                        return (
                            <div key={subdir} class="directory-item folder-item" onClick={() => handleFolderClick(subPath)} title={subPath}>
                                <span class="item-icon">📁</span>
                                <span class="item-name">{subdir}</span>
                            </div>
                        );
                    })}
                    {/* 직접 파일들 */}
                    {directFiles.map((file) => (
                        <div key={file.path} class="directory-item file-item" onClick={() => handleFileClick(file)} title={file.path}>
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
