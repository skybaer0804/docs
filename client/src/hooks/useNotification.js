import { useState, useEffect } from 'preact/hooks';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  urlBase64ToUint8Array,
} from '../utils/notificationService';
import { savePushSubscription } from '../utils/api';

/**
 * 알림 권한 및 웹 푸시 구독을 담당하는 Custom Hook
 *
 * @param {boolean} autoRequest - 자동으로 권한 요청할지 여부 (기본값: false)
 * @returns {Object} { permission, requestPermission, isSupported, subscribePush, subscription }
 */
export function useNotification(autoRequest = false) {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  // 지원 여부 및 초기 권한 확인
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      // 기존 구독 정보 확인
      navigator.serviceWorker.ready
        .then((reg) => {
          return reg.pushManager.getSubscription();
        })
        .then((sub) => {
          setSubscription(sub);
        });
    }
  }, []);

  // 권한 요청 함수
  const requestPermission = async () => {
    if (!isSupported) return 'denied';
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    return newPermission;
  };

  /**
   * 웹 푸시 구독 시작
   */
  const subscribePush = async () => {
    if (!isSupported) {
      throw new Error('Push messaging is not supported in this browser');
    }

    setLoading(true);
    try {
      // 1. 권한 확인 및 요청
      let currentPermission = Notification.permission;
      if (currentPermission !== 'granted') {
        currentPermission = await requestPermission();
      }

      if (currentPermission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // 2. 서비스 워커 준비 대기 (PWA 플러그인이 등록한 sw.js 사용)
      const registration = await navigator.serviceWorker.ready;

      // 3. 푸시 구독
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // 4. 서버에 구독 정보 저장
      await savePushSubscription(newSubscription);

      setSubscription(newSubscription);
      return newSubscription;
    } catch (error) {
      console.error('[useNotification] Push subscription failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 구독 취소 (선택사항)
   */
  const unsubscribePush = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      // 서버에서도 삭제 로직이 필요하다면 여기에 추가 (현재 백엔드에는 구현 안됨)
    } catch (error) {
      console.error('[useNotification] Unsubscribe failed:', error);
    }
  };

  return {
    permission,
    requestPermission,
    isSupported,
    isGranted: permission === 'granted',
    subscribePush,
    unsubscribePush,
    subscription,
    isSubscribed: !!subscription,
    loading,
  };
}
