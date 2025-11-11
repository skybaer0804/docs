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

    const toggleCategory = (category) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const toggleSubcategory = (category, subcategory) => {
        const key = `${category}/${subcategory}`;
        setExpandedSubcategories((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
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
                        <div class="category-header" onClick={() => toggleCategory(category)}>
                            <span class={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
                            <span class="category-title">{categoryNames[category] || category}</span>
                        </div>
                        {isExpanded && (
                            <ul class="file-list">
                                {/* 직접 파일들 */}
                                {categoryData._files &&
                                    categoryData._files.map((file) => (
                                        <li key={file.path} class={`file-item ${currentPath === file.route ? 'active' : ''}`} onClick={() => handleClick(file)}>
                                            {file.title}
                                        </li>
                                    ))}

                                {/* 하위 디렉토리들 */}
                                {subcategories.map((subcategory) => {
                                    const key = `${category}/${subcategory}`;
                                    const isSubExpanded = expandedSubcategories[key] !== false; // 기본값 true
                                    const subFiles = categoryData[subcategory] || [];

                                    return (
                                        <li key={subcategory} class="subcategory-item">
                                            <div class="subcategory-header" onClick={() => toggleSubcategory(category, subcategory)}>
                                                <span class={`toggle-icon ${isSubExpanded ? 'expanded' : ''}`}>▶</span>
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
                                                            {file.title}
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
