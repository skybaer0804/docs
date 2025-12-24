# Documentation Site - 프로젝트 문서

## 📋 목차

1. [핵심 콘셉트](#핵심-콘셉트)
2. [패키지 정보](#패키지-정보)
3. [업데이트 히스토리](#업데이트-히스토리)

---

## 핵심 콘셉트

### 아키텍처 개요

이 문서 사이트는 **Preact + Vite** 기반의 문서 뷰어이며, 문서/폴더 구조는 **Supabase DB의 `nodes` 테이블**을 통해 관리됩니다. 클라이언트는 `/api/docs` API를 통해 트리 구조와 문서 콘텐츠를 조회합니다. (즉, `client/public/docs` 정적 디렉토리에 의존하지 않습니다.)

### 주요 기능

#### 1. 문서 트리/콘텐츠 DB 기반 조회

-   문서/폴더 구조는 Supabase `nodes` 테이블에 저장
-   트리 조회: `GET /api/docs`
-   문서 조회(경로 기반): `GET /api/docs/*`
-   TanStack Query 캐시를 사용하여 Sidebar/DirectoryView가 동일한 트리 데이터를 공유

#### 2. 동적 라우팅

-   파일 경로 기반 자동 라우팅 (`/docs/Spark/Client/README.md`)
-   카테고리/서브카테고리 뷰 (`/category/Spark/Client`)
-   Preact Router를 사용한 클라이언트 사이드 라우팅

#### 3. 마크다운 렌더링

-   `marked` 라이브러리를 사용한 마크다운 파싱
-   내부 링크 자동 처리 및 네비게이션
-   코드 하이라이팅 및 GFM(GitHub Flavored Markdown) 지원
-   UTF-8/UTF-16 자동 인코딩 감지 및 처리

#### 4. 디렉토리 탐색

-   **DirectoryTree**: 사이드바에 표시되는 트리 구조
-   **DirectoryView**: 메인 영역에 표시되는 그리드 뷰
-   재귀적 렌더링으로 무제한 중첩 구조 지원

#### 5. PWA 지원

-   Service Worker를 통한 오프라인 지원
-   자동 업데이트 기능
-   캐시 전략 최적화

### 핵심 컴포넌트

#### `App.jsx`

-   라우터 설정 및 레이아웃 래핑
-   무제한 중첩 경로 지원 (`/category/:path*`)

#### `DocPage.jsx`

-   문서 로딩 및 렌더링 담당
-   파일 확장자에 따른 뷰어 선택 (MarkdownViewer / TemplateViewer)
-   디렉토리 뷰와 문서 뷰 전환

#### `MarkdownViewer.jsx`

-   마크다운 콘텐츠 렌더링
-   내부 링크 클릭 처리 및 라우팅
-   다운로드 기능

#### `DirectoryTree.jsx` / `DirectoryView.jsx`

-   디렉토리 구조 시각화
-   재귀적 렌더링으로 무제한 중첩 지원

#### `markdownLoader.js` (레거시)

-   과거 `public/docs` 기반 정적 로딩을 위해 사용되었으나, 현재는 DB 기반으로 전환되어 사용하지 않습니다.

### 빌드 프로세스

1. **개발 모드** (`npm run dev`)

    - 아이콘 생성
    - Vite 개발 서버 시작

2. **빌드 모드** (`npm run build`)

    - 아이콘 생성
    - Vite 프로덕션 빌드
    - PWA 매니페스트 및 Service Worker 생성
 
3. **문서 변경 반영**
    - 문서/폴더 생성/수정/삭제 시 TanStack Query의 트리 캐시(`docsKeys.tree()`)를 무효화하여 Sidebar가 즉시 갱신됩니다.

---

## 패키지 정보

### 프로젝트 메타데이터

```json
{
    "name": "docs",
    "version": "1.0.0",
    "type": "module"
}
```

### 주요 의존성 (Dependencies)

| 패키지                 | 버전     | 용도              |
| ---------------------- | -------- | ----------------- |
| `@tabler/icons-preact` | ^3.35.0  | 아이콘 라이브러리 |
| `marked`               | ^11.1.1  | 마크다운 파싱     |
| `preact`               | ^10.19.0 | UI 프레임워크     |
| `preact-router`        | ^4.1.1   | 라우팅            |

### 개발 의존성 (DevDependencies)

| 패키지                | 버전    | 용도               |
| --------------------- | ------- | ------------------ |
| `@preact/preset-vite` | ^2.9.0  | Preact Vite 프리셋 |
| `sass`                | ^1.94.0 | SCSS 컴파일러      |
| `vite`                | ^5.1.0  | 빌드 도구          |
| `vite-plugin-pwa`     | ^1.1.0  | PWA 지원           |

### NPM 스크립트

```bash
# 아이콘 생성
npm run generate-icons

# 캐시 정리
npm run clean

# 개발 서버 실행
npm run dev

# 캐시 정리 후 개발 서버 실행
npm run dev:clean

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

### 프로젝트 구조

```
docs/
├── public/
│   ├── docs/              # 마크다운 문서 파일들
│   │   ├── Spark/
│   │   ├── common/
│   │   └── style/
│   └── assets/            # 정적 자산 (아이콘 등)
├── src/
│   ├── components/        # UI 컴포넌트
│   │   ├── Breadcrumb.jsx
│   │   ├── DirectoryTree.jsx
│   │   ├── DirectoryView.jsx
│   │   ├── Layout.jsx
│   │   ├── MarkdownViewer.jsx
│   │   └── ...
│   ├── pages/             # 페이지 컴포넌트
│   │   ├── DocPage.jsx
│   │   └── Home.jsx
│   ├── utils/             # 유틸리티 함수
│   │   ├── markdownLoader.js
│   │   ├── breadcrumbUtils.js
│   │   └── downloadUtils.js
│   ├── contexts/          # Context API
│   ├── docs-list.json     # 자동 생성된 문서 목록
│   └── main.jsx           # 진입점
├── scripts/
│   ├── generate-docs-list.js  # 문서 목록 생성 스크립트
│   ├── generate-icons.js      # 아이콘 생성 스크립트
│   └── clean-cache.js         # 캐시 정리 스크립트
├── vite.config.js         # Vite 설정
└── package.json           # 패키지 정보
```

---

## 업데이트 히스토리

### 2024년 최근 업데이트

#### 무제한 중첩 디렉토리 구조 지원

-   **변경 사항**: 기존 2단계(category/subcategory) 제한을 제거하고 무제한 중첩 구조 지원
-   **영향 파일**:
    -   `scripts/generate-docs-list.js`: `directoryPath` 배열로 전체 경로 저장
    -   `src/components/DirectoryTree.jsx`: 재귀적 렌더링 구현
    -   `src/components/DirectoryView.jsx`: 경로 기반 노드 탐색
    -   `src/App.jsx`: 라우팅을 `/category/:path*`로 변경

#### README.md 파일 인코딩 문제 해결

-   **문제**: README.md 파일만 깨져서 표시되는 현상
-   **원인**: 일부 README.md 파일이 UTF-16 LE 인코딩으로 저장됨
-   **해결**: `markdownLoader.js`에 BOM 자동 감지 및 다중 인코딩 지원 추가
    -   UTF-16 LE/BE 자동 감지 및 디코딩
    -   UTF-8 BOM 처리
    -   UTF-32 LE 지원
-   **영향 파일**: `src/utils/markdownLoader.js`

#### 캐시 관리 개선

-   **추가**: `scripts/clean-cache.js` 생성
-   **기능**: `dist` 및 `node_modules/.vite` 캐시 자동 정리
-   **스크립트**: `npm run clean`, `npm run dev:clean` 추가

#### Sass Deprecation 경고 해결

-   **문제**: Dart Sass의 legacy JS API deprecation 경고
-   **해결**: `vite.config.js`에 `silenceDeprecations` 옵션 추가
-   **영향 파일**: `vite.config.js`

#### 코드 품질 개선

-   **변경**: `markdownLoader.js` 네이밍 개선 및 문서화
    -   함수 파라미터명 명확화 (`path` → `filePath`)
    -   JSDoc 주석 추가
    -   에러 메시지 한국어화
-   **추가**: 개발 모드 디버깅 로그 추가

### 주요 기능 추가 이력

1. **자동 문서 목록 생성**: 빌드 시점에 문서 목록 자동 생성
2. **파일 변경 감지**: 개발 모드에서 문서 파일 변경 시 자동 재생성
3. **PWA 지원**: 오프라인 접근 및 자동 업데이트
4. **다운로드 기능**: 마크다운 파일 다운로드 지원
5. **템플릿 뷰어**: `.template` 파일 전용 뷰어
6. **브레드크럼 네비게이션**: 현재 위치 표시 및 이동

### 기술 스택 변경 이력

-   **초기**: React 기반 (추정)
-   **현재**: Preact 기반으로 전환 (경량화 및 성능 최적화)
-   **빌드 도구**: Vite 도입 (빠른 개발 서버 및 빌드)

---

## 개발 가이드

### 새로운 문서 추가하기

1. `public/docs` 디렉토리에 원하는 경로로 `.md` 파일 생성
2. 개발 서버가 자동으로 파일을 감지하고 목록에 추가
3. 필요시 `npm run generate-docs`로 수동 생성 가능

### 스타일 가이드

-   **SCSS 및 BEM 네이밍**: 모든 스타일은 SCSS 사용, BEM 방식 네이밍
-   **컴포넌트 모듈화**: UI 컴포넌트와 로직을 함께 포함하여 모듈화
-   **함수화 및 재사용성**: 반복되는 로직은 함수로 분리

### 문제 해결

#### README.md 파일이 깨져 보이는 경우

-   파일 인코딩이 UTF-16인지 확인
-   VS Code에서 "Save with Encoding" → "UTF-8"로 저장
-   또는 코드에서 자동으로 처리되므로 새로고침

#### 문서 목록이 업데이트되지 않는 경우

-   `npm run generate-docs` 실행
-   또는 개발 서버 재시작

#### 캐시 문제가 발생하는 경우

-   `npm run clean` 실행
-   또는 `npm run dev:clean`으로 개발 서버 시작

---

## 라이선스 및 기여

이 프로젝트는 Nodnjs 프로젝트의 문서 사이트입니다.
