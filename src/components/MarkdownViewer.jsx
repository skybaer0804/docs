import { useEffect, useState } from 'preact/hooks';
import { marked } from 'marked';

export function MarkdownViewer({ content }) {
    const [html, setHtml] = useState('');

    useEffect(() => {
        if (content) {
            const rendered = marked.parse(content);
            setHtml(rendered);
        }
    }, [content]);

    return <div class="markdown-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
