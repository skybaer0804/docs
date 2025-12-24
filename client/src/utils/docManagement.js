import { createDoc } from './api';
import { navigationObserver } from '../observers/NavigationObserver';

/**
 * 문서 생성 유틸리티 함수
 * @param {Object} params
 * @param {string} params.name - 문서명 (확장자 제외)
 * @param {string} params.parentPath - 부모 경로
 * @param {string} params.content - 문서 내용
 * @param {boolean} params.isPublic - 공개 여부
 * @returns {Promise<Object>} 생성된 문서 객체
 */
export async function createDocument({ name, parentPath, content = '# 제목\n\n내용을 입력하세요.', isPublic = true }) {
  const docName = name.endsWith('.md') ? name : `${name}.md`;
  const result = await createDoc({
    type: 'FILE',
    parent_path: parentPath,
    name: docName,
    content,
    is_public: isPublic,
  });

  const newPath = `${parentPath}/${docName}`.replace('//', '/');

  // 트리 업데이트를 위한 이벤트 발생
  navigationObserver.notify(newPath, { type: 'file', action: 'create', file: result });

  return { ...result, path: newPath };
}

/**
 * 폴더 생성 유틸리티 함수
 * @param {Object} params
 * @param {string} params.name - 폴더명
 * @param {string} params.parentPath - 부모 경로
 * @param {boolean} params.isPublic - 공개 여부
 * @returns {Promise<Object>} 생성된 폴더 객체
 * @note author_id는 서버 측에서 req.user.id로 자동 설정됩니다 (Authorization 헤더의 토큰에서 추출)
 */
export async function createFolder({ name, parentPath, isPublic = true }) {
  // createDoc API는 Authorization 헤더에 토큰을 포함하며,
  // 서버 측 authMiddleware가 토큰을 검증하여 req.user.id를 author_id로 사용합니다.
  const result = await createDoc({
    type: 'DIRECTORY',
    parent_path: parentPath,
    name,
    content: null,
    is_public: isPublic,
    // author_id는 서버 측에서 자동으로 req.user.id에서 가져옵니다
  });

  const newPath = `${parentPath}/${name}`.replace('//', '/');

  // 트리 업데이트를 위한 이벤트 발생
  navigationObserver.notify(newPath, { type: 'directory', action: 'create', folder: result });

  return { ...result, path: newPath };
}

/**
 * 현재 경로를 기반으로 부모 경로 계산
 * @param {string} currentPath - 현재 경로
 * @returns {string} 부모 경로
 */
export function getParentPathFromCurrentPath(currentPath) {
  if (currentPath.startsWith('/category/')) {
    return currentPath.replace('/category/', '/docs/');
  }
  if (currentPath === '/') {
    return '/docs';
  }
  // 파일 경로인 경우 부모 디렉토리 추출
  const parts = currentPath.split('/').filter(Boolean);
  if (parts.length > 1) {
    parts.pop(); // 파일명 제거
    return '/' + parts.join('/');
  }
  return currentPath;
}
