# Expo 개발 가이드 문서

## 📋 개요
Expo는 React Native 기반 크로스플랫폼 모바일/웹 앱 개발 프레임워크로, 복잡한 네이티브 환경 설정 없이 JavaScript 하나로 iOS/Android/웹을 동시 개발할 수 있습니다.

---

## 🎯 주요 특징

### 1. 간편한 시작
- **빠른 설치**: `npx create-expo-app` 한 명령어로 프로젝트 생성
- **네이티브 환경 불필요**: Xcode, Android Studio 설정 없이 개발 시작
- **즉시 테스트**: Expo Go 앱으로 QR 코드 스캔하여 실시간 테스트

### 2. 풍부한 SDK
Expo에서 제공하는 기본 모듈로 네이티브 기능 구현:
- 카메라, 갤러리, 이미지 피커
- GPS 위치 정보
- 푸시 알림
- 파일 시스템 접근
- 기기 센서 (가속도계, 자이로스코프)
- 오디오/비디오 재생

### 3. 크로스플랫폼 지원
- **단일 코드베이스**: 한 번의 코드 작성으로 iOS/Android/웹 동시 지원
- **React Native for Web**: 네이티브 컴포넌트(`<View>`, `<Text>`)가 웹에서도 동작

### 4. OTA (Over-The-Air) 업데이트
- 앱스토어 승인 대기 없이 JavaScript 코드 실시간 배포
- 사용자는 자동으로 최신 버전 수신

### 5. 빠른 개발 속도
- **Hot Reload**: 파일 저장 시 앱 자동 새로고침
- **Fast Refresh**: 상태 유지하며 변경사항 즉시 반영
- **통합 CLI**: 복잡한 설정 없이 개발 환경 자동 관리

---

## 🔧 개발 환경 설정 (Windows + Cursor IDE)

### 사전 요구사항
```bash
# Node.js LTS (20.x 이상)
node -v
npm -v

# Git
git --version
```

### 프로젝트 생성
```bash
# 1. GitHub Repository 생성
git clone https://github.com/[username]/[project-name].git
cd [project-name]

# 2. Expo 프로젝트 초기화
npx create-expo-app@latest . --template blank-typescript
npx expo install

# 3. 개발 시작
npx expo start
```

### Cursor IDE 설정
- Expo Tools 플러그인 설치
- `Ctrl+Shift+P` → "Expo: Start" 명령어 사용 가능

---

## 🚀 배포 과정

### 웹 배포 (가장 간단)
```bash
# 1. 개발 중 테스트
npx expo start --web

# 2. 프로덕션 배포
eas deploy

# 결과: Expo Hosting에 자동 배포
# - 커스텀 도메인 지원
# - SSL 인증서 자동 적용
# - CDN으로 빠른 로딩
```

### 모바일 배포 (iOS/Android)
```bash
# 1. 클라우드 빌드
eas build --platform all

# 2. 앱스토어 자동 제출
eas submit --platform ios
eas submit --platform android

# 또는 수동으로 빌드 파일(.apk/.ipa) 다운로드
```

### OTA 업데이트
```bash
# JavaScript 코드만 즉시 배포 (앱스토어 재승인 불필요)
eas update
```

---

## 💡 개발 워크플로우

### 로컬 개발
```
1. npx expo start
2. Expo Go 앱 또는 웹브라우저에서 QR 스캔/접속
3. 코드 수정 → 자동 리로드 (Fast Refresh)
4. 테스트
```

### 배포
```
로컬 개발 완료
    ↓
Git Push (main 브랜치)
    ↓
eas build (모바일)
    ↓
eas deploy (웹) / eas submit (앱스토어)
    ↓
배포 완료 (웹은 즉시, 모바일은 2-24시간 후)
```

---

## ✅ 장점 요약

| 구분 | 설명 |
|------|------|
| **개발 속도** | 3-5배 빠른 개발 (환경 설정 최소화) |
| **학습곡선** | JavaScript만으로 앱 개발 가능 |
| **배포 용이** | 한 명령어로 웹+모바일 동시 배포 |
| **유지보수** | OTA 업데이트로 버그 수정 즉시 배포 |
| **비용** | Expo Hosting 무료 플랜 제공 |
| **팀 협업** | Expo Go로 다른 팀원 실시간 테스트 가능 |

---

## ⚠️ 제약사항 및 고려사항

### Managed Workflow 제약
- **커스텀 네이티브 모듈**: 기본 Expo SDK에 없는 기능은 development build 필요
- **특정 네이티브 라이브러리**: 일부 React Native 패키지 미지원

### 해결 방법
- **Development Build**: `eas build --dev-client` 로 커스텀 네이티브 모듈 추가 가능
- **Bare React Native 전환**: 필요 시 `expo prebuild` 후 네이티브 프로젝트로 전환 가능

### 우리 프로젝트 (Firebase + 요구사항 테이블)
✅ **Expo Managed Workflow 완전 지원 가능**
- Firebase JS SDK로 인증, Firestore, Storage 구현
- 테이블 UI는 React Native 기본 컴포넌트로 충분
- 네이티브 모듈 의존성 없음

---

## 📚 참고 자료

- **공식 문서**: https://docs.expo.dev
- **Firebase 연동**: https://docs.expo.dev/guides/using-firebase/
- **웹 개발**: https://docs.expo.dev/workflow/web/
- **EAS 배포**: https://docs.expo.dev/eas/

---

## 🎓 팀 체크리스트

- [ ] Node.js LTS 설치 완료
- [ ] Git 설정 완료
- [ ] Cursor IDE 설정 완료
- [ ] Expo 프로젝트 생성 완료
- [ ] Expo Go 앱 설치 완료 (iOS/Android)
- [ ] 로컬 개발 환경 테스트 완료
- [ ] Firebase 프로젝트 생성 완료
- [ ] GitHub Repository 설정 완료
- [ ] EAS 계정 설정 완료 (배포 시)

---

**작성일**: 2025-12-03  
**담당**: 개발팀  
**상태**: 활성화
