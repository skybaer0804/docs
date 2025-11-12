import { getMarkdownFiles } from '../utils/markdownLoader';
import { route } from 'preact-router';
import './DirectoryView.scss';

export function DirectoryView({ currentRoute, onNavigate }) {
    const { categorized, files } = getMarkdownFiles();

    const handleCategoryClick = (category) => {
        // 카테고리 폴더 뷰를 보여주기 위해 특별한 경로로 이동
        const categoryRoute = `/category/${category}`;
        if (onNavigate) {
            onNavigate(categoryRoute);
        } else {
            route(categoryRoute);
        }
    };

    const handleSubcategoryClick = (category, subcategory) => {
        // 서브카테고리 폴더 뷰를 보여주기 위해 특별한 경로로 이동
        const subcategoryRoute = `/category/${category}/${subcategory}`;
        if (onNavigate) {
            onNavigate(subcategoryRoute);
        } else {
            route(subcategoryRoute);
        }
    };

    const handleFileClick = (file) => {
        if (onNavigate) {
            onNavigate(file.route);
        } else {
            route(file.route);
        }
    };

    // 현재 경로에 따라 표시할 내용 결정
    let displayData = null;
    let displayType = 'root'; // 'root', 'category', 'subcategory'

    if (!currentRoute || currentRoute === '/') {
        // 루트: 모든 카테고리 표시
        displayType = 'root';
    } else if (currentRoute.startsWith('/category/')) {
        // 카테고리 또는 서브카테고리 경로 파싱
        const parts = currentRoute.replace('/category/', '').split('/');
        if (parts.length === 1) {
            // 카테고리 레벨: /category/common
            const category = parts[0];
            displayType = 'category';
            displayData = {
                category: category,
                data: categorized[category],
            };
        } else if (parts.length === 2) {
            // 서브카테고리 레벨: /category/common/tdd
            const category = parts[0];
            const subcategory = parts[1];
            displayType = 'subcategory';
            displayData = {
                category: category,
                subcategory: subcategory,
                files: categorized[category]?.[subcategory] || [],
            };
        }
    } else {
        const currentFile = files.find((f) => f.route === currentRoute);
        if (currentFile) {
            if (currentFile.subcategory) {
                // 서브카테고리 내부: 해당 서브카테고리의 파일들만 표시
                displayType = 'subcategory';
                displayData = {
                    category: currentFile.category,
                    subcategory: currentFile.subcategory,
                    files: categorized[currentFile.category]?.[currentFile.subcategory] || [],
                };
            } else if (currentFile.category) {
                // 카테고리 내부: 해당 카테고리의 하위 항목만 표시
                displayType = 'category';
                displayData = {
                    category: currentFile.category,
                    data: categorized[currentFile.category],
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
                        const categoryData = categorized[category];
                        const subcategories = Object.keys(categoryData).filter((key) => key !== '_files');
                        const hasDirectFiles = categoryData._files && categoryData._files.length > 0;
                        const hasSubcategories = subcategories.length > 0;

                        return (
                            <div key={category} class="directory-item folder-item" onClick={() => handleCategoryClick(category)} title={category}>
                                <span class="item-icon">📁</span>
                                <span class="item-name">{category}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // 카테고리 레벨: 해당 카테고리의 하위 항목만 표시
    if (displayType === 'category' && displayData) {
        const { category, data } = displayData;
        const subcategories = Object.keys(data).filter((key) => key !== '_files');
        const directFiles = data._files || [];

        return (
            <div class="directory-view">
                <div class="directory-grid">
                    {/* 서브카테고리들 */}
                    {subcategories.map((subcategory) => {
                        const subFiles = data[subcategory] || [];
                        return (
                            <div
                                key={subcategory}
                                class="directory-item folder-item"
                                onClick={() => handleSubcategoryClick(category, subcategory)}
                                title={`${category}/${subcategory}`}
                            >
                                <span class="item-icon">📁</span>
                                <span class="item-name">{subcategory}</span>
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

    // 서브카테고리 레벨: 해당 서브카테고리의 파일들만 표시
    if (displayType === 'subcategory' && displayData) {
        const { files: subFiles } = displayData;

        return (
            <div class="directory-view">
                <div class="directory-grid">
                    {subFiles.map((file) => (
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
