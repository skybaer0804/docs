import { useEffect, useState } from 'preact/hooks';
import { getMarkdownContent } from '../utils/markdownLoader';
import { MarkdownViewer } from '../components/MarkdownViewer';

export function Home() {
    const [content, setContent] = useState('');

    useEffect(() => {
        const loadContent = async () => {
            const mdContent = await getMarkdownContent('/README.md');
            if (mdContent) {
                setContent(mdContent);
            }
        };
        loadContent();
    }, []);

    return (
        <div class="page">
            <MarkdownViewer content={content} />
        </div>
    );
}
