// API 유틸리티: 백엔드 서버 통신 담당

const API_BASE = '/api/docs';
const AUTH_API_BASE = '/api/auth';
const SUB_API_BASE = '/api/subscriptions';

/**
 * 로컬 스토리지에서 토큰 가져오기
 */
export function getToken() {
  return localStorage.getItem('auth_token');
}

/**
 * 로컬 스토리지에 토큰 저장
 */
export function setToken(token) {
  localStorage.setItem('auth_token', token);
}

/**
 * 로컬 스토리지에서 토큰 제거
 */
export function removeToken() {
  localStorage.removeItem('auth_token');
}

/**
 * 회원가입 API 호출
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} { token, user }
 */
export async function register(username, email, password) {
  const response = await fetch(`${AUTH_API_BASE}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Registration failed');
  }

  const data = await response.json();

  // 토큰을 로컬 스토리지에 저장
  if (data.token) {
    setToken(data.token);
  }

  return data;
}

/**
 * 로그인 API 호출
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} { token, user }
 */
export async function login(email, password) {
  const response = await fetch(`${AUTH_API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Login failed');
  }

  const data = await response.json();

  // 토큰을 로컬 스토리지에 저장
  if (data.token) {
    setToken(data.token);
  }

  return data;
}

/**
 * 현재 사용자 정보 조회
 * @returns {Promise<Object>} { user }
 */
export async function getCurrentUser() {
  const token = getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${AUTH_API_BASE}/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // 토큰이 만료되었거나 유효하지 않음
      removeToken();
      throw new Error('Session expired');
    }
    const err = await response.json();
    throw new Error(err.error || 'Failed to get user info');
  }

  return response.json();
}

/**
 * 로그아웃 (클라이언트 측 토큰 제거)
 */
export function logout() {
  removeToken();
}

/**
 * 모든 문서 구조(Nodes)를 가져옵니다. (내 문서)
 * @returns {Promise<Array>} 노드 목록 (id, parent_id, name, type, path 등)
 */
export async function fetchAllDocs() {
  const token = getToken();
  if (!token) return [];

  const response = await fetch(API_BASE, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch docs structure');
  }
  return response.json();
}

/**
 * 특정 유저의 문서 구조를 가져옵니다. (가시성 필터링 적용)
 */
export async function fetchUserDocs(userId) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/user/${userId}`, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch user docs');
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

/**
 * 새 문서를 생성합니다. (관리자 전용)
 */
export async function createDoc(data, token = null) {
  const authToken = token || getToken();
  if (!authToken) {
    throw new Error('Authentication required');
  }

  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create document');
  }
  return response.json();
}

/**
 * 문서를 수정합니다. (관리자 전용)
 */
export async function updateDoc(id, data, token = null) {
  const authToken = token || getToken();
  if (!authToken) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to update document');
  }
  return response.json();
}

/**
 * 문서를 삭제합니다. (관리자 전용)
 */
export async function deleteDoc(id, token = null) {
  const authToken = token || getToken();
  if (!authToken) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to delete document');
  }
  return response.json();
}

/**
 * 문서/폴더를 다른 폴더로 이동합니다. (본인(author_id)만 가능)
 * @param {Object} data - { id, target_parent_id } (target_parent_id는 null이면 루트로 이동)
 */
export async function moveDoc(data, token = null) {
  const authToken = token || getToken();
  if (!authToken) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to move document');
  }
  return response.json();
}

/**
 * 사용자 프로필 업데이트
 * @param {Object} data - { document_title, personal_link }
 * @returns {Promise<Object>} { user }
 */
export async function updateProfile(data) {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${AUTH_API_BASE}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

/**
 * 팔로우 요청
 * @param {string} following_id - 팔로우할 대상 유저 ID
 */
export async function followUser(following_id) {
  const token = getToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${SUB_API_BASE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ following_id }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to follow user');
  }
  return response.json();
}

/**
 * 언팔로우 요청
 * @param {string} following_id - 언팔로우할 대상 유저 ID
 */
export async function unfollowUser(following_id) {
  const token = getToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${SUB_API_BASE}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ following_id }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to unfollow user');
  }
  return response.json();
}

/**
 * 특정 유저의 구독 통계 조회
 */
export async function fetchSubscriptionStats(userId) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${SUB_API_BASE}/${userId}/stats`, { headers });
  if (!response.ok) throw new Error('Failed to fetch subscription stats');
  return response.json();
}

/**
 * 특정 유저의 팔로워/팔로잉 리스트 조회
 * @param {string} userId
 * @param {'followers'|'following'} type
 */
export async function fetchSubscriptionList(userId, type) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${SUB_API_BASE}/${userId}/list?type=${type}`, { headers });
  if (!response.ok) throw new Error('Failed to fetch subscription list');
  return response.json();
}

/**
 * 내가 구독한 유저들의 노드 조회
 */
export async function fetchFollowingNodes() {
  const token = getToken();
  if (!token) return [];

  const response = await fetch(`${SUB_API_BASE}/following-nodes`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch following nodes');
  return response.json();
}

/**
 * 사용자 검색
 * @param {string} query
 */
export async function searchUsers(query) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${AUTH_API_BASE}/search?q=${encodeURIComponent(query)}`, { headers });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to search users');
  }
  return response.json();
}
