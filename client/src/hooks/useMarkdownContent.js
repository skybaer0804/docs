import { useMemo } from 'preact/hooks';
import { useDocContentQuery } from './useDocContentQuery';

/**
 * 마크다운 콘텐츠 로딩을 담당하는 Custom Hook
 */
export function useMarkdownContent(url) {
  const routePath = url || '/';
  
  // URL에서 ID 추출 (/doc/:id 또는 /folder/:id)
  const isDocRoute = routePath.startsWith('/doc/');
  const isFolderRoute = routePath.startsWith('/folder/');
  const urlPath = routePath.split('?')[0];
  const id = (isDocRoute || isFolderRoute) ? urlPath.split('/').pop() : null;

  const isRootRoute = routePath === '/';

  const shouldFetch = !!id;
  const { data: doc, isLoading } = useDocContentQuery(id || routePath, { enabled: shouldFetch });

  const { content, fileExt, currentFile } = useMemo(() => {
    if (!shouldFetch && !isRootRoute) {
      return { content: '', fileExt: '', currentFile: null };
    }

    if (isRootRoute) {
       return { content: '', fileExt: '', currentFile: null };
    }

    if (!doc) {
      // 404 or not loaded yet
      return { content: '', fileExt: '', currentFile: null };
    }

    const name = doc.name || '';
    const ext = name.includes('.') ? `.${name.split('.').pop()}` : '.md';

    return {
      content: doc.content || '',
      fileExt: ext,
      currentFile: {
        id: doc.id,
        route: `/doc/${doc.id}`,
        title: name.replace(/\.md$/, '').replace(/\.template$/, ''),
        ext,
        author_id: doc.author_id,
        parent_id: doc.parent_id,
        updated_at: doc.updated_at,
      },
    };
  }, [doc, shouldFetch, isRootRoute]);

  return {
    content,
    loading: shouldFetch ? isLoading : false,
    fileExt,
    currentFile,
  };
}
