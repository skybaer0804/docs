# KRDS 디자인 토큰 SCSS 구현 가이드

## 목차
1. [개요](#개요)
2. [아키텍처](#아키텍처)
3. [토큰 구조](#토큰-구조)
4. [Primitive 토큰 구현](#primitive-토큰-구현)
5. [Semantic 토큰 구현](#semantic-토큰-구현)
6. [Component 토큰 구현](#component-토큰-구현)
7. [Provider 패턴](#provider-패턴)
8. [사용 예시](#사용-예시)
9. [모드 관리](#모드-관리)
10. [유지보수 가이드](#유지보수-가이드)

---

## 개요

KRDS(범정부 UI/UX 디자인시스템) 디자인 토큰을 SCSS와 Provider 패턴으로 구현하는 문서입니다. 이 구현은 **Primitive → Semantic → Component** 3단계 토큰 계층과 **기본 모드 / 선명한 화면 모드** 2가지 모드를 지원합니다.

### 주요 특징

- **계층적 토큰 구조**: 재사용성과 유지보수성 극대화
- **Provider 패턴**: CSS 변수를 통한 동적 토큰 관리
- **모드 전환**: 기본 모드 ↔ 선명한 화면 모드 지원
- **접근성**: WCAG 레벨 AA 기준 준수
- **반응형**: mobile / PC 기기별 토큰 값 관리

---

## 아키텍처

```
토큰 시스템 구조
├── Primitive Token (기본값)
│   ├── Color (primary, secondary, gray)
│   ├── Typography (fontFamily, fontSize, fontWeight, lineHeight)
│   ├── Space (number 4, 8, 12, 16, ...)
│   └── Radius (2px, 4px, 6px, ...)
│
├── Semantic Token (의미)
│   ├── color-* (배경, 텍스트, 아이콘, 테두리 등)
│   ├── typo-* (본문, 제목, 네비게이션 등)
│   ├── space-* (gap, padding, margin 등)
│   └── shadow-* (elevation별 그림자)
│
└── Component Token (컴포넌트)
    ├── button-*
    ├── input-*
    ├── card-*
    ├── typography-*
    └── ... (각 컴포넌트별 토큰)

Provider 패턴
└── TokenProvider (React Context)
    ├── 모드 상태 관리
    ├── CSS 변수 적용
    └── 다크모드/선명한 화면 모드 전환
```

---

## 토큰 구조

### 3단계 토큰 계층

#### 1. Primitive Token (기본 토큰)
기본적인 디자인 속성을 정의하는 추상화된 값으로, **직접 사용하지 않고 참고 용도**입니다.

```scss
// Primitive Color
--primitive-primary-0: #ffffff;    // Lightness 100%
--primitive-primary-50: #...;      // Lightness 50% (기준)
--primitive-primary-100: #000000;  // Lightness 0%

--primitive-secondary-0: #ffffff;
--primitive-secondary-50: #...;
--primitive-secondary-100: #000000;

--primitive-gray-0: #ffffff;
--primitive-gray-50: #...;
--primitive-gray-100: #000000;

// Primitive Typography
--primitive-font-family: 'Pretendard GOV', sans-serif;
--primitive-font-size-xs: 13px;
--primitive-font-size-sm: 15px;
--primitive-font-size-base: 17px;
--primitive-font-weight-regular: 400;
--primitive-font-weight-bold: 700;
--primitive-line-height: 1.5;

// Primitive Space (8pt Grid)
--primitive-space-xs: 4px;    // number-1
--primitive-space-sm: 8px;    // number-2
--primitive-space-md: 16px;   // number-4
--primitive-space-lg: 24px;   // number-7
--primitive-space-xl: 32px;   // number-9

// Primitive Radius
--primitive-radius-xs: 2px;
--primitive-radius-sm: 4px;
--primitive-radius-md: 6px;
--primitive-radius-lg: 10px;
--primitive-radius-xl: 12px;
```

#### 2. Semantic Token (의미 토큰)
Primitive 토큰을 참조하여 특정 역할과 의미를 부여한 토큰입니다.

```scss
// Color Semantic
--color-background-primary: var(--primitive-gray-0);      // 기본 배경
--color-background-secondary: var(--primitive-gray-5);    // 보조 배경
--color-text-primary: var(--primitive-gray-100);          // 기본 텍스트
--color-text-secondary: var(--primitive-gray-70);         // 보조 텍스트
--color-icon-primary: var(--primitive-gray-100);          // 기본 아이콘
--color-border-default: var(--primitive-gray-20);         // 기본 테두리

// Typography Semantic
--typo-heading-1: var(--primitive-font-size-xxl);
--typo-heading-2: var(--primitive-font-size-xl);
--typo-body-large: var(--primitive-font-size-base);
--typo-body-medium: var(--primitive-font-size-sm);
--typo-label-small: var(--primitive-font-size-xs);

// Space Semantic
--space-layout-gap: var(--primitive-space-lg);      // 레이아웃 간격
--space-component-gap: var(--primitive-space-md);   // 컴포넌트 간격
--space-padding-card: var(--primitive-space-lg);    // 카드 패딩
```

#### 3. Component Token (컴포넌트 토큰)
특정 UI 컴포넌트에 직접 적용되는 구체적인 스타일입니다.

```scss
// Button Component Token
--button-primary-background: var(--primitive-primary-50);
--button-primary-text: var(--primitive-primary-0);
--button-primary-border: transparent;
--button-primary-padding: 12px 16px;
--button-primary-radius: var(--primitive-radius-md);
--button-primary-font-weight: var(--primitive-font-weight-bold);

// Input Component Token
--input-default-background: var(--color-background-primary);
--input-default-border: var(--color-border-default);
--input-default-padding: 12px 16px;
--input-default-radius: var(--primitive-radius-md);

// Card Component Token
--card-background: var(--color-background-primary);
--card-border: var(--color-border-default);
--card-padding: var(--space-padding-card);
--card-radius: var(--primitive-radius-lg);
--card-shadow: var(--shadow-2);
```

---

## Primitive 토큰 구현

### 1. 색상 Primitive 토큰

```scss
// src/styles/tokens/primitive/_color.scss

// ============================================
// KRDS Primitive Color Tokens
// ============================================

// HSL 기반 색상 정의 (Lightness 11 단계)
// 각 색상군은 0% ~ 100% Lightness 범위에서 5% 단위로 정의

// Primary Color Palette
--primitive-primary-0: hsl(var(--hue-primary), var(--saturation-primary), 100%);   // White
--primitive-primary-5: hsl(var(--hue-primary), var(--saturation-primary), 95%);
--primitive-primary-10: hsl(var(--hue-primary), var(--saturation-primary), 90%);
--primitive-primary-15: hsl(var(--hue-primary), var(--saturation-primary), 85%);
--primitive-primary-20: hsl(var(--hue-primary), var(--saturation-primary), 80%);
--primitive-primary-25: hsl(var(--hue-primary), var(--saturation-primary), 75%);
--primitive-primary-30: hsl(var(--hue-primary), var(--saturation-primary), 70%);
--primitive-primary-40: hsl(var(--hue-primary), var(--saturation-primary), 60%);
--primitive-primary-50: hsl(var(--hue-primary), var(--saturation-primary), 50%);   // Base
--primitive-primary-70: hsl(var(--hue-primary), var(--saturation-primary), 30%);
--primitive-primary-100: hsl(var(--hue-primary), var(--saturation-primary), 0%);   // Black

// Secondary Color Palette
--primitive-secondary-0: hsl(var(--hue-secondary), var(--saturation-secondary), 100%);
--primitive-secondary-5: hsl(var(--hue-secondary), var(--saturation-secondary), 95%);
--primitive-secondary-10: hsl(var(--hue-secondary), var(--saturation-secondary), 90%);
--primitive-secondary-15: hsl(var(--hue-secondary), var(--saturation-secondary), 85%);
--primitive-secondary-20: hsl(var(--hue-secondary), var(--saturation-secondary), 80%);
--primitive-secondary-25: hsl(var(--hue-secondary), var(--saturation-secondary), 75%);
--primitive-secondary-30: hsl(var(--hue-secondary), var(--saturation-secondary), 70%);
--primitive-secondary-40: hsl(var(--hue-secondary), var(--saturation-secondary), 60%);
--primitive-secondary-50: hsl(var(--hue-secondary), var(--saturation-secondary), 50%);
--primitive-secondary-70: hsl(var(--hue-secondary), var(--saturation-secondary), 30%);
--primitive-secondary-100: hsl(var(--hue-secondary), var(--saturation-secondary), 0%);

// Gray Color Palette
--primitive-gray-0: hsl(0, 0%, 100%);     // White
--primitive-gray-5: hsl(0, 0%, 95%);
--primitive-gray-10: hsl(0, 0%, 90%);
--primitive-gray-15: hsl(0, 0%, 85%);
--primitive-gray-20: hsl(0, 0%, 80%);
--primitive-gray-25: hsl(0, 0%, 75%);
--primitive-gray-30: hsl(0, 0%, 70%);
--primitive-gray-40: hsl(0, 0%, 60%);
--primitive-gray-50: hsl(0, 0%, 50%);
--primitive-gray-70: hsl(0, 0%, 30%);
--primitive-gray-100: hsl(0, 0%, 0%);    // Black

// HSL 변수 (기관별로 커스터마이징 가능)
--hue-primary: 210;           // Primary 색상의 Hue 값
--saturation-primary: 100%;   // Primary 색상의 Saturation 값
--hue-secondary: 45;          // Secondary 색상의 Hue 값
--saturation-secondary: 100%; // Secondary 색상의 Saturation 값

// System Colors (고정값)
--primitive-success-50: hsl(120, 100%, 50%);
--primitive-warning-50: hsl(40, 100%, 50%);
--primitive-error-50: hsl(0, 100%, 50%);
--primitive-info-50: hsl(200, 100%, 50%);
```

### 2. 타이포그래피 Primitive 토큰

```scss
// src/styles/tokens/primitive/_typography.scss

// ============================================
// KRDS Primitive Typography Tokens
// ============================================

// Font Family
--primitive-font-family: 'Pretendard GOV', 'Pretendard', sans-serif;

// Font Weight
--primitive-font-weight-regular: 400;
--primitive-font-weight-bold: 700;

// Font Size
// Display (배너/마케팅용)
--primitive-font-size-display-lg: 60px;    // PC
--primitive-font-size-display-lg-mobile: 44px;

--primitive-font-size-display-md: 44px;
--primitive-font-size-display-md-mobile: 32px;

--primitive-font-size-display-sm: 36px;
--primitive-font-size-display-sm-mobile: 28px;

// Heading (h1 ~ h6)
--primitive-font-size-h1-xlarge: 40px;
--primitive-font-size-h1-xlarge-mobile: 28px;

--primitive-font-size-h2-large: 32px;
--primitive-font-size-h2-large-mobile: 24px;

--primitive-font-size-h3-medium: 24px;
--primitive-font-size-h3-medium-mobile: 22px;

--primitive-font-size-h4-small: 19px;
--primitive-font-size-h4-small-mobile: 19px;

--primitive-font-size-h5-xsmall: 17px;
--primitive-font-size-h5-xsmall-mobile: 17px;

--primitive-font-size-h6-xxsmall: 15px;
--primitive-font-size-h6-xxsmall-mobile: 15px;

// Body (본문)
--primitive-font-size-body-lg: 19px;
--primitive-font-size-body-md: 17px;    // 기본값
--primitive-font-size-body-sm: 15px;
--primitive-font-size-body-xs: 13px;

// Line Height (1.5 = 150%)
--primitive-line-height-tight: 1.2;   // 120%
--primitive-line-height-normal: 1.5;  // 150%
--primitive-line-height-relaxed: 1.75; // 175%

// Letter Spacing
--primitive-letter-spacing-tight: 0px;
--primitive-letter-spacing-normal: 0px;
--primitive-letter-spacing-wide: 1px;

// Text Transform
--primitive-text-transform-none: none;
--primitive-text-transform-uppercase: uppercase;
--primitive-text-transform-lowercase: lowercase;
```

### 3. 공간(Space) Primitive 토큰

```scss
// src/styles/tokens/primitive/_space.scss

// ============================================
// KRDS Primitive Space Tokens
// 8-point Grid System 기준
// ============================================

// Base Unit
--primitive-space-base: 8px;

// Space Scale (4, 8, 12, 16, 20, 24, 28, 32, ...)
--primitive-space-1: 4px;     // 0.5 unit
--primitive-space-2: 8px;     // 1 unit
--primitive-space-3: 12px;    // 1.5 unit
--primitive-space-4: 16px;    // 2 unit
--primitive-space-5: 20px;    // 2.5 unit
--primitive-space-6: 24px;    // 3 unit
--primitive-space-7: 28px;    // 3.5 unit
--primitive-space-8: 32px;    // 4 unit
--primitive-space-9: 36px;    // 4.5 unit
--primitive-space-10: 40px;   // 5 unit
--primitive-space-11: 44px;   // 5.5 unit
--primitive-space-12: 48px;   // 6 unit
--primitive-space-13: 52px;   // 6.5 unit
--primitive-space-14: 56px;   // 7 unit
--primitive-space-15: 60px;   // 7.5 unit
--primitive-space-16: 64px;   // 8 unit
--primitive-space-18: 72px;   // 9 unit
--primitive-space-20: 80px;   // 10 unit

// 별칭 (사용 편의성)
--primitive-gap-xs: var(--primitive-space-1);
--primitive-gap-sm: var(--primitive-space-2);
--primitive-gap-md: var(--primitive-space-4);
--primitive-gap-lg: var(--primitive-space-6);
--primitive-gap-xl: var(--primitive-space-8);

--primitive-padding-xs: var(--primitive-space-2);
--primitive-padding-sm: var(--primitive-space-3);
--primitive-padding-md: var(--primitive-space-4);
--primitive-padding-lg: var(--primitive-space-6);
--primitive-padding-xl: var(--primitive-space-8);
```

### 4. 형태(Shape) Primitive 토큰

```scss
// src/styles/tokens/primitive/_shape.scss

// ============================================
// KRDS Primitive Shape Tokens (Radius)
// ============================================

// Radius Scale
--primitive-radius-none: 0px;
--primitive-radius-xs: 2px;
--primitive-radius-sm: 4px;
--primitive-radius-md: 6px;
--primitive-radius-lg: 10px;
--primitive-radius-xl: 12px;
--primitive-radius-max: 50%;  // 원형

// 레벨별 Radius (컴포넌트 크기에 따른 분류)
// Xsmall: 8x8 ~ 16x16
--primitive-radius-xsmall: 2px;

// Small: 20x20 ~ 32x32
--primitive-radius-small: 4px;

// Medium: 40x40 ~ 64x64 (기본값)
--primitive-radius-medium: 6px;

// Large: 72x72 ~ 80x80
--primitive-radius-large: 10px;

// Xlarge: 96x96 ~ 120x120
--primitive-radius-xlarge: 12px;
```

### 5. 그림자(Shadow/Elevation) Primitive 토큰

```scss
// src/styles/tokens/primitive/_shadow.scss

// ============================================
// KRDS Primitive Shadow Tokens
// ============================================

// Shadow 4단계 (Elevation별)
--primitive-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.05);
--primitive-shadow-2: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
--primitive-shadow-3: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
--primitive-shadow-4: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);

// Shadow 세부 값 (수정이 필요할 때)
--primitive-shadow-offset-x: 0;
--primitive-shadow-offset-y: 1px;
--primitive-shadow-blur: 2px;
--primitive-shadow-spread: 0;
--primitive-shadow-color: rgba(0, 0, 0, 0.05);
```

---

## Semantic 토큰 구현

### 색상 Semantic 토큰

```scss
// src/styles/tokens/semantic/_color.scss

// ============================================
// KRDS Semantic Color Tokens
// 기본 모드 기준
// ============================================

// *** 배경 색상 ***
--color-background-primary: var(--primitive-gray-0);     // 기본 배경
--color-background-secondary: var(--primitive-gray-5);   // 보조 배경
--color-background-tertiary: var(--primitive-gray-10);   // 3번째 배경
--color-background-overlay: rgba(0, 0, 0, 0.5);          // 오버레이

// *** 텍스트 색상 ***
--color-text-primary: var(--primitive-gray-100);         // 주요 텍스트 (100% 대비)
--color-text-secondary: var(--primitive-gray-70);        // 보조 텍스트 (70)
--color-text-tertiary: var(--primitive-gray-40);         // 3번째 텍스트 (40)
--color-text-disabled: var(--primitive-gray-25);         // 비활성화 텍스트 (25)

// *** 아이콘 색상 ***
--color-icon-primary: var(--primitive-gray-100);         // 주요 아이콘
--color-icon-secondary: var(--primitive-gray-70);        // 보조 아이콘
--color-icon-disabled: var(--primitive-gray-25);         // 비활성화 아이콘

// *** 테두리 색상 ***
--color-border-default: var(--primitive-gray-20);        // 기본 테두리
--color-border-light: var(--primitive-gray-10);          // 밝은 테두리
--color-border-dark: var(--primitive-gray-40);           // 어두운 테두리
--color-border-focus: var(--primitive-primary-50);       // 포커스 테두리

// *** 상태 색상 ***
--color-status-success: var(--primitive-success-50);
--color-status-warning: var(--primitive-warning-50);
--color-status-error: var(--primitive-error-50);
--color-status-info: var(--primitive-info-50);

// *** 상호작용 색상 ***
--color-interactive-primary: var(--primitive-primary-50);
--color-interactive-secondary: var(--primitive-secondary-50);
--color-interactive-disabled: var(--primitive-gray-20);

// *** Surface (Elevation별) ***
--color-surface-base: var(--primitive-gray-0);           // 기본 표면
--color-surface-level-1: var(--primitive-gray-0);        // Elevation -1
--color-surface-level-2: var(--primitive-gray-0);        // Elevation 0
--color-surface-level-3: var(--primitive-gray-0);        // Elevation +1
--color-surface-level-4: var(--primitive-gray-5);        // Elevation +2
--color-surface-level-5: var(--primitive-gray-10);       // Elevation +3
--color-surface-level-6: var(--primitive-gray-15);       // Elevation +4
```

### 타이포그래피 Semantic 토큰

```scss
// src/styles/tokens/semantic/_typography.scss

// ============================================
// KRDS Semantic Typography Tokens
// PC와 Mobile 동시 정의
// ============================================

// Display (배너/마케팅)
// .display-large
--typo-display-large-size-pc: var(--primitive-font-size-display-lg);
--typo-display-large-size-mobile: var(--primitive-font-size-display-lg-mobile);
--typo-display-large-weight: var(--primitive-font-weight-bold);
--typo-display-large-line-height: 1.5;
--typo-display-large-letter-spacing: 1px;

// .display-medium
--typo-display-medium-size-pc: var(--primitive-font-size-display-md);
--typo-display-medium-size-mobile: var(--primitive-font-size-display-md-mobile);
--typo-display-medium-weight: var(--primitive-font-weight-bold);
--typo-display-medium-line-height: 1.5;
--typo-display-medium-letter-spacing: 1px;

// .display-small
--typo-display-small-size-pc: var(--primitive-font-size-display-sm);
--typo-display-small-size-mobile: var(--primitive-font-size-display-sm-mobile);
--typo-display-small-weight: var(--primitive-font-weight-bold);
--typo-display-small-line-height: 1.5;
--typo-display-small-letter-spacing: 1px;

// Heading
// .heading-1 (h1-xlarge)
--typo-heading-1-size-pc: var(--primitive-font-size-h1-xlarge);
--typo-heading-1-size-mobile: var(--primitive-font-size-h1-xlarge-mobile);
--typo-heading-1-weight: var(--primitive-font-weight-bold);
--typo-heading-1-line-height: 1.5;
--typo-heading-1-letter-spacing: 1px;

// .heading-2 (h2-large)
--typo-heading-2-size-pc: var(--primitive-font-size-h2-large);
--typo-heading-2-size-mobile: var(--primitive-font-size-h2-large-mobile);
--typo-heading-2-weight: var(--primitive-font-weight-bold);
--typo-heading-2-line-height: 1.5;
--typo-heading-2-letter-spacing: 1px;

// .heading-3 (h3-medium)
--typo-heading-3-size-pc: var(--primitive-font-size-h3-medium);
--typo-heading-3-size-mobile: var(--primitive-font-size-h3-medium-mobile);
--typo-heading-3-weight: var(--primitive-font-weight-bold);
--typo-heading-3-line-height: 1.5;
--typo-heading-3-letter-spacing: 0px;

// .heading-4 (h4-small)
--typo-heading-4-size-pc: var(--primitive-font-size-h4-small);
--typo-heading-4-size-mobile: var(--primitive-font-size-h4-small-mobile);
--typo-heading-4-weight: var(--primitive-font-weight-bold);
--typo-heading-4-line-height: 1.5;
--typo-heading-4-letter-spacing: 0px;

// .heading-5 (h5-xsmall)
--typo-heading-5-size-pc: var(--primitive-font-size-h5-xsmall);
--typo-heading-5-size-mobile: var(--primitive-font-size-h5-xsmall-mobile);
--typo-heading-5-weight: var(--primitive-font-weight-bold);
--typo-heading-5-line-height: 1.5;
--typo-heading-5-letter-spacing: 0px;

// .heading-6 (h6-xxsmall)
--typo-heading-6-size-pc: var(--primitive-font-size-h6-xxsmall);
--typo-heading-6-size-mobile: var(--primitive-font-size-h6-xxsmall-mobile);
--typo-heading-6-weight: var(--primitive-font-weight-bold);
--typo-heading-6-line-height: 1.5;
--typo-heading-6-letter-spacing: 0px;

// Body (본문)
// .body-large
--typo-body-large-size: var(--primitive-font-size-body-lg);
--typo-body-large-size-mobile: var(--primitive-font-size-body-lg);
--typo-body-large-weight: var(--primitive-font-weight-regular);
--typo-body-large-weight-bold: var(--primitive-font-weight-bold);
--typo-body-large-line-height: 1.5;
--typo-body-large-letter-spacing: 0px;

// .body-medium (기본값)
--typo-body-medium-size: var(--primitive-font-size-body-md);
--typo-body-medium-size-mobile: var(--primitive-font-size-body-md);
--typo-body-medium-weight: var(--primitive-font-weight-regular);
--typo-body-medium-weight-bold: var(--primitive-font-weight-bold);
--typo-body-medium-line-height: 1.5;
--typo-body-medium-letter-spacing: 0px;

// .body-small
--typo-body-small-size: var(--primitive-font-size-body-sm);
--typo-body-small-size-mobile: var(--primitive-font-size-body-sm);
--typo-body-small-weight: var(--primitive-font-weight-regular);
--typo-body-small-weight-bold: var(--primitive-font-weight-bold);
--typo-body-small-line-height: 1.5;
--typo-body-small-letter-spacing: 0px;

// .body-xsmall
--typo-body-xsmall-size: var(--primitive-font-size-body-xs);
--typo-body-xsmall-size-mobile: var(--primitive-font-size-body-xs);
--typo-body-xsmall-weight: var(--primitive-font-weight-regular);
--typo-body-xsmall-weight-bold: var(--primitive-font-weight-bold);
--typo-body-xsmall-line-height: 1.5;
--typo-body-xsmall-letter-spacing: 0px;

// Navigation
// .nav-title-large
--typo-nav-title-large-size: var(--primitive-font-size-h3-medium);
--typo-nav-title-large-size-mobile: var(--primitive-font-size-h3-medium-mobile);
--typo-nav-title-large-weight: var(--primitive-font-weight-bold);
--typo-nav-title-large-line-height: 1.5;
--typo-nav-title-large-letter-spacing: 0px;

// .nav-title-small
--typo-nav-title-small-size: var(--primitive-font-size-h4-small);
--typo-nav-title-small-size-mobile: var(--primitive-font-size-h4-small-mobile);
--typo-nav-title-small-weight: var(--primitive-font-weight-bold);
--typo-nav-title-small-line-height: 1.5;
--typo-nav-title-small-letter-spacing: 0px;

// Label (입력 필드 라벨)
// .label-large
--typo-label-large-size: var(--primitive-font-size-body-lg);
--typo-label-large-weight: var(--primitive-font-weight-regular);
--typo-label-large-line-height: 1.5;
--typo-label-large-letter-spacing: 0px;

// .label-medium
--typo-label-medium-size: var(--primitive-font-size-body-md);
--typo-label-medium-weight: var(--primitive-font-weight-regular);
--typo-label-medium-line-height: 1.5;
--typo-label-medium-letter-spacing: 0px;

// .label-small
--typo-label-small-size: var(--primitive-font-size-body-sm);
--typo-label-small-weight: var(--primitive-font-weight-regular);
--typo-label-small-line-height: 1.5;
--typo-label-small-letter-spacing: 0px;

// .label-xsmall
--typo-label-xsmall-size: var(--primitive-font-size-body-xs);
--typo-label-xsmall-weight: var(--primitive-font-weight-regular);
--typo-label-xsmall-line-height: 1.5;
--typo-label-xsmall-letter-spacing: 0px;
```

### 공간(Space) Semantic 토큰

```scss
// src/styles/tokens/semantic/_space.scss

// ============================================
// KRDS Semantic Space Tokens
// ============================================

// *** Layout Gap (레이아웃 주요 간격) ***
--space-layout-header-breadcrumb: var(--primitive-space-10);      // 24px (number-10)
--space-layout-left-contents: var(--primitive-space-16);          // 64px (number-18)
--space-layout-contents-right: var(--primitive-space-10);         // 40px (number-14)
--space-layout-contents-footer: var(--primitive-space-16);        // 64px (number-18)
--space-layout-breadcrumb-contents: var(--primitive-space-10);    // 40px (number-14)

// 모바일용
@media (max-width: 768px) {
  --space-layout-contents-footer: var(--primitive-space-10);      // 40px
}

// *** Content Gap (콘텐츠 계층 간격) ***
--space-content-gap-lg: var(--primitive-space-6);        // 24px (gap-7)
--space-content-gap-md: var(--primitive-space-4);        // 16px (gap-5)
--space-content-gap-sm: var(--primitive-space-2);        // 8px (gap-3)

// *** Component Gap (컴포넌트 간격) ***
--space-gap-xl: var(--primitive-space-6);        // 24px
--space-gap-lg: var(--primitive-space-4);        // 16px
--space-gap-md: var(--primitive-space-3);        // 12px
--space-gap-sm: var(--primitive-space-2);        // 8px
--space-gap-xs: var(--primitive-space-1);        // 4px

// *** Padding (패딩) ***
// Card/Modal/InfoBox/Alert 컨테이너
--space-padding-card-lg: var(--primitive-space-6);      // PC: 24px
--space-padding-card-md: var(--primitive-space-4);      // Mobile: 16px

// 텍스트 입력 필드
--space-padding-input: var(--primitive-space-4);        // 16px
--space-padding-input-sm: var(--primitive-space-3);     // 12px

// 버튼 패딩
--space-padding-button-lg: var(--primitive-space-4);    // 16px
--space-padding-button-md: var(--primitive-space-3);    // 12px
--space-padding-button-sm: var(--primitive-space-2);    // 8px

// *** Margin (마진) ***
--space-margin-lg: var(--primitive-space-6);
--space-margin-md: var(--primitive-space-4);
--space-margin-sm: var(--primitive-space-2);
--space-margin-xs: var(--primitive-space-1);
```

### Elevation & Shadow Semantic 토큰

```scss
// src/styles/tokens/semantic/_elevation.scss

// ============================================
// KRDS Semantic Elevation & Shadow Tokens
// ============================================

// *** Surface (배경색) by Elevation ***
// Elevation -1 (Background보다 낮음)
--elevation-surface-minus-1: var(--primitive-gray-0);
--elevation-shadow-minus-1: var(--primitive-shadow-2);

// Elevation 0 (기본)
--elevation-surface-0: var(--primitive-gray-0);
--elevation-shadow-0: none;

// Elevation +1 (기본 interactive)
--elevation-surface-1: var(--primitive-gray-0);
--elevation-shadow-1: var(--primitive-shadow-2);

// Elevation +2 (Select open, Menu expand)
--elevation-surface-2: var(--primitive-gray-0);
--elevation-shadow-2: var(--primitive-shadow-3);

// Elevation +3 (Tooltip, Panel)
--elevation-surface-3: var(--primitive-gray-0);
--elevation-shadow-3: var(--primitive-shadow-4);

// Elevation +4 (Critical alerts)
--elevation-surface-4: var(--primitive-gray-0);
--elevation-shadow-4: var(--primitive-shadow-4);
--elevation-dimd: rgba(0, 0, 0, 0.5);  // 오버레이

// *** Shadow 별칭 ***
--shadow-sm: var(--primitive-shadow-1);
--shadow-md: var(--primitive-shadow-2);
--shadow-lg: var(--primitive-shadow-3);
--shadow-xl: var(--primitive-shadow-4);

// *** Border (테두리) by Elevation ***
--border-color-elevation-minus-1: var(--primitive-gray-20);
--border-color-elevation-0: transparent;
--border-color-elevation-1: var(--primitive-gray-20);
--border-color-elevation-2: var(--color-border-focus);
--border-color-elevation-3: var(--color-border-focus);
--border-color-elevation-4: var(--color-border-focus);
```

---

## Component 토큰 구현

Component 토큰은 **코드에서만** 정의하며, 특정 UI 컴포넌트의 구체적인 스타일입니다.

```scss
// src/styles/tokens/component/_button.scss

// ============================================
// Button Component Tokens
// ============================================

// Primary Button
--button-primary-background: var(--color-interactive-primary);
--button-primary-text: var(--primitive-gray-0);
--button-primary-text-disabled: var(--color-text-disabled);
--button-primary-border: transparent;
--button-primary-padding: var(--space-padding-button-md);
--button-primary-radius: var(--primitive-radius-medium);
--button-primary-font-size: var(--typo-body-large-size);
--button-primary-font-weight: var(--primitive-font-weight-bold);
--button-primary-line-height: var(--typo-body-large-line-height);
--button-primary-shadow: var(--elevation-shadow-1);
--button-primary-height: 48px;

// Secondary Button
--button-secondary-background: var(--color-surface-level-3);
--button-secondary-text: var(--color-interactive-secondary);
--button-secondary-border: var(--color-border-default);
--button-secondary-padding: var(--space-padding-button-md);
--button-secondary-radius: var(--primitive-radius-medium);

// Button States
--button-hover-opacity: 0.9;
--button-active-opacity: 0.8;
--button-disabled-opacity: 0.5;
--button-focus-ring: 2px solid var(--color-border-focus);

// *** Size Variants ***
// Large
--button-lg-padding: var(--space-padding-button-lg);
--button-lg-font-size: var(--typo-body-large-size);
--button-lg-height: 56px;

// Small
--button-sm-padding: var(--space-padding-button-sm);
--button-sm-font-size: var(--typo-body-small-size);
--button-sm-height: 40px;
```

```scss
// src/styles/tokens/component/_input.scss

// ============================================
// Input Component Tokens
// ============================================

// Text Input (기본)
--input-background: var(--color-background-primary);
--input-border: var(--color-border-default);
--input-border-width: 1px;
--input-text-color: var(--color-text-primary);
--input-placeholder-color: var(--color-text-secondary);
--input-padding: var(--space-padding-input);
--input-radius: var(--primitive-radius-medium);
--input-font-size: var(--typo-body-medium-size);
--input-font-weight: var(--primitive-font-weight-regular);
--input-line-height: var(--typo-body-medium-line-height);
--input-height: 48px;
--input-shadow: none;

// Input States
--input-focus-border: var(--color-border-focus);
--input-focus-shadow: 0 0 0 3px rgba(var(--color-border-focus), 0.1);
--input-disabled-background: var(--color-background-secondary);
--input-disabled-text: var(--color-text-disabled);
--input-error-border: var(--color-status-error);

// Textarea
--textarea-padding: var(--space-padding-input);
--textarea-min-height: 96px;
--textarea-line-height: var(--typo-body-medium-line-height);

// Label
--input-label-font-size: var(--typo-label-medium-size);
--input-label-font-weight: var(--primitive-font-weight-regular);
--input-label-margin-bottom: var(--space-gap-sm);

// Helper Text
--input-helper-text-font-size: var(--typo-label-small-size);
--input-helper-text-color: var(--color-text-secondary);
--input-helper-text-margin-top: var(--space-gap-xs);
--input-error-text-color: var(--color-status-error);

// Gap between label and input
--input-gap-label-input: var(--space-gap-sm);      // 8px
--input-gap-input-helper: var(--space-gap-xs);     // 4px
```

```scss
// src/styles/tokens/component/_card.scss

// ============================================
// Card Component Tokens
// ============================================

// Card (기본)
--card-background: var(--color-surface-level-3);
--card-border: var(--color-border-default);
--card-border-width: 1px;
--card-padding: var(--space-padding-card-lg);
--card-radius: var(--primitive-radius-large);
--card-shadow: var(--elevation-shadow-1);

// Card States
--card-hover-shadow: var(--elevation-shadow-2);
--card-hover-background: var(--color-surface-level-4);

// Card with Header
--card-header-padding: var(--space-padding-card-lg);
--card-header-border-bottom: var(--color-border-default);
--card-header-gap: var(--space-gap-lg);

// Card Body
--card-body-padding: var(--space-padding-card-lg);
--card-body-gap: var(--space-gap-md);

// Card Footer
--card-footer-padding: var(--space-padding-card-lg);
--card-footer-border-top: var(--color-border-default);
--card-footer-gap: var(--space-gap-md);

// Interactive Card (clickable)
--card-interactive-cursor: pointer;
--card-interactive-transition: all 0.2s ease;
```

---

## Provider 패턴

### React Context + CSS Variables

```typescript
// src/context/TokenProvider.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';

export type TokenMode = 'default' | 'enhanced'; // 기본 모드 | 선명한 화면 모드

interface TokenContextType {
  mode: TokenMode;
  setMode: (mode: TokenMode) => void;
  deviceSize: 'mobile' | 'pc';
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

interface TokenProviderProps {
  children: React.ReactNode;
  defaultMode?: TokenMode;
}

export const TokenProvider: React.FC<TokenProviderProps> = ({
  children,
  defaultMode = 'default'
}) => {
  const [mode, setMode] = useState<TokenMode>(defaultMode);
  const [deviceSize, setDeviceSize] = useState<'mobile' | 'pc'>('pc');

  // 모드에 따른 CSS 변수 적용
  useEffect(() => {
    const root = document.documentElement;
    
    // 모드에 따른 색상 변경
    if (mode === 'enhanced') {
      // 선명한 화면 모드: 더 높은 대비율
      root.style.setProperty('--color-text-primary', 'hsl(0, 0%, 0%)');
      root.style.setProperty('--color-text-secondary', 'hsl(0, 0%, 20%)');
      root.style.setProperty('--color-background-primary', 'hsl(0, 0%, 100%)');
      root.style.setProperty('--elevation-surface-4', 'hsl(0, 0%, 10%)');
    } else {
      // 기본 모드
      root.style.setProperty('--color-text-primary', 'var(--primitive-gray-100)');
      root.style.setProperty('--color-text-secondary', 'var(--primitive-gray-70)');
      root.style.setProperty('--color-background-primary', 'var(--primitive-gray-0)');
      root.style.setProperty('--elevation-surface-4', 'var(--primitive-gray-0)');
    }

    // data 속성으로도 추가 (CSS selector에서 활용)
    root.setAttribute('data-token-mode', mode);
  }, [mode]);

  // 반응형 기기 감지
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setDeviceSize(width < 768 ? 'mobile' : 'pc');
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기값 설정

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value: TokenContextType = {
    mode,
    setMode,
    deviceSize
  };

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokens = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokens must be used within TokenProvider');
  }
  return context;
};

export const useModeToggle = () => {
  const { mode, setMode } = useTokens();
  
  const toggleMode = () => {
    setMode(mode === 'default' ? 'enhanced' : 'default');
  };

  return { mode, toggleMode };
};
```

### SCSS에서 Provider 활용

```scss
// src/styles/tokens/_provider.scss

// ============================================
// Token Provider SCSS
// 모드별 CSS 변수 오버라이딩
// ============================================

// 기본 모드
:root[data-token-mode="default"] {
  // 색상은 primitive 토큰 기본값 사용
  --color-text-primary: var(--primitive-gray-100);
  --color-text-secondary: var(--primitive-gray-70);
  --color-background-primary: var(--primitive-gray-0);
  
  // 그림자 - 완만한 느낌
  --elevation-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.05);
  --elevation-shadow-2: 0 1px 3px rgba(0, 0, 0, 0.1);
}

// 선명한 화면 모드 (High Contrast)
:root[data-token-mode="enhanced"] {
  // 색상 - 더 높은 대비율 (7:1 이상)
  --color-text-primary: hsl(0, 0%, 0%);           // 100% 대비율
  --color-text-secondary: hsl(0, 0%, 15%);       // 명도 15 (더 어두워짐)
  --color-background-primary: hsl(0, 0%, 100%);
  --color-background-secondary: hsl(0, 0%, 95%);
  
  // Surface 색상 재조정
  --color-surface-level-1: hsl(0, 0%, 90%);
  --color-surface-level-2: hsl(0, 0%, 85%);
  --color-surface-level-3: hsl(0, 0%, 80%);
  --color-surface-level-4: hsl(0, 0%, 75%);
  --color-surface-level-5: hsl(0, 0%, 70%);
  --color-surface-level-6: hsl(0, 0%, 60%);
  
  // 그림자 - 더 강한 느낌
  --elevation-shadow-1: 0 2px 4px rgba(0, 0, 0, 0.2);
  --elevation-shadow-2: 0 4px 8px rgba(0, 0, 0, 0.25);
  --elevation-shadow-3: 0 8px 12px rgba(0, 0, 0, 0.3);
  --elevation-shadow-4: 0 12px 16px rgba(0, 0, 0, 0.35);
  
  // 테두리 - 더 명확하게
  --color-border-default: hsl(0, 0%, 40%);
  --color-border-light: hsl(0, 0%, 50%);
}

// 기기별 간격 (반응형)
@media (max-width: 768px) {
  :root {
    // 모바일 전용 토큰 오버라이딩
    --space-padding-card-lg: var(--space-padding-card-md);
    
    // 타이포그래피 크기 조정
    @each $level in (1, 2, 3, 4, 5, 6) {
      --typo-heading-#{$level}-size: var(--typo-heading-#{$level}-size-mobile);
    }
  }
}

// PC 이상
@media (min-width: 1024px) {
  :root {
    // PC 전용 토큰
    --space-layout-left-contents: var(--primitive-space-16);
  }
}
```

---

## 사용 예시

### 1. 기본 컴포넌트 작성

```scss
// src/styles/components/_button.scss

// 버튼 컴포넌트 예시
.button {
  padding: var(--button-primary-padding);
  border: var(--button-primary-border);
  border-radius: var(--button-primary-radius);
  
  font-family: var(--primitive-font-family);
  font-size: var(--button-primary-font-size);
  font-weight: var(--button-primary-font-weight);
  
  background-color: var(--button-primary-background);
  color: var(--button-primary-text);
  
  box-shadow: var(--button-primary-shadow);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: var(--button-hover-opacity);
    box-shadow: var(--elevation-shadow-2);
  }

  &:active {
    opacity: var(--button-active-opacity);
  }

  &:disabled {
    opacity: var(--button-disabled-opacity);
    cursor: not-allowed;
    color: var(--button-primary-text-disabled);
  }

  &:focus-visible {
    outline: var(--button-focus-ring);
    outline-offset: 2px;
  }

  // Size Variants
  &.lg {
    padding: var(--button-lg-padding);
    font-size: var(--button-lg-font-size);
    height: var(--button-lg-height);
  }

  &.sm {
    padding: var(--button-sm-padding);
    font-size: var(--button-sm-font-size);
    height: var(--button-sm-height);
  }
}

// 버튼 색상 변형
.button.secondary {
  background-color: var(--button-secondary-background);
  color: var(--button-secondary-text);
  border: 1px solid var(--button-secondary-border);
}
```

```scss
// src/styles/components/_input.scss

// 입력 필드 컴포넌트 예시
.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--input-gap-label-input);
}

.input-label {
  font-family: var(--primitive-font-family);
  font-size: var(--input-label-font-size);
  font-weight: var(--input-label-font-weight);
  color: var(--color-text-primary);
}

.input-wrapper {
  position: relative;
}

.input {
  width: 100%;
  height: var(--input-height);
  padding: var(--input-padding);
  
  border: var(--input-border-width) solid var(--input-border);
  border-radius: var(--input-radius);
  
  font-family: var(--primitive-font-family);
  font-size: var(--input-font-size);
  font-weight: var(--input-font-weight);
  line-height: var(--input-line-height);
  color: var(--input-text-color);
  
  background-color: var(--input-background);
  box-shadow: var(--input-shadow);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: var(--input-placeholder-color);
  }

  &:focus {
    outline: none;
    border-color: var(--input-focus-border);
    box-shadow: var(--input-focus-shadow);
  }

  &:disabled {
    background-color: var(--input-disabled-background);
    color: var(--input-disabled-text);
    cursor: not-allowed;
  }

  &.error {
    border-color: var(--input-error-border);
  }
}

.input-helper-text {
  margin-top: var(--input-helper-text-margin-top);
  font-size: var(--input-helper-text-font-size);
  color: var(--input-helper-text-color);

  &.error {
    color: var(--input-error-text-color);
  }
}

.input-textarea {
  min-height: var(--textarea-min-height);
  resize: vertical;
}
```

### 2. React 컴포넌트 구현

```typescript
// src/components/Button.tsx

import React from 'react';
import { useTokens } from '@/context/TokenProvider';
import styles from '@/styles/components/_button.scss';

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'lg' | 'md' | 'sm';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => {
    const { mode } = useTokens();

    return (
      <button
        ref={ref}
        className={`button ${variant} ${size}`}
        data-token-mode={mode}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

```typescript
// src/components/Input.tsx

import React from 'react';
import { useTokens } from '@/context/TokenProvider';
import styles from '@/styles/components/_input.scss';

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className, ...props }, ref) => {
    const { mode } = useTokens();

    return (
      <div className="input-group" data-token-mode={mode}>
        {label && <label className="input-label">{label}</label>}
        <div className="input-wrapper">
          <input
            ref={ref}
            className={`input ${error ? 'error' : ''}`}
            {...props}
          />
        </div>
        {helperText && (
          <span className={`input-helper-text ${error ? 'error' : ''}`}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### 3. 마크다운 문서 내 컴포넌트 적용

```markdown
# 제목 1
<!-- typo-heading-1 토큰 적용 -->

## 제목 2
<!-- typo-heading-2 토큰 적용 -->

본문 텍스트입니다.
<!-- typo-body-medium 토큰 적용 -->

### 버튼 예시

<Button variant="primary">주요 버튼</Button>
<Button variant="secondary">보조 버튼</Button>
<Button size="sm">작은 버튼</Button>

### 입력 필드 예시

<Input
  label="이름"
  placeholder="이름을 입력하세요"
  helperText="한글, 영문, 숫자만 입력 가능합니다"
/>

<Input
  label="이메일"
  type="email"
  placeholder="example@example.com"
  helperText="올바른 이메일 형식을 입력하세요"
  error={true}
/>
```

---

## 모드 관리

### 모드 전환 구현

```typescript
// src/components/ModeToggle.tsx

import React from 'react';
import { useModeToggle } from '@/context/TokenProvider';

export const ModeToggle: React.FC = () => {
  const { mode, toggleMode } = useModeToggle();

  return (
    <button
      onClick={toggleMode}
      aria-label={`Switch to ${mode === 'default' ? 'enhanced' : 'default'} mode`}
    >
      {mode === 'default' ? '🌞 일반 모드' : '🔆 선명한 화면 모드'}
    </button>
  );
};
```

### 모드별 스타일 적용

```scss
// 모드별 색상 차이

// 기본 모드
:root[data-token-mode="default"] {
  --heading-color: var(--primitive-gray-100);     // 어두운 회색
  --text-color: var(--primitive-gray-100);
  --border-color: var(--primitive-gray-20);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

// 선명한 화면 모드 (고대비)
:root[data-token-mode="enhanced"] {
  --heading-color: hsl(0, 0%, 0%);                // 검정색
  --text-color: hsl(0, 0%, 0%);
  --border-color: hsl(0, 0%, 40%);                // 어두운 회색
  --shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  // 대비율 강화
  h1, h2, h3, h4, h5, h6 {
    color: var(--heading-color);
  }
}
```

---

## 유지보수 가이드

### 토큰 변경 프로세스

```markdown
## 1. Primitive 토큰 변경
예: Primary 색상 변경

1. `src/styles/tokens/primitive/_color.scss`에서 HSL 값 수정
   ```scss
   --hue-primary: 215;  // 변경 전: 210
   ```

2. 영향을 받는 Semantic 토큰 자동 업데이트됨
3. 모든 관련 컴포넌트에 즉시 반영

## 2. Semantic 토큰 추가
예: 새로운 상태 색상 추가

1. `src/styles/tokens/semantic/_color.scss`에 추가
   ```scss
   --color-status-pending: var(--primitive-primary-30);
   ```

2. 컴포넌트 토큰에서 참조
3. 해당 컴포넌트에 적용

## 3. Component 토큰 변경
예: Button 패딩 변경

1. `src/styles/tokens/component/_button.scss`에서 수정
   ```scss
   --button-primary-padding: var(--space-padding-button-lg);  // 변경
   ```

2. 영향받는 컴포넌트 스타일 확인
3. 필요시 Component 토큰 재조정

## 4. 모드별 토큰 오버라이딩
예: 선명한 화면 모드에서 특정 색상 조정

1. `src/styles/tokens/_provider.scss`의 `[data-token-mode="enhanced"]` 섹션 수정
2. 필요시 모드별 별도 Semantic 토큰 생성
```

### 토큰 명명 규칙

```
Primitive: --primitive-[category]-[variant]
예: --primitive-primary-50, --primitive-space-4

Semantic: --[category]-[role]-[state]
예: --color-text-primary, --space-padding-card

Component: --[component]-[state]-[property]
예: --button-primary-padding, --input-focus-border
```

### 체크리스트

```markdown
## 새 컴포넌트 추가 시

- [ ] Component 토큰 정의 (`src/styles/tokens/component/`)
- [ ] 기본 모드 및 선명한 화면 모드 토큰 작성
- [ ] 반응형(mobile/PC) 토큰 값 지정
- [ ] SCSS 컴포넌트 스타일 구현
- [ ] React 컴포넌트 구현 (useTokens hook 활용)
- [ ] 문서 작성 (사용 예시 포함)
- [ ] 접근성 검증 (대비율 확인)
- [ ] 모드 전환 테스트
```

### 접근성 검증

```scss
// 색상 대비율 검증
.contrast-check {
  // 기본 모드: 최소 4.5:1 (본문)
  color: var(--color-text-primary);           // 회색-100 (명도 0%)
  background: var(--color-background-primary); // 회색-0 (명도 100%)
  // 대비율: 21:1 ✅

  // 선명한 화면 모드: 최소 7:1
  @media (prefers-contrast: more) {
    color: hsl(0, 0%, 0%);     // 검정 (명도 0%)
    background: hsl(0, 0%, 100%); // 흰색 (명도 100%)
    // 대비율: 21:1 ✅
  }
}
```

---

## 요약

이 문서는 KRDS 디자인 시스템을 SCSS와 Provider 패턴으로 구현하는 완전한 가이드입니다. **Primitive → Semantic → Component** 3단계 토큰 구조를 통해 일관성 있고 유지보수하기 쉬운 디자인 시스템을 구축할 수 있습니다.

### 핵심 포인트

1. **계층적 구조**: Primitive 토큰을 변경하면 모든 상위 토큰이 자동으로 업데이트됨
2. **Provider 패턴**: React Context로 모드 전환을 동적으로 관리
3. **CSS 변수**: 런타임에 스타일 값 변경 가능
4. **접근성**: WCAG AA 기준 준수, 모드별 대비율 관리
5. **확장성**: 새로운 컴포넌트와 토큰 추가 용이

이를 통해 **모든 기관이 KRDS를 일관되게 적용하면서도, 기관의 특성에 맞게 커스터마이징**할 수 있습니다.
