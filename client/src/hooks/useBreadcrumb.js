import { useMemo } from 'preact/hooks';
import { buildCategoryBreadcrumbItems, buildFileBreadcrumbItems } from '../utils/breadcrumbUtils';
import { useDocsTreeQuery } from './useDocsTreeQuery';

/**
 * Breadcrumb의 로직을 담당하는 Custom Hook
 * TDD 친화적: 로직을 분리하여 테스트 용이
 */
export function useBreadcrumb(currentRoute) {
  const { data: nodes = [] } = useDocsTreeQuery();
  
  // path로 노드를 찾는 헬퍼 함수
  const findNodeByPath = (path) => {
    return nodes.find((n) => n.path === path);
  };

  const allFiles = useMemo(() => {
    return nodes
      .filter((n) => n.type === 'FILE')
      .map((n) => {
        const parts = n.path.split('/').filter(Boolean);
        // parts: ['docs', 'Platform', 'Web', 'guide']
        let directoryPath = [];
        if (parts[0] === 'docs') {
          directoryPath = parts.slice(1, -1);
        } else {
          directoryPath = parts.slice(0, -1);
        }

        return {
          path: n.path,
          route: n.path,
          title: n.name.replace(/\.md$/, ''),
          name: n.name,
          directoryPath: directoryPath,
        };
      });
  }, [nodes]);

  return useMemo(() => {
    // 로그인 페이지는 브레드크럼 표시
    if (currentRoute === '/login') {
      const items = [{ label: '로그인', route: '/login', type: 'current' }];
      return {
        items: items,
        displayType: 'file',
      };
    }

    // 문서 작성/수정 페이지는 브레드크럼 표시
    if (currentRoute.startsWith('/write') || currentRoute.startsWith('/edit')) {
      const items = currentRoute.startsWith('/write')
        ? [{ label: '새 문서 작성', route: currentRoute, type: 'current' }]
        : [{ label: '문서 수정', route: currentRoute, type: 'current' }];
      return {
        items: items,
        displayType: 'file',
      };
    }

    // 홈일 때도 브레드크럼 표시
    if (!currentRoute || currentRoute === '/') {
      const homeItems = [{ label: 'Home', route: '/', type: 'link' }];
      return {
        items: homeItems,
        displayType: 'home',
      };
    }

    // 카테고리/서브카테고리 경로인 경우
    if (currentRoute.startsWith('/category/')) {
      // 무제한 중첩 경로 파싱
      const pathParts = currentRoute
        .replace('/category/', '')
        .split('/')
        .filter((p) => p); // 빈 문자열 제거

      const breadcrumbItems = buildCategoryBreadcrumbItems(pathParts);
      
      // 각 아이템에 nodeId 추가 (path로 노드 찾기)
      const itemsWithNodeId = breadcrumbItems.map((item) => {
        if (item.type === 'link' && item.route === '/') {
          // 루트는 null
          return { ...item, nodeId: null };
        }
        if (item.path) {
          // path를 /docs/... 형태로 변환
          const docsPath = item.path.startsWith('/docs') ? item.path : `/docs/${item.path}`;
          const node = findNodeByPath(docsPath);
          return { ...item, nodeId: node?.id || null };
        }
        return item;
      });

      return {
        items: itemsWithNodeId,
        displayType: 'category',
      };
    }

    const file = allFiles.find((f) => f.route === currentRoute);

    if (!file) {
      return {
        items: [],
        displayType: 'none',
      };
    }

    const breadcrumbItems = buildFileBreadcrumbItems(file);
    
    // 각 아이템에 nodeId 추가 (path로 노드 찾기)
    const itemsWithNodeId = breadcrumbItems.map((item) => {
      if (item.type === 'link' && item.route === '/') {
        // 루트는 null
        return { ...item, nodeId: null };
      }
      if (item.path) {
        // path를 /docs/... 형태로 변환
        const docsPath = item.path.startsWith('/docs') ? item.path : `/docs/${item.path}`;
        const node = findNodeByPath(docsPath);
        return { ...item, nodeId: node?.id || null };
      }
      return item;
    });

    return {
      items: itemsWithNodeId,
      displayType: 'file',
    };
  }, [currentRoute, allFiles, findNodeByPath]);
}
