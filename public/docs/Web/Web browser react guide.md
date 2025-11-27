# 웹 브라우저 동작방식 및 React 렌더링 메커니즘

## 목차

1. [웹 브라우저 아키텍처](#웹-브라우저-아키텍처)
2. [브라우저 렌더링 프로세스](#브라우저-렌더링-프로세스)
3. [JavaScript 실행과 이벤트 루프](#javascript-실행과-이벤트-루프)
4. [React 렌더링 메커니즘](#react-렌더링-메커니즘)
5. [React가 브라우저에서 동작하는 방식](#react가-브라우저에서-동작하는-방식)
6. [성능 최적화](#성능-최적화)

---

## 웹 브라우저 아키텍처

### 브라우저 주요 컴포넌트

웹 브라우저는 다음과 같은 핵심 컴포넌트로 구성되어 있습니다:

#### 1. **사용자 인터페이스 (User Interface)**

-   주소 표시줄, 뒤로/앞으로 버튼, 북마크 등 사용자가 상호작용하는 부분
-   렌더링되는 웹페이지 콘텐츠를 제외한 모든 브라우저 요소

#### 2. **브라우저 엔진 (Browser Engine)**

-   사용자 인터페이스와 렌더링 엔진 사이의 중개자 역할
-   데이터 지속성 관리 (쿠키, 캐시, localStorage)
-   여러 브라우저 컴포넌트 간의 통신 조율

#### 3. **렌더링 엔진 (Rendering Engine)**

-   HTML, CSS, JavaScript를 화면에 보이는 픽셀로 변환
-   JavaScript 해석기, 네트워킹 레이어와 협력
-   브라우저마다 다름 (Chrome: Blink, Firefox: Gecko, Safari: WebKit)

#### 4. **네트워킹 계층 (Networking Layer)**

-   HTTP/HTTPS 요청 관리
-   DNS 해석
-   캐싱, 압축 및 보안 조치 처리
-   연결 제한 설정

#### 5. **JavaScript 해석기 (JavaScript Interpreter)**

-   JavaScript 코드 파싱, 컴파일, 실행
-   토큰화 → 추상 구문 트리(AST) 생성 → 바이트코드 변환 → JIT 최적화 → 실행
-   DOM 조작, 이벤트 처리, 페이지 상호작용 가능

#### 6. **데이터 지속성 (Data Persistence)**

-   localStorage, sessionStorage, 인덱스드 DB 등으로 로컬 데이터 저장 및 검색

### 브라우저의 단일 스레드 특성

**중요한 특징: 브라우저는 기본적으로 단일 스레드(Single-threaded)**

브라우저의 메인 스레드는 다음 작업들을 순차적으로 처리합니다:

-   JavaScript 실행
-   DOM 조작
-   스타일 재계산
-   사용자 입력 처리
-   레이아웃 계산
-   화면 그리기(Paint)

이러한 단일 스레드 구조 때문에 오래 실행되는 JavaScript는 사용자 입력 반응성을 저하시킬 수 있습니다.

---

## 브라우저 렌더링 프로세스

### Critical Rendering Path (중요 렌더링 경로)

Critical Rendering Path(CRP)는 HTML, CSS, JavaScript를 픽셀로 변환하는 일련의 단계입니다.

### 브라우저 렌더링 프로세스 시간 흐름 (병렬 수행 표시)

| 단계             | 0%    | 10%   | 20%   | 30% | 40%   | 50%   | 60%   | 70%   | 80%   | 90% | 100% |
| ---------------- | ----- | ----- | ----- | --- | ----- | ----- | ----- | ----- | ----- | --- | ---- |
| HTML 파싱        | >>>>> |       |       |     |       |       |       |       |       |     |
| CSS 파싱         |       | >>>>> | >>>>> |     |       |       |       |       |       |     |      |
| JS 파싱/실행     |       |       |       |     | >>>>> | >>>>> |       |       |       |     |      |
| Render Tree 생성 |       |       |       |     |       |       | >>>>> |       |       |     |      |
| Layout           |       |       |       |     |       |       |       | >>>>> |       |     |      |
| Paint            |       |       |       |     |       |       |       |       | >>>>> |     |      |

### 5단계 렌더링 프로세스

#### **1단계: HTML 파싱 및 DOM 트리 구성**

```
HTTP 응답 → 바이트 스트림 → 토큰화 → 노드 생성 → DOM 트리
```

-   브라우저가 위에서 아래로 순차적으로 HTML을 파싱
-   토큰: 시작 태그, 종료 태그, 속성명, 속성값 등
-   각 토큰이 노드로 변환되고 계층 구조로 연결
-   DOM 트리는 점진적으로(incrementally) 구성됨

**중요한 차단 요소:**

-   `<script>` 태그를 만나면 HTML 파싱이 중단되고 JavaScript를 다운로드 및 실행
-   스크립트가 DOM에 접근할 수 있도록 현재까지의 DOM을 먼저 구성

#### **2단계: CSSOM 트리 구성**

```
CSS 다운로드 → 파싱 → CSSOM 트리
```

-   DOM 구성과 병렬로 수행
-   CSS 다운로드가 DOM 파싱을 직접 차단하지는 않음
-   그러나 렌더링은 CSSOM이 준비될 때까지 대기

**중요한 특징:**

-   CSS는 "렌더링 차단 리소스(render-blocking resource)"
-   CSSOM이 완성되기 전까지 렌더링이 진행되지 않음

#### **3단계: Render Tree 구성**

```
DOM + CSSOM → Render Tree (가시적 콘텐츠만)
```

-   보이는 콘텐츠만 포함 (display: none은 제외)
-   각 노드에 스타일 정보 첨부

#### **4단계: 레이아웃 (Layout)**

```
Render Tree → 각 요소의 정확한 위치와 크기 계산
```

-   "Reflow"라고도 불림
-   모든 요소의 정확한 치수와 위치 결정
-   부모 요소의 변경이 자식 요소의 재계산 유발

#### **5단계: 페인트 (Paint)**

```
Layout 정보 → 각 픽셀 래스터화 → 화면에 표시
```

-   "Repaint"라고도 불림
-   실제 픽셀을 메모리에 그리기
-   Reflow가 발생하면 반드시 Repaint 발생

### Reflow와 Repaint

**Reflow (리플로우)**: 레이아웃 재계산이 필요한 경우

-   요소의 크기, 위치, 디스플레이 변경
-   브라우저 창 크기 조정
-   폰트 크기 변경
-   DOM 요소 추가/제거

**Repaint (리페인트)**: 스타일만 변경되는 경우

-   배경색, 색상 변경 (레이아웃에 영향 없음)
-   테두리 스타일 변경
-   그림자 효과 변경

**성능 팁**: Repaint만 발생하는 속성 변경이 Reflow를 유발하는 속성 변경보다 빠릅니다.

---

## JavaScript 실행과 이벤트 루프

### 이벤트 루프 (Event Loop)

브라우저는 JavaScript를 동기적으로 실행하고, 비동기 작업을 관리하기 위해 이벤트 루프를 사용합니다.

### 태스크 큐와 마이크로태스크 큐

```
┌─────────────────────┐
│   Call Stack        │ ← 동기 코드 실행
├─────────────────────┤
│   Microtask Queue   │ ← Promise, MutationObserver
│   [...............]  │   process.nextTick
├─────────────────────┤
│   Macrotask Queue   │ ← setTimeout, setInterval
│   [...............]  │   I/O, UI 렌더링
└─────────────────────┘
```

#### **마이크로태스크 (Microtask)**

-   Promise 콜백
-   MutationObserver
-   process.nextTick (Node.js)

#### **매크로태스크 (Macrotask)**

-   setTimeout, setInterval, setImmediate
-   I/O 작업
-   UI 렌더링
-   클릭, 스크롤 등 이벤트 콜백

### 이벤트 루프 실행 순서

```
1. 콜 스택에서 동기 코드 실행
2. 콜 스택이 비면 마이크로태스크 큐의 모든 작업 실행
3. 마이크로태스크 큐가 비면 UI 렌더링 수행
4. 마크로태스크 큐에서 하나의 작업 실행
5. 1번으로 돌아가 반복
```

### 실행 예제

```javascript
console.log('1. 동기 코드');

setTimeout(() => {
    console.log('4. setTimeout (매크로태스크)');
}, 0);

Promise.resolve().then(() => {
    console.log('2. Promise (마이크로태스크)');
});

console.log('3. 동기 코드');

// 출력 순서:
// 1. 동기 코드
// 3. 동기 코드
// 2. Promise (마이크로태스크)
// 4. setTimeout (매크로태스크)
```

---

## React 렌더링 메커니즘

### Virtual DOM (가상 DOM)

#### Virtual DOM이 필요한 이유

실제 DOM 조작은 매우 비용이 많이 드는 작업입니다:

-   브라우저 렌더링 과정(Reflow, Repaint)이 반복적으로 발생
-   SPA(Single Page Application)에서 사용자 상호작용에 따른 지속적인 DOM 업데이트
-   부모 요소 변경 시 모든 자식 요소도 다시 렌더링

**React의 해결책**: Virtual DOM

-   메모리에서 가상의 DOM 트리 유지
-   변경사항을 메모리에서 먼저 처리
-   최소한의 DOM 업데이트만 실제 DOM에 반영

#### Virtual DOM의 동작 원리

```
상태 변경 → Virtual DOM 렌더링 (메모리)
         ↓
    이전 Virtual DOM과 비교 (Diffing)
         ↓
   변경사항 계산 (Reconciliation)
         ↓
   최소한의 DOM 변경만 적용 (Commit)
         ↓
   브라우저 렌더링 (Reflow/Repaint 최소화)
```

### React Fiber 아키텍처

React 16에서 도입된 새로운 조정(Reconciliation) 알고리즘입니다.

#### Fiber가 해결한 문제

**기존 Stack 기반 알고리즘의 한계:**

-   재귀적으로 전체 컴포넌트 트리 순회
-   동기적 작업으로 중단 불가능
-   오래 걸리는 렌더링이 메인 스레드 차단 → 애니메이션 끊김, 입력 지연

**Fiber의 개선사항:**

-   작업을 작은 단위(fiber)로 분할
-   우선순위 기반 작업 관리
-   작업 중단 및 재개 가능
-   메인 스레드 차단 최소화

#### Fiber 작업 흐름

```
1. [비동기] Render 단계
   - 모든 비동기 작업 수행
   - Fiber를 하나의 작업 단위로 처리
   - finishedWork()로 마무리

2. [동기] Commit 단계
   - 실제 DOM에 변경사항 반영
   - commitWork() 실행
   - DOM 업데이트 후 화면 그리기
```

### React 렌더링 프로세스 3단계

#### **1단계: Render 트리거**

렌더링이 시작되는 두 가지 경우:

**초기 렌더링:**

```javascript
import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(<App />, document.getElementById('root'));
```

**상태 업데이트:**

```javascript
const [count, setCount] = useState(0);

const handleClick = () => {
    setCount(count + 1); // 렌더링 트리거
};
```

#### **2단계: 컴포넌트 렌더링**

React가 컴포넌트 함수를 호출하여 반환할 JSX 결정:

```javascript
function Counter() {
    const [count, setCount] = useState(0);

    // render 단계: 이 함수가 호출됨
    return (
        <div>
            <p>{count}</p>
            <button onClick={() => setCount(count + 1)}>+1</button>
        </div>
    );
}
```

**주의: 이 단계에서는 실제 DOM이 변경되지 않습니다. Virtual DOM만 업데이트됩니다.**

#### **3단계: DOM에 Commit**

Virtual DOM 비교 결과를 실제 DOM에 반영:

```
이전 Virtual DOM과 새로운 Virtual DOM 비교 (Shallow Comparison)
                    ↓
            변경된 부분만 식별
                    ↓
        실제 DOM에 변경사항 반영 (Commit)
                    ↓
        브라우저 렌더링 (Reflow/Repaint)
```

### React Batching (배치 처리)

React는 여러 상태 업데이트를 하나의 렌더링 사이클에 묶습니다.

#### React 17까지

**이벤트 핸들러 내에서만 배치:**

```javascript
const handleClick = () => {
    setCount(count + 1); // 배치됨
    setFlag(!flag); // 배치됨
    // 1번의 렌더링으로 처리
};

// 그러나 이벤트 핸들러 외부에서는 배치 안됨:
setTimeout(() => {
    setCount(count + 1); // 개별 렌더링
    setFlag(!flag); // 개별 렌더링
    // 각각 1번씩, 총 2번 렌더링
}, 1000);
```

#### React 18부터: 자동 배치 (Automatic Batching)

**모든 비동기 업데이트가 자동으로 배치됨:**

```javascript
// setTimeout 내에서도 배치됨
setTimeout(() => {
    setCount(count + 1);
    setFlag(!flag);
    // React 18: 1번의 렌더링으로 처리
}, 1000);

// Promise 콜백에서도 배치됨
fetchData().then(() => {
    setCount(count + 1);
    setFlag(!flag);
    // 1번의 렌더링으로 처리
});
```

### 상태 업데이트 큐

React는 상태 업데이트를 큐에 저장하고 순차적으로 처리합니다:

```javascript
const [number, setNumber] = useState(0);

const handleClick = () => {
    setNumber(number + 1); // 큐: [number + 1]
    setNumber(number + 1); // 큐: [number + 1] (이전과 동일)
    setNumber(number + 1); // 큐: [number + 1] (이전과 동일)
};

// 결과: 1 증가 (3번 아님!)
```

**업데이터 함수 사용:**

```javascript
const handleClick = () => {
    setNumber((n) => n + 1); // 큐: [이전값 + 1]
    setNumber((n) => n + 1); // 큐: [(이전값 + 1) + 1]
    setNumber((n) => n + 1); // 큐: [((이전값 + 1) + 1) + 1]
};

// 결과: 3 증가
```

---

## React가 브라우저에서 동작하는 방식

### React 애플리케이션의 생명 주기

#### **1. 초기 마운트 (Initial Mount)**

```javascript
// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

**동작 순서:**

1. `<App />` 컴포넌트 함수 호출
2. Virtual DOM 구성
3. 실제 DOM에 마운트
4. 브라우저 렌더링 (첫 화면 표시)

#### **2. 업데이트 (Update)**

**상태 변경 시:**

```javascript
function Counter() {
    const [count, setCount] = useState(0);

    const handleClick = () => {
        setCount(count + 1); // 1. 상태 업데이트 스케줄
        // 2. 렌더링 트리거
        // 3. 컴포넌트 재실행
        // 4. 새로운 JSX 반환
        // 5. Virtual DOM 비교
        // 6. 실제 DOM 업데이트
        // 7. 브라우저 렌더링
    };

    return <button onClick={handleClick}>{count}</button>;
}
```

#### **3. 언마운트 (Unmount)**

```javascript
useEffect(() => {
    // Mount 시 실행
    console.log('마운트됨');

    // 정리 함수 (cleanup)
    return () => {
        console.log('언마운트됨');
    };
}, []);
```

### React와 브라우저 이벤트 루프의 상호작용

#### **Synthetic Event 시스템**

React는 네이티브 브라우저 이벤트를 래핑하여 관리합니다:

```javascript
function Button() {
    const handleClick = (e) => {
        // e는 React의 Synthetic Event 객체
        console.log(e.type); // "click"
    };

    return <button onClick={handleClick}>클릭</button>;
}
```

**동작 과정:**

1. 사용자 클릭
2. 브라우저 이벤트 발생
3. React Synthetic Event로 변환
4. 이벤트 핸들러 호출
5. setState 호출 → 배치 처리
6. 렌더링 트리거
7. Virtual DOM 비교
8. 실제 DOM 업데이트
9. 브라우저 렌더링

#### **마이크로태스크 활용**

React 내부에서 Promise의 마이크로태스크를 활용합니다:

```javascript
// React 18의 자동 배치 구현 (개념)
function batchUpdates(callback) {
    // 모든 업데이트를 마이크로태스크로 처리
    return Promise.resolve().then(() => {
        flushUpdates();
        callback();
    });
}
```

### useEffect 생명 주기

```javascript
function Component() {
    const [count, setCount] = useState(0);

    // 렌더링 후 모든 효과 실행
    useEffect(() => {
        console.log('모든 렌더링 후 실행');
    });

    // 의존성 없음: 매 렌더링마다 실행
    useEffect(() => {
        console.log('매 렌더링마다');
    }, []);

    // 빈 의존성 배열: 마운트 시만 실행
    useEffect(() => {
        console.log('마운트 시만 실행');

        return () => {
            console.log('언마운트 시 정리 함수 실행');
        };
    }, []);

    // 의존성 배열: 의존성 변경 시만 실행
    useEffect(() => {
        console.log('count 변경 시 실행');
    }, [count]);

    return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**실행 순서:**

```
1. 컴포넌트 렌더링
2. 실제 DOM 업데이트
3. 브라우저 렌더링
4. useEffect 콜백 실행 (마이크로태스크)
5. 정리 함수 실행 (다음 effect 전)
```

---

## 성능 최적화

### 렌더링 최적화

#### **불필요한 렌더링 방지**

```javascript
// 1. React.memo 사용 (함수 컴포넌트)
const MemoizedComponent = React.memo(function Component(props) {
    return <div>{props.value}</div>;
});

// 2. useMemo 사용 (계산 결과 메모이제이션)
function Component() {
    const expensiveValue = useMemo(() => {
        return computeExpensiveValue();
    }, [dependency]);

    return <div>{expensiveValue}</div>;
}

// 3. useCallback 사용 (함수 메모이제이션)
function Component() {
    const memoizedCallback = useCallback(() => {
        doSomething();
    }, [dependency]);

    return <button onClick={memoizedCallback}>클릭</button>;
}
```

#### **상태 구조 최적화**

```javascript
// ❌ 나쁜 예: 전체 상태가 자주 변경
const [appState, setAppState] = useState({
    user: { name: '' },
    ui: { theme: 'dark' },
    data: [],
});

// ✅ 좋은 예: 관련된 상태를 분리
const [user, setUser] = useState({ name: '' });
const [theme, setTheme] = useState('dark');
const [data, setData] = useState([]);
```

### DOM 조작 최적화

#### **배치 업데이트 활용**

```javascript
// ❌ 나쁜 예: 여러 번 DOM 업데이트
function handleMultipleUpdates() {
    setState1(value1); // 렌더링 1
    setState2(value2); // 렌더링 2
    setState3(value3); // 렌더링 3
}

// ✅ 좋은 예: 자동으로 배치됨 (React 18+)
function handleMultipleUpdates() {
    setState1(value1);
    setState2(value2);
    setState3(value3);
    // 1번의 렌더링으로 처리됨
}
```

#### **key 속성 사용**

```javascript
// ❌ 나쁜 예: index를 key로 사용
{
    items.map((item, index) => <div key={index}>{item.name}</div>);
}

// ✅ 좋은 예: 고유 ID를 key로 사용
{
    items.map((item) => <div key={item.id}>{item.name}</div>);
}
```

### Critical Rendering Path 최적화

#### **JavaScript 로딩 최적화**

```html
<!-- ❌ 나쁜 예: 렌더링 차단 -->
<head>
    <script src="app.js"></script>
</head>
<body>
    <div id="root"></div>
</body>

<!-- ✅ 좋은 예 1: async 속성 사용 (독립적인 스크립트) -->
<head>
    <script async src="analytics.js"></script>
</head>

<!-- ✅ 좋은 예 2: defer 속성 사용 (순서 보장 필요) -->
<head>
    <script defer src="app.js"></script>
</head>

<!-- ✅ 좋은 예 3: 바디 끝에 배치 -->
<body>
    <div id="root"></div>
    <script src="app.js"></script>
</body>
```

#### **CSS 최적화**

```html
<!-- ❌ 나쁜 예: @import 사용 (순차 다운로드) -->
<style>
    @import url('styles.css');
</style>

<!-- ✅ 좋은 예: 직접 링크 (병렬 다운로드) -->
<link rel="stylesheet" href="styles.css" />

<!-- ✅ 중요하지 않은 CSS: media 속성 사용 -->
<link rel="stylesheet" href="print.css" media="print" />
```

### 메인 스레드 최적화

#### **긴 작업 분할**

```javascript
// ❌ 나쁜 예: 메인 스레드 차단
function processLargeData(data) {
    for (let i = 0; i < data.length; i++) {
        // 처리
    }
}

// ✅ 좋은 예: Web Worker 사용
// worker.js
self.onmessage = (event) => {
    const result = processLargeData(event.data);
    self.postMessage(result);
};

// main.js
const worker = new Worker('worker.js');
worker.postMessage(largeData);
worker.onmessage = (event) => {
    console.log('처리 완료:', event.data);
};
```

#### **requestIdleCallback 사용**

```javascript
// 낮은 우선순위 작업 처리
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        // 유휴 시간에 실행되는 작업
        analyzePerformance();
    });
} else {
    // Fallback
    setTimeout(() => {
        analyzePerformance();
    }, 1);
}
```

---

## 정리

### 웹 브라우저 동작 요약

1. **수신**: 서버에서 HTML 다운로드
2. **파싱**: HTML, CSS 순차 파싱 → DOM, CSSOM 생성
3. **렌더링**: DOM + CSSOM → Render Tree → Layout → Paint
4. **상호작용**: JavaScript 실행 → 이벤트 처리 → 상태 변경 → 렌더링 반복

### React 렌더링 메커니즘 요약

1. **상태/Props 변경**: 컴포넌트 업데이트 트리거
2. **Virtual DOM 렌더링**: 메모리에서 새로운 트리 구성
3. **Reconciliation**: 이전 트리와 비교하여 변경사항 식별
4. **Commit**: 변경사항을 실제 DOM에 반영
5. **브라우저 렌더링**: DOM 업데이트 → Reflow/Repaint → 화면 표시

### React의 주요 성능 특징

-   **Virtual DOM**: 불필요한 DOM 조작 최소화
-   **Fiber 아키텍처**: 작업 분할 및 우선순위 관리
-   **자동 배치**: 여러 상태 업데이트를 한 번의 렌더링으로 처리
-   **Synthetic Events**: 이벤트 위임으로 메모리 효율 개선
