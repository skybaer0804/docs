// 빌드 시점에 생성된 파일 목록을 가져오기
import docsList from '../docs-list.json';

// 마크다운 파일 목록을 자동으로 가져오는 유틸리티
export function getMarkdownFiles() {
    // 빌드 시점에 생성된 docs-list.json 사용
    return docsList;
}

// 런타임에 fetch로 마크다운 파일 내용 가져오기
export async function getMarkdownContent(path) {
    try {
        // 개발 모드에서는 직접 파일을 fetch
        const response = await fetch(path);
        if (response.ok) {
            // UTF-8 인코딩 명시적으로 처리 (README.md 파일 깨짐 문제 해결)
            const contentType = response.headers.get('content-type') || '';
            const isText = contentType.includes('text/') || contentType.includes('application/json');

            if (isText) {
                // 텍스트 파일은 UTF-8로 디코딩
                const buffer = await response.arrayBuffer();
                const decoder = new TextDecoder('utf-8');
                return decoder.decode(buffer);
            } else {
                // 기타는 기본 text() 사용
                return await response.text();
            }
        } else {
            console.error(`Failed to load markdown: ${path} (${response.status})`);
        }
    } catch (error) {
        console.error('Error loading markdown:', error);
    }
    return null;
}
