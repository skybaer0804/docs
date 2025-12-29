import { useMemo } from 'preact/hooks';
import { buildDirectoryTree } from '../utils/treeUtils';
import { navigationObserver } from '../observers/NavigationObserver';
import { useDocsTreeQuery } from './useDocsTreeQuery';
import { useQuery } from '@tanstack/react-query';
import { fetchUserDocs } from '../utils/api';
import { docsKeys } from '../query/queryKeys';

/**
 * DirectoryView의 로직을 담당하는 Custom Hook
 * TDD 친화적: 로직을 분리하여 테스트 용이
 */
export function useDirectoryView(currentRoute, onNavigate) {
  // 내 문서 트리
  const { data: allNodes = [], isLoading: loadingMyNodes } = useDocsTreeQuery();

  // 현재 경로가 구독 페이지인지 확인
  const isSubscribedRoute = currentRoute?.startsWith('/category/sub_') || currentRoute?.startsWith('/docs/sub_');
  const subscribedUserId = isSubscribedRoute
    ? currentRoute.startsWith('/category/sub_')
      ? currentRoute.replace('/category/sub_', '').split('/')[0]
      : currentRoute.replace('/docs/sub_', '').split('/')[0]
    : null;

  // 구독 문서 트리 (필요한 경우에만 쿼리 활성화)
  const { data: userNodes = [], isLoading: loadingUserNodes } = useQuery({
    queryKey: docsKeys.userTree(subscribedUserId),
    queryFn: () => fetchUserDocs(subscribedUserId),
    enabled: !!subscribedUserId,
    staleTime: 60 * 1000,
  });

  const loading = loadingMyNodes || (!!subscribedUserId && loadingUserNodes);

  // 현재 컨텍스트에 맞는 노드 목록 결정
  const nodesToUse = isSubscribedRoute ? userNodes : allNodes;

  const { categorized, files } = useMemo(() => {
    if (!nodesToUse || nodesToUse.length === 0) {
      return { categorized: {}, files: [] };
    }

    const tree = buildDirectoryTree(nodesToUse);
    const fileList = nodesToUse
      .filter((n) => n.type === 'FILE')
      .map((n) => ({
        path: n.path,
        route: n.path,
        title: n.name.replace(/\.(md|template)$/i, ''),
        name: n.name,
        ext: n.name.includes('.') ? `.${n.name.split('.').pop()}` : '',
        id: n.id,
        author_id: n.author_id,
      }));

    return { categorized: tree, files: fileList };
  }, [nodesToUse]);

  const handleFolderClick = (path) => {
    // 폴더 뷰를 보여주기 위해 특별한 경로로 이동
    const folderRoute = `/category/${path}`;
    if (onNavigate) {
      onNavigate(folderRoute);
    }
    // Observer 패턴: 네비게이션 이벤트 알림
    navigationObserver.notify(folderRoute, { type: 'folder' });
  };

  const handleFileClick = (file) => {
    if (onNavigate) {
      onNavigate(file.route);
    }
    // Observer 패턴: 네비게이션 이벤트 알림
    navigationObserver.notify(file.route, { type: 'file', file });
  };

  // 트리에서 경로에 해당하는 노드 찾기
  function getNodeByPath(tree, pathParts) {
    let current = tree;
    for (const part of pathParts) {
      if (current && current[part]) {
        current = current[part];
      } else {
        return null;
      }
    }
    return current;
  }

  // 현재 경로에 따라 표시할 내용 결정
  const { displayType, displayData } = useMemo(() => {
    if (loading) return { displayType: 'root', displayData: null };

    let type = 'root';
    let data = null;

    if (!currentRoute || currentRoute === '/') {
      // 루트: 모든 카테고리 표시
      type = 'root';
    } else if (currentRoute.startsWith('/category/')) {
      // 무제한 중첩 경로 파싱
      let pathParts = currentRoute
        .replace('/category/', '')
        .split('/')
        .filter((p) => p);

      // 구독 페이지인 경우 첫 번째 파트(sub_USERID)는 트리 탐색에서 제외
      const searchParts = isSubscribedRoute ? pathParts.slice(1) : pathParts;

      if (isSubscribedRoute && searchParts.length === 0) {
        // 구독 페이지의 루트인 경우
        type = 'directory';
        data = {
          path: pathParts[0],
          pathParts: pathParts,
          node: categorized, // buildDirectoryTree가 이미 최상위 노드들을 반환함
        };
      } else {
        const node = getNodeByPath(categorized, searchParts);
        if (node) {
          type = 'directory';
          data = {
            path: pathParts.join('/'),
            pathParts: pathParts,
            node: node,
          };
        }
      }
    } else {
      // 파일 경로인 경우 해당 파일의 디렉토리 표시
      const currentFile = files.find((f) => f.route === currentRoute);
      if (currentFile) {
        // 경로에서 디렉토리 부분 추출
        const parts = currentFile.path.split('/').filter(Boolean);
        let directoryPath = [];
        if (parts[0] === 'docs') {
          directoryPath = parts.slice(1, -1);
        } else {
          directoryPath = parts.slice(0, -1);
        }

        // 구독 파일인 경우 sub_USERID를 포함한 전체 경로로 탐색 파트 구성
        const searchParts = isSubscribedRoute ? directoryPath.slice(1) : directoryPath;

        if (isSubscribedRoute && searchParts.length === 0) {
          type = 'directory';
          data = {
            path: directoryPath[0],
            pathParts: directoryPath,
            node: categorized,
          };
        } else if (searchParts.length > 0) {
          const node = getNodeByPath(categorized, searchParts);
          if (node) {
            type = 'directory';
            data = {
              path: directoryPath.join('/'),
              pathParts: directoryPath,
              node: node,
            };
          }
        } else {
          // 루트 레벨 파일인 경우
          type = 'root';
        }
      }
    }

    return { displayType: type, displayData: data };
  }, [currentRoute, categorized, files, loading, isSubscribedRoute]);

  return {
    categorized,
    files,
    displayType,
    displayData,
    handleFolderClick,
    handleFileClick,
    loading,
  };
}
