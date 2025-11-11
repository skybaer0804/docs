import { getMarkdownFiles } from '../utils/markdownLoader';
import { route } from 'preact-router';

export function DirectoryTree({ currentPath, onNavigate }) {
    let categorized = {};
    try {
        const result = getMarkdownFiles();
        categorized = result.categorized || {};
        console.log('Loaded files:', result.files);
        console.log('Categorized:', categorized);
    } catch (error) {
        console.error('Error loading markdown files:', error);
    }

    const categoryNames = {
        root: '루트',
        common: '공통',
        sdk: 'SDK',
        backend: '백엔드',
        misc: '기타',
        'workspace-templates': '워크스페이스 템플릿',
        tdd: 'TDD',
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
            {categoryKeys.map((category) => (
                <div key={category} class="category-section">
                    <div class="category-title">{categoryNames[category] || category}</div>
                    <ul class="file-list">
                        {categorized[category].map((file) => (
                            <li key={file.path} class={`file-item ${currentPath === file.route ? 'active' : ''}`} onClick={() => handleClick(file)}>
                                {file.title}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
