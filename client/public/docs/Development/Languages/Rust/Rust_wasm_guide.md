# Rust와 WebAssembly(Wasm) 심화 가이드

이 문서는 Rust를 활용하여 웹 브라우저에서 네이티브 성능을 내는 **WebAssembly(Wasm)** 기술을 심도 있게 다룹니다. 기존 JavaScript 환경의 한계를 넘어서고 싶은 개발자를 위해 구성되었습니다.

---

## 1. WebAssembly(Wasm)란 무엇인가?

### 1.1 정의
WebAssembly는 브라우저에서 실행 가능한 **바이너리 명령어 포맷(Binary Instruction Format)**입니다. 
C++, Rust, Go 같은 저수준 언어로 작성된 코드를 컴파일하여 웹에서 실행할 수 있게 해줍니다.

### 1.2 핵심 철학
**"JavaScript를 대체하는 것이 아니라, 보완(Complement)한다."**
*   **JavaScript:** UI 상호작용, DOM 조작, 가벼운 로직 (Main Thread)
*   **WebAssembly:** 이미지/영상 처리, 암호화, 물리 엔진 등 무거운 연산 (Worker)

### 1.3 장단점 요약

| 구분 | 장점 (Pros) | 단점 (Cons) |
| :--- | :--- | :--- |
| **성능** | 네이티브에 가까운 실행 속도 (Parsing/Compiling 불필요) | DOM 접근 시 JS를 거쳐야 하므로 오버헤드 발생 |
| **보안** | 샌드박스 환경에서 실행되어 메모리 접근이 제한됨 | 디버깅이 JS에 비해 복잡함 (Source Maps 필요) |
| **이식성** | 한 번 컴파일하면 모든 최신 브라우저에서 실행 | 초기 번들 사이즈(wasm 파일)가 커질 수 있음 |

---

## 2. Rust로 WebAssembly 활용하기 (90%)

Rust는 가비지 컬렉터(GC)가 없고 런타임이 매우 작아 `.wasm` 파일 사이즈를 최소화할 수 있어, **WebAssembly를 위한 최고의 언어**로 꼽힙니다.

### 2.1 필수 도구 설치
Rust 툴체인 외에 Wasm 빌드 및 패키징 도구가 필요합니다.

```bash
# 1. wasm-pack 설치 (Rust -> Wasm 빌드 및 번들링 도구)
cargo install wasm-pack

# 2. 프로젝트 생성 (라이브러리 형태)
cargo new --lib rust_wasm_demo
cd rust_wasm_demo
```

### 2.2 Cargo.toml 설정
Wasm은 동적 라이브러리(`cdylib`) 형태로 컴파일되어야 합니다.

```toml
[package]
name = "rust_wasm_demo"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"] # 필수 설정

[dependencies]
# Rust와 JS 간의 통신을 담당하는 마법 같은 접착제
wasm-bindgen = "0.2"

# 브라우저 API(console, alert, window 등)를 사용하기 위한 크레이트
web-sys = { version = "0.3", features = ["console"] }
```

### 2.3 Rust 코드 작성 (`src/lib.rs`)
`wasm-bindgen`을 사용하여 JS가 호출할 수 있는 Rust 함수를 만듭니다.

```rust
use wasm_bindgen::prelude::*;

// JavaScript의 `alert` 함수를 가져옴 (Import)
#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

// JavaScript로 내보낼 함수 (Export)
#[wasm_bindgen]
pub fn greet(name: &str) {
    // Rust의 format! 매크로 사용
    let msg = format!("Hello, {}! from Rust", name);
    alert(&msg);
}

// 고성능 연산 예시: 피보나치 수열
#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    if n < 2 {
        n
    } else {
        fibonacci(n - 1) + fibonacci(n - 2)
    }
}
```

### 2.4 빌드하기
다음 명령어를 실행하면 `pkg` 폴더에 `.wasm` 파일과 이를 감싸는 `.js` 파일이 생성됩니다.

```bash
# 웹 타겟으로 빌드
wasm-pack build --target web
```

### 2.5 웹 페이지에 연동하기 (`index.html`)
최신 브라우저는 ES Modules를 지원하므로 바로 로딩이 가능합니다.

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rust Wasm Demo</title>
</head>
<body>
    <script type="module">
        // 빌드된 모듈 불러오기 (init 함수가 초기화를 담당)
        import init, { greet, fibonacci } from './pkg/rust_wasm_demo.js';

        async function run() {
            // 1. Wasm 모듈 초기화
            await init();

            // 2. Rust 함수 호출
            greet("WebAssembly"); // 알림창: "Hello, WebAssembly! from Rust"

            // 3. 성능 테스트
            console.time("Rust Fibonacci");
            console.log(fibonacci(40));
            console.timeEnd("Rust Fibonacci");
        }

        run();
    </script>
</body>
</html>
```

### 2.6 심화: DOM 조작과 프레임워크
순수 `wasm-bindgen`만으로 DOM을 조작하는 것은 번거롭습니다. 이를 쉽게 해주는 생태계가 있습니다.

1.  **web-sys:** `window`, `document`, `element` 등 브라우저 API를 Rust 타입으로 매핑해둔 크레이트입니다.
    ```rust
    // web-sys 예시
    let window = web_sys::window().expect("no global window");
    let document = window.document().expect("no document");
    let body = document.body().expect("no body");
    
    let val = document.create_element("p")?;
    val.set_inner_html("Rust가 만든 문단입니다.");
    body.append_child(&val)?;
    ```

2.  **Rust 프론트엔드 프레임워크:** React처럼 Component 기반으로 개발하고 Wasm으로 컴파일합니다.
    *   **Yew:** 가장 오래되고 성숙한 프레임워크 (React와 유사).
    *   **Leptos:** 최근 가장 핫한 프레임워크. Virtual DOM 없이 리액티브 시스템 사용 (SolidJS와 유사, 성능 최강).
    *   **Dioxus:** 웹뿐만 아니라 데스크탑, 모바일 앱까지 개발 가능 (React Native와 유사).

---

## 3. 실전 서비스 활용 및 적용 케이스

글로벌 기업들은 이미 성능이 중요한 파트(Hot Path)를 Wasm으로 대체하고 있습니다.

### 3.1 Figma (피그마)
*   **활용:** 브라우저 기반 디자인 툴의 **렌더링 엔진(WebGL/WebGPU)**과 **물리 연산** 엔진.
*   **효과:** C++로 작성된 거대한 레거시 코드를 Wasm으로 컴파일하여 브라우저에 이식했습니다. 덕분에 네이티브 앱 수준의 로딩 속도와 반응성을 확보했습니다.

### 3.2 1Password (원패스워드)
*   **활용:** 비밀번호 **암호화 및 복호화 로직**.
*   **효과:** JS의 느린 수학 연산 대신 Rust의 고성능 연산을 사용하여, 수천 개의 비밀번호를 순식간에 암호화합니다. 또한 Rust의 타입 시스템 덕분에 보안 로직의 결함을 컴파일 단계에서 차단했습니다.

### 3.3 Google Earth (구글 어스)
*   **활용:** 3D 지구 렌더링.
*   **효과:** 과거 네이티브 클라이언트(설치형)에서만 가능했던 부드러운 3D 지구 탐험을 브라우저 탭 하나에서 구현했습니다.

### 3.4 Amazon Prime Video
*   **활용:** 저사양 셋톱박스나 TV 내장 브라우저에서의 UI 렌더링 및 애니메이션.
*   **효과:** JS 엔진 성능이 좋지 않은 임베디드 장비에서 Rust Wasm을 통해 프레임 드랍 없는 부드러운 UI를 제공합니다.

---

## 4. 마치며: 언제 Wasm을 써야 할까?

*   ✅ **추천:**
    *   이미지/동영상 편집 (FFmpeg 등)
    *   게임 엔진 (Unity, Godot, Bevy)
    *   복잡한 알고리즘/수학 연산
    *   기존 C/C++/Rust 라이브러리 재사용
*   ❌ **비추천:**
    *   단순한 블로그나 쇼핑몰 UI (JS가 더 빠르고 편함)
    *   DOM 조작이 매우 빈번한 경우 (JS <-> Wasm 통신 비용 발생)
