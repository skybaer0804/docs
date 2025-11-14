import { getMarkdownFiles } from '../utils/markdownLoader';
import { navigationObserver } from '../observers/NavigationObserver';

/**
 * DirectoryView의 로직을 담당하는 Custom Hook
 * TDD 친화적: 로직을 분리하여 테스트 용이
 */
export function useDirectoryView(currentRoute, onNavigate) {
    const { categorized, files } = getMarkdownFiles();

    const handleFolderClick = (path) => {
        // 폴더 뷰를 보여주기 위해 특별한 경로로 이동
        const folderRoute = `/category/${path}`;
        if (onNavigate) {
            onNavigate(folderRoute);
        }
        // Observer 패턴: 네비게이션 이벤트 알림
        navigationObserver.notify(folderRoute, { type: 'folder' });
    };

    const handleFileClick = (file) => {
        if (onNavigate) {
            onNavigate(file.route);
        }
        // Observer 패턴: 네비게이션 이벤트 알림
        navigationObserver.notify(file.route, { type: 'file', file });
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

    return {
        categorized,
        files,
        displayType,
        displayData,
        handleFolderClick,
        handleFileClick,
    };
}
