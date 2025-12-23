# SPA 구조 전환 계획서

## 현재 구조의 문제점 분석

### 1. preact-router의 한계

-   **컴포넌트 생명주기 문제**: 라우트 변경 시 컴포넌트가 언마운트/리마운트됨
-   **타이밍 제어 어려움**: 슬라이드 애니메이션과 네비게이션의 동기화가 어려움
-   **상태 초기화**: 라우트 변경 시 컴포넌트가 재생성되면서 상태가 초기화됨
-   **깜빡임 현상**: 네비게이션 후 새로운 콘텐츠가 로드되면서 기본 애니메이션이 발생

### 2. 현재 구조의 문제점

```
라우트 변경 → 컴포넌트 언마운트 → 새 컴포넌트 마운트 → 콘텐츠 로드 → 애니메이션 발생
```

이 과정에서 슬라이드 애니메이션과 네비게이션이 분리되어 있어 동기화가 어려움

## SPA 구조로 전환 시 장점

### 1. 완전한 제어

-   페이지 히스토리를 직접 관리
-   슬라이드 애니메이션과 네비게이션을 완전히 동기화
-   여러 페이지를 동시에 렌더링하고 전환 제어 가능

### 2. 부드러운 전환

-   애니메이션 중에도 컴포넌트가 유지됨
-   상태가 초기화되지 않음
-   깜빡임 없이 부드러운 전환

### 3. 성능 향상

-   불필요한 컴포넌트 재생성 방지
-   페이지 캐싱 가능
-   메모리 효율적인 관리

## 구현 방안

### 1. 상태 기반 네비게이션 시스템

```javascript
// App.jsx - 상태 기반 라우팅
export function App() {
    const [currentRoute, setCurrentRoute] = useState('/');
    const [routeHistory, setRouteHistory] = useState(['/']);
    const [slideState, setSlideState] = useState({
        direction: 'none',
        isAnimating: false,
        currentIndex: 0,
    });

    const handleNavigate = (path, options = {}) => {
        if (options.animate) {
            // 슬라이드 애니메이션과 함께 네비게이션
            setSlideState({ direction: options.direction, isAnimating: true });
            setTimeout(() => {
                setCurrentRoute(path);
                setRouteHistory([...routeHistory, path]);
                setSlideState({ direction: 'none', isAnimating: false });
            }, 350);
        } else {
            // 즉시 네비게이션
            setCurrentRoute(path);
            setRouteHistory([...routeHistory, path]);
        }
    };

    return (
        <LayoutContainer>
            <DocPageContainer currentRoute={currentRoute} slideState={slideState} onNavigate={handleNavigate} />
        </LayoutContainer>
    );
}
```

### 2. 페이지 스택 관리

```javascript
// 페이지 히스토리를 스택으로 관리
const [pageStack, setPageStack] = useState([{ route: '/', content: null, loading: false }]);

// 슬라이드 애니메이션 중에도 페이지 유지
// 상위 페이지로 이동 시 현재 페이지를 스택에 유지
```

### 3. URL 동기화 (선택사항)

```javascript
// 브라우저 히스토리와 동기화 (필요시)
useEffect(() => {
    window.history.pushState(null, '', currentRoute);
}, [currentRoute]);

// 브라우저 뒤로가기/앞으로가기 지원
window.addEventListener('popstate', (e) => {
    // 히스토리에서 이전/다음 페이지로 이동
});
```

## 구현 단계

### Phase 1: 기본 구조 변경

1. `App.jsx`에서 라우터 제거
2. 상태 기반 네비게이션 시스템 구현
3. `DocPageContainer`를 상태 기반으로 변경

### Phase 2: 페이지 스택 관리

1. 페이지 히스토리 스택 구현
2. 슬라이드 애니메이션과 네비게이션 동기화
3. 페이지 캐싱 구현

### Phase 3: URL 동기화 (선택사항)

1. 브라우저 히스토리와 동기화
2. 뒤로가기/앞으로가기 지원
3. 직접 URL 접근 지원

## 예상 효과

### 장점

-   ✅ 슬라이드 애니메이션과 네비게이션 완전 동기화
-   ✅ 깜빡임 없는 부드러운 전환
-   ✅ 상태 유지로 더 나은 사용자 경험
-   ✅ 성능 향상 (불필요한 재렌더링 방지)

### 고려사항

-   ⚠️ 브라우저 히스토리 관리 필요 (선택사항)
-   ⚠️ 직접 URL 접근 처리 필요 (선택사항)
-   ⚠️ SEO 고려 (현재는 문서 뷰어이므로 문제 없음)

## 결론

**SPA 구조로 전환하는 것을 강력히 권장합니다.**

현재 구조에서는 라우터의 생명주기와 슬라이드 애니메이션을 동기화하기 어렵습니다.
SPA 구조로 변경하면 완전한 제어가 가능하고, 부드러운 전환을 구현할 수 있습니다.
