import { useEffect } from 'preact/hooks';
import { useRegisterSW } from 'virtual:pwa-register/preact';
import { useToast } from '../contexts/ToastContext';

/**
 * PWA 업데이트를 감지하고 사용자에게 알림을 표시하는 Hook
 */
export function usePWAUpdate() {
  const { showToast } = useToast();

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      // 주기적으로 업데이트 확인 (예: 1시간마다)
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);

        // 창이 포커스될 때마다 업데이트 확인
        window.addEventListener('focus', () => {
          r.update();
        });
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      showToast('앱이 오프라인에서도 사용할 준비가 되었습니다.', 'success', 3000);
      setOfflineReady(false);
    }
  }, [offlineReady, showToast, setOfflineReady]);

  useEffect(() => {
    if (needRefresh) {
      showToast(
        '새로운 버전의 앱이 출시되었습니다. 지금 업데이트하시겠습니까?',
        'info',
        0, // 무제한 대기
        {
          label: '업데이트',
          onClick: () => {
            updateServiceWorker(true);
          },
        },
      );
      // needRefresh는 toast가 닫힐 때 혹은 업데이트 시 처리되므로
      // 여기서는 상태만 유지
    }
  }, [needRefresh, showToast, updateServiceWorker]);

  return { offlineReady, needRefresh, updateServiceWorker };
}
