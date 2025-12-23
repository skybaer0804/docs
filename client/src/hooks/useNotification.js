import { useState, useEffect } from 'preact/hooks';
import { checkNotificationPermission, requestNotificationPermission } from '../utils/notificationService';

/**
 * 알림 권한 관리를 담당하는 Custom Hook
 * TDD 친화적: 상태 관리 로직을 분리하여 테스트 용이
 * 
 * @param {boolean} autoRequest - 자동으로 권한 요청할지 여부 (기본값: false)
 * @returns {Object} { permission, requestPermission, isSupported }
 */
export function useNotification(autoRequest = false) {
    const [permission, setPermission] = useState('default');
    const [isSupported, setIsSupported] = useState(false);
    
    // Notification API 지원 여부 확인
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        } else {
            setIsSupported(false);
            setPermission('denied');
        }
    }, []);
    
    // 권한 상태 변경 감지
    useEffect(() => {
        if (!isSupported) return;
        
        // 권한 상태 확인
        const checkPermission = async () => {
            const currentPermission = await checkNotificationPermission();
            setPermission(currentPermission);
        };
        
        checkPermission();
        
        // 권한 상태가 변경될 수 있으므로 주기적으로 확인 (선택사항)
        // 실제로는 사용자가 브라우저 설정에서 변경할 수 있으므로
        // 필요시 이벤트 리스너를 추가할 수 있지만, Notification API는
        // 권한 변경 이벤트를 직접 제공하지 않음
    }, [isSupported]);
    
    // 자동 권한 요청
    useEffect(() => {
        if (autoRequest && isSupported && permission === 'default') {
            requestNotificationPermission().then((newPermission) => {
                setPermission(newPermission);
            });
        }
    }, [autoRequest, isSupported, permission]);
    
    /**
     * 권한 요청 함수
     * @returns {Promise<NotificationPermission>}
     */
    const requestPermission = async () => {
        if (!isSupported) {
            console.warn('[useNotification] Notification API를 사용할 수 없습니다.');
            return 'denied';
        }
        
        const newPermission = await requestNotificationPermission();
        setPermission(newPermission);
        return newPermission;
    };
    
    return {
        permission,
        requestPermission,
        isSupported,
        isGranted: permission === 'granted',
    };
}



