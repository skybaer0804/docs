import { useEffect, useState, useRef, useMemo } from 'preact/hooks';
import { marked } from 'marked';
import { downloadFile } from '../utils/downloadUtils';
import { MarkdownViewerPresenter } from '../components/MarkdownViewer';
import { MarkdownParser, resolvePath, findTargetFile } from '../tdd/MarkdownLogic';
import { useDocsTreeQuery } from '../hooks/useDocsTreeQuery';

/**
 * MarkdownViewer Container 컴포넌트
 * 마크다운 렌더링 로직과 이벤트 처리를 담당
 * SPA 구조: onNavigate prop을 통한 네비게이션
 * TDD 친화적: 핵심 로직을 src/tdd/MarkdownLogic으로 분리하여 의존성 최소화
 */
export function MarkdownViewerContainer({ content, file, onNavigate, onContentRef }) {
    const [html, setHtml] = useState('');
    const contentRef = useRef(null);
    const { data: nodes = [] } = useDocsTreeQuery();

    const allFiles = useMemo(() => {
        return nodes
            .filter((n) => n.type === 'FILE')
            .map((n) => ({
                route: `/doc/${n.id}`,
                title: n.name.replace(/\.md$/, ''),
                name: n.name,
                id: n.id,
                author_id: n.author_id,
                parent_id: n.parent_id,
            }));
    }, [nodes]);

    // MarkdownParser 인스턴스 메모이제이션 (marked 라이브러리 주입)
    const parser = useMemo(() => new MarkdownParser(marked), []);

    // contentRef를 외부로 노출 (알림 기능 등에서 사용)
    useEffect(() => {
        if (onContentRef) {
            onContentRef(contentRef);
        }
    }, [onContentRef]);

    useEffect(() => {
        if (content) {
            const rendered = parser.parse(content);
            setHtml(rendered);
        }
    }, [content, parser]);

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

            // 상대 경로인 경우 현재 파일의 경로를 기준으로 절대 경로로 변환 (현재는 ID 기반이므로 지원 제한됨)
            if (!href.startsWith('/') && file && file.route) {
                // routePath = resolvePath(file.path, href);
                // ID 기반 라우팅에서는 상대 경로 해결이 어려우므로 href를 그대로 사용하거나
                // 필요시 추가 로직 구현
            }

            // 매칭되는 파일 찾기
            const targetFile = findTargetFile(allFiles, routePath);

            if (targetFile) {
                if (onNavigate) {
                    onNavigate(targetFile.route);
                }
            } else {
                // 찾지 못한 경우 routePath 그대로 시도
                if (onNavigate) {
                    onNavigate(routePath);
                }
            }
        };

        const contentEl = contentRef.current;
        if (contentEl) {
            contentEl.addEventListener('click', handleLinkClick);
            return () => {
                contentEl.removeEventListener('click', handleLinkClick);
            };
        }
    }, [html, file, onNavigate, allFiles]);

    const handleDownload = () => {
        if (file && file.id) {
            const fileName = file.title.endsWith('.md') ? file.title : `${file.title}.md`;
            downloadFile(`/api/docs/id/${file.id}`, fileName);
        }
    };

    const handleEdit = (id) => {
        if (onNavigate) {
            onNavigate(`/edit/${id}`);
        }
    };

    return <MarkdownViewerPresenter html={html} file={file} contentRef={contentRef} onDownload={handleDownload} onEdit={handleEdit} />;
}

