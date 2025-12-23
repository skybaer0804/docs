/**
 * 상대 경로를 현재 경로 기준으로 절대 경로로 변환합니다.
 * @param {string} currentPath - 현재 파일의 경로 (예: '/docs/guide/index.md')
 * @param {string} relativeHref - 이동하려는 상대 경로 (예: '../about.md')
 * @returns {string} - 해결된 절대 경로
 */
export function resolvePath(currentPath, relativeHref) {
    if (!currentPath || !relativeHref) return relativeHref;
    if (relativeHref.startsWith('/')) return relativeHref;
    if (relativeHref.startsWith('http')) return relativeHref;

    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const parts = (currentDir + '/' + relativeHref).split('/').filter((p) => p);

    const normalized = [];
    for (const part of parts) {
        if (part === '..') {
            normalized.pop();
        } else if (part !== '.') {
            normalized.push(part);
        }
    }

    return '/' + normalized.join('/');
}

/**
 * 요청된 경로에 매칭되는 파일을 목록에서 찾습니다.
 * @param {Array} files - 파일 목록
 * @param {string} routePath - 찾으려는 경로
 * @returns {Object|null} - 찾은 파일 객체 또는 null
 */
export function findTargetFile(files, routePath) {
    if (!files || !routePath) return null;

    // 1. 정확한 route 또는 path 매칭
    let target = files.find((f) => f.route === routePath || f.path === routePath);
    if (target) return target;

    // 2. 확장자가 없는 경우 .md, .template 등을 붙여서 시도
    const extensions = ['.md', '.template'];
    for (const ext of extensions) {
        target = files.find((f) => f.route === routePath + ext);
        if (target) return target;
    }

    return null;
}

/**
 * 마크다운 파서 설정 및 변환을 담당하는 클래스
 * marked 라이브러리를 주입받아 사용 (의존성 분리)
 */
export class MarkdownParser {
    /**
     * @param {Object} markedLibrary - marked 라이브러리 인스턴스 또는 모듈
     */
    constructor(markedLibrary) {
        if (!markedLibrary) {
            throw new Error('marked library is required');
        }
        this.marked = markedLibrary;
        this.renderer = new this.marked.Renderer();
        this.setupRenderer();

        this.marked.setOptions({
            renderer: this.renderer,
            breaks: true,
            gfm: true,
        });
    }

    setupRenderer() {
        // 링크 렌더러 커스터마이징
        this.renderer.link = (href, title, text) => {
            if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'))) {
                return `<a href="${href}"${title ? ` title="${title}"` : ''} target="_blank" rel="noopener noreferrer">${text}</a>`;
            }
            // 내부 링크는 data-href 속성 사용
            return `<a href="javascript:void(0)" data-href="${href || ''}"${title ? ` title="${title}"` : ''} style="cursor: pointer;">${text}</a>`;
        };

        // 테이블 렌더러 커스터마이징
        this.renderer.table = (header, body) => {
            return `<div class="table-wrapper"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
        };
    }

    parse(content) {
        return this.marked.parse(content);
    }
}
