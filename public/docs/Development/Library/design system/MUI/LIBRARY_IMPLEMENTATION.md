# 라이브러리화 구현 문서

## 개요

본 문서는 `@quve17/util` 패키지의 디자인 시스템 라이브러리화 과정에서 적용한 기술 스택, 선택 이유, 그리고 구현 중 수정한 사항들을 기록합니다.

---

## 기술 스택

### 핵심 라이브러리

#### 1. Material-UI (MUI) v7.0.0 이상

**선택 이유:**

-   최신 React 디자인 시스템 표준
-   완전한 TypeScript 지원 (선택적 사용 가능)
-   테마 커스터마이제이션 시스템이 강력함
-   다크 모드 기본 지원
-   반응형 디자인 내장
-   광범위한 컴포넌트 라이브러리

**적용 방식:**

```jsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Button, Typography } from '@mui/material';
```

**주요 특징:**

-   MUI v7의 새로운 `applyStyles` API 사용
-   `StyledEngineProvider injectFirst`로 스타일 우선순위 제어
-   `CssBaseline`으로 브라우저 기본 스타일 리셋

---

#### 2. Emotion (v11.13.0)

**선택 이유:**

-   MUI의 기본 스타일링 엔진
-   CSS-in-JS의 성능 최적화
-   런타임 스타일 동적 생성 지원
-   서버 사이드 렌더링(SSR) 호환성

**적용 방식:**

-   MUI와 함께 자동 설치됨
-   `sx` prop을 통한 스타일링 활용

---

#### 3. React (v18.0.0 이상)

**선택 이유:**

-   최신 React 기능 지원 (Hooks, Concurrent Features)
-   라이브러리 사용자와의 호환성 보장
-   peerDependency로 설정하여 버전 충돌 방지

**적용 방식:**

```json
{
    "peerDependencies": {
        "react": ">=18.0.0",
        "react-dom": ">=18.0.0"
    }
}
```

---

### 개발 도구

#### 4. Jest (v30.2.0)

**선택 이유:**

-   React 컴포넌트 테스트에 최적화
-   ESM 모듈 지원
-   Snapshot 테스팅 지원
-   TDD 워크플로우와 잘 맞음

**설정:**

```javascript
// jest.config.js
export default {
    testEnvironment: 'jsdom',
    extensionsToTreatAsEsm: ['.jsx'],
    transform: {
        '^.+\\.(js|jsx)$': [
            'babel-jest',
            {
                presets: [
                    ['@babel/preset-env', { modules: false }],
                    ['@babel/preset-react', { runtime: 'automatic' }],
                ],
            },
        ],
    },
};
```

---

#### 5. @testing-library/react (v16.0.0)

**선택 이유:**

-   사용자 관점의 테스트 작성
-   컴포넌트 구현 세부사항에 의존하지 않음
-   접근성 테스트 지원
-   React 18과 완벽 호환

---

## 아키텍처 결정사항

### 1. 모듈 구조

**구조:**

```
src/
├── design/
│   ├── core/          # 핵심 테마 시스템
│   │   ├── ConfigContext.jsx
│   │   ├── ThemeCustomization.jsx
│   │   ├── palette.jsx
│   │   ├── typography.jsx
│   │   ├── shadows.jsx
│   │   └── compStyleOverride.jsx
│   └── button/        # UI 컴포넌트
│       └── ButtonCustom.jsx
```

**이유:**

-   **관심사 분리**: 테마 시스템과 UI 컴포넌트를 분리하여 유지보수성 향상
-   **확장성**: 새로운 컴포넌트 추가 시 `design/` 하위에 모듈 단위로 추가 가능
-   **트리 쉐이킹**: 사용하지 않는 모듈은 번들에서 제외 가능

---

### 2. Package.json Exports 설정

**구현:**

```json
{
    "exports": {
        "./design/core": {
            "import": "./src/design/core/index.js",
            "require": "./src/design/core/index.js",
            "default": "./src/design/core/index.js"
        },
        "./design/button": {
            "import": "./src/design/button/index.js",
            "require": "./src/design/button/index.js",
            "default": "./src/design/button/index.js"
        }
    }
}
```

**이유:**

-   **명확한 API**: 사용자가 필요한 모듈만 import 가능
-   **버전 관리**: 각 모듈별로 독립적인 버전 관리 가능 (향후)
-   **번들 최적화**: 사용하지 않는 코드 제거

**사용 예시:**

```javascript
// 코어만 사용
import { ConfigProvider, ThemeCustomization } from '@quve17/util/design/core';

// 버튼만 사용
import { ButtonCustom } from '@quve17/util/design/button';
```

---

### 3. Context API 기반 설정 관리

**구현:**

```jsx
// ConfigContext.jsx
export function ConfigProvider({ children, configKey = 'berry-config-next-ts' }) {
    const [savedConfig, setSavedConfig] = useLocalStorage(configKey, defaultConfig);
    // ...
}
```

**이유:**

-   **전역 상태 관리**: React Context로 설정을 전역적으로 공유
-   **localStorage 영속성**: 브라우저 재시작 후에도 설정 유지
-   **타입 안전성**: PropTypes로 런타임 타입 검증
-   **버전 관리**: `configVersion`으로 설정 호환성 관리

**장점:**

-   Redux 같은 외부 라이브러리 불필요
-   설정 변경 시 자동 리렌더링
-   깊은 병합(deep merge)으로 부분 업데이트 지원

---

### 4. 컴포넌트 모듈화 원칙

**원칙:**

1. **UI와 로직 통합**: 각 컴포넌트는 자체 로직을 포함
2. **Props 최소화**: 필요한 props만 노출
3. **레이아웃 모듈화**: children과 이벤트 핸들러를 prop으로 전달

**적용 예시 (ButtonCustom):**

```jsx
// ✅ 좋은 예: 모든 기능이 컴포넌트 내부에 캡슐화
<ButtonCustom
  iconType="add"
  buttonText="추가"
  onClick={handleClick}
/>

// ❌ 나쁜 예: 내부 구현을 외부에서 제어
<ButtonCustom
  icon={<AddIcon />}
  text={<Typography>추가</Typography>}
  iconPosition="start"
/>
```

---

## 주요 수정 사항

### 1. MUI v7 문법 적용

**변경 전 (MUI v5 이하):**

```jsx
MuiButton: {
  styleOverrides: {
    root: {
      '&.MuiButton-colorWarning': {
        color: theme.palette.common.black
      }
    }
  }
}
```

**변경 후 (MUI v7):**

```jsx
MuiButton: {
  styleOverrides: {
    root: {
      ...theme.applyStyles('dark', {
        '&.MuiButton-colorWarning': {
          color: theme.palette.common.black
        }
      })
    }
  }
}
```

**이유:**

-   MUI v7의 새로운 `applyStyles` API 사용으로 모드별 스타일 적용이 더 명확해짐
-   타입 안전성 향상
-   성능 최적화

---

### 2. 반응형 디자인 Grid 시스템

**변경 전:**

```jsx
<Grid container>
    <Grid item xs={12} sm={6} md={4}>
        Content
    </Grid>
</Grid>
```

**변경 후 (MUI v7):**

```jsx
<Grid container spacing={2}>
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>Content</Grid>
</Grid>
```

**이유:**

-   MUI v7의 새로운 Grid API 사용
-   더 간결한 문법
-   타입 안전성 향상

---

### 3. 테마 팔레트 구조 개선

**변경 사항:**

-   SCSS 모듈 대신 JavaScript 객체로 색상 관리
-   다크/라이트 모드 색상을 하나의 객체에 통합
-   프리셋 색상 시스템 확장 가능하도록 구조화

**이유:**

-   SCSS 컴파일 불필요
-   런타임 색상 변경 가능
-   JavaScript 생태계와의 통합 용이

**구현:**

```javascript
// palette.jsx
const defaultColors = {
    // 라이트 모드 색상
    primaryMain: '#2196f3',
    // 다크 모드 색상
    darkPrimaryMain: '#64b5f6',
    // ...
};

export default function Palette(mode, presetColor) {
    return createTheme({
        palette: {
            primary: {
                main: mode === ThemeMode.DARK ? colors.darkPrimaryMain : colors.primaryMain,
            },
        },
    });
}
```

---

### 4. 컴포넌트 스타일 오버라이드 구조화

**변경 사항:**

-   전역 컴포넌트 스타일을 `compStyleOverride.jsx`에 중앙화
-   개별 컴포넌트 오버라이드는 `overrides/` 디렉토리로 분리 가능하도록 구조화

**이유:**

-   유지보수성 향상
-   스타일 충돌 방지
-   확장성 확보

---

### 5. localStorage 기반 설정 영속성

**구현:**

```javascript
// useLocalStorage.js
export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            return initialValue;
        }
    });
    // ...
}
```

**특징:**

-   SSR 환경 대응 (`typeof window === 'undefined'` 체크)
-   에러 처리로 안정성 확보
-   깊은 병합으로 부분 업데이트 지원

---

### 6. 테스트 환경 설정

**주요 설정:**

1. **ESM 모듈 지원:**

```javascript
extensionsToTreatAsEsm: ['.jsx'],
transformIgnorePatterns: [
  'node_modules/(?!(@mui|@emotion|@babel)/)'
]
```

2. **MUI 모듈 매핑:**

```javascript
moduleNameMapper: {
  '^@mui/material/(.*)$': '<rootDir>/node_modules/@mui/material/$1',
  '^@mui/icons-material/(.*)$': '<rootDir>/node_modules/@mui/icons-material/$1',
}
```

3. **CSS 모듈 모킹:**

```javascript
'\\.(css|less|scss|sass)$': 'identity-obj-proxy'
```

**이유:**

-   MUI v7의 ESM 모듈 구조 지원
-   테스트 환경에서도 실제 모듈 구조 유지
-   CSS 파일 import 에러 방지

---

## 성능 최적화

### 1. useMemo를 통한 테마 재계산 방지

```jsx
const theme = useMemo(() => Palette(mode, presetColor), [mode, presetColor]);
const themeTypography = useMemo(() => Typography(theme, borderRadius, fontFamily), [theme, borderRadius, fontFamily]);
```

**효과:**

-   설정 변경 시에만 테마 재생성
-   불필요한 리렌더링 방지
-   메모리 사용량 최적화

---

### 2. 컴포넌트 스타일 오버라이드 메모이제이션

```jsx
themes.components = useMemo(() => componentStyleOverrides(themes, borderRadius, outlinedFilled), [themes, borderRadius, outlinedFilled]);
```

**효과:**

-   스타일 오버라이드 재계산 최소화
-   렌더링 성능 향상

---

## 보안 고려사항

### 1. XSS 방지

-   `toRenderXssSafe` 함수로 HTML 엔티티 변환
-   사용자 입력값 검증 (`isInputXssSafe`)

### 2. localStorage 보안

-   JSON 파싱 에러 처리
-   잘못된 데이터로 인한 앱 크래시 방지
-   기본값으로 자동 복구

---

## 호환성

### 지원 환경

-   **React**: 18.0.0 이상
-   **Node.js**: 14.0.0 이상 (ESM 지원)
-   **브라우저**: 최신 브라우저 (ES6+ 지원)

### 제한사항

-   **SSR**: Next.js 등 SSR 환경에서 사용 시 `ConfigProvider`의 localStorage 접근 주의 필요
-   **TypeScript**: 선택적 지원 (PropTypes 기반 런타임 검증)

---

## 향후 개선 방향

### 1. TypeScript 지원

-   `.d.ts` 타입 정의 파일 추가
-   완전한 타입 안전성 제공

### 2. 추가 컴포넌트

-   Input, Select, Dialog 등 공통 컴포넌트 추가
-   각 컴포넌트별 모듈화

### 3. 테마 프리셋 확장

-   SCSS 기반 테마 파일 지원
-   테마 빌더 도구 제공

### 4. 문서화

-   Storybook 통합
-   컴포넌트별 사용 예제
-   API 문서 자동 생성

---

## 참고 자료

-   [Material-UI v7 문서](https://mui.com/)
-   [React Context API](https://react.dev/reference/react/createContext)
-   [Jest ESM 지원](https://jestjs.io/docs/ecmascript-modules)
-   [Package.json Exports 필드](https://nodejs.org/api/packages.html#exports)

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2024  
**작성자**: Quve17
