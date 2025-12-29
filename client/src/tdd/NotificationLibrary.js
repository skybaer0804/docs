/**
 * 브라우저 Notification API를 캡슐화한 라이브러리 클래스
 * TDD를 통해 안정성이 검증된 모듈입니다.
 */
export class NotificationLibrary {
    constructor(defaults = {}) {
        this.defaults = {
            silent: true,
            requireInteraction: false,
            ...defaults,
        };
    }

    /**
     * 브라우저의 Notification API 지원 여부 확인
     * @returns {boolean} 지원 여부
     */
    isSupported() {
        return typeof window !== 'undefined' && 'Notification' in window;
    }

    /**
     * 현재 권한 상태 반환
     * @returns {NotificationPermission} 'granted' | 'denied' | 'default'
     */
    getPermission() {
        if (!this.isSupported()) {
            return 'denied';
        }
        return Notification.permission;
    }

    /**
     * 알림 권한 요청
     * @returns {Promise<NotificationPermission>}
     */
    async requestPermission() {
        if (!this.isSupported()) {
            return 'denied';
        }

        const currentPermission = this.getPermission();
        if (currentPermission !== 'default') {
            return currentPermission;
        }

        try {
            return await Notification.requestPermission();
        } catch (error) {
            console.warn('[NotificationLibrary] 권한 요청 실패:', error);
            return 'denied';
        }
    }

    /**
     * 알림 표시
     * @param {string} title - 알림 제목
     * @param {NotificationOptions & { timeout?: number }} options - 알림 옵션 및 타임아웃
     * @returns {Notification|null} 생성된 Notification 객체
     */
    show(title, options = {}) {
        if (!this.isSupported() || this.getPermission() !== 'granted') {
            return null;
        }

        const { timeout, ...nativeOptions } = options;
        const mergedOptions = { ...this.defaults, ...nativeOptions };

        try {
            const notification = new Notification(title, mergedOptions);

            // 자동 닫기 (timeout 옵션이 있을 경우)
            if (timeout && timeout > 0) {
                setTimeout(() => {
                    notification.close();
                }, timeout);
            }

            return notification;
        } catch (error) {
            console.error('[NotificationLibrary] 알림 생성 오류:', error);
            return null;
        }
    }
}
