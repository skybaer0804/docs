import { useMemo } from 'preact/hooks';
import { buildDirectoryTree } from '../utils/treeUtils';
import { navigationObserver } from '../observers/NavigationObserver';
import { useDocsTreeQuery } from './useDocsTreeQuery';
import { useQuery } from '@tanstack/react-query';
import { fetchUserDocs } from '../utils/api';
import { docsKeys } from '../query/queryKeys';

/**
 * DirectoryView의 로직을 담당하는 Custom Hook
 */
export function useDirectoryView(currentRoute, onNavigate) {
  // 내 문서 트리
  const { data: allNodes = [], isLoading: loadingMyNodes } = useDocsTreeQuery();

  // URL에서 ID 추출 (/folder/:id 또는 /doc/:id)
  const isFolderRoute = currentRoute?.startsWith('/folder/');
  const isDocRoute = currentRoute?.startsWith('/doc/');
  const currentId = isFolderRoute || isDocRoute ? currentRoute.split('/').pop() : null;

  // TODO: 구독 유저 처리 로직 개선 필요 (현재는 내 문서 중심)
  const subscribedUserId = null;

  const { data: userNodes = [], isLoading: loadingUserNodes } = useQuery({
    queryKey: docsKeys.userTree(subscribedUserId),
    queryFn: () => fetchUserDocs(subscribedUserId),
    enabled: !!subscribedUserId,
    staleTime: 60 * 1000,
  });

  const loading = loadingMyNodes || (!!subscribedUserId && loadingUserNodes);
  const nodesToUse = subscribedUserId ? userNodes : allNodes;

  const categorized = useMemo(() => {
    if (!nodesToUse || nodesToUse.length === 0) return {};
    return buildDirectoryTree(nodesToUse);
  }, [nodesToUse]);

  const files = useMemo(() => {
    return nodesToUse
      .filter((n) => n.type === 'FILE')
      .map((n) => ({
        id: n.id,
        name: n.name,
        title: n.name.replace(/\.(md|template)$/i, ''),
        route: `/doc/${n.id}`,
        author_id: n.author_id,
        parent_id: n.parent_id,
        ext: n.name.includes('.') ? `.${n.name.split('.').pop()}` : '',
      }));
  }, [nodesToUse]);

  const handleFolderClick = (id) => {
    const folderRoute = `/folder/${id}`;
    if (onNavigate) onNavigate(folderRoute);
    navigationObserver.notify(folderRoute, { type: 'folder', id });
  };

  const handleFileClick = (file) => {
    if (onNavigate) onNavigate(file.route);
    navigationObserver.notify(file.route, { type: 'file', file });
  };

  // ID 기반으로 트리에서 노드 찾기 (재귀)
  function findNodeById(tree, id) {
    if (!tree) return null;

    // 현재 레벨의 _meta에서 ID 확인
    for (const key in tree) {
      if (key === '_files' || key === '_meta') continue;
      const node = tree[key];
      if (node._meta?.id === id) return node;

      const found = findNodeById(node, id);
      if (found) return found;
    }
    return null;
  }

  const { displayType, displayData } = useMemo(() => {
    if (loading) return { displayType: 'root', displayData: null };

    if (!currentRoute || currentRoute === '/') {
      return { displayType: 'root', displayData: null };
    }

    if (isFolderRoute && currentId) {
      const node = findNodeById(categorized, currentId);
      if (node) {
        return {
          displayType: 'directory',
          displayData: { id: currentId, node },
        };
      }
    }

    if (isDocRoute && currentId) {
      const file = files.find((f) => f.id === currentId);
      if (file && file.parent_id) {
        const node = findNodeById(categorized, file.parent_id);
        if (node) {
          return {
            displayType: 'directory',
            displayData: { id: file.parent_id, node },
          };
        }
      }
    }

    return { displayType: 'root', displayData: null };
  }, [currentRoute, categorized, files, loading, isFolderRoute, isDocRoute, currentId]);

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
