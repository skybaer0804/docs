import { useState, useEffect, useCallback } from 'preact/hooks';
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

    // 트리 데이터 로드 함수
    const loadTreeData = useCallback(async () => {
        try {
            setLoading(true);
            const nodes = await fetchAllDocs();
            console.log('loadTreeData: Fetched nodes count:', nodes?.length);
            console.log('loadTreeData: Sample nodes:', nodes?.slice(0, 5));
            const tree = buildDirectoryTree(nodes);
            console.log('loadTreeData: Built tree structure:', Object.keys(tree));
            setCategorized(tree);
        } catch (error) {
            devError('Error loading docs tree:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 초기 데이터 로드 (API)
    useEffect(() => {
        loadTreeData();
    }, [loadTreeData]);

    // 문서 변경 이벤트 감지하여 트리 업데이트 (디바운싱 및 중복 로드 방지)
    useEffect(() => {
        let debounceTimer = null;
        let isReloading = false;

        const handleDocumentChange = ({ action, type, path }) => {
            // 파일/폴더 생성, 수정, 삭제 시 트리 다시 로드
            console.log('handleDocumentChange:', { action, type, path });
            if ((type === 'file' || type === 'directory') && (action === 'create' || action === 'update' || action === 'delete')) {
                // 이미 로딩 중이면 무시
                if (isReloading) {
                    console.log('handleDocumentChange: Already reloading, skipping');
                    return;
                }

                console.log('handleDocumentChange: Scheduling tree reload');
                // 디바운싱: 300ms 내 여러 이벤트가 오면 마지막 것만 실행
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }
                debounceTimer = setTimeout(async () => {
                    isReloading = true;
                    try {
                        console.log('handleDocumentChange: Reloading tree data');
                        await loadTreeData();
                    } finally {
                        isReloading = false;
                        debounceTimer = null;
                    }
                }, 300);
            }
        };

        const unsubscribe = navigationObserver.subscribe(handleDocumentChange);
        return () => {
            unsubscribe();
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
        };
    }, [loadTreeData]);

    // currentPath 변경 시 자동으로 부모 경로들을 펼치기
    useEffect(() => {
        if (!currentPath || Object.keys(categorized).length === 0) return;

        let parts = [];
        
        // /category/ 경로인 경우 처리
        if (currentPath.startsWith('/category/')) {
            parts = currentPath.replace('/category/', '').split('/').filter(Boolean);
        } else {
            // /docs/... 경로인 경우
            parts = currentPath.split('/').filter(Boolean);
            // 'docs' 접두사 제외
            if (parts[0] === 'docs') {
                parts = parts.slice(1);
            }
            // 마지막이 파일명인 경우 제외 (확장자가 있는 경우)
            if (parts.length > 0) {
                const lastPart = parts[parts.length - 1];
                if (lastPart.includes('.') && !lastPart.startsWith('.')) {
                    parts = parts.slice(0, -1);
                }
            }
        }
        
        const newExpanded = {};
        let accumulated = '';
        
        parts.forEach((part, index) => {
            const key = index === 0 ? part : `${accumulated}/${part}`;
            accumulated = key;
            newExpanded[key] = true;
        });

        setExpandedPaths(prev => ({ ...prev, ...newExpanded }));
        
    }, [currentPath, categorized]);

    const handleFolderClick = (path) => {
        setExpandedPaths((prev) => ({
            ...prev,
            [path]: !prev[path],
        }));

        // 카테고리 라우팅은 트리 구조상 가상 경로일 수 있음
        const categoryRoute = `/category/${path}`;
        if (onNavigate) {
            onNavigate(categoryRoute);
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

