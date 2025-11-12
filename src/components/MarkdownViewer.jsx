import { useEffect, useState } from 'preact/hooks';
import { marked } from 'marked';
import { IconDownload } from '@tabler/icons-preact';
import { downloadFile } from '../utils/downloadUtils';
import './MarkdownViewer.scss';

export function MarkdownViewer({ content, file }) {
    const [html, setHtml] = useState('');

    useEffect(() => {
        if (content) {
            const rendered = marked.parse(content);
            setHtml(rendered);
        }
    }, [content]);

    const handleDownload = () => {
        if (file && file.path) {
            // 파일명 추출 (경로에서 마지막 부분)
            const fileName = file.path.split('/').pop() || file.title || 'download';
            downloadFile(file.path, fileName);
        }
    };

    return (
        <div class="markdown-viewer">
            {file && (
                <button class="markdown-viewer__download-btn" onClick={handleDownload} aria-label="파일 다운로드" title="파일 다운로드">
                    <IconDownload size={18} />
                </button>
            )}
            <div class="markdown-content" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
}
