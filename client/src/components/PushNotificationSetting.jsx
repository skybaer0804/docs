import { useNotification } from '../hooks/useNotification';
import { useToast } from '../contexts/ToastContext';
import { Button } from './Button';
import './PushNotificationSetting.scss';

/**
 * 푸시 알림 설정을 관리하는 컴포넌트 (BEM 스타일)
 */
export function PushNotificationSetting() {
  const { isSupported, isSubscribed, subscribePush, unsubscribePush, loading, permission } = useNotification();
  const { showToast, showError } = useToast();

  if (!isSupported) {
    return (
      <div className="push-setting push-setting--unsupported">
        <p className="push-setting__message">이 브라우저는 푸시 알림을 지원하지 않습니다.</p>
      </div>
    );
  }

  const handleSubscribe = async () => {
    try {
      await subscribePush();
      showToast('실시간 알림이 활성화되었습니다.', 'success');
    } catch (err) {
      console.error(err);
      showError('알림 활성화에 실패했습니다. 권한 설정을 확인해주세요.');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribePush();
      showToast('실시간 알림이 비활성화되었습니다.', 'info');
    } catch (err) {
      console.error(err);
      showError('알림 비활성화에 실패했습니다.');
    }
  };

  return (
    <div className="push-setting">
      <div className="push-setting__info">
        <h3 className="push-setting__title">실시간 알림</h3>
        <p className="push-setting__description">새로운 팔로워, 문서 성과 등의 소식을 실시간으로 알려드립니다.</p>
        {permission === 'denied' && (
          <p className="push-setting__warning">브라우저 설정에서 알림 권한이 차단되어 있습니다. 권한을 허용해주세요.</p>
        )}
      </div>
      <div className="push-setting__actions">
        {isSubscribed ? (
          <Button variant="secondary" onClick={handleUnsubscribe} disabled={loading} className="push-setting__button">
            알림 끄기
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubscribe}
            disabled={loading || permission === 'denied'}
            loading={loading}
            className="push-setting__button"
          >
            알림 켜기
          </Button>
        )}
      </div>
    </div>
  );
}
