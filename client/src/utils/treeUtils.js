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
 */
export function buildDirectoryTree(nodes) {
    const tree = {};
    const idMap = {}; // id -> node 객체 매핑 (참조용)

    // docs 루트 노드 찾기 (parent_id가 null이고 이름이 docs인 노드)
    const docsRootId = nodes.find(n => n.name === 'docs' && (n.parent_id === null || n.parent_id === undefined))?.id;

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

        // docs 폴더 자체는 트리에서 제외
        if (docsRootId && node.id === docsRootId) {
            return;
        }

        // docs의 직접 하위 노드들은 최상위로 처리
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
            // 최상위 노드인 경우 (docs가 없는 경우를 대비)
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
            }
        }
    });

    // 3. 재귀적으로 기존 프론트엔드 구조(순수 객체 + files 배열)로 정제
    return cleanTreeStructure(tree);
}

/**
 * 구독한 유저들의 노드를 유저별로 그룹화하여 트리 구조로 변환합니다.
 */
export function buildSubscriptionTree(nodes) {
    const userMap = {};

    // 1. 유저별로 노드 분류
    nodes.forEach((node) => {
        if (!userMap[node.author_id]) {
            userMap[node.author_id] = [];
        }
        userMap[node.author_id].push(node);
    });

    const subTree = {};

    // 2. 각 유저별로 트리 구성
    Object.keys(userMap).forEach((authorId) => {
        const userNodes = userMap[authorId];
        // 유저명이 노드에 포함되어 내려오므로 첫 번째 노드에서 유저명을 가져옴
        const username = userNodes[0]?.users?.username || authorId;

        // 유저별로 별도의 루트를 가짐
        subTree[username] = buildDirectoryTree(userNodes);
    });

    return subTree;
}

/**
 * 파일 노드를 프론트엔드 포맷으로 변환합니다.
 */
export function transformFileNode(node) {
    // 기존 MarkdownLoader가 반환하던 파일 객체 포맷에 맞춤
    const rawName = typeof node?.name === 'string' ? node.name : '';
    const hasDot = rawName.includes('.') && !rawName.startsWith('.') && rawName.lastIndexOf('.') > 0;
    const ext = hasDot ? `.${rawName.split('.').pop()}` : '';
    return {
        route: `/doc/${node.id}`, // ID 기반 라우팅
        title: rawName.replace(/\.(md|template)$/i, ''), // 확장자 제거된 제목
        name: rawName,
        ext,
        id: node.id,
        type: node.type,
        author_id: node.author_id,
        view_count: node.stats?.view_count || (Array.isArray(node.stats) ? node.stats[0]?.view_count : 0) || 0,
        download_count: node.stats?.download_count || (Array.isArray(node.stats) ? node.stats[0]?.download_count : 0) || 0
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

        // 폴더 메타 보존 (삭제/이동/DnD를 위해 id가 필요)
        // NOTE: 기존 렌더러들이 폴더 키로 인식하지 않도록 `_meta`는 예약 키로 사용
        if (node && node.type === 'DIRECTORY') {
            cleanChildren._meta = {
                id: node.id,
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
