import { useEffect, useState } from 'preact/hooks';
import './TemplateViewer.scss';

export function TemplateViewer({ content }) {
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

    return (
        <div class="template-viewer">
            <pre class="template-content">
                <code>{formattedContent || content}</code>
            </pre>
        </div>
    );
}
