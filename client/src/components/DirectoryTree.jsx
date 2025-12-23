import { DirectoryTreeContainer } from '../containers/DirectoryTreeContainer';
import './DirectoryTree.scss';

/**
 * DirectoryTree Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
export function DirectoryTreePresenter({ categorized, currentPath, expandedPaths, onFolderClick, onFileClick }) {
    // 재귀적으로 트리 렌더링
    function renderTree(node, path = '', level = 0) {
        // 정렬 제거: 원본 순서 유지 (대소문자, 한글 그대로 표시)
        const keys = Object.keys(node).filter((key) => key !== '_files');
        const files = node._files || [];

        if (keys.length === 0 && files.length === 0) {
            return null;
        }

        return (
            <ul class={level === 0 ? 'file-list' : 'sub-file-list'}>
                {/* 파일들 */}
                {files.map((file) => (
                    <li key={file.path} class={`file-item ${currentPath === file.route ? 'active' : ''}`} onClick={() => onFileClick(file)} title={file.path}>
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

                    const isSubExpanded = expandedPaths[subPath] === true; // 기본값 false

                    const subcategoryRoute = `/category/${subPath}`;
                    const isSubcategoryActive = currentPath === subcategoryRoute;

                    return (
                        <li key={key} class={level === 0 ? 'subcategory-item' : 'subcategory-item nested'} data-expanded={isSubExpanded}>
                            <div
                                class={`${level === 0 ? 'subcategory-header' : 'subcategory-header nested'} ${isSubcategoryActive ? 'active' : ''}`}
                                onClick={() => onFolderClick(subPath)}
                                title={subPath}
                            >
                                <span class="folder-icon">📁</span>
                                <span class="subcategory-title">{key}</span>
                            </div>
                            <div class="subcategory-content">{renderTree(subNode, subPath, level + 1)}</div>
                        </li>
                    );
                })}
            </ul>
        );
    }

    // 정렬 제거: 원본 순서 유지 (대소문자, 한글 그대로 표시)
    const categoryKeys = Object.keys(categorized);

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
                const isExpanded = expandedPaths[categoryPath] === true; // 기본값 false

                const categoryRoute = `/category/${categoryPath}`;
                const isCategoryActive = currentPath === categoryRoute;

                return (
                    <div key={category} class="category-section" data-expanded={isExpanded}>
                        <div class={`category-header ${isCategoryActive ? 'active' : ''}`} onClick={() => onFolderClick(categoryPath)} title={category}>
                            <span class="folder-icon">📁</span>
                            <span class="category-title">{category}</span>
                        </div>
                        <div class="category-content">{renderTree(categoryData, categoryPath, 0)}</div>
                    </div>
                );
            })}
        </div>
    );
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
export const DirectoryTree = DirectoryTreeContainer;
