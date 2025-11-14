import { useState } from 'preact/hooks';
import { getMarkdownFiles } from '../utils/markdownLoader';
import { route } from 'preact-router';
import './DirectoryTree.scss';

export function DirectoryTree({ currentPath, onNavigate }) {
    const [expandedPaths, setExpandedPaths] = useState({});

    let categorized = {};
    try {
        const result = getMarkdownFiles();
        categorized = result.categorized || {};
    } catch (error) {
        console.error('Error loading markdown files:', error);
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
    };

    const handleClick = (file) => {
        if (onNavigate) {
            onNavigate(file.route);
        } else {
            route(file.route);
        }
    };

    // 재귀적으로 트리 렌더링
    function renderTree(node, path = '', level = 0) {
        const keys = Object.keys(node)
            .filter((key) => key !== '_files')
            .sort();
        const files = node._files || [];

        if (keys.length === 0 && files.length === 0) {
            return null;
        }

        return (
            <ul class={level === 0 ? 'file-list' : 'sub-file-list'}>
                {/* 파일들 */}
                {files.map((file) => (
                    <li key={file.path} class={`file-item ${currentPath === file.route ? 'active' : ''}`} onClick={() => handleClick(file)} title={file.path}>
                        <span class="file-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
                        <span class="file-name">{file.title}</span>
                    </li>
                ))}

                {/* 하위 디렉토리들 */}
                {keys.map((key) => {
                    const subPath = path ? `${path}/${key}` : key;
                    const subNode = node[key];
                    const hasContent = subNode._files?.length > 0 || Object.keys(subNode).filter((k) => k !== '_files').length > 0;

                    if (!hasContent) return null;

                    const isSubExpanded = expandedPaths[subPath] !== false; // 기본값 true

                    return (
                        <li key={key} class={level === 0 ? 'subcategory-item' : 'subcategory-item nested'}>
                            <div
                                class={level === 0 ? 'subcategory-header' : 'subcategory-header nested'}
                                onClick={() => handleFolderClick(subPath)}
                                title={subPath}
                            >
                                <span class="folder-icon">📁</span>
                                <span class="subcategory-title">{key}</span>
                            </div>
                            {isSubExpanded && renderTree(subNode, subPath, level + 1)}
                        </li>
                    );
                })}
            </ul>
        );
    }

    const categoryKeys = Object.keys(categorized).sort();

    if (categoryKeys.length === 0) {
        return (
            <div class="directory-tree">
                <div class="category-section">
                    <div class="category-title">로딩 중...</div>
                    <ul class="file-list">
                        <li class="file-item">파일을 불러오는 중입니다...</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div class="directory-tree">
            {categoryKeys.map((category) => {
                const categoryData = categorized[category];
                const categoryPath = category;
                const isExpanded = expandedPaths[categoryPath] !== false; // 기본값 true

                return (
                    <div key={category} class="category-section">
                        <div class="category-header" onClick={() => handleFolderClick(categoryPath)} title={category}>
                            <span class="folder-icon">📁</span>
                            <span class="category-title">{category}</span>
                        </div>
                        {isExpanded && renderTree(categoryData, categoryPath, 0)}
                    </div>
                );
            })}
        </div>
    );
}
