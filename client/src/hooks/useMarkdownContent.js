import { useMemo } from 'preact/hooks';
import { useDocContentQuery } from './useDocContentQuery';

/**
 * 마크다운 콘텐츠 로딩을 담당하는 Custom Hook
 */
export function useMarkdownContent(url) {
    const routePath = url || '/';
    const isCategoryRoute = routePath.startsWith('/category/');
    const isRootRoute = routePath === '/';
    const isDocRoute = routePath.startsWith('/docs/');

    const shouldFetch = !isCategoryRoute && !isRootRoute && isDocRoute;
    const { data: doc, isLoading } = useDocContentQuery(routePath, { enabled: shouldFetch });

    const { content, fileExt, currentFile } = useMemo(() => {
        if (!shouldFetch) {
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
                path: doc.path,
                route: doc.path,
                title: name.replace(/\.md$/, '').replace(/\.template$/, ''),
                ext,
            },
        };
    }, [doc, shouldFetch]);

    return {
        content,
        loading: shouldFetch ? isLoading : false,
        fileExt,
        currentFile,
    };
}

