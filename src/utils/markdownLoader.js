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
            return await response.text();
        }
    } catch (error) {
        console.error('Error loading markdown:', error);
    }
    return null;
}
