import { useState, useEffect, useMemo, useCallback, useRef } from 'preact/hooks';
import { buildDirectoryTree } from '../utils/treeUtils';
import { navigationObserver } from '../observers/NavigationObserver';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { docsKeys, subKeys } from '../query/queryKeys';
import { useDocsTreeQuery } from './useDocsTreeQuery';
import { fetchSubscriptionList, fetchUserDocs } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * DirectoryTree의 로직을 담당하는 Custom Hook
 */
export function useDirectoryTree(currentPath, onNavigate) {
  const [expandedPaths, setExpandedPaths] = useState({});
  const [followingTrees, setFollowingTrees] = useState({});
  const [loadingTrees, setLoadingTrees] = useState({});
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const lastPathRef = useRef('');

  useEffect(() => {
    setFollowingTrees({});
    setLoadingTrees({});
  }, [user?.id]);

  const { data: nodes = [], isLoading: loading } = useDocsTreeQuery();
  const categorized = useMemo(() => buildDirectoryTree(nodes), [nodes]);

  const { data: followingUsers = [] } = useQuery({
    queryKey: subKeys.list(user?.id, 'following'),
    queryFn: () => fetchSubscriptionList(user.id, 'following'),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  const loadUserTree = useCallback(
    async (targetUserId) => {
      if (followingTrees[targetUserId] || loadingTrees[targetUserId]) return;
      setLoadingTrees((prev) => ({ ...prev, [targetUserId]: true }));
      try {
        const userNodes = await fetchUserDocs(targetUserId);
        const tree = buildDirectoryTree(userNodes);
        setFollowingTrees((prev) => ({ ...prev, [targetUserId]: tree }));
      } catch (err) {
        console.error('Failed to load user tree:', err);
      } finally {
        setLoadingTrees((prev) => ({ ...prev, [targetUserId]: false }));
      }
    },
    [followingTrees, loadingTrees],
  );

  useEffect(() => {
    let debounceTimer = null;
    const handleDocumentChange = ({ action, type }) => {
      if ((type === 'file' || type === 'directory') && (action === 'create' || action === 'update' || action === 'delete')) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: docsKeys.tree() });
        }, 300);
      }
    };
    const unsubscribe = navigationObserver.subscribe(handleDocumentChange);
    return () => {
      unsubscribe();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [queryClient]);

  // 현재 경로 변경 시 트리 자동 확장 (ID 기반)
  useEffect(() => {
    if (!currentPath || currentPath === lastPathRef.current || nodes.length === 0) return;
    lastPathRef.current = currentPath;

    const isDoc = currentPath.startsWith('/doc/');
    const isFolder = currentPath.startsWith('/folder/');
    const id = (isDoc || isFolder) ? currentPath.split('/').pop() : null;

    if (!id) return;

    const newExpanded = { ...expandedPaths };
    let currentNode = nodes.find(n => n.id === id);
    
    while (currentNode && currentNode.parent_id) {
      newExpanded[currentNode.parent_id] = true;
      currentNode = nodes.find(n => n.id === currentNode.parent_id);
    }

    setExpandedPaths(newExpanded);
  }, [currentPath, nodes]);

  const handleFolderClick = (id) => {
    setExpandedPaths((prev) => ({ ...prev, [id]: !prev[id] }));
    const folderRoute = `/folder/${id}`;
    if (onNavigate) onNavigate(folderRoute);
    navigationObserver.notify(folderRoute, { type: 'folder', id });
  };

  const handleClick = (file) => {
    if (onNavigate) onNavigate(file.route);
    navigationObserver.notify(file.route, { type: 'file', file });
  };

  const handleUserClick = (targetUserId) => {
    const key = `sub_${targetUserId}`;
    const isExpanding = !expandedPaths[key];
    setExpandedPaths((prev) => ({ ...prev, [key]: !prev[key] }));
    if (isExpanding) loadUserTree(targetUserId);
  };

  return {
    categorized,
    followingUsers,
    followingTrees,
    loadingTrees,
    expandedPaths,
    handleFolderClick,
    handleUserClick,
    handleClick,
    loading,
  };
}
