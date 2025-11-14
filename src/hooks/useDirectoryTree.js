import { useState, useEffect } from 'preact/hooks';
import { getMarkdownFiles } from '../utils/markdownLoader';
import { devError } from '../utils/logger';
import { navigationObserver } from '../observers/NavigationObserver';

/**
 * 파일 경로에서 부모 경로들을 추출하는 유틸리티 함수
 * @param {Object} file - 파일 객체 (category, subcategory, directoryPath 포함)
 * @returns {Array<string>} 부모 경로 배열 (예: ['common', 'common/tdd'])
 */
function getParentPathsFromFile(file) {
    const paths = [];

    if (file.category) {
        paths.push(file.category);
    }

    if (file.subcategory) {
        paths.push(`${file.category}/${file.subcategory}`);
    }

    // directoryPath가 있으면 더 정확한 경로 추출
    if (file.directoryPath && Array.isArray(file.directoryPath)) {
        const dirPaths = [];
        file.directoryPath.forEach((dir, index) => {
            if (index === 0) {
                dirPaths.push(dir);
            } else {
                dirPaths.push(`${dirPaths[dirPaths.length - 1]}/${dir}`);
            }
        });
        // directoryPath가 더 정확하면 사용
        if (dirPaths.length > 0) {
            return dirPaths;
        }
    }

    return paths;
}

/**
 * 카테고리 경로에서 부모 경로들을 추출하는 유틸리티 함수
 * @param {string} categoryPath - 카테고리 경로 (예: 'common/tdd')
 * @returns {Array<string>} 부모 경로 배열 (예: ['common', 'common/tdd'])
 */
function getParentPathsFromCategory(categoryPath) {
    if (!categoryPath) return [];

    const parts = categoryPath.split('/').filter(Boolean);
    const paths = [];

    parts.forEach((part, index) => {
        if (index === 0) {
            paths.push(part);
        } else {
            paths.push(`${paths[paths.length - 1]}/${part}`);
        }
    });

    return paths;
}

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

    // currentPath 변경 시 자동으로 부모 경로들을 펼치기
    useEffect(() => {
        if (!currentPath) return;

        // 카테고리 경로인 경우
        if (currentPath.startsWith('/category/')) {
            const categoryPath = currentPath.replace('/category/', '');
            const parentPaths = getParentPathsFromCategory(categoryPath);

            setExpandedPaths((prev) => {
                const updated = { ...prev };
                parentPaths.forEach((path) => {
                    updated[path] = true;
                });
                return updated;
            });
            return;
        }

        // 파일 경로인 경우
        const { files } = getMarkdownFiles();
        const file = files.find((f) => f.route === currentPath);

        if (file) {
            const parentPaths = getParentPathsFromFile(file);

            setExpandedPaths((prev) => {
                const updated = { ...prev };
                parentPaths.forEach((path) => {
                    updated[path] = true;
                });
                return updated;
            });
        }
    }, [currentPath]);

    const handleFolderClick = (path) => {
        // 폴더 클릭 시 토글
        setExpandedPaths((prev) => ({
            ...prev,
            [path]: prev[path] === undefined ? false : !prev[path],
        }));

        const categoryRoute = `/category/${path}`;
        if (onNavigate) {
            onNavigate(categoryRoute);
        }
        // Observer 패턴: 네비게이션 이벤트 알림
        navigationObserver.notify(categoryRoute, { type: 'folder' });
    };

    const handleClick = (file) => {
        if (onNavigate) {
            onNavigate(file.route);
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
