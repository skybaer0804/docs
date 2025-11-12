import { useEffect, useState } from 'preact/hooks';
import { IconDownload } from '@tabler/icons-preact';
import { downloadFile } from '../utils/downloadUtils';
import './TemplateViewer.scss';

export function TemplateViewer({ content, file }) {
    const [formattedContent, setFormattedContent] = useState('');

    useEffect(() => {
        if (!content) return;

        try {
            // JSON인지 확인
            const jsonContent = JSON.parse(content);
            // JSON을 예쁘게 포맷팅
            setFormattedContent(JSON.stringify(jsonContent, null, 2));
        } catch (e) {
            // JSON이 아니면 원본 그대로 사용
            setFormattedContent(content);
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
        <div class="template-viewer">
            {file && (
                <button class="template-viewer__download-btn" onClick={handleDownload} aria-label="파일 다운로드" title="파일 다운로드">
                    <IconDownload size={18} />
                </button>
            )}
            <pre class="template-content">
                <code>{formattedContent || content}</code>
            </pre>
        </div>
    );
}
