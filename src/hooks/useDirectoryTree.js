import { useState } from 'preact/hooks';
import { getMarkdownFiles } from '../utils/markdownLoader';
import { route } from 'preact-router';
import { devError } from '../utils/logger';
import { navigationObserver } from '../observers/NavigationObserver';

/**
 * DirectoryTree의 로직을 담당하는 Custom Hook
 * TDD 친화적: 로직을 분리하여 테스트 용이
 */
export function useDirectoryTree(currentPath, onNavigate) {
    const [expandedPaths, setExpandedPaths] = useState({});

    let categorized = {};
    try {
        const result = getMarkdownFiles();
        categorized = result.categorized || {};
    } catch (error) {
        devError('Error loading markdown files:', error);
    }

    const handleFolderClick = (path) => {
        // 폴더 클릭 시 토글
        setExpandedPaths((prev) => ({
            ...prev,
            [path]: prev[path] === undefined ? false : !prev[path],
        }));

        const categoryRoute = `/category/${path}`;
        if (onNavigate) {
            onNavigate(categoryRoute);
        } else {
            route(categoryRoute);
        }
        // Observer 패턴: 네비게이션 이벤트 알림
        navigationObserver.notify(categoryRoute, { type: 'folder' });
    };

    const handleClick = (file) => {
        if (onNavigate) {
            onNavigate(file.route);
        } else {
            route(file.route);
        }
        // Observer 패턴: 네비게이션 이벤트 알림
        navigationObserver.notify(file.route, { type: 'file', file });
    };

    return {
        categorized,
        expandedPaths,
        handleFolderClick,
        handleClick,
    };
}
