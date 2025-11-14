/**
 * SidebarObserver
 * 사이드바 상태 변경 이벤트를 관찰하고 구독자에게 알림
 * TDD 친화적: 상태 변경 로직을 분리하여 테스트 용이
 */
export class SidebarObserver {
    constructor() {
        this.subscribers = new Set();
        this.state = {
            isOpen: false,
            isCollapsed: false,
            width: 250,
        };
    }

    /**
     * 구독자 추가
     * @param {Function} callback - 사이드바 상태 변경 시 호출될 콜백
     * @returns {Function} 구독 해제 함수
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        // 현재 상태를 즉시 전달
        callback(this.state);
        // 구독 해제 함수 반환
        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * 상태 변경 시 모든 구독자에게 알림
     * @param {Object} newState - 새로운 상태
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    /**
     * 모든 구독자에게 현재 상태 알림
     */
    notify() {
        this.subscribers.forEach((callback) => {
            try {
                callback(this.state);
            } catch (error) {
                console.error('SidebarObserver callback error:', error);
            }
        });
    }

    /**
     * 현재 상태 가져오기
     * @returns {Object} 현재 상태
     */
    getState() {
        return { ...this.state };
    }

    /**
     * 모든 구독자 제거
     */
    clear() {
        this.subscribers.clear();
    }
}

// 싱글톤 인스턴스 생성
export const sidebarObserver = new SidebarObserver();
