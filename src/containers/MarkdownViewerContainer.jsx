import { useEffect, useState, useRef } from 'preact/hooks';
import { marked } from 'marked';
import { route } from 'preact-router';
import { downloadFile } from '../utils/downloadUtils';
import { getMarkdownFiles } from '../utils/markdownLoader';
import { MarkdownViewerPresenter } from '../components/MarkdownViewer';

/**
 * MarkdownViewer Container 컴포넌트
 * 마크다운 렌더링 로직과 이벤트 처리를 담당
 * TDD 친화적: 로직을 분리하여 테스트 시 Mock으로 대체 가능
 */
export function MarkdownViewerContainer({ content, file }) {
    const [html, setHtml] = useState('');
    const contentRef = useRef(null);

    useEffect(() => {
        if (content) {
            // marked 옵션 설정: 자동 링크 비활성화
            const renderer = new marked.Renderer();

            // 링크 렌더러 커스터마이징
            renderer.link = (href, title, text) => {
                // 외부 링크는 그대로 처리
                if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'))) {
                    return `<a href="${href}"${title ? ` title="${title}"` : ''} target="_blank" rel="noopener noreferrer">${text}</a>`;
                }
                // 내부 링크는 data-href 속성 사용
                return `<a href="javascript:void(0)" data-href="${href || ''}"${title ? ` title="${title}"` : ''} style="cursor: pointer;">${text}</a>`;
            };

            marked.setOptions({
                renderer: renderer,
                breaks: true,
                gfm: true,
            });

            const rendered = marked.parse(content);
            setHtml(rendered);
        }
    }, [content]);

    useEffect(() => {
        // 렌더링된 HTML의 링크를 수정하여 브라우저의 자동 리소스 로드 방지
        const element = contentRef.current;
        if (!element) return;

        // 혹시 모를 경우를 대비해 링크 확인 및 수정
        const links = element.querySelectorAll('a[href]:not([data-href])');
        links.forEach((link) => {
            const href = link.getAttribute('href');
            if (!href || href === 'javascript:void(0)') return;

            // 외부 링크는 그대로 유지
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('#')) {
                return;
            }

            // 내부 링크는 data-href에 원본 href 저장하고 href를 javascript:void(0)으로 변경
            link.setAttribute('data-href', href);
            link.setAttribute('href', 'javascript:void(0)');
            link.style.cursor = 'pointer';
        });

        // 링크 클릭 이벤트 처리
        const handleLinkClick = (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            // data-href가 있으면 그것을 사용 (이미 수정된 링크)
            const originalHref = link.getAttribute('data-href');
            const href = originalHref || link.getAttribute('href');
            if (!href || href === '#' || href === 'javascript:void(0)') return;

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

        const contentEl = contentRef.current;
        if (contentEl) {
            contentEl.addEventListener('click', handleLinkClick);
            return () => {
                contentEl.removeEventListener('click', handleLinkClick);
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

    return <MarkdownViewerPresenter html={html} file={file} contentRef={contentRef} onDownload={handleDownload} />;
}
