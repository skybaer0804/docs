import { useMemo } from 'preact/hooks';
import { buildDirectoryTree } from '../utils/treeUtils';
import { navigationObserver } from '../observers/NavigationObserver';
import { useDocsTreeQuery } from './useDocsTreeQuery';

/**
 * DirectoryView의 로직을 담당하는 Custom Hook
 * TDD 친화적: 로직을 분리하여 테스트 용이
 */
export function useDirectoryView(currentRoute, onNavigate) {
  const { data: allNodes = [], isLoading: loading } = useDocsTreeQuery();

  const { categorized, files } = useMemo(() => {
    if (allNodes.length === 0) return { categorized: {}, files: [] };

    const tree = buildDirectoryTree(allNodes);
    const fileList = allNodes
      .filter((n) => n.type === 'FILE')
      .map((n) => ({
        path: n.path,
        route: n.path,
        title: n.name.replace(/\.md$/, ''),
        name: n.name,
        id: n.id,
      }));

    return { categorized: tree, files: fileList };
  }, [allNodes]);

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
      const pathParts = currentRoute
        .replace('/category/', '')
        .split('/')
        .filter((p) => p);
      if (pathParts.length > 0) {
        const node = getNodeByPath(categorized, pathParts);
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

        if (directoryPath.length > 0) {
          const node = getNodeByPath(categorized, directoryPath);
          if (node) {
            type = 'directory';
            data = {
              path: directoryPath.join('/'),
              pathParts: directoryPath,
              node: node,
            };
          }
        }
      }
    }

    return { displayType: type, displayData: data };
  }, [currentRoute, categorized, files, loading]);

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
