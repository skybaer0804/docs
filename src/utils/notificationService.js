/**
 * Web Notification API 서비스 유틸리티
 * 알림 권한 요청, 알림 표시, 자동 닫기 등을 관리
 * TDD 친화적: 순수 함수로 구성하여 테스트 용이
 */

const NOTIFICATION_TIMEOUT = 10000; // 10초 (밀리초)

/**
 * 알림 권한 상태 확인
 * @returns {Promise<NotificationPermission>} 'granted' | 'denied' | 'default'
 */
export async function checkNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
    }
    
    return Notification.permission;
}

/**
 * 알림 권한 요청
 * @returns {Promise<NotificationPermission>} 'granted' | 'denied' | 'default'
 */
export async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('[notificationService] Notification API를 사용할 수 없습니다.');
        return 'denied';
    }
    
    // 이미 권한이 있으면 바로 반환
    if (Notification.permission === 'granted') {
        return 'granted';
    }
    
    // 권한이 거부되었으면 요청하지 않음
    if (Notification.permission === 'denied') {
        return 'denied';
    }
    
    // 권한 요청
    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.warn('[notificationService] 권한 요청 실패:', error);
        return 'denied';
    }
}

/**
 * 알림 표시 옵션 타입
 * @typedef {Object} NotificationOptions
 * @property {string} title - 알림 제목
 * @property {string} body - 알림 본문
 * @property {string} [icon] - 알림 아이콘 URL (선택사항)
 * @property {boolean} [silent=true] - 소리 없음 (기본값: true)
 * @property {number} [timeout=10000] - 자동 닫기 시간(밀리초) (기본값: 10000)
 */

/**
 * 알림을 표시합니다.
 * @param {NotificationOptions} options - 알림 옵션
 * @returns {Notification|null} 생성된 Notification 객체 또는 null
 */
export async function showNotification(options) {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('[notificationService] Notification API를 사용할 수 없습니다.');
        return null;
    }
    
    // 권한 확인
    const permission = await checkNotificationPermission();
    if (permission !== 'granted') {
        console.warn('[notificationService] 알림 권한이 없습니다:', permission);
        return null;
    }
    
    const {
        title,
        body,
        icon,
        silent = true,
        timeout = NOTIFICATION_TIMEOUT,
    } = options;
    
    if (!title || !body) {
        console.warn('[notificationService] title과 body는 필수입니다.');
        return null;
    }
    
    try {
        // 알림 생성
        const notification = new Notification(title, {
            body,
            icon: icon || undefined,
            silent,
            tag: 'docs-notification', // 같은 태그의 알림은 하나만 표시
            requireInteraction: false, // 사용자 상호작용 불필요
        });
        
        // 클릭 시 앱으로 포커스
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        // 에러 처리
        notification.onerror = (error) => {
            console.error('[notificationService] 알림 표시 오류:', error);
        };
        
        // 자동 닫기
        if (timeout > 0) {
            setTimeout(() => {
                notification.close();
            }, timeout);
        }
        
        return notification;
    } catch (error) {
        console.error('[notificationService] 알림 생성 실패:', error);
        return null;
    }
}

/**
 * 경과 시간 알림을 표시합니다.
 * @param {number} minutes - 경과 시간 (분)
 */
export async function showTimerNotification(minutes) {
    const messages = {
        1: '1분이 경과했습니다.',
        10: '10분이 경과했습니다.',
        30: '30분이 경과했습니다.',
        60: '1시간이 경과했습니다.',
    };
    
    const message = messages[minutes] || `${minutes}분이 경과했습니다.`;
    
    return showNotification({
        title: '읽기 시간 알림',
        body: message,
        silent: true,
        timeout: NOTIFICATION_TIMEOUT,
    });
}

/**
 * 회독 완료 알림을 표시합니다.
 * @param {number} count - 회독 횟수
 * @param {string} fileName - 파일명
 */
export async function showReadingCompleteNotification(count, fileName) {
    const displayFileName = fileName || '문서';
    const message = `${count}회독 했습니다.`;
    
    return showNotification({
        title: `${displayFileName} 읽기 완료`,
        body: message,
        silent: true,
        timeout: NOTIFICATION_TIMEOUT,
    });
}

