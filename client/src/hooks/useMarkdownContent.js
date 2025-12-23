import { useState, useEffect } from 'preact/hooks';
import { fetchDocContent } from '../utils/api';
import { devLog, devWarn } from '../utils/logger';

/**
 * 마크다운 콘텐츠 로딩을 담당하는 Custom Hook
 */
export function useMarkdownContent(url) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [fileExt, setFileExt] = useState('');
    const [currentFile, setCurrentFile] = useState(null);

    useEffect(() => {
        setContent('');
        setFileExt('');
        setCurrentFile(null);
        setLoading(true);
        
        let cancelled = false;
        
        const loadContent = async () => {
            const routePath = url || '/';

            if (routePath.startsWith('/category/')) {
                if (!cancelled) setLoading(false);
                return;
            }

            try {
                const doc = await fetchDocContent(routePath);
                
                if (!cancelled) {
                    if (doc) {
                        setContent(doc.content || '');
                        setCurrentFile({
                            path: doc.path,
                            route: doc.path,
                            title: doc.name.replace(/\.md$/, ''),
                            ext: 'md' // DB에는 ext 필드가 없을 수 있으므로 고정
                        });
                        setFileExt('md');
                    } else {
                        // 404
                        setCurrentFile(null);
                    }
                }
            } catch (error) {
                devWarn(`Error loading content for ${routePath}:`, error);
                if (!cancelled) setCurrentFile(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadContent();
        
        return () => {
            cancelled = true;
        };
    }, [url]);

    return {
        content,
        loading,
        fileExt,
        currentFile,
    };
}

