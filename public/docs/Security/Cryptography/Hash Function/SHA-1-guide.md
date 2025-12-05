# SHA-1 이해와 모바일 앱 개발에서의 활용

## 1. SHA-1 기초 개념

### 1.1 SHA-1이란 무엇인가?

**SHA-1(Secure Hash Algorithm 1)**은 미국 국가안보국(NSA)이 설계하고 NIST(National Institute of Standards and Technology)에서 표준화한 암호화 해시 함수입니다. 임의 길이의 입력 데이터를 받아서 항상 **160비트(20바이트)** 길이의 고정된 해시 값(메시지 다이제스트)을 생성합니다.

```
입력: "hello world" → SHA-1 → 2aae6c35c94fcfb415dbe95f408b9ce91ee846ed (40자리 16진수)
입력: "hello" → SHA-1 → aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d (40자리 16진수)
```

### 1.2 해시 함수의 특성

SHA-1은 다음과 같은 특성을 가집니다:

- **단방향성(One-way)**: 해시값에서 원본 입력을 역산할 수 없습니다
- **결정성(Deterministic)**: 동일한 입력은 항상 동일한 해시값을 생성합니다
- **눈사태 효과(Avalanche Effect)**: 입력의 작은 변화(1비트)도 해시값을 완전히 다르게 만듭니다
- **충돌 저항성(Collision Resistance)**: 서로 다른 입력이 같은 해시값을 가질 확률은 극히 낮습니다(이론상)

### 1.3 SHA-1의 역사와 현재 상태

SHA-1은 1995년 발표되어 2000년대 초반 TLS/SSL, Git, 디지털 서명 등 다양한 분야에서 광범위하게 사용되었습니다. 그러나 2005년 왕샤오유엔(Wang Xiaoyun) 등 연구진이 SHA-1의 충돌 공격을 발표하면서 보안 위협이 대두되었고, 2017년 구글이 실제 SHA-1 해시 충돌(SHAttered 프로젝트)을 생성하면서 결정적으로 취약함이 증명되었습니다.

현재는 **SHA-256(SHA-2 계열)** 또는 **SHA-3**로 대체되고 있으며, 주요 기관들이 SHA-1 지원을 종료하고 있습니다:
- TLS 1.3에서 SHA-1 제거
- Git이 SHA-256으로 전환 중
- 브라우저의 HTTPS 인증서에서 SHA-1 거부

---

## 2. 모바일 앱 개발에서의 SHA-1 역할

### 2.1 Android 앱 서명(App Signing)

Android 앱은 배포 전에 개발자의 private key로 디지털 서명을 해야 합니다. 이 서명 인증서로부터 생성된 SHA-1 지문은 앱의 신원을 나타내는 독특한 식별자 역할을 합니다.

```
Keystore(개인키 저장소)
  └─ Debug Key (debug.keystore)
       └─ SHA-1 fingerprint: 12:34:56:78:... (development용)
  
  └─ Release Key (release.keystore)
       └─ SHA-1 fingerprint: AB:CD:EF:12:... (production용)
```

### 2.2 Expo에서의 SHA-1 관리

Expo는 managed workflow 또는 bare workflow에서 다음과 같이 SHA-1을 관리합니다:

**Managed Workflow:**
- EAS(Expo Application Services)가 빌드 시 자동으로 keystore를 생성/관리
- 초기 `eas build --platform android`를 실행하면 내부적으로 keystore 생성
- `expo fetch:android:hashes` 또는 `eas credentials` 명령으로 SHA-1/SHA-256 확인 가능

**Bare Workflow:**
- `android/app/build.gradle`에서 signingConfigs 직접 설정
- `./gradlew signingReport` 실행하여 debug/release 지문 확인

### 2.3 Google OAuth 등록 프로세스

Expo 앱에서 구글 소셜 로그인을 구현하려면:

1. **Google Cloud Console** → OAuth 2.0 Client ID 생성
2. **클라이언트 유형 선택**: Android 선택
3. **패키지 이름 입력**: `com.example.myapp` (app.json의 android.package)
4. **SHA-1 지문 등록**: 위에서 생성한 debug/release SHA-1값 입력
5. **Client ID 생성**: 제공된 Client ID를 앱에 통합

### 2.4 다른 구글 서비스와의 연동

SHA-1 지문은 다음 서비스들과의 연동에 필수입니다:

| 서비스 | 용도 | 설명 |
|------|------|------|
| Google Maps SDK | 지도 API 키 | 앱 신원 검증 |
| Google Play Services | FCM, Auth | 푸시 알림, 인증 |
| Firebase | Realtime DB, Cloud Storage | 백엔드 서비스 |
| Google Sign-In | OAuth 로그인 | 소셜 로그인 |

---

## 3. SHA-1 지문 생성 방법

### 3.1 Expo CLI를 이용한 방법 (추천)

가장 간단한 방법입니다:

```bash
expo fetch:android:hashes
```

출력 예시:
```
Android Keystore SHA-1 Fingerprint:
  Debug: 12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78
  Release: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12

SHA-256:
  Debug: ABCDEF0123456789...
  Release: 123456789ABCDEF0...
```

### 3.2 keytool 명령어를 이용한 방법

JDK에 포함된 `keytool` 유틸리티로 직접 생성:

**Debug 키(개발용):**
```bash
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

**Release 키(배포용):**
```bash
keytool -list -v -keystore /path/to/release.keystore \
  -alias your_alias \
  -storepass your_storepass \
  -keypass your_keypass
```

출력에서 "SHA1" 또는 "SHA-1" 행을 찾으면 됩니다.

### 3.3 Android Studio Gradle Report

Android Studio IDE를 사용하는 경우:

```bash
cd android
./gradlew signingReport
```

또는 Android Studio UI에서:
1. Build → Analyze APK
2. 서명 정보에서 SHA-1 확인

### 3.4 EAS CLI를 이용한 방법

Expo EAS 관리 프로젝트의 경우:

```bash
eas credentials
```

인터랙티브 메뉴에서 Android 선택 후 SHA-1 정보 확인

---

## 4. SHA-1 지문 관리 베스트 프랙티스

### 4.1 키 저장소(Keystore) 관리

**Debug Keystore:**
- 자동으로 `~/.android/debug.keystore`에 생성
- 개발 테스트용으로만 사용
- 버전 관리에서 제외할 필요 없음 (자동 재생성 가능)
- 비밀번호: `android` (기본값)

**Release Keystore:**
- 배포용 개인 키로 반드시 **보안 관리** 필요
- **절대 Git에 커밋하면 안 됨** (.gitignore 추가)
- 백업 관리: 안전한 저장소(물리 저장소, 암호화된 드라이브) 보관
- 분실 시 Google Play Store에 새 버전 업로드 불가능 (중요함)

```gitignore
# .gitignore
android/app/release.keystore
android/app/*.keystore
*.jks
*.keystore
.env*
```

### 4.2 환경별 키 분리

프로젝트가 커지면 다양한 빌드 환경이 필요합니다:

```
keys/
  ├─ debug/
  │   └─ debug.keystore (자동생성, 공유 가능)
  ├─ staging/
  │   └─ staging-release.keystore (비공개)
  └─ production/
      └─ production-release.keystore (극비)
```

각 환경별 `android/app/build.gradle` 설정:

```gradle
signingConfigs {
    debug {
        keyAlias 'androiddebugkey'
        keyPassword 'android'
        storeFile file('~/.android/debug.keystore')
        storePassword 'android'
    }
    release {
        keyAlias project.hasProperty('releaseKeyAlias') ? 
            project.releaseKeyAlias : System.getenv('RELEASE_KEY_ALIAS')
        keyPassword project.hasProperty('releaseKeyPassword') ? 
            project.releaseKeyPassword : System.getenv('RELEASE_KEY_PASSWORD')
        storeFile project.hasProperty('releaseStoreFile') ? 
            file(project.releaseStoreFile) : file(System.getenv('RELEASE_STORE_FILE'))
        storePassword project.hasProperty('releaseStorePassword') ? 
            project.releaseStorePassword : System.getenv('RELEASE_STORE_PASSWORD')
    }
}
```

### 4.3 CI/CD 파이프라인 통합

GitHub Actions 예시:

```yaml
name: Build Android Release

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
      
      - name: Create keystore
        run: |
          echo "${{ secrets.RELEASE_KEYSTORE }}" | base64 -d > android/app/release.keystore
      
      - name: Build APK
        run: |
          cd android
          ./gradlew assembleRelease \
            -Pandroid.injected.signing.store.file=app/release.keystore \
            -Pandroid.injected.signing.store.password=${{ secrets.RELEASE_STORE_PASSWORD }} \
            -Pandroid.injected.signing.key.alias=${{ secrets.RELEASE_KEY_ALIAS }} \
            -Pandroid.injected.signing.key.password=${{ secrets.RELEASE_KEY_PASSWORD }}
      
      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJson: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: com.example.myapp
          releaseFiles: 'android/app/build/outputs/apk/release/*.apk'
          track: production
```

### 4.4 Google Cloud Console 등록 관리

- **Debug SHA-1**: 개발 중 테스트용 (여러 명 가능)
- **Release SHA-1**: 프로덕션 배포용 (신중하게 관리)
- **Google Play App Signing SHA-1**: Play Console의 '앱 무결성' 탭에서 별도 등록 필요

```
Google Cloud Console (OAuth)
  ├─ Debug SHA-1: 12:34:56:...
  └─ Release SHA-1: AB:CD:EF:...

Google Play Console (앱 서명)
  └─ Play App Signing SHA-1: 98:76:54:...
```

---

## 5. 보안 고려사항

### 5.1 SHA-1의 취약성과 대안

SHA-1은 더 이상 보안 해시함수로 권장되지 않습니다:

- **충돌 공격 가능**: 다른 입력이 같은 해시값을 가질 수 있음
- **단계적 제거**: 2024년 이후 주요 서비스에서 SHA-1 지원 종료 예정
- **대안**: SHA-256, SHA-512 (SHA-2 계열) 또는 SHA-3 사용

따라서 모바일 앱에서도 **SHA-1과 함께 SHA-256도 등록**하는 것이 권장됩니다.

### 5.2 다중 등록 문제 (Firebase)

Firebase에서 같은 패키지명과 SHA-1을 가진 여러 OAuth 클라이언트를 등록하면 충돌이 발생합니다:

```
Error: The package name and SHA-1 fingerprint combination is already 
registered with a different Google account
```

**해결 방법:**
- 새로운 Firebase 프로젝트 생성
- 또는 기존 클라이언트 제거 후 재등록
- 개발/스테이징/프로덕션 환경별로 별도 프로젝트 사용

### 5.3 키 분실 대응

Release 키를 분실한 경우:

1. **Play Store 앱 서명 사용 시**: Play Console에서 업로드 키로 재생성 가능 (2022년 이후 신규 앱)
2. **레거시 서명 시**: 앱을 재발행하거나 패키지명 변경 필요
3. **예방 방법**: GitHub Secrets, 1Password, AWS Secrets Manager 등으로 암호화된 백업 유지

---

## 6. 실무 예시: Expo + 구글 소셜 로그인 완전 가이드

### 6.1 프로젝트 초기화

```bash
expo init MyApp --template
cd MyApp

# Google Play 버전 코드 설정
npm install expo-google-app-auth
```

### 6.2 SHA-1 생성 및 확인

```bash
expo fetch:android:hashes
# 출력: Debug SHA-1 및 Release SHA-1 확인
```

### 6.3 Google Cloud Console 설정

1. GCP Console 접속
2. OAuth 동의 화면 구성 (User Type: External)
3. OAuth 2.0 Client ID 생성
   - 애플리케이션 유형: Android
   - 패키지 이름: `com.example.myapp` (app.json에서 확인)
   - SHA-1 지문: 위에서 생성한 debug/release 값 입력
4. Client ID 생성 및 저장

### 6.4 앱 코드 작성

```javascript
import * as Google from 'expo-google-app-auth';

const handleGoogleLogin = async () => {
  try {
    const result = await Google.logInAsync({
      iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
      androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
      androidStandaloneAppClientId: 'YOUR_ANDROID_STANDALONE_CLIENT_ID.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    });

    if (result.type === 'success') {
      console.log('Login successful:', result.user);
      return result.idToken;
    }
  } catch (e) {
    console.error('Google login error:', e);
  }
};
```

### 6.5 app.json 설정

```json
{
  "app": {
    "name": "MyApp",
    "slug": "myapp",
    "version": "1.0.0",
    "assetBundlePatterns": ["**/*"],
    "android": {
      "package": "com.example.myapp",
      "versionCode": 1,
      "permissions": []
    }
  }
}
```

---

## 7. 트러블슈팅

### 7.1 "Invalid package name" 오류
- app.json의 android.package가 Google Console에 등록한 패키지명과 동일한지 확인

### 7.2 "SHA-1 not registered" 오류
- `expo fetch:android:hashes`로 최신 SHA-1 확인
- Google Console에 정확히 같은 형식(콜론 포함)으로 입력되었는지 확인

### 7.3 Google Play App Signing과의 불일치
- Google Play로 배포할 때 자동 서명 사용 시, Play Console의 '앱 무결성' 탭에서 플레이 앱 서명 키의 SHA-1을 별도 등록 필요

---

## 요약

SHA-1은 Android 앱의 신원을 검증하는 암호화 해시 함수로, Expo에서 구글 소셜 로그인 등 서비스 연동 시 필수적입니다. 개발자는 `expo fetch:android:hashes` 같은 CLI 도구로 debug/release 키의 SHA-1 지문을 생성하고, Google Cloud Console에 등록해야 합니다. 보안 측면에서는 release 키를 엄격하게 관리하고, SHA-1의 취약성을 대비해 SHA-256도 함께 사용하는 것이 권장됩니다. CI/CD 파이프라인에서는 환경 변수와 GitHub Secrets를 활용해 안전하게 관리해야 합니다.