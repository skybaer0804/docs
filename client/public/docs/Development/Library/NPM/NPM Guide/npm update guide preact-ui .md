# MUI처럼 Preact UI 컴포넌트를 NPM 라이브러리화하기

## 📌 목표
당신의 Preact UI 컴포넌트들을 **@your-npm-id/ui** 형태로 NPM에 배포하기 (MUI처럼!)

---

## 📚 제공된 문서들

### 1. **Quick_Start_Summary.md** ⭐ 여기서 시작!
- 가장 빠른 시작 가이드
- 5단계 체크리스트
- 예상 소요 시간: 2-3시간
- **👉 이 문서부터 읽으세요**

### 2. **NPM_Library_Setup_Roadmap.md**
- 전체 구조와 개념 설명
- Phase별 상세 설명
- 왜 각 단계가 필요한지 설명
- 이미지 포함 (구조도)

### 3. **Implementation_Guide.md**
- 단계별 실행 명령어
- 코드 예제
- 트러블슈팅
- GitHub Actions 설정

### 4. **File_Templates.md**
- 모든 필수 파일의 완전한 템플릿
- 복사해서 바로 사용 가능
- 각 파일별 상세 설명

### 5. **setup_scripts.sh**
- 자동 설정 스크립트
- 대부분의 파일을 자동 생성
- 인터활 셋업 지원

---

## 🚀 가장 빠른 시작 (3가지 방법)

### 방법 1️⃣: 자동 스크립트 (가장 빠름, 추천!)
```bash
bash setup_scripts.sh
# 패키지명, NPM ID 등 입력하면 자동 생성
```

### 방법 2️⃣: 수동 설정 (권장, 이해하면서 진행)
1. `Quick_Start_Summary.md` 읽기
2. 각 단계별 파일 생성 (템플릿은 `File_Templates.md`에서)
3. 명령어 실행

### 방법 3️⃣: 상세 학습
1. `NPM_Library_Setup_Roadmap.md`로 전체 구조 이해
2. `Implementation_Guide.md`로 단계별 진행
3. 필요시 `File_Templates.md` 참고

---

## 📊 대략적인 진행 시간

| 단계 | 작업 | 시간 |
|------|------|------|
| 1 | 기본 파일 생성 | 30분 |
| 2 | 빌드 시스템 설정 | 1시간 |
| 3 | 코드 정리 | 1시간 |
| 4 | 로컬 테스트 | 30분 |
| 5 | NPM 배포 | 30분 |
| **총합** | | **3-4시간** |

---

## 🎯 현재 상태 분석

당신은 이미 가지고 있는 것들:
```
✅ UI 컴포넌트 (Accordion.tsx 등)
✅ 디자인 토큰 (styles/tokens/)
✅ ThemeProvider (테마 시스템)
✅ TypeScript
✅ Preact
✅ NPM 계정
```

필요한 것들:
```
❌ package.json (올바른 exports 설정)
❌ 빌드 시스템 (esbuild)
❌ 타입 정의 파일
❌ 디렉토리 구조 정리
❌ CI/CD 설정 (GitHub Actions)
```

---

## 💡 핵심 개념

### 1. ESM vs CJS
- **ESM** (index.esm.js): 모던 JavaScript, Tree-shaking 가능
- **CJS** (index.js): 이전 Node.js 호환

### 2. Exports 필드
```json
"exports": {
  ".": {
    "import": "./dist/index.esm.js",
    "require": "./dist/index.js"
  }
}
```
→ 사용자가 `import` 또는 `require`로 선택해서 가져갈 수 있음

### 3. Tree-shaking
```typescript
// 사용자가 이렇게 하면
import { Accordion } from '@your-npm-id/ui';

// 필요한 것만 번들에 포함됨 (ESM 덕분)
```

### 4. 타입 정의
- TypeScript 사용자를 위해 `.d.ts` 파일 제공
- IntelliSense/자동완성 지원

---

## 📦 배포 후 사용자 경험

```bash
# 설치
npm install @your-npm-id/ui preact

# 사용
import { Accordion, Button, ThemeProvider } from '@your-npm-id/ui';
import '@your-npm-id/ui/styles';
```

---

## 🔄 버전 관리 (Semantic Versioning)

```
0.1.0     Major . Minor . Patch
```

- **Major**: 큰 변경 (Breaking changes) - 1.0.0 이상
- **Minor**: 새 기능 (하위 호환) - 0.2.0
- **Patch**: 버그 수정 - 0.1.1

**첫 배포**: `0.1.0`

---

## 📚 단계별 가이드

### Step 1: 기본 설정 (30분)
```bash
# 폴더 생성
mkdir -p src/{components,context,styles}

# 파일 생성 (File_Templates.md에서 복사)
# - package.json
# - tsconfig.json
# - build.ts
# - README.md
# - LICENSE
# - .npmignore
```

### Step 2: 빌드 시스템 (1시간)
```bash
npm install

npm run build
# dist/ 폴더 생성 확인
```

### Step 3: 코드 정리 (1시간)
```bash
# 기존 파일들을 src/ 구조로 옮기기
mv src/ui-component/* src/components/
mv src/context/* src/context/
mv src/styles/* src/styles/

# src/index.ts 생성 (엔트리 포인트)
```

### Step 4: 로컬 테스트 (30분)
```bash
npm link

# 다른 프로젝트에서
npm link @your-npm-id/ui
```

### Step 5: 배포 (30분)
```bash
npm login
npm publish
```

---

## 🐛 자주 하는 실수

### ❌ 실수 1: package.json 이름 오류
```json
// ❌ 잘못됨
"name": "your-ui"

// ✅ 올바름 (scoped package)
"name": "@your-npm-id/ui"
```

### ❌ 실수 2: 빌드 결과 무시
```bash
# ❌ dist/ 폴더가 없어도 진행하면 안됨
npm publish

# ✅ 반드시 확인
npm run build
ls dist/
```

### ❌ 실수 3: 로그인 안됨
```bash
npm whoami
# 로그인 안되면
npm login
```

### ❌ 실수 4: 타입 정의 누락
```bash
# ✅ 타입 체크
npm run type-check

# ✅ 빌드 후 확인
ls dist/index.d.ts
```

---

## ✅ 최종 체크리스트

배포 직전 확인사항:

```
[ ] package.json
    [ ] "name": "@your-npm-id/ui"
    [ ] "version": "0.1.0"
    [ ] "exports" 필드 있음
    [ ] "peerDependencies": { "preact": "^10.0.0" }

[ ] tsconfig.json
    [ ] "jsx": "react-jsx"
    [ ] "jsxImportSource": "preact"
    [ ] "declaration": true

[ ] build.ts
    [ ] ESM 빌드
    [ ] CJS 빌드
    [ ] 타입 정의 생성

[ ] src/index.ts (엔트리)
    [ ] 컴포넌트 export
    [ ] ThemeProvider export
    [ ] 스타일 import

[ ] npm run build
    [ ] 성공
    [ ] dist/ 폴더 생성
    [ ] 4가지 파일 있음 (esm, cjs, d.ts, css)

[ ] npm publish --dry-run
    [ ] 성공

[ ] npm login
    [ ] 로그인 성공

[ ] npm publish
    [ ] 배포 성공!
```

---

## 📞 문제 해결

### Q: "Cannot find module 'preact'"
A: peerDependencies 설정 확인
```json
"peerDependencies": {
  "preact": "^10.0.0"
}
```

### Q: "Type definitions not generated"
A: tsconfig.json 확인
```json
"declaration": true,
"emitDeclarationOnly": false
```

### Q: "SCSS 컴파일 에러"
A: @use 경로 확인
```scss
// ✅ 올바름
@use '/src/styles/tokens/index';

// ❌ 틀림
@import '../styles/tokens/index';
```

### Q: "패키지가 이미 존재"
A: 다른 이름으로 변경
```json
"name": "@your-npm-id/my-ui"
```

---

## 💡 Pro Tips

### 1. 배포 전 파일 크기 확인
```bash
npm run build
du -sh dist/
# 50KB 미만이면 좋음
```

### 2. 버전 업데이트 자동화
```bash
npm version patch    # 0.1.0 → 0.1.1
npm version minor    # 0.1.0 → 0.2.0
npm version major    # 0.1.0 → 1.0.0
```

### 3. GitHub Actions 자동 배포
- `.github/workflows/publish.yml` 설정
- NPM_TOKEN 시크릿 추가
- 태그 푸시시 자동 배포

### 4. 개발 모드
```bash
npm run dev
# 파일 변경하면 자동 빌드
```

---

## 🎓 학습 순서 (추천)

1. **이 README 읽기** (5분)
2. **Quick_Start_Summary.md** (15분)
3. **File_Templates.md에서 템플릿 복사** (30분)
4. **npm run build** 실행 (5분)
5. **npm publish** 실행 (5분)
6. **NPM 웹사이트에서 확인** (2분)

**총 소요 시간: 1-2시간**

---

## 🚀 성공 신호

배포가 성공하면:

1. NPM 웹사이트에서 패키지 보임
   ```
   https://www.npmjs.com/package/@your-npm-id/ui
   ```

2. 설치 가능
   ```bash
   npm install @your-npm-id/ui
   ```

3. 사용 가능
   ```typescript
   import { Accordion } from '@your-npm-id/ui';
   ```

---

## 📖 다음 단계 (선택)

배포 후 더 나아가려면:

1. **문서 사이트**: Storybook 또는 VitePress
2. **테스트**: Vitest 추가
3. **CI/CD**: GitHub Actions 완전 자동화
4. **모니터링**: GitHub Dependabot 설정

---

## 🎉 축하합니다!

이제 당신도 MUI처럼 공개 UI 라이브러리를 만들 수 있습니다!

---

## 📚 참고 자료

### 공식 문서
- [NPM Docs - package.json exports](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
- [Node.js - Conditional Exports](https://nodejs.org/api/packages.html#exports)
- [Preact 공식](https://preactjs.com)

### 예제
- [MUI (Material-UI)](https://github.com/mui/material-ui)
- [React Bootstrap](https://github.com/react-bootstrap/react-bootstrap)
- [Chakra UI](https://github.com/chakra-ui/chakra-ui)

---

## 💬 Questions?

문서에서 못찾은 부분:
1. `NPM_Library_Setup_Roadmap.md` - 전체 구조
2. `Implementation_Guide.md` - 단계별 상세
3. `File_Templates.md` - 파일 예제

---

**Happy Publishing! 🚀**

당신의 라이브러리가 많은 개발자에게 도움이 되길 바랍니다.
