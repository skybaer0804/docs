/**
 * NavigationObserver
 * 네비게이션 이벤트를 관찰하고 구독자에게 알림
 * TDD 친화적: 이벤트 핸들러를 분리하여 테스트 용이
 */
export class NavigationObserver {
    constructor() {
        this.subscribers = new Set();
    }

    /**
     * 구독자 추가
     * @param {Function} callback - 네비게이션 이벤트 발생 시 호출될 콜백
     * @returns {Function} 구독 해제 함수
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        // 구독 해제 함수 반환
        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * 네비게이션 이벤트 발생 시 모든 구독자에게 알림
     * @param {string} path - 이동할 경로
     * @param {Object} context - 추가 컨텍스트 정보
     */
    notify(path, context = {}) {
        this.subscribers.forEach((callback) => {
            try {
                callback({ path, ...context });
            } catch (error) {
                console.error('NavigationObserver callback error:', error);
            }
        });
    }

    /**
     * 모든 구독자 제거
     */
    clear() {
        this.subscribers.clear();
    }
}

// 싱글톤 인스턴스 생성
export const navigationObserver = new NavigationObserver();
