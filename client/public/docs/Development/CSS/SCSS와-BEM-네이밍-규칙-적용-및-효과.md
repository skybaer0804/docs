# SCSS와 BEM 네이밍 규칙 적용 및 효과

## 개요

이 문서는 Nodnjs Documentation 프로젝트에서 SCSS와 BEM(Block Element Modifier) 네이밍 규칙을 적용한 방법과 그 효과에 대해 설명합니다.

## SCSS란?

SCSS(Sassy CSS)는 CSS의 전처리기로, 변수, 중첩, 믹스인, 함수 등의 기능을 제공하여 더 효율적이고 유지보수하기 쉬운 스타일시트를 작성할 수 있게 해줍니다.

### 주요 특징

-   **변수 사용**: 색상, 폰트 크기 등을 변수로 관리
-   **중첩**: 선택자를 중첩하여 구조화된 스타일 작성
-   **믹스인**: 재사용 가능한 스타일 블록 생성
-   **함수**: 동적 값 계산 및 변환

## BEM 네이밍 규칙

BEM은 CSS 클래스 네이밍 방법론으로, Block, Element, Modifier의 약자입니다.

### 구조

```
.block {}
.block__element {}
.block--modifier {}
.block__element--modifier {}
```

### 구성 요소

1. **Block (블록)**: 독립적으로 사용 가능한 컴포넌트

    - 예: `layout`, `breadcrumb`, `directory-tree`

2. **Element (요소)**: Block의 하위 요소

    - 예: `layout__sidebar`, `breadcrumb__item`, `directory-tree__file-item`

3. **Modifier (수정자)**: Block 또는 Element의 변형
    - 예: `breadcrumb--desktop`, `breadcrumb--mobile`, `file-item--active`

## 프로젝트 적용 예시

### 1. Layout 컴포넌트

```scss
.layout {
    display: flex;
    justify-content: center;
    height: 100%;
    background-color: #ffffff;

    &__container {
        max-width: 1100px;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    &__content-wrapper {
        display: flex;
        align-items: stretch;
        flex: 1;
        overflow: hidden;
    }

    &__sidebar {
        background: #ffffff;
        padding: 20px;
        border-right: 1px solid #e0e0e0;

        &--collapsed {
            width: 0;
            padding: 0;
            overflow: hidden;
        }
    }

    &__main {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
    }
}
```

**효과:**

-   `.layout` 블록으로 전체 레이아웃 구조를 명확히 표현
-   `&__sidebar`, `&__main` 등으로 요소 간 관계를 직관적으로 파악 가능
-   `&--collapsed` 수정자로 상태 변화를 쉽게 표현

### 2. Breadcrumb 컴포넌트

```scss
.breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    font-size: 0.9rem;
    color: #666;

    &--desktop {
        display: flex;
    }

    &--mobile {
        display: none;
    }

    &__expand-btn {
        background: transparent;
        border: none;
        border-radius: 50%;
        padding: 6px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background-color: #f0f0f0;
            color: #333;
        }
    }

    &__item {
        display: inline-flex;
        align-items: center;
    }

    &__link {
        color: #1976d2;
        text-decoration: none;

        &:hover {
            color: #1565c0;
            text-decoration: underline;
        }
    }

    &__current {
        color: #333;
        font-weight: 500;
    }

    &__separator {
        margin: 0 8px;
        color: #999;
    }
}

@media (max-width: 768px) {
    .breadcrumb {
        &--desktop {
            display: none;
        }

        &--mobile {
            display: flex;
        }
    }
}
```

**효과:**

-   반응형 디자인을 `--desktop`, `--mobile` 수정자로 명확히 구분
-   SCSS 중첩을 활용하여 관련 스타일을 그룹화
-   가상 선택자(`&:hover`)를 자연스럽게 통합

### 3. DirectoryTree 컴포넌트

```scss
.directory-tree {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.category-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.category-header {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 6px 0;

    &:hover {
        color: #2c3e50;
    }
}

.file-item {
    padding: 6px 12px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
    color: #666;

    &:hover {
        background-color: #f0f0f0;
        color: #2c3e50;
    }

    &.active {
        background-color: #e3f2fd;
        color: #1976d2;
        font-weight: 500;
    }
}
```

**효과:**

-   각 컴포넌트의 구조를 명확히 표현
-   상태 변화(`&.active`)를 수정자로 표현
-   호버 효과를 SCSS 중첩으로 간결하게 작성

## 적용 효과

### 1. 코드 가독성 향상

**Before (일반 CSS):**

```css
.breadcrumb-desktop {
    display: flex;
}

.breadcrumb-mobile {
    display: none;
}

.breadcrumb-expand-btn {
    background: transparent;
}

.breadcrumb-expand-btn:hover {
    background-color: #f0f0f0;
}
```

**After (SCSS + BEM):**

```scss
.breadcrumb {
    &--desktop {
        display: flex;
    }

    &--mobile {
        display: none;
    }

    &__expand-btn {
        background: transparent;

        &:hover {
            background-color: #f0f0f0;
        }
    }
}
```

**효과:**

-   관련 스타일이 그룹화되어 구조 파악이 쉬움
-   중첩을 통해 계층 구조를 명확히 표현
-   클래스명만으로 요소 간 관계를 이해 가능

### 2. 유지보수성 향상

-   **명확한 네이밍**: 클래스명만으로 요소의 역할과 관계를 파악 가능
-   **중앙 집중화**: 관련 스타일이 한 곳에 모여 있어 수정이 용이
-   **재사용성**: Block 단위로 컴포넌트를 재사용 가능

### 3. 스타일 충돌 방지

-   BEM 네이밍 규칙으로 클래스명이 고유하게 유지됨
-   글로벌 스타일 오염 최소화
-   컴포넌트 간 스타일 간섭 방지

### 4. 개발 생산성 향상

-   **자동 완성**: IDE에서 관련 클래스명을 쉽게 찾을 수 있음
-   **리팩토링 용이**: 클래스명 규칙이 일관되어 대규모 변경이 쉬움
-   **협업 효율**: 팀원 간 코드 이해도 향상

### 5. 성능 최적화

-   SCSS 컴파일 시 최적화된 CSS 생성
-   불필요한 중첩 제거
-   미사용 스타일 제거 가능

## 모범 사례

### 1. 중첩 깊이 제한

**권장:**

```scss
.layout {
    &__sidebar {
        &__collapse-btn {
            // 최대 3단계
        }
    }
}
```

**비권장:**

```scss
.layout {
    &__sidebar {
        &__collapse-btn {
            &__icon {
                &__svg {
                    // 너무 깊은 중첩
                }
            }
        }
    }
}
```

### 2. 수정자 사용

**권장:**

```scss
.button {
    &--primary {
        background-color: #1976d2;
    }

    &--disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}
```

**비권장:**

```scss
.button-primary {
    background-color: #1976d2;
}

.button-disabled {
    opacity: 0.5;
}
```

### 3. 반응형 디자인

```scss
.breadcrumb {
    font-size: 0.9rem;

    @media (max-width: 768px) {
        font-size: 0.85rem;

        &--desktop {
            display: none;
        }

        &--mobile {
            display: flex;
        }
    }
}
```

## 결론

SCSS와 BEM 네이밍 규칙을 적용함으로써:

1. **코드 품질 향상**: 가독성, 유지보수성, 재사용성 개선
2. **개발 효율성 증대**: 명확한 구조로 빠른 개발 및 수정 가능
3. **협업 효율성 향상**: 일관된 규칙으로 팀원 간 소통 원활
4. **확장성 확보**: 대규모 프로젝트에서도 안정적인 스타일 관리 가능

이러한 규칙을 지속적으로 적용하여 프로젝트의 스타일 코드 품질을 유지하고 개선해 나가야 합니다.
