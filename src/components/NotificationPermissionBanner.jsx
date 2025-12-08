import { IconBell, IconX } from '@tabler/icons-preact';
import './NotificationPermissionBanner.scss';

/**
 * 알림 권한 요청 배너 컴포넌트
 * 사용자에게 알림 권한을 요청하는 UI를 제공
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
export function NotificationPermissionBanner({ 
    permission, 
    onRequestPermission, 
    onDismiss 
}) {
    // 권한이 이미 승인되었거나 거부되었으면 표시하지 않음
    if (permission === 'granted' || permission === 'denied') {
        return null;
    }
    
    return (
        <div class="notification-permission-banner">
            <div class="notification-permission-banner__content">
                <IconBell size={20} class="notification-permission-banner__icon" />
                <div class="notification-permission-banner__text">
                    <span class="notification-permission-banner__title">읽기 시간 및 회독 알림</span>
                    <span class="notification-permission-banner__description">
                        문서 읽기 시간과 회독 횟수를 추적하여 알림을 받을 수 있습니다.
                    </span>
                </div>
            </div>
            <div class="notification-permission-banner__actions">
                <button 
                    class="notification-permission-banner__button notification-permission-banner__button--primary"
                    onClick={onRequestPermission}
                >
                    허용
                </button>
                <button 
                    class="notification-permission-banner__button notification-permission-banner__button--dismiss"
                    onClick={onDismiss}
                    aria-label="닫기"
                >
                    <IconX size={16} />
                </button>
            </div>
        </div>
    );
}






