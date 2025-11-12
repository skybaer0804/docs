import { useState } from 'preact/hooks';
import { getMarkdownFiles } from '../utils/markdownLoader';
import { route } from 'preact-router';

export function DirectoryTree({ currentPath, onNavigate }) {
    const [expandedCategories, setExpandedCategories] = useState({});
    const [expandedSubcategories, setExpandedSubcategories] = useState({});

    let categorized = {};
    try {
        const result = getMarkdownFiles();
        categorized = result.categorized || {};
    } catch (error) {
        console.error('Error loading markdown files:', error);
    }

    const categoryNames = {
        root: '루트',
        common: '공통',
        sdk: 'SDK',
        backend: '백엔드',
        misc: '기타',
    };

    const handleCategoryClick = (category) => {
        // 폴더 클릭 시 토글하고 해당 폴더 뷰로 이동
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: prev[category] === undefined ? false : !prev[category],
        }));

        const categoryRoute = `/category/${category}`;
        if (onNavigate) {
            onNavigate(categoryRoute);
        } else {
            route(categoryRoute);
        }
    };

    const handleSubcategoryClick = (category, subcategory) => {
        // 서브폴더 클릭 시 토글하고 해당 폴더 뷰로 이동
        const key = `${category}/${subcategory}`;
        setExpandedSubcategories((prev) => ({
            ...prev,
            [key]: prev[key] === undefined ? false : !prev[key],
        }));

        const subcategoryRoute = `/category/${category}/${subcategory}`;
        if (onNavigate) {
            onNavigate(subcategoryRoute);
        } else {
            route(subcategoryRoute);
        }
    };

    const handleClick = (file) => {
        if (onNavigate) {
            onNavigate(file.route);
        } else {
            route(file.route);
        }
    };

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
                const isExpanded = expandedCategories[category] !== false; // 기본값 true
                const subcategories = Object.keys(categoryData).filter((key) => key !== '_files');

                return (
                    <div key={category} class="category-section">
                        <div class="category-header" onClick={() => handleCategoryClick(category)}>
                            <span class="folder-icon">📁</span>
                            <span class="category-title">{categoryNames[category] || category}</span>
                        </div>
                        {isExpanded && (
                            <ul class="file-list">
                                {/* 직접 파일들 */}
                                {categoryData._files &&
                                    categoryData._files.map((file) => (
                                        <li key={file.path} class={`file-item ${currentPath === file.route ? 'active' : ''}`} onClick={() => handleClick(file)}>
                                            <span class="file-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
                                            <span class="file-name">{file.title}</span>
                                        </li>
                                    ))}

                                {/* 하위 디렉토리들 */}
                                {subcategories.map((subcategory) => {
                                    const key = `${category}/${subcategory}`;
                                    const isSubExpanded = expandedSubcategories[key] !== false; // 기본값 true
                                    const subFiles = categoryData[subcategory] || [];

                                    return (
                                        <li key={subcategory} class="subcategory-item">
                                            <div class="subcategory-header" onClick={() => handleSubcategoryClick(category, subcategory)}>
                                                <span class="folder-icon">📁</span>
                                                <span class="subcategory-title">{subcategory}</span>
                                            </div>
                                            {isSubExpanded && (
                                                <ul class="sub-file-list">
                                                    {subFiles.map((file) => (
                                                        <li
                                                            key={file.path}
                                                            class={`file-item ${currentPath === file.route ? 'active' : ''}`}
                                                            onClick={() => handleClick(file)}
                                                        >
                                                            <span class="file-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
                                                            <span class="file-name">{file.title}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
