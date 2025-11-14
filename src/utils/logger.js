/**
 * 개발 모드에서만 로그를 출력하는 유틸리티 함수
 */

const NODE_MODE = import.meta.env.VITE_NODE_MODE || import.meta.env.MODE || 'development';
const IS_DEVELOPMENT = NODE_MODE === 'development' || import.meta.env.DEV;

/**
 * 개발 모드에서만 console.log 출력
 */
export function devLog(...args) {
    if (IS_DEVELOPMENT) {
        console.log(...args);
    }
}

/**
 * 개발 모드에서만 console.warn 출력
 */
export function devWarn(...args) {
    if (IS_DEVELOPMENT) {
        console.warn(...args);
    }
}

/**
 * 개발 모드에서만 console.error 출력
 */
export function devError(...args) {
    if (IS_DEVELOPMENT) {
        console.error(...args);
    }
}

/**
 * 개발 모드 여부 확인
 */
export function isDevelopment() {
    return IS_DEVELOPMENT;
}
