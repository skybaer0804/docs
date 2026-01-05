/**
 * Web Notification API 서비스 유틸리티
 * 알림 권한 요청, 알림 표시, 자동 닫기 등을 관리
 * TDD 친화적: NotificationLibrary를 사용하여 안정성 확보
 */

import { NotificationLibrary } from '../tdd/NotificationLibrary';

const NOTIFICATION_TIMEOUT = 10000; // 10초 (밀리초)

// NotificationLibrary 인스턴스 생성 (싱글톤처럼 사용)
const notificationLib = new NotificationLibrary({
  tag: 'docs-notification',
  requireInteraction: false,
});

/**
 * Base64 문자열을 Uint8Array로 변환 (VAPID 공개 키 형식 변환)
 * @param {string} base64String
 * @returns {Uint8Array}
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * 알림 권한 상태 확인
 * @returns {Promise<NotificationPermission>} 'granted' | 'denied' | 'default'
 */
export async function checkNotificationPermission() {
  return notificationLib.getPermission();
}

/**
 * 알림 권한 요청
 * @returns {Promise<NotificationPermission>} 'granted' | 'denied' | 'default'
 */
export async function requestNotificationPermission() {
  return await notificationLib.requestPermission();
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
  const { title, body, icon, silent = true, timeout = NOTIFICATION_TIMEOUT } = options;

  if (!title || !body) {
    console.warn('[notificationService] title과 body는 필수입니다.');
    return null;
  }

  // 라이브러리를 사용하여 알림 생성
  const notification = notificationLib.show(title, {
    body,
    icon,
    silent,
    timeout,
  });

  if (notification) {
    // 클릭 시 앱으로 포커스 및 닫기
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // 에러 처리
    notification.onerror = (error) => {
      console.error('[notificationService] 알림 표시 오류:', error);
    };
  }

  return notification;
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
