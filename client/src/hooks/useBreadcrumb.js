import { useMemo } from 'preact/hooks';
import { useDocsTreeQuery } from './useDocsTreeQuery';
import { useQuery } from '@tanstack/react-query';
import { subKeys, docsKeys } from '../query/queryKeys';
import { fetchSubscriptionList, fetchUserDocs, fetchDocById } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useDocContentQuery } from './useDocContentQuery';

/**
 * Breadcrumb의 로직을 담당하는 Custom Hook
 */
export function useBreadcrumb(currentRoute) {
  const { user: currentUser } = useAuth();
  const { data: myNodes = [] } = useDocsTreeQuery();

  const isDoc = currentRoute?.startsWith('/doc/');
  const isFolder = currentRoute?.startsWith('/folder/');
  const urlPath = currentRoute?.split('?')[0];
  const currentId = (isDoc || isFolder) ? urlPath.split('/').pop() : null;

  // 현재 노드 정보 가져오기 (author_id 확인용)
  const { data: currentNodeInfo } = useDocContentQuery(currentId, {
    enabled: !!currentId
  });

  const authorId = currentNodeInfo?.author_id;
  const isOthersNode = authorId && authorId !== currentUser?.id;

  // 다른 사용자의 노드 트리 가져오기
  const { data: userNodes = [] } = useQuery({
    queryKey: docsKeys.userTree(authorId),
    queryFn: () => fetchUserDocs(authorId),
    enabled: !!isOthersNode,
    staleTime: 60 * 1000,
  });

  const nodes = isOthersNode ? userNodes : myNodes;

  const { data: followingUsers = [] } = useQuery({
    queryKey: subKeys.list(currentUser?.id, 'following'),
    queryFn: () => fetchSubscriptionList(currentUser.id, 'following'),
    enabled: !!currentUser?.id,
    staleTime: 30 * 1000,
  });

  return useMemo(() => {
    if (!currentRoute || currentRoute === '/') {
      return {
        items: [{ label: 'Home', route: '/', type: 'link', nodeId: null }],
        displayType: 'home'
      };
    }

    if (currentRoute === '/profile') {
      return {
        items: [{ label: '프로필', route: '/profile', type: 'current' }],
        displayType: 'file'
      };
    }

    if (currentRoute === '/settings/subscriptions') {
      return {
        items: [{ label: '구독 관리', route: '/settings/subscriptions', type: 'current' }],
        displayType: 'file'
      };
    }

    if (currentRoute === '/settings/study-timer') {
      return {
        items: [{ label: '공부 시간', route: '/settings/study-timer', type: 'current' }],
        displayType: 'file'
      };
    }

    if (currentRoute === '/login') {
      return {
        items: [{ label: '로그인', route: '/login', type: 'current' }],
        displayType: 'file'
      };
    }

    if (currentRoute.startsWith('/write') || currentRoute.startsWith('/edit')) {
      return {
        items: [{
          label: currentRoute.startsWith('/write') ? '새 문서 작성' : '문서 수정',
          route: currentRoute,
          type: 'current'
        }],
        displayType: 'file'
      };
    }

    const id = (isDoc || isFolder) ? currentRoute.split('/').pop() : null;

    if (!id || !nodes || nodes.length === 0) {
      return { items: [{ label: 'Home', route: '/', type: 'link', nodeId: null }], displayType: 'home' };
    }

    const items = [];
    let currentNode = nodes.find(n => n.id === id);

    if (!currentNode) {
      // 노드를 찾지 못한 경우 (로딩 중이거나 권한 없음)
      if (currentNodeInfo && currentNodeInfo.id === id) {
        currentNode = currentNodeInfo;
      } else {
        return { items: [{ label: 'Home', route: '/', type: 'link', nodeId: null }], displayType: 'home' };
      }
    }

    const lastUpdatedAt = currentNode.updated_at;

    let tempNode = currentNode;
    while (tempNode) {
      const isCurrent = tempNode.id === id;
      items.unshift({
        label: tempNode.name.replace(/\.(md|template)$/i, ''),
        route: tempNode.type === 'DIRECTORY' ? `/folder/${tempNode.id}` : `/doc/${tempNode.id}`,
        type: isCurrent ? 'current' : 'link',
        nodeId: tempNode.id,
        updated_at: isCurrent ? lastUpdatedAt : null
      });

      if (tempNode.parent_id) {
        tempNode = nodes.find(n => n.id === tempNode.parent_id);
      } else {
        tempNode = null;
      }
    }

    items.unshift({ label: 'Home', route: '/', type: 'link', nodeId: null });

    return {
      items,
      displayType: isDoc ? 'file' : 'category',
    };
  }, [currentRoute, nodes, followingUsers, currentNodeInfo, isDoc, isFolder]);
}
