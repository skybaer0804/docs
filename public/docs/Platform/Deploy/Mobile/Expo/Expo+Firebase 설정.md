# Expo + Firebase 설정 가이드 (2025)

## 1. Firebase 프로젝트 준비

Firebase 콘솔 → 새 프로젝트 생성 → 웹 앱(</>) 등록 → config 복사

## 2. Expo 프로젝트 설정

### Firebase 설치

```bash
npx expo install firebase
```

### Metro 설정 (firebase .cjs 지원)

```bash
npx expo install @expo/metro-config
```

`metro.config.js` (루트 디렉토리):

```javascript
const { getDefaultConfig } = require('@expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
module.exports = config;
```

## 3. 환경변수 설정

`.env.development`:

```text
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx
FIREBASE_PROJECT_ID=xxx
FIREBASE_STORAGE_BUCKET=xxx
FIREBASE_MESSAGING_SENDER_ID=xxx
FIREBASE_APP_ID=xxx
FIREBASE_MEASUREMENT_ID=G-xxx
```

## 4. firebaseApp.ts (핵심 파일)

```typescript
import { initializeApp, FirebaseApp, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

export let app: FirebaseApp;
let analyticsInstance: any = null;

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY!,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.FIREBASE_PROJECT_ID!,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.FIREBASE_APP_ID!,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID!,
};

try {
    app = getApp('app');
} catch (e) {
    app = initializeApp(firebaseConfig, 'app');
}

export async function initializeAnalytics() {
    if (!analyticsInstance && (typeof document !== 'undefined' || typeof window !== 'undefined')) {
        try {
            if (await isSupported()) {
                analyticsInstance = getAnalytics(app);
                console.log('✅ Analytics 초기화 완료');
            }
        } catch (error) {
            console.warn('Analytics 스킵:', error);
        }
    }
    return analyticsInstance;
}

export default app;
```

## 5. App.tsx 초기화

```typescript
import { useEffect } from 'react';
import { initializeAnalytics } from './firebaseApp';
import { logEvent } from 'firebase/analytics';

export default function App() {
    useEffect(() => {
        initializeAnalytics().then((analytics) => {
            if (analytics) logEvent(analytics, 'app_start');
        });
    }, []);
    return <YourApp />;
}
```

## 6. 실행 & 테스트

```bash
npx expo start --clear
```

### 확인사항:

-   ✅ 콘솔: ✅ Analytics 초기화 완료
-   ✅ Firestore: test/status 문서 생성 테스트
-   ✅ .gitignore: .env\* 추가
