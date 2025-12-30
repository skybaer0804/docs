import { useMemo } from 'preact/hooks';
import { useDocsTreeQuery } from './useDocsTreeQuery';
import { useQuery } from '@tanstack/react-query';
import { subKeys } from '../query/queryKeys';
import { fetchSubscriptionList } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Breadcrumb의 로직을 담당하는 Custom Hook
 */
export function useBreadcrumb(currentRoute) {
  const { user: currentUser } = useAuth();
  const { data: nodes = [] } = useDocsTreeQuery();

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

    const isDoc = currentRoute.startsWith('/doc/');
    const isFolder = currentRoute.startsWith('/folder/');
    const id = (isDoc || isFolder) ? currentRoute.split('/').pop() : null;

    if (!id || nodes.length === 0) {
      return { items: [{ label: 'Home', route: '/', type: 'link', nodeId: null }], displayType: 'home' };
    }

    const items = [];
    let currentNode = nodes.find(n => n.id === id);
    
    if (!currentNode) {
      return { items: [{ label: 'Home', route: '/', type: 'link', nodeId: null }], displayType: 'home' };
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
  }, [currentRoute, nodes, followingUsers]);
}
