/**
 * 평탄한 노드 목록(DB 결과)을 기존 프론트엔드에서 사용하는 'categorized' 트리 구조로 변환합니다.
 * 
 * 기존 구조 예시:
 * {
 *   "Platform": {
 *     "Web": {
 *       "files": [ { title: "...", route: "..." } ],
 *       "API": { "files": [...] }
 *     }
 *   },
 *   "files": [...] // 루트 파일들
 * }
 * 
 * DB 노드 예시:
 * { id: 1, parent_id: null, name: "Platform", type: "DIRECTORY", path: "/docs/Platform" }
 */
export function buildDirectoryTree(nodes) {
    const tree = {};
    const idMap = {}; // id -> node 객체 매핑 (참조용)
    
    // /docs 폴더의 ID 찾기 (경로가 '/docs'이고 parent_id가 null인 노드)
    const docsRootId = nodes.find(n => n.path === '/docs' && (n.parent_id === null || n.parent_id === undefined))?.id;

    // 1. 모든 노드를 idMap에 저장하고, children 배열 초기화
    nodes.forEach(node => {
        idMap[node.id] = { 
            ...node, 
            children: {},   // 하위 디렉토리
            files: []       // 하위 파일
        };
    });

    // 2. 트리 구성
    nodes.forEach(node => {
        const current = idMap[node.id];
        
        // /docs 폴더 자체는 트리에서 제외
        if (docsRootId && node.id === docsRootId) {
            return;
        }
        
        // /docs의 직접 하위 노드들은 최상위로 처리
        if (docsRootId && node.parent_id === docsRootId) {
            if (node.type === 'DIRECTORY') {
                tree[node.name] = current;
            } else {
                if (!tree.files) tree.files = [];
                tree.files.push(transformFileNode(node));
            }
            return;
        }
        
        if (node.parent_id === null || node.parent_id === undefined) {
            // 최상위 노드인 경우 (/docs가 없는 경우를 대비)
            if (node.type === 'DIRECTORY') {
                tree[node.name] = current;
            } else {
                if (!tree.files) tree.files = [];
                tree.files.push(transformFileNode(node));
            }
        } else {
            const parent = idMap[node.parent_id];
            if (parent) {
                if (node.type === 'DIRECTORY') {
                    parent.children[node.name] = current;
                } else {
                    parent.files.push(transformFileNode(node));
                }
            } else {
                // 부모가 없는 경우 경로 기반으로 처리 시도
                console.warn('Parent not found for node:', node.path, 'parent_id:', node.parent_id);
                
                // 경로 기반으로 부모 찾기 시도
                if (node.path && node.path.startsWith('/docs/')) {
                    const pathParts = node.path.split('/').filter(Boolean);
                    if (pathParts.length > 1 && pathParts[0] === 'docs') {
                        // /docs/Archtecture/BCP 같은 경우
                        // 부모 경로를 찾아서 처리
                        const parentPath = '/' + pathParts.slice(0, -1).join('/');
                        const parentNode = nodes.find(n => n.path === parentPath);
                        if (parentNode && idMap[parentNode.id]) {
                            const foundParent = idMap[parentNode.id];
                            if (node.type === 'DIRECTORY') {
                                foundParent.children[node.name] = current;
                            } else {
                                foundParent.files.push(transformFileNode(node));
                            }
                        } else {
                            console.warn('Parent node not found by path:', parentPath);
                        }
                    }
                }
            }
        }
    });

    // 3. 재귀적으로 기존 프론트엔드 구조(순수 객체 + files 배열)로 정제
    return cleanTreeStructure(tree);
}

function transformFileNode(node) {
    // 기존 MarkdownLoader가 반환하던 파일 객체 포맷에 맞춤
    return {
        path: node.path,
        route: node.path, // 라우팅 경로
        title: node.name.replace(/\.md$/, ''), // 확장자 제거된 제목
        name: node.name,
        ext: node.name.split('.').pop() || '',
        id: node.id,
        type: node.type,
        author_id: node.author_id
    };
}

function cleanTreeStructure(dirtyTree) {
    const clean = {};
    
    // files 배열 처리
    if (dirtyTree.files) {
        clean._files = dirtyTree.files;
    }

    Object.keys(dirtyTree).forEach(key => {
        if (key === 'files') return;
        
        const node = dirtyTree[key];
        // node는 idMap의 객체 (children, files 포함)
        
        // 재귀 처리
        const cleanChildren = cleanTreeStructure(node.children || {});

        // 폴더 메타 보존 (삭제/이동/DnD를 위해 id/path가 필요)
        // NOTE: 기존 렌더러들이 폴더 키로 인식하지 않도록 `_meta`는 예약 키로 사용
        if (node && node.type === 'DIRECTORY') {
            cleanChildren._meta = {
                id: node.id,
                path: node.path,
                name: node.name,
                type: node.type,
                author_id: node.author_id
            };
        }
        
        // 현재 폴더의 파일들
        if (node.files && node.files.length > 0) {
            cleanChildren._files = node.files;
        }

        clean[key] = cleanChildren;
    });

    return clean;
}




