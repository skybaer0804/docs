import { useEffect, useState } from 'preact/hooks';
import { getMarkdownContent, getMarkdownFiles } from '../utils/markdownLoader';
import { MarkdownViewer } from '../components/MarkdownViewer';
import { TemplateViewer } from '../components/TemplateViewer';
import { DirectoryView } from '../components/DirectoryView';
import { route } from 'preact-router';

export function DocPage({ url }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [fileExt, setFileExt] = useState('');
    const [currentRoute, setCurrentRoute] = useState('');
    const [currentFile, setCurrentFile] = useState(null);

    useEffect(() => {
        const loadContent = async () => {
            setLoading(true);
            const routePath = url || '/';
            setCurrentRoute(routePath);

            // 카테고리/서브카테고리 경로인 경우 파일을 로드하지 않음
            if (routePath.startsWith('/category/')) {
                setContent('');
                setCurrentFile(null);
                setLoading(false);
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

            if (file) {
                setCurrentFile(file);
                setFileExt(file.ext || '');
                const mdContent = await getMarkdownContent(file.path);
                if (mdContent) {
                    setContent(mdContent);
                }
            } else {
                setCurrentFile(null);
            }
            setLoading(false);
        };

        loadContent();
    }, [url]);

    const handleNavigate = (path) => {
        route(path);
    };

    if (loading) {
        return <div class="page">로딩 중...</div>;
    }

    if (!content) {
        return (
            <div class="page">
                <DirectoryView currentRoute={currentRoute} onNavigate={handleNavigate} />
            </div>
        );
    }

    // .template 파일인 경우 TemplateViewer 사용
    if (fileExt === '.template') {
        return (
            <div class="page">
                <TemplateViewer content={content} file={currentFile} />
            </div>
        );
    }

    return (
        <div class="page">
            <MarkdownViewer content={content} file={currentFile} />
        </div>
    );
}
