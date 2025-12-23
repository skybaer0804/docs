// API 유틸리티: 백엔드 서버 통신 담당

const API_BASE = '/api/docs';

/**
 * 모든 문서 구조(Nodes)를 가져옵니다.
 * @returns {Promise<Array>} 노드 목록 (id, parent_id, name, type, path 등)
 */
export async function fetchAllDocs() {
    const response = await fetch(API_BASE);
    if (!response.ok) {
        throw new Error('Failed to fetch docs structure');
    }
    return response.json();
}

/**
 * 특정 경로의 문서 내용을 가져옵니다.
 * @param {string} path - 문서 경로 (예: /docs/guide)
 * @returns {Promise<Object>} 문서 객체 (content 포함)
 */
export async function fetchDocContent(path) {
    // path가 /로 시작하지 않으면 붙여줌
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');

    // API 라우팅상 /api/docs/some/path 로 요청해야 함
    // 주의: API_BASE가 /api/docs 이므로, /api/docs/docs/guide 처럼 중복될 수 있음.
    // 백엔드 라우터가 /api/docs/* 로 되어 있고, DB path가 /docs/... 로 저장되어 있다면
    // 요청 URL은 /api/docs/docs/guide 가 맞음.

    // 하지만 현재 백엔드 로직:
    // router.get('/*', docsController.getDocByPath);
    // getDocByPath: req.params[0] (와일드카드 전체)를 사용.
    // 만약 DB에 path가 "/docs/guide"로 저장되어 있다면,
    // 클라이언트는 GET /api/docs/docs/guide 라고 호출해야 req.params[0]이 "docs/guide"가 됨.

    // DB 저장 시 path 규칙을 어떻게 했느냐에 따라 다름.
    // 로컬 파일 시스템 마이그레이션 시, 기존 URL이 "/docs/..." 였으므로 DB path도 "/docs/..." 일 것임.

    // 따라서 요청은 /api/docs/docs/... 형태가 되어야 함.
    // 하지만 path 파라미터가 이미 "/docs/..."를 포함하고 있다면:
    const url = `${API_BASE}${cleanPath}`;

    const response = await fetch(url);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch document content');
    }
    return response.json();
}
