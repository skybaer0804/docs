import { useEffect, useState, useRef } from 'preact/hooks';
import { marked } from 'marked';
import { IconDownload } from '@tabler/icons-preact';
import { route } from 'preact-router';
import { downloadFile } from '../utils/downloadUtils';
import { getMarkdownFiles } from '../utils/markdownLoader';
import './MarkdownViewer.scss';

export function MarkdownViewer({ content, file }) {
    const [html, setHtml] = useState('');
    const contentRef = useRef(null);

    useEffect(() => {
        if (content) {
            const rendered = marked.parse(content);
            setHtml(rendered);
        }
    }, [content]);

    useEffect(() => {
        // 링크 클릭 이벤트 처리
        const handleLinkClick = (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // 외부 링크는 기본 동작 유지
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('#')) {
                return;
            }

            // 내부 링크 처리
            e.preventDefault();

            // 경로를 route로 변환 (확장자 포함)
            let routePath = href;

            // 상대 경로인 경우 현재 파일의 경로를 기준으로 절대 경로로 변환
            if (!href.startsWith('/')) {
                if (file && file.path) {
                    const currentDir = file.path.substring(0, file.path.lastIndexOf('/'));
                    // 상대 경로 정규화 (../ 처리)
                    const parts = (currentDir + '/' + href).split('/').filter((p) => p);
                    const normalized = [];
                    for (const part of parts) {
                        if (part === '..') {
                            normalized.pop();
                        } else if (part !== '.') {
                            normalized.push(part);
                        }
                    }
                    routePath = '/' + normalized.join('/');
                }
            }

            // docs-list에서 해당 route 찾기
            const { files } = getMarkdownFiles();

            // route 또는 path로 파일 찾기
            let targetFile = files.find((f) => {
                // route와 정확히 일치
                if (f.route === routePath) return true;
                // path와 정확히 일치
                if (f.path === routePath) return true;
                return false;
            });

            // 찾지 못한 경우 확장자 없는 경로로도 시도 (하위 호환성)
            if (!targetFile) {
                const routePathWithMd = routePath + '.md';
                const routePathWithTemplate = routePath + '.template';
                targetFile = files.find((f) => f.route === routePathWithMd || f.route === routePathWithTemplate);
            }

            if (targetFile) {
                route(targetFile.route);
            } else {
                // 찾지 못한 경우 routePath 그대로 시도
                route(routePath);
            }
        };

        const contentElement = contentRef.current;
        if (contentElement) {
            contentElement.addEventListener('click', handleLinkClick);
            return () => {
                contentElement.removeEventListener('click', handleLinkClick);
            };
        }
    }, [html, file]);

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
            <div class="markdown-content" ref={contentRef} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
}
