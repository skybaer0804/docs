/**
 * 회독 기록 관리 유틸리티
 * localStorage에 파일별 회독 횟수를 저장하고 관리
 * TDD 친화적: 순수 함수로 구성하여 테스트 용이
 */

const STORAGE_KEY = 'readingHistory';

/**
 * 회독 기록 데이터 구조
 * @typedef {Object} ReadingRecord
 * @property {string} fileName - 파일명 (예: "intro.md")
 * @property {string} path - 전체 경로 (예: "/doc/123")
 * @property {string} title - 문서 제목
 * @property {number} count - 회독 횟수
 * @property {number} lastRead - 마지막으로 읽은 시간 (timestamp)
 */

/**
 * localStorage에서 회독 기록을 읽어옵니다.
 * @returns {ReadingRecord[]} 회독 기록 배열
 */
export function getReadingHistory() {
    if (typeof window === 'undefined') return [];
    
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        
        const history = JSON.parse(stored);
        if (!Array.isArray(history)) return [];
        
        return history;
    } catch (error) {
        console.warn('[readingHistory] localStorage 읽기 실패:', error);
        return [];
    }
}

/**
 * 마지막으로 읽은 문서 3개를 가져옵니다.
 * @returns {ReadingRecord[]} 최근 읽은 문서 3개
 */
export function getRecentDocs(limit = 3) {
    const history = getReadingHistory();
    // lastRead 기준으로 내림차순 정렬하여 상위 N개 반환
    return [...history]
        .filter(r => r.path) // 경로가 있는 것만
        .sort((a, b) => (b.lastRead || 0) - (a.lastRead || 0))
        .slice(0, limit);
}

/**
 * 특정 파일의 회독 횟수를 가져옵니다.
 */
export function getReadingCount(fileName) {
    if (!fileName) return 0;
    
    const history = getReadingHistory();
    const record = history.find((r) => r.fileName === fileName);
    return record ? record.count : 0;
}

/**
 * 특정 파일의 회독 횟수를 증가시키고 정보를 업데이트합니다.
 * @param {string} fileName - 파일명
 * @param {Object} options - 추가 정보
 * @param {string} options.path - 문서 경로
 * @param {string} options.title - 문서 제목
 * @returns {number} 증가된 회독 횟수
 */
export function incrementReadingCount(fileName, options = {}) {
    if (!fileName) return 0;
    
    const history = getReadingHistory();
    const existingIndex = history.findIndex((r) => r.fileName === fileName);
    const now = Date.now();
    
    if (existingIndex >= 0) {
        // 기존 기록 업데이트
        history[existingIndex].count += 1;
        history[existingIndex].lastRead = now;
        if (options.path) history[existingIndex].path = options.path;
        if (options.title) history[existingIndex].title = options.title;
    } else {
        // 새 기록 생성
        history.push({
            fileName: fileName,
            path: options.path || '',
            title: options.title || fileName,
            count: 1,
            lastRead: now
        });
    }
    
    // localStorage에 저장
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
        console.warn('[readingHistory] localStorage 저장 실패:', error);
    }
    
    return history[existingIndex >= 0 ? existingIndex : history.length - 1].count;
}

/**
 * 회독 기록을 초기화합니다.
 */
export function clearReadingHistory() {
    if (typeof window === 'undefined') return;
    
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.warn('[readingHistory] localStorage 삭제 실패:', error);
    }
}

/**
 * 특정 파일의 회독 기록을 삭제합니다.
 * @param {string} fileName - 파일명
 */
export function removeReadingRecord(fileName) {
    if (!fileName) return;
    
    const history = getReadingHistory();
    const filtered = history.filter((r) => r.fileName !== fileName);
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.warn('[readingHistory] localStorage 업데이트 실패:', error);
    }
}

















