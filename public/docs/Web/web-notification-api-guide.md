# Web Notification API 완벽 가이드: 브라우저 알림 구현 및 활용

## 목차

1. [Web Notification API 개요](#web-notification-api-개요)
2. [기본 개념 및 용어](#기본-개념-및-용어)
3. [권한 관리](#권한-관리)
4. [알림 표시 방법](#알림-표시-방법)
5. [실제 적용 사례](#실제-적용-사례)
6. [베스트 프랙티스](#베스트-프랙티스)
7. [브라우저 호환성](#브라우저-호환성)
8. [확장 가능성](#확장-가능성)

---

## Web Notification API 개요

### 정의

**Web Notification API**는 웹 애플리케이션이 사용자에게 시스템 레벨 알림을 표시할 수 있게 해주는 브라우저 API입니다. 이 API를 통해 웹 앱은 네이티브 앱처럼 사용자에게 알림을 보낼 수 있습니다.

### 주요 특징

-   **시스템 레벨 알림**: 브라우저 창 밖에서도 알림 표시 가능
-   **비동기 처리**: 사용자 경험을 방해하지 않음
-   **권한 기반**: 사용자 동의 후에만 알림 표시 가능
-   **크로스 플랫폼**: Windows, macOS, Linux, 모바일에서 동작

### 사용 사례

1. **콘텐츠 회독 추적**: 문서를 끝까지 읽었을 때 알림
2. **타이머 알림**: 특정 시간 경과 시 알림
3. **메시지 알림**: 새로운 메시지나 업데이트 알림
4. **작업 완료 알림**: 백그라운드 작업 완료 시 알림
5. **일정 알림**: 캘린더 이벤트 알림

---

## 기본 개념 및 용어

### Notification 객체

알림을 표시하기 위한 핵심 객체입니다.

```javascript
const notification = new Notification(title, options);
```

#### 필수 매개변수

-   **title** (string): 알림 제목

#### 선택 매개변수 (options)

-   **body** (string): 알림 본문 내용
-   **icon** (string): 알림 아이콘 이미지 URL
-   **badge** (string): 배지 아이콘 URL (모바일)
-   **tag** (string): 알림 그룹화 태그 (같은 태그는 하나만 표시)
-   **data** (any): 알림과 함께 전달할 데이터
-   **requireInteraction** (boolean): 사용자 상호작용 필요 여부
-   **silent** (boolean): 소리 재생 여부
-   **sound** (string): 소리 파일 URL
-   **vibrate** (array): 진동 패턴 (모바일)
-   **dir** (string): 텍스트 방향 ('auto', 'ltr', 'rtl')
-   **lang** (string): 언어 코드
-   **renotify** (boolean): 같은 태그의 알림 재표시 여부
-   **sticky** (boolean): 자동 닫힘 방지 (일부 브라우저)

### 권한 상태

알림 권한은 세 가지 상태를 가집니다:

1. **'default'**: 아직 권한을 요청하지 않음
2. **'granted'**: 사용자가 권한을 허용함
3. **'denied'**: 사용자가 권한을 거부함

### 알림 생명주기

```
권한 요청 → 권한 확인 → 알림 생성 → 알림 표시 → 사용자 상호작용 → 알림 닫기
```

---

## 권한 관리

### 권한 확인

```javascript
if ('Notification' in window) {
    const permission = Notification.permission;
    // 'default', 'granted', 'denied'
}
```

### 권한 요청

```javascript
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
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
    const permission = await Notification.requestPermission();
    return permission;
}
```

### 권한 상태별 처리

```javascript
switch (Notification.permission) {
    case 'granted':
        // 알림 표시 가능
        showNotification('알림 제목', '알림 내용');
        break;
    case 'denied':
        // 권한 거부됨 - 사용자에게 브라우저 설정에서 변경하도록 안내
        console.warn('알림 권한이 거부되었습니다.');
        break;
    case 'default':
        // 권한 요청 필요
        await requestNotificationPermission();
        break;
}
```

### 베스트 프랙티스: Opt-in 방식

사용자에게 명확한 안내 후 권한을 요청하는 것이 중요합니다:

```javascript
// ❌ 나쁜 예: 즉시 권한 요청
Notification.requestPermission();

// ✅ 좋은 예: 사용자에게 안내 후 요청
function showPermissionBanner() {
    // 배너를 표시하여 사용자에게 알림 기능 설명
    // 사용자가 "허용" 버튼을 클릭하면 권한 요청
    if (userClickedAllow) {
        await requestNotificationPermission();
    }
}
```

---

## 알림 표시 방법

### 기본 알림 표시

```javascript
function showBasicNotification() {
    if (Notification.permission === 'granted') {
        const notification = new Notification('알림 제목', {
            body: '알림 본문 내용입니다.',
            icon: '/icon.png',
        });
    }
}
```

### 알림 옵션 설정

```javascript
const notification = new Notification('읽기 시간 알림', {
    body: '1분이 경과했습니다.',
    icon: '/icon.png',
    tag: 'reading-timer', // 같은 태그의 알림은 하나만 표시
    silent: true, // 소리 없음
    requireInteraction: false, // 자동으로 닫힘
    data: {
        type: 'timer',
        minutes: 1,
    },
});
```

### 알림 이벤트 처리

```javascript
const notification = new Notification('알림 제목', {
    body: '알림 내용',
});

// 클릭 이벤트
notification.onclick = (event) => {
    event.preventDefault();
    window.focus(); // 브라우저 창으로 포커스
    notification.close();
};

// 표시 이벤트
notification.onshow = () => {
    console.log('알림이 표시되었습니다.');
};

// 닫기 이벤트
notification.onclose = () => {
    console.log('알림이 닫혔습니다.');
};

// 에러 이벤트
notification.onerror = (error) => {
    console.error('알림 오류:', error);
};
```

### 알림 자동 닫기

```javascript
const NOTIFICATION_TIMEOUT = 10000; // 10초

const notification = new Notification('알림 제목', {
    body: '알림 내용',
});

// 10초 후 자동으로 닫기
setTimeout(() => {
    notification.close();
}, NOTIFICATION_TIMEOUT);
```

### 알림 닫기

```javascript
// 수동으로 닫기
notification.close();

// 모든 알림 닫기 (Service Worker 사용 시)
self.registration.getNotifications().then((notifications) => {
    notifications.forEach((notification) => notification.close());
});
```

---

## 실제 적용 사례

### 프로젝트 구조

이 프로젝트에서는 다음과 같은 구조로 Web Notification API를 적용했습니다:

```
src/
├── utils/
│   ├── notificationService.js      # 알림 서비스 유틸리티
│   └── readingHistory.js           # 회독 기록 관리
├── hooks/
│   ├── useNotification.js          # 알림 권한 관리 Hook
│   ├── useReadingTracker.js        # 회독 추적 Hook
│   └── useTimerNotification.js     # 타이머 알림 Hook
└── components/
    └── NotificationPermissionBanner.jsx  # 권한 요청 배너
```

### 1. 알림 서비스 유틸리티

```javascript
// utils/notificationService.js

const NOTIFICATION_TIMEOUT = 10000; // 10초

export async function checkNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
}

export async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        return 'denied';
    }

    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.warn('[notificationService] 권한 요청 실패:', error);
        return 'denied';
    }
}

export async function showNotification(options) {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return null;
    }

    const permission = await checkNotificationPermission();
    if (permission !== 'granted') {
        return null;
    }

    const { title, body, icon, silent = true, timeout = NOTIFICATION_TIMEOUT } = options;

    if (!title || !body) {
        return null;
    }

    try {
        const notification = new Notification(title, {
            body,
            icon: icon || undefined,
            silent,
            tag: 'docs-notification',
            requireInteraction: false,
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        notification.onerror = (error) => {
            console.error('[notificationService] 알림 표시 오류:', error);
        };

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
```

### 2. 알림 권한 관리 Hook

```javascript
// hooks/useNotification.js

import { useState, useEffect } from 'preact/hooks';
import { checkNotificationPermission, requestNotificationPermission } from '../utils/notificationService';

export function useNotification(autoRequest = false) {
    const [permission, setPermission] = useState('default');
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        } else {
            setIsSupported(false);
            setPermission('denied');
        }
    }, []);

    const requestPermission = async () => {
        if (!isSupported) {
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
```

### 3. 타이머 알림 Hook

```javascript
// hooks/useTimerNotification.js

import { useEffect, useRef, useState } from 'preact/hooks';
import { showTimerNotification } from '../utils/notificationService';

export function useTimerNotification({ enabled = true } = {}) {
    const startTimeRef = useRef(null);
    const timersRef = useRef([]);
    const notifiedMinutesRef = useRef(new Set());
    const [isDocumentVisible, setIsDocumentVisible] = useState(() => {
        if (typeof document !== 'undefined') {
            return !document.hidden;
        }
        return true;
    });

    const NOTIFICATION_TIMES = [1, 10, 30, 60]; // 1분, 10분, 30분, 1시간

    useEffect(() => {
        if (typeof document !== 'undefined') {
            const handleVisibilityChange = () => {
                setIsDocumentVisible(!document.hidden);
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }
    }, []);

    useEffect(() => {
        if (!enabled || !isDocumentVisible) {
            timersRef.current.forEach((timer) => clearTimeout(timer));
            timersRef.current = [];
            notifiedMinutesRef.current.clear();
            return;
        }

        if (!startTimeRef.current) {
            startTimeRef.current = Date.now();
        }

        const scheduleNotification = (minutes) => {
            if (notifiedMinutesRef.current.has(minutes)) {
                return;
            }

            const milliseconds = minutes * 60 * 1000;
            const elapsed = Date.now() - startTimeRef.current;

            if (elapsed >= milliseconds) {
                showTimerNotification(minutes).catch((error) => {
                    console.warn('[useTimerNotification] 알림 표시 실패:', error);
                });
                notifiedMinutesRef.current.add(minutes);
                return;
            }

            const remainingTime = milliseconds - elapsed;
            const timer = setTimeout(() => {
                showTimerNotification(minutes).catch((error) => {
                    console.warn('[useTimerNotification] 알림 표시 실패:', error);
                });
                notifiedMinutesRef.current.add(minutes);
            }, remainingTime);

            timersRef.current.push(timer);
        };

        NOTIFICATION_TIMES.forEach((minutes) => {
            scheduleNotification(minutes);
        });

        return () => {
            timersRef.current.forEach((timer) => clearTimeout(timer));
            timersRef.current = [];
        };
    }, [enabled, isDocumentVisible]);

    const resetTimer = () => {
        startTimeRef.current = Date.now();
        timersRef.current.forEach((timer) => clearTimeout(timer));
        timersRef.current = [];
        notifiedMinutesRef.current.clear();
    };

    return {
        resetTimer,
    };
}
```

### 4. 회독 추적 및 알림

```javascript
// hooks/useReadingTracker.js

import { useEffect, useRef, useState } from 'preact/hooks';
import { incrementReadingCount } from '../utils/readingHistory';
import { showReadingCompleteNotification } from '../utils/notificationService';

export function useReadingTracker({ contentRef, file, enabled = true, threshold = 0.95 }) {
    const hasNotifiedRef = useRef(false);
    const hasScrolledRef = useRef(false);

    useEffect(() => {
        if (!enabled || !file?.path) {
            return;
        }

        const getContentElement = () => {
            if (!contentRef) return null;
            return contentRef.current || contentRef;
        };

        const findScrollContainer = () => {
            const element = getContentElement();
            if (!element) return null;

            let current = element;
            while (current && current !== document.body) {
                const style = window.getComputedStyle(current);
                const hasScroll = current.scrollHeight > current.clientHeight;
                const overflowY = style.overflowY || style.overflow;

                if (hasScroll && (overflowY === 'auto' || overflowY === 'scroll')) {
                    return current;
                }
                current = current.parentElement;
            }

            return document.querySelector('.layout__main') || null;
        };

        const checkReadingComplete = () => {
            const element = getContentElement();
            if (!element) return;

            const scrollContainer = findScrollContainer();
            let scrollPercentage = 0;

            if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
                const scrollTop = scrollContainer.scrollTop;
                const scrollHeight = scrollContainer.scrollHeight;
                const clientHeight = scrollContainer.clientHeight;
                const scrollableHeight = scrollHeight - clientHeight;

                if (scrollableHeight > 0) {
                    scrollPercentage = scrollTop / scrollableHeight;
                }

                const elementRect = element.getBoundingClientRect();
                const containerRect = scrollContainer.getBoundingClientRect();
                const distanceFromBottom = containerRect.bottom - elementRect.bottom;
                const isElementBottomVisible = distanceFromBottom >= -200;

                if (isElementBottomVisible || scrollPercentage >= 0.9) {
                    scrollPercentage = 1;
                }
            }

            if (scrollPercentage >= threshold && !hasNotifiedRef.current) {
                const fileName = file.path.split('/').pop() || file.name || file.path;
                const count = incrementReadingCount(fileName);

                showReadingCompleteNotification(count, fileName).catch((error) => {
                    console.error('[useReadingTracker] 알림 표시 실패:', error);
                });

                hasNotifiedRef.current = true;
            }
        };

        const handleScroll = () => {
            hasScrolledRef.current = true;
            checkReadingComplete();
        };

        const scrollContainer = findScrollContainer();

        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        } else {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
            window.removeEventListener('scroll', handleScroll);
        };
    }, [contentRef, file, enabled, threshold]);
}
```

### 5. 회독 기록 관리

```javascript
// utils/readingHistory.js

const STORAGE_KEY = 'readingHistory';

export function getReadingHistory() {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const history = JSON.parse(stored);
        if (!Array.isArray(history)) return [];

        return history;
    } catch (error) {
        console.warn('[readingHistory] localStorage 읽기 실패:', error);
        return [];
    }
}

export function getReadingCount(fileName) {
    if (!fileName) return 0;

    const history = getReadingHistory();
    const record = history.find((r) => r.fileName === fileName);
    return record ? record.count : 0;
}

export function incrementReadingCount(fileName) {
    if (!fileName) return 0;

    const history = getReadingHistory();
    const existingIndex = history.findIndex((r) => r.fileName === fileName);

    if (existingIndex >= 0) {
        history[existingIndex].count += 1;
    } else {
        history.push({
            fileName: fileName,
            count: 1,
        });
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
        console.warn('[readingHistory] localStorage 저장 실패:', error);
    }

    return history[existingIndex >= 0 ? existingIndex : history.length - 1].count;
}
```

---

## 베스트 프랙티스

### 1. 권한 요청 타이밍

```javascript
// ❌ 나쁜 예: 페이지 로드 시 즉시 권한 요청
window.addEventListener('load', () => {
    Notification.requestPermission();
});

// ✅ 좋은 예: 사용자 액션 후 권한 요청
button.addEventListener('click', async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        showNotification('알림이 활성화되었습니다!');
    }
});
```

### 2. 알림 태그 활용

같은 종류의 알림은 태그를 사용하여 중복을 방지합니다:

```javascript
// 타이머 알림은 하나만 표시
new Notification('읽기 시간 알림', {
    body: '1분이 경과했습니다.',
    tag: 'reading-timer',
});

// 나중에 다른 시간 알림이 와도 이전 알림을 대체
new Notification('읽기 시간 알림', {
    body: '10분이 경과했습니다.',
    tag: 'reading-timer', // 이전 알림을 대체
});
```

### 3. 에러 처리

```javascript
try {
    const notification = new Notification(title, options);

    notification.onerror = (error) => {
        console.error('알림 오류:', error);
        // 대체 방법 제공 (예: 인앱 알림)
    };
} catch (error) {
    console.error('알림 생성 실패:', error);
    // Graceful degradation
}
```

### 4. 메모리 관리

```javascript
// 알림이 너무 많이 쌓이지 않도록 관리
const MAX_NOTIFICATIONS = 5;

function showNotificationWithLimit(title, options) {
    if (Notification.permission === 'granted') {
        // 기존 알림 확인 및 정리
        navigator.serviceWorker?.ready.then((registration) => {
            registration.getNotifications().then((notifications) => {
                if (notifications.length >= MAX_NOTIFICATIONS) {
                    notifications[0].close(); // 가장 오래된 알림 닫기
                }
            });
        });

        return new Notification(title, options);
    }
}
```

### 5. 사용자 경험 고려

```javascript
// 알림이 너무 자주 표시되지 않도록 제한
const lastNotificationTime = useRef(0);
const MIN_INTERVAL = 5000; // 5초

function showNotificationThrottled(title, options) {
    const now = Date.now();
    if (now - lastNotificationTime.current < MIN_INTERVAL) {
        return; // 너무 자주 표시하지 않음
    }

    lastNotificationTime.current = now;
    return new Notification(title, options);
}
```

---

## 브라우저 호환성

### 데스크탑 브라우저

| 브라우저 | 지원 버전 | 비고                        |
| -------- | --------- | --------------------------- |
| Chrome   | 22+       | 완전 지원                   |
| Firefox  | 22+       | 완전 지원                   |
| Safari   | 7+        | macOS만 지원 (iOS는 제한적) |
| Edge     | 14+       | 완전 지원                   |
| Opera    | 25+       | 완전 지원                   |

### 모바일 브라우저

| 플랫폼           | 지원 여부 | 비고                              |
| ---------------- | --------- | --------------------------------- |
| Android Chrome   | ✅        | 완전 지원                         |
| iOS Safari       | ⚠️        | 제한적 지원 (Service Worker 필요) |
| Samsung Internet | ✅        | 완전 지원                         |

### 기능별 호환성

```javascript
// 기능 감지
function checkNotificationSupport() {
    return {
        supported: 'Notification' in window,
        permission: 'Notification' in window ? Notification.permission : null,
        serviceWorker: 'serviceWorker' in navigator,
        persistent: 'Notification' in window && 'show' in Notification.prototype,
    };
}
```

### 폴백 처리

```javascript
function showNotificationWithFallback(title, options) {
    if ('Notification' in window && Notification.permission === 'granted') {
        // Web Notification API 사용
        return new Notification(title, options);
    } else {
        // 대체 방법: 인앱 알림 표시
        showInAppNotification(title, options.body);
    }
}
```

---

## 확장 가능성

### Service Worker와의 연계

Service Worker를 사용하면 브라우저가 닫혀 있어도 알림을 받을 수 있습니다:

```javascript
// service-worker.js
self.addEventListener('push', (event) => {
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: data.data,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});
```

### 푸시 알림 연동

```javascript
// 푸시 구독
async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });

    // 서버에 구독 정보 전송
    await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
```

### 알림 액션 버튼

```javascript
// Service Worker에서 액션 버튼 추가
self.registration.showNotification('새 메시지', {
    body: '새로운 메시지가 도착했습니다.',
    actions: [
        { action: 'view', title: '보기' },
        { action: 'dismiss', title: '닫기' },
    ],
    tag: 'message',
});

// 액션 클릭 처리
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(clients.openWindow('/messages'));
    }
});
```

### 데이터 확장

회독 기록에 추가 정보를 저장할 수 있습니다:

```javascript
// 확장된 데이터 구조
const readingHistory = [
    {
        fileName: 'intro.md',
        count: 3,
        lastRead: '2024-01-15T10:30:00Z',
        totalReadingTime: 1800, // 초 단위
        userId: 'user123', // 다중 사용자 지원
    },
];
```

---

## 주의사항 및 제한사항

### 1. HTTPS 필수

대부분의 브라우저에서 Web Notification API는 **HTTPS 환경**에서만 작동합니다. 로컬 개발 환경(`localhost`)에서는 예외적으로 HTTP에서도 작동합니다.

### 2. 사용자 동의 필수

알림은 사용자가 명시적으로 권한을 허용한 경우에만 표시할 수 있습니다. 권한이 거부되면 브라우저 설정에서만 변경할 수 있습니다.

### 3. 알림 위치 제어 불가

알림의 표시 위치는 **운영체제가 결정**합니다. 개발자가 직접 위치를 지정할 수 없습니다:

-   Windows: 기본적으로 우하단
-   macOS: 기본적으로 우상단
-   Linux: 배경에 따라 다름

### 4. 알림 개수 제한

일부 브라우저에서는 동시에 표시할 수 있는 알림 개수에 제한이 있을 수 있습니다.

### 5. 모바일 제한

iOS Safari에서는 Service Worker 없이는 백그라운드 알림이 불가능합니다.

---

## 트러블슈팅

### 알림이 표시되지 않는 경우

1. **권한 확인**

    ```javascript
    console.log('권한 상태:', Notification.permission);
    ```

2. **브라우저 지원 확인**

    ```javascript
    if (!('Notification' in window)) {
        console.error('이 브라우저는 Notification API를 지원하지 않습니다.');
    }
    ```

3. **HTTPS 확인**
    - 프로덕션 환경에서는 HTTPS 필수
    - 로컬 개발은 `localhost`에서 HTTP 허용

### 권한이 거부된 경우

사용자가 권한을 거부하면 브라우저 설정에서만 변경할 수 있습니다:

```javascript
if (Notification.permission === 'denied') {
    // 사용자에게 브라우저 설정에서 변경하도록 안내
    showMessage('알림 권한이 거부되었습니다. 브라우저 설정에서 변경해주세요.');
}
```

### 알림이 너무 자주 표시되는 경우

태그를 사용하여 중복을 방지하거나, 디바운싱/스로틀링을 적용합니다:

```javascript
const notificationCache = new Map();

function showNotificationThrottled(title, options) {
    const key = options.tag || title;
    const lastShown = notificationCache.get(key);
    const now = Date.now();

    if (lastShown && now - lastShown < 5000) {
        return; // 5초 이내에는 표시하지 않음
    }

    notificationCache.set(key, now);
    return new Notification(title, options);
}
```

---

## 참고 자료

-   [MDN Web Docs - Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notification)
-   [W3C Notification API Specification](https://notifications.spec.whatwg.org/)
-   [Can I Use - Notifications](https://caniuse.com/notifications)
-   [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)

---

## 결론

Web Notification API는 웹 애플리케이션에 네이티브 앱과 유사한 알림 기능을 제공하는 강력한 도구입니다. 적절한 권한 관리, 사용자 경험 고려, 그리고 확장 가능한 구조 설계를 통해 효과적으로 활용할 수 있습니다.

이 프로젝트에서는 문서 회독 추적과 타이머 알림 기능을 구현하여, 사용자가 문서를 읽는 동안 유용한 피드백을 제공하고 있습니다. 이러한 패턴은 다른 웹 애플리케이션에도 적용할 수 있습니다.
