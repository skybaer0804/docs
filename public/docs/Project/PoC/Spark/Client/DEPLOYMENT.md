# Spark Messaging Client SDK - 배포 가이드

## 목차

1. [npm 배포 준비](#npm-배포-준비)
2. [배포 전 체크리스트](#배포-전-체크리스트)
3. [배포 절차](#배포-절차)
4. [버전 관리](#버전-관리)
5. [배포 후 확인](#배포-후-확인)

---

## npm 배포 준비

### 1. package.json 확인

**필수 필드 확인**:

-   `name`: 패키지 이름 (고유해야 함)
-   `version`: 버전 번호
-   `description`: 패키지 설명
-   `main`: CommonJS 진입점
-   `module`: ES Module 진입점
-   `types`: TypeScript 타입 정의
-   `files`: npm에 포함될 파일 목록

**현재 설정**:

```json
{
    "name": "@skybaer0804/spark-messaging-client",
    "version": "1.0.1",
    "main": "dist/index.js",
    "module": "dist/index.esm.js",
    "types": "dist/index.d.ts",
    "files": ["dist", "README.md"]
}
```

### 2. 빌드 확인

```bash
# 빌드 실행
npm run build

# 빌드된 파일 확인
ls dist/
```

**확인 사항**:

-   `dist/index.js` (CommonJS)
-   `dist/index.esm.js` (ES Module)
-   `dist/index.d.ts` (TypeScript 타입 정의)
-   모든 타입 정의 파일 (`*.d.ts`)

### 3. .npmignore 확인

`.npmignore` 파일에 의해 다음 파일들이 제외됩니다:

-   `src/` (소스 코드)
-   `test/` (테스트 파일)
-   `examples/` (예제 파일)
-   설정 파일들

**포함되는 파일**:

-   `dist/` (빌드된 파일)
-   `README.md`

---

## 배포 전 체크리스트

### 코드 품질

-   [ ] 타입 체크 통과: `npx tsc --noEmit`
-   [ ] 빌드 성공: `npm run build`
-   [ ] 테스트 통과: `npm run test:sdk`
-   [ ] 린트 에러 없음

### 문서

-   [ ] README.md 업데이트됨
-   [ ] API 문서 정확함
-   [ ] 사용 예제 정확함
-   [ ] 변경사항 문서화됨

### 버전 관리

-   [ ] 버전 번호 업데이트
-   [ ] CHANGELOG 작성 (선택사항)

---

## 배포 절차

### 1. 버전 업데이트

**Semantic Versioning**:

-   **PATCH** (1.0.0 → 1.0.1): 버그 수정
-   **MINOR** (1.0.0 → 1.1.0): 새로운 기능 추가 (하위 호환)
-   **MAJOR** (1.0.0 → 2.0.0): Breaking changes

**package.json 수정**:

```json
{
    "version": "1.0.1" // 버전 업데이트
}
```

### 2. 빌드 및 테스트

```bash
# 빌드
npm run build

# 테스트
npm run test:sdk
```

### 3. npm 로그인

```bash
npm login
```

**필요 정보**:

-   npm 계정 사용자명
-   비밀번호
-   이메일
-   OTP (2FA 활성화 시)

### 4. 배포

**Scoped Package (`@username/package-name`)인 경우**:

```bash
npm publish --access public
```

또는 `package.json`에 `publishConfig` 추가:

```json
{
    "publishConfig": {
        "access": "public"
    }
}
```

그 후 일반 배포:

```bash
npm publish
```

**일반 Package인 경우**:

```bash
npm publish
```

**자동 실행**:

-   `prepublishOnly` 스크립트가 자동으로 빌드를 실행합니다

### 5. 배포 확인

```bash
# 패키지 정보 확인
npm view @skybaer0804/@skybaer0804/spark-messaging-client

# 설치 테스트
npm install @skybaer0804/@skybaer0804/spark-messaging-client
```

---

## 버전 관리

### 버전 업데이트 예시

**PATCH 버전** (버그 수정):

```bash
# package.json에서 버전 수정
"version": "1.0.1"

# 배포
npm publish
```

**MINOR 버전** (새 기능):

```bash
"version": "1.1.0"
npm publish
```

**MAJOR 버전** (Breaking changes):

```bash
"version": "2.0.0"
npm publish
```

### 버전 태그

**기본 태그**:

-   `latest`: 기본 태그 (최신 안정 버전)
-   `beta`: 베타 버전
-   `alpha`: 알파 버전

**베타 버전 배포**:

```bash
npm publish --tag beta
```

**특정 버전 설치**:

```bash
npm install @skybaer0804/spark-messaging-client@1.0.1
npm install @skybaer0804/spark-messaging-client@beta
```

---

## 배포 후 확인

### 1. npm 레지스트리 확인

```bash
npm view @skybaer0804/spark-messaging-client
```

**확인 사항**:

-   버전 번호
-   설명
-   파일 목록
-   의존성

### 2. 설치 테스트

**새 프로젝트에서 테스트**:

```bash
mkdir test-install
cd test-install
npm init -y
npm install @skybaer0804/spark-messaging-client

# 사용 테스트
node -e "const SDK = require('@skybaer0804/spark-messaging-client'); console.log(SDK);"
```

### 3. 문서 확인

-   npm 패키지 페이지에서 README 확인
-   설치 가이드 확인
-   사용 예제 확인

---

## 배포 취소 (배포 실수 시)

### 24시간 이내

```bash
npm unpublish @skybaer0804/spark-messaging-client@1.0.1
```

**주의**:

-   24시간 이내에만 가능
-   같은 버전은 다시 배포 불가
-   신중하게 사용

### 대안: 새 버전 배포

```bash
# 버그 수정 버전 배포
"version": "1.0.2"
npm publish
```

---

## 보안 고려사항

### npm 보안

1. **2FA 활성화**: npm 계정에 2단계 인증 활성화
2. **토큰 관리**: npm 토큰을 안전하게 관리
3. **의존성 점검**: `npm audit` 실행

### 패키지 보안

1. **민감한 정보 제외**: `.npmignore`로 소스 코드 제외
2. **의존성 최소화**: 필요한 의존성만 포함
3. **정기 업데이트**: 보안 패치가 있는 경우 즉시 업데이트

---

## 트러블슈팅

### 배포 실패

**에러**: `403 Forbidden`

-   **원인**: npm 로그인 필요 또는 권한 없음
-   **해결**: `npm login` 실행

**에러**: `400 Bad Request`

-   **원인**: 패키지 이름 중복 또는 버전 중복
-   **해결**: 패키지 이름 변경 또는 버전 업데이트

**에러**: `404 Not Found`

-   **원인**: 패키지가 존재하지 않음
-   **해결**: 패키지 이름 확인

---

이 가이드를 따라 npm에 SDK를 배포할 수 있습니다.
