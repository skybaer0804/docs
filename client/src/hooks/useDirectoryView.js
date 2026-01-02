import { useMemo, useState, useEffect } from 'preact/hooks';
import { buildDirectoryTree, transformFileNode } from '../utils/treeUtils';
import { navigationObserver } from '../observers/NavigationObserver';
import { useDocsTreeQuery } from './useDocsTreeQuery';
import { useQuery } from '@tanstack/react-query';
import { fetchUserDocs } from '../utils/api';
import { docsKeys } from '../query/queryKeys';
import { useAuth } from '../contexts/AuthContext';

/**
 * DirectoryView의 로직을 담당하는 Custom Hook
 */
export function useDirectoryView(currentRoute, onNavigate, authorId) {
  const { user: currentUser } = useAuth();

  // 구독 유저 처리
  const subscribedUserId = authorId && currentUser?.id !== authorId ? authorId : null;

  // 1. 데이터 가져오기
  const { data: allNodes = [], isLoading: loadingMyNodes } = useDocsTreeQuery();

  const { data: userNodes = [], isLoading: loadingUserNodes } = useQuery({
    queryKey: docsKeys.userTree(subscribedUserId),
    queryFn: () => fetchUserDocs(subscribedUserId),
    enabled: !!subscribedUserId,
    staleTime: 60 * 1000,
  });

  // URL에서 ID 추출
  const urlInfo = useMemo(() => {
    if (!currentRoute || currentRoute === '/') return { id: null, type: 'root' };
    const isFolder = currentRoute.startsWith('/folder/');
    const isDoc = currentRoute.startsWith('/doc/');
    const id = (isFolder || isDoc) ? currentRoute.split('/').pop() : null;
    return { id, type: isFolder ? 'folder' : (isDoc ? 'doc' : 'other') };
  }, [currentRoute]);

  // nodesToUse 결정 로직 개선
  const nodesToUse = useMemo(() => {
    // 명시적으로 구독 유저 ID가 있는 경우
    if (subscribedUserId) return userNodes;

    // authorId가 없지만 현재 경로가 특정 문서/폴더인 경우
    if (urlInfo.id && allNodes.length > 0) {
      const existsInMine = allNodes.some(n => n.id === urlInfo.id);
      // 내 문서에 없고, 아직 authorId를 모르는 상태라면 데이터를 기다림
      if (!existsInMine && !authorId) return [];
    }

    return allNodes;
  }, [subscribedUserId, userNodes, allNodes, urlInfo.id, authorId]);

  const loading = loadingMyNodes || (!!subscribedUserId && loadingUserNodes) || (!!urlInfo.id && nodesToUse.length === 0 && !allNodes.some(n => n.id === urlInfo.id));

  const [activeId, setActiveId] = useState(null);

  // URL 변경 시 activeId 동기화
  useEffect(() => {
    if (!currentRoute || currentRoute === '/') {
      setActiveId(null);
      return;
    }

    const isFolder = currentRoute.startsWith('/folder/');
    const isDoc = currentRoute.startsWith('/doc/');
    const idFromUrl = (isFolder || isDoc) ? currentRoute.split('/').pop() : null;

    if (isFolder) {
      setActiveId(idFromUrl);
    } else if (isDoc && idFromUrl) {
      // 파일인 경우 parent_id를 찾아야 함
      const doc = nodesToUse.find(n => n.id === idFromUrl);
      if (doc) {
        setActiveId(doc.parent_id || null);
      }
    } else {
      setActiveId(null);
    }
  }, [currentRoute, nodesToUse]);

  // Observer 구독 (URL 변경 없이도 뷰를 업데이트하기 위함)
  useEffect(() => {
    const unsubscribe = navigationObserver.subscribe((event) => {
      // 명시적으로 folder나 file 이벤트가 올 경우 activeId 업데이트
      if (event.type === 'folder' && event.id) {
        setActiveId(event.id);
      } else if (event.type === 'file' && event.file) {
        setActiveId(event.file.parent_id || null);
      } else if (event.path === '/') {
        setActiveId(null);
      }
    });
    return unsubscribe;
  }, []);

  // 3. 현재 보여줄 데이터 구성 (parent_id 기반 필터링)
  const { displayType, displayData, categorized } = useMemo(() => {
    if (loading || !nodesToUse.length) {
      return { displayType: 'root', displayData: null, categorized: {} };
    }

    // docs 루트 노드 찾기 (전체 트리 구성을 위함)
    const docsRoot = nodesToUse.find(n => n.name === 'docs' && !n.parent_id);
    const docsRootId = docsRoot?.id;

    // 만약 activeId가 null이라면 루트 레벨을 보여줌
    // 루트 레벨 조건: parent_id가 null이거나 docsRootId인 경우 (docs 폴더 자체는 제외)
    if (!activeId || activeId === docsRootId) {
      const rootItems = nodesToUse.filter(n =>
        (n.parent_id === null || n.parent_id === docsRootId) && n.id !== docsRootId
      );

      const rootCategorized = {
        _files: rootItems.filter(n => n.type === 'FILE').map(transformFileNode),
      };

      rootItems.filter(n => n.type === 'DIRECTORY').forEach(n => {
        rootCategorized[n.name] = {
          _meta: { id: n.id, name: n.name, type: n.type, author_id: n.author_id },
          _files: [], // 하위는 여기서 알 필요 없음
        };
      });

      return {
        displayType: 'root',
        displayData: null,
        categorized: rootCategorized
      };
    }

    // 특정 폴더(activeId)의 하위 아이템 찾기
    const children = nodesToUse.filter(n => n.parent_id === activeId);

    // Presenter가 기대하는 node 구조 생성
    const activeNode = {
      _meta: nodesToUse.find(n => n.id === activeId),
      _files: children.filter(n => n.type === 'FILE').map(transformFileNode),
    };

    children.filter(n => n.type === 'DIRECTORY').forEach(n => {
      activeNode[n.name] = {
        _meta: { id: n.id, name: n.name, type: n.type, author_id: n.author_id },
        _files: [],
      };
    });

    return {
      displayType: 'directory',
      displayData: { id: activeId, node: activeNode },
      categorized: {} // directory 모드에선 사용 안 함
    };
  }, [nodesToUse, loading, activeId]);

  const handleFolderClick = (id) => {
    const folderRoute = `/folder/${id}`;
    setActiveId(id); // 즉시 상태 업데이트
    if (onNavigate) onNavigate(folderRoute);
    navigationObserver.notify(folderRoute, { type: 'folder', id });
  };

  const handleFileClick = (file) => {
    if (onNavigate) onNavigate(file.route);
    navigationObserver.notify(file.route, { type: 'file', file });
  };

  return {
    categorized,
    displayType,
    displayData,
    handleFolderClick,
    handleFileClick,
    loading,
    activeId,
  };
}
