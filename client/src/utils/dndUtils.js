export function normalizePath(path) {
  if (typeof path !== 'string') return '';
  return path.replace(/\/{2,}/g, '/');
}

export function isDocsPath(path) {
  return typeof path === 'string' && path.startsWith('/docs');
}

// currentRoute(=앱 라우트)를 /docs 기반 경로로 변환
// - /category/a/b -> /docs/a/b
// - /docs/a/b -> /docs/a/b
// - / -> /docs
export function routeToDocsPath(route) {
  if (typeof route !== 'string' || route.length === 0) return '';
  if (route === '/') return '/docs';
  if (route.startsWith('/docs')) return normalizePath(route);
  if (route.startsWith('/category/')) return normalizePath(route.replace('/category/', '/docs/'));
  return '';
}

export function docsPathToCategoryRoute(docsPath) {
  if (!isDocsPath(docsPath)) return '';
  if (docsPath === '/docs') return '/';
  return normalizePath(docsPath.replace('/docs/', '/category/'));
}

export function getParentDocsPath(docsPath) {
  const clean = normalizePath(docsPath);
  if (!isDocsPath(clean)) return '';
  if (clean === '/docs') return '/docs';

  const parts = clean.split('/').filter(Boolean); // ['docs', ...]
  if (parts.length <= 1) return '/docs';
  parts.pop();
  if (parts.length <= 1) return '/docs';
  return `/${parts.join('/')}`;
}

export function isInvalidDrop({ dragPath, dragType, targetParentPath }) {
  const from = normalizePath(dragPath);
  const to = normalizePath(targetParentPath);

  if (!isDocsPath(from) || !isDocsPath(to)) return true;
  if (from === '/docs') return true;
  if (!dragType) return true;

  // 폴더는 자기 자신/하위로 이동 불가
  if (dragType === 'DIRECTORY') {
    if (to === from) return true;
    if (to.startsWith(`${from}/`)) return true;
  }

  return false;
}

// 현재 라우트가 이동 대상(oldDocsPath)에 포함되는 경우 새 라우트로 매핑
export function mapRouteAfterMove({ currentRoute, oldDocsPath, newDocsPath }) {
  const currentDocs = routeToDocsPath(currentRoute);
  if (!currentDocs) return null;

  const oldP = normalizePath(oldDocsPath);
  const newP = normalizePath(newDocsPath);
  if (!oldP || !newP) return null;

  if (currentDocs === oldP) {
    // 파일/폴더 경로가 정확히 일치
    if (currentRoute.startsWith('/category/')) return docsPathToCategoryRoute(newP);
    return newP;
  }

  if (currentDocs.startsWith(`${oldP}/`)) {
    const suffix = currentDocs.slice(oldP.length);
    const nextDocs = normalizePath(`${newP}${suffix}`);
    if (currentRoute.startsWith('/category/')) return docsPathToCategoryRoute(nextDocs);
    return nextDocs;
  }

  return null;
}


