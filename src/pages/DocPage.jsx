import { useEffect, useState } from 'preact/hooks';
import { getMarkdownContent, getMarkdownFiles } from '../utils/markdownLoader';
import { MarkdownViewer } from '../components/MarkdownViewer';

export function DocPage({ url }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadContent = async () => {
            setLoading(true);
            const routePath = url || '/';
            const { files } = getMarkdownFiles();
            const file = files.find((f) => f.route === routePath);

            if (file) {
                const mdContent = await getMarkdownContent(file.path);
                if (mdContent) {
                    setContent(mdContent);
                }
            }
            setLoading(false);
        };

        loadContent();
    }, [url]);

    if (loading) {
        return <div class="page">로딩 중...</div>;
    }

    if (!content) {
        return <div class="page">문서를 찾을 수 없습니다.</div>;
    }

    return (
        <div class="page">
            <MarkdownViewer content={content} />
        </div>
    );
}
