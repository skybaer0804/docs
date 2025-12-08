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
 * @property {number} count - 회독 횟수
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
        // 유효성 검사: 배열인지 확인
        if (!Array.isArray(history)) return [];
        
        return history;
    } catch (error) {
        console.warn('[readingHistory] localStorage 읽기 실패:', error);
        return [];
    }
}

/**
 * 특정 파일의 회독 횟수를 가져옵니다.
 * @param {string} fileName - 파일명
 * @returns {number} 회독 횟수 (없으면 0)
 */
export function getReadingCount(fileName) {
    if (!fileName) return 0;
    
    const history = getReadingHistory();
    const record = history.find((r) => r.fileName === fileName);
    return record ? record.count : 0;
}

/**
 * 특정 파일의 회독 횟수를 증가시킵니다.
 * @param {string} fileName - 파일명
 * @returns {number} 증가된 회독 횟수
 */
export function incrementReadingCount(fileName) {
    if (!fileName) return 0;
    
    const history = getReadingHistory();
    const existingIndex = history.findIndex((r) => r.fileName === fileName);
    
    if (existingIndex >= 0) {
        // 기존 기록이 있으면 count 증가
        history[existingIndex].count += 1;
    } else {
        // 새 기록 생성
        history.push({
            fileName: fileName,
            count: 1,
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






