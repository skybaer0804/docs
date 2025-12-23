import { useState, useEffect } from 'preact/hooks';
import { fetchAllDocs } from '../utils/api';
import { buildDirectoryTree } from '../utils/treeUtils';
import { devError } from '../utils/logger';
import { navigationObserver } from '../observers/NavigationObserver';

/**
 * 파일 경로에서 부모 경로들을 추출하는 유틸리티 함수
 * @param {Object} file - 파일 객체 (category, subcategory, directoryPath 포함)
 * @returns {Array<string>} 부모 경로 배열 (예: ['common', 'common/tdd'])
 */
function getParentPathsFromFile(file) {
    // ... 기존 로직 유지 (단, DB 기반에선 file 객체 구조가 다를 수 있어 확인 필요)
    // 현재는 API 응답을 기존 구조로 매핑했으므로 그대로 둠
    const paths = [];
    if (file.route) {
        const parts = file.route.split('/').filter(Boolean);
        // parts: ['docs', 'Platform', 'Web', 'API', 'guide']
        // 마지막은 파일명이므로 제외
        parts.pop();
        
        // 누적 경로 생성
        let current = '';
        parts.forEach(part => {
             // docs/Platform 같은 대분류 처리가 기존과 다를 수 있음
             // 기존: categorized['Platform']...
             // 따라서 키 이름만 추출해야 함?
             // buildDirectoryTree가 키 이름을 기반으로 구조를 만듦.
             // 여기서는 'Platform', 'Platform/Web' 형태로 키를 만들어야 함.
             
             // 하지만 기존 로직은 `getMarkdownFiles` 결과에 의존.
             // buildDirectoryTree가 반환하는 구조: { "Platform": { "Web": { files: [...] } } }
             // 따라서 키는 'Platform', 'Platform/Web' 이런 식이 아니라,
             // 1depth: 'Platform'
             // 2depth: 'Platform/Web' (X) -> 그냥 트리 탐색용 키.
             
             // expandedPaths는 { "Platform": true, "Platform/Web": true } 형태로 관리됨 (DirectoryTree.jsx 참조)
             // 따라서 경로(String)를 만들어내야 함.
        });
    }
    return paths; // 일단 빈 배열, 아래 useEffect에서 다시 로직 보강
}

// ... getParentPathsFromCategory 도 비슷함

/**
 * DirectoryTree의 로직을 담당하는 Custom Hook
 */
export function useDirectoryTree(currentPath, onNavigate) {
    const [expandedPaths, setExpandedPaths] = useState({});
    const [categorized, setCategorized] = useState({});
    const [loading, setLoading] = useState(true);

    // 초기 데이터 로드 (API)
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const nodes = await fetchAllDocs();
                const tree = buildDirectoryTree(nodes);
                setCategorized(tree);
            } catch (error) {
                devError('Error loading docs tree:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // currentPath 변경 시 자동으로 부모 경로들을 펼치기
    useEffect(() => {
        if (!currentPath || Object.keys(categorized).length === 0) return;

        // API 기반 트리에서는 경로 파싱 방식이 달라질 수 있음.
        // 단순히 URL path를 쪼개서 누적 경로를 모두 expand 처리하면 됨.
        // 예: /docs/Platform/Web/API/guide
        // -> Expand: Platform, Platform/Web, Platform/Web/API
        
        const parts = currentPath.split('/').filter(Boolean); // ['docs', 'Platform', ...]
        
        // 'docs' 접두사가 DB path에 포함되어 있다면 제외할지 여부 결정 필요.
        // 현재 DB path: /docs/...
        // 화면 표시 트리 키: Platform (docs 하위)
        
        // parts 중에서 실제 트리 키로 쓰이는 부분 찾기
        // 보통 0번 인덱스가 'docs'라면 1번부터가 실제 트리 키
        let startIndex = 0;
        if (parts[0] === 'docs') startIndex = 1;
        
        const relevantParts = parts.slice(startIndex, parts.length - 1); // 마지막은 파일명
        
        const newExpanded = {};
        let accumulated = '';
        
        relevantParts.forEach((part, index) => {
            const key = index === 0 ? part : `${accumulated}/${part}`;
            accumulated = key;
            newExpanded[key] = true;
        });

        setExpandedPaths(prev => ({ ...prev, ...newExpanded }));
        
    }, [currentPath, categorized]);

    const handleFolderClick = (path) => {
        setExpandedPaths((prev) => ({
            ...prev,
            [path]: prev[path] === undefined ? false : !prev[path],
        }));

        // 카테고리 라우팅은 트리 구조상 가상 경로일 수 있음
        const categoryRoute = `/category/${path}`;
        if (onNavigate) {
            // 폴더 클릭 시 네비게이션이 필요한지? 보통은 펼치기만 함.
            // onNavigate(categoryRoute); 
        }
        navigationObserver.notify(categoryRoute, { type: 'folder' });
    };

    const handleClick = (file) => {
        if (onNavigate) {
            onNavigate(file.route);
        }
        navigationObserver.notify(file.route, { type: 'file', file });
    };

    return {
        categorized,
        expandedPaths,
        handleFolderClick,
        handleClick,
        loading // 로딩 상태 추가됨
    };
}

