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
        
        if (node.parent_id === null) {
            // 최상위 노드인 경우 (하지만 보통 최상위는 'public/docs' 폴더가 아니라 그 내용물들이 루트로 옴)
            // 기존 로직상 'Platform' 같은 대분류가 최상위 키가 됨.
            if (node.type === 'DIRECTORY') {
                tree[node.name] = current; // 잠시 전체 객체를 넣음
            } else {
                // 루트 파일
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
        id: node.id
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
        
        // 현재 폴더의 파일들
        if (node.files && node.files.length > 0) {
            cleanChildren._files = node.files;
        }

        clean[key] = cleanChildren;
    });

    return clean;
}




