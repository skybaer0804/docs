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
            const file = files.find((f) => f.route === routePath);

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
