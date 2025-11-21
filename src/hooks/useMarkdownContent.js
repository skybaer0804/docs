import { useState, useEffect } from 'preact/hooks';
import { getMarkdownContent, getMarkdownFiles } from '../utils/markdownLoader';
import { devLog, devWarn } from '../utils/logger';

/**
 * 마크다운 콘텐츠 로딩을 담당하는 Custom Hook
 * TDD 친화적: 순수 함수로 로직 분리하여 테스트 용이
 */
export function useMarkdownContent(url) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [fileExt, setFileExt] = useState('');
    const [currentFile, setCurrentFile] = useState(null);

    useEffect(() => {
        // URL 변경 시 즉시 이전 콘텐츠 초기화 (새로고침 시 깨짐 방지)
        setContent('');
        setFileExt('');
        setCurrentFile(null);
        setLoading(true);
        
        let cancelled = false; // 요청 취소 플래그
        
        const loadContent = async () => {
            const routePath = url || '/';

            // 카테고리/서브카테고리 경로인 경우 파일을 로드하지 않음
            if (routePath.startsWith('/category/')) {
                if (!cancelled) {
                    setContent('');
                    setCurrentFile(null);
                    setLoading(false);
                }
                return;
            }

            const { files } = getMarkdownFiles();
            // route로 파일 찾기 (확장자 포함)
            let file = files.find((f) => f.route === routePath);

            // 찾지 못한 경우 확장자 없는 경로로도 시도 (하위 호환성)
            if (!file) {
                const routePathWithExt = routePath + '.md';
                file = files.find((f) => f.route === routePathWithExt);
            }
            if (!file) {
                const routePathWithTemplate = routePath + '.template';
                file = files.find((f) => f.route === routePathWithTemplate);
            }

            if (routePath.toLowerCase().includes('readme')) {
                devLog(`[DEBUG] useMarkdownContent - routePath: ${routePath}`);
                devLog(`[DEBUG] useMarkdownContent - 파일 찾기 결과:`, file ? file.path : '없음');
                if (file) {
                    devLog(`[DEBUG] useMarkdownContent - 파일 정보:`, {
                        path: file.path,
                        route: file.route,
                        title: file.title,
                        ext: file.ext,
                    });
                }
            }

            if (file) {
                if (!cancelled) {
                    setCurrentFile(file);
                    setFileExt(file.ext || '');
                }
                const mdContent = await getMarkdownContent(file.path);
                if (!cancelled) {
                    if (mdContent) {
                        if (file.path.toLowerCase().includes('readme')) {
                            devLog(`[DEBUG] useMarkdownContent - 콘텐츠 로드 성공, 길이: ${mdContent.length}`);
                            devLog(`[DEBUG] useMarkdownContent - 콘텐츠 첫 50자:`, mdContent.substring(0, 50));
                        }
                        setContent(mdContent);
                    } else {
                        if (file.path.toLowerCase().includes('readme')) {
                            devWarn(`[DEBUG] useMarkdownContent - 콘텐츠 로드 실패: ${file.path}`);
                        }
                    }
                }
            } else {
                if (!cancelled) {
                    setCurrentFile(null);
                }
            }
            if (!cancelled) {
                setLoading(false);
            }
        };

        loadContent();
        
        // cleanup 함수: URL 변경 시 이전 요청 취소 및 상태 초기화
        return () => {
            cancelled = true;
            setContent('');
            setFileExt('');
            setCurrentFile(null);
        };
    }, [url]);

    return {
        content,
        loading,
        fileExt,
        currentFile,
    };
}
