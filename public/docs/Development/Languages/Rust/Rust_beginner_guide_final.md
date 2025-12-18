# Rust 완전 초보를 위한 종합 학습 가이드

이 문서는 여러 번의 수정을 거쳐 최종적으로 완성된, Rust에 처음 입문하는 개발자를 위한 종합 가이드입니다. 설치부터 핵심 개념, 실전 예제까지 모든 내용을 담았습니다.

---

## Chapter 1: 왜 Rust를 배워야 할까요? (The Big Picture)

### 1.1 Rust란 무엇인가요?
Rust는 **프로그래밍 언어**입니다. Node.js나 Python처럼 코드를 실행해주는 "환경"이 아니라, C언어처럼 코드를 실행 가능한 파일(기계어)로 만드는 "설계도"에 가깝습니다. 이 덕분에 매우 빠르고 가볍습니다.

*   **핵심 특징:** **성능(Performance)**과 **안전성(Safety)**을 동시에 잡은 유일한 언어.
*   **비유:** F1 경주용 자동차의 엔진을 가졌지만, 최첨단 에어백과 충돌 방지 시스템이 기본 장착된 자동차.

### 1.2 탄생 배경과 장단점
*   **탄생:** 2006년, 모질라(Mozilla)의 개발자 그레이던 호어가 잦은 소프트웨어 충돌(Crash)에 좌절하여 "절대 죽지 않는" 튼튼한 언어를 만들고자 시작했습니다. [18][21]
*   **장점:**
    1.  **속도:** C/C++와 동급으로, 현존하는 가장 빠른 언어 중 하나입니다. [13]
    2.  **메모리 안전성:** 프로그래머의 실수로 발생하는 거의 모든 종류의 메모리 버그(Null 참조, 데이터 경쟁 등)를 컴파일러가 원천 차단합니다. [13]
    3.  **최고의 도구:** `cargo`라는 패키지 매니저는 의존성 관리, 빌드, 테스트를 하나의 명령어로 통합하여 압도적인 개발 경험을 제공합니다.
*   **단점:**
    1.  **높은 학습 곡선:** "소유권"이라는 독특한 메모리 관리 규칙 때문에 초반 진입 장벽이 높습니다. [14][20]
    2.  **느린 컴파일:** 안전성을 보장하기 위해 컴파일러가 많은 일을 하므로 빌드 속도가 느립니다.

### 1.3 어디에 사용되나요?
*   **백엔드/MSA:** Discord, Cloudflare, Dropbox 등 대용량 트래픽을 처리하는 핵심 서버. [22][23]
*   **운영체제:** 리눅스 커널, 윈도우 커널, 구글 안드로이드 OS의 핵심 부분. [27][28]
*   **웹 프론트엔드:** WebAssembly(Wasm)를 통해 브라우저에서 네이티브 속도를 내는 로직 (Figma, 1Password). [26]

---

## Chapter 2: 첫걸음 떼기 (Getting Started)

### 2.1 설치 (Linux, macOS, Windows)
Rust는 `rustup`이라는 툴체인 관리자로 설치합니다. (Node.js의 nvm과 유사)
*   **Linux & macOS:** 터미널에 `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` 입력. [36][40]
*   **Windows:** [공식 웹사이트](https://www.rust-lang.org/tools/install)에서 `rustup-init.exe`를 다운로드하여 실행. (C++ Build Tools 설치 필요) [32]
*   **설치 확인:** 터미널 재시작 후 `rustc --version` 입력.

### 2.2 첫 Rust 프로그램 만들기
1.  프로젝트 생성:
    ```bash
    cargo new hello_rust
    cd hello_rust
    ```
2.  코드 확인 (`src/main.rs`):
    ```rust
    fn main() {
        println!("Hello, world!");
    }
    ```
3.  실행:
    ```bash
    cargo run
    ```
    터미널에 `Hello, world!`가 출력되면 성공입니다.

### 2.3 Rust 프로그램의 구조
*   `fn main()`: 모든 실행 가능한 Rust 프로그램의 시작점입니다.
*   `println!`: 텍스트를 화면에 출력하는 **매크로(macro)**입니다. `!`가 붙어있으면 일반 함수가 아닌 매크로 호출을 의미합니다.

---

## Chapter 3: 프로그래밍 기본 개념 (Basic Concepts)

### 3.1 변수와 가변성
*   **기본은 불변:** `let`으로 선언한 변수는 한 번 할당하면 값을 바꿀 수 없습니다.
    ```rust
    let x = 5;
    // x = 6; // 컴파일 에러!
    ```
*   **가변성:** 값을 변경하려면 `mut` 키워드를 붙여야 합니다.
    ```rust
    let mut y = 5;
    y = 6; // OK
    ```

### 3.2 데이터 타입
*   **스칼라 타입 (단일 값):**
    *   정수: `i8, u8, i32(기본), u64, isize` 등
    *   부동소수점: `f32, f64(기본)`
    *   불리언: `bool` (true, false)
    *   문자: `char` (작은따옴표 사용, 예: 'a')
*   **복합 타입 (여러 값):**
    *   **튜플:** 다양한 타입의 값을 고정된 크기로 묶습니다.
      ```rust
      let tup: (i32, f64, u8) = (500, 6.4, 1);
      let five_hundred = tup.0; // 인덱스로 접근
      ```
    *   **배열:** 동일한 타입의 값을 고정된 크기로 묶습니다. (스택에 저장)
      ```rust
      let a = [1, 2, 3, 4, 5];
      ```

### 3.3 문자열: `String` vs `&str` (초보자의 첫 번째 난관)
*   `&str`: **문자열 슬라이스(Slice)**. 수정 불가능한 **참조**입니다. 컴파일 시점에 크기가 확정되어 스택에 저장됩니다. (예: `let s = "hello";`)
*   `String`: **힙에 저장되는 동적 문자열**. 수정 및 확장이 가능합니다. (예: `let s = String::from("hello");`)
*   **언제 뭘 쓸까?** 함수 매개변수로는 대부분 `&str`을 쓰고, 함수 내에서 문자열을 만들거나 수정할 때는 `String`을 씁니다.

### 3.4 함수와 제어 흐름
*   **함수:** `fn` 키워드로 선언하며, 매개변수와 반환 타입은 반드시 명시해야 합니다.
*   **표현식 기반:** Rust의 대부분 구문은 값을 반환하는 **표현식(Expression)**입니다. 함수 마지막 줄에 `;`를 생략하면 그 값이 자동으로 반환됩니다.
    ```rust
    fn add_one(x: i32) -> i32 {
        x + 1 // return x + 1; 과 동일
    }
    ```
*   **제어 흐름:**
    *   `if-else`는 값을 반환할 수 있습니다: `let number = if condition { 5 } else { 6 };`
    *   `loop`, `while`, `for` 반복문은 JS와 유사하게 동작합니다.

---

## Chapter 4: Rust의 심장, 소유권 (Ownership)

GC 없이 메모리 안전성을 달성하는 Rust의 핵심 규칙입니다.

### 4.1 스택과 힙
*   **스택 (Stack):** 매우 빠름. 크기가 고정된 데이터 (`i32`, `bool`, `&str` 참조 등) 저장.
*   **힙 (Heap):** 상대적으로 느림. 크기가 변할 수 있는 데이터 (`String`, `Vec` 등) 저장.

### 4.2 소유권 규칙
1.  모든 값은 **소유자(owner)** 변수를 갖는다.
2.  소유자는 단 **하나**뿐이다.
3.  소유자가 스코프 `{}`를 벗어나면 값은 자동으로 **제거(dropped)**된다.

### 4.3 이동(Move) vs 복사(Clone)
*   **Move:** 힙에 저장된 데이터(`String` 등)는 대입 시 소유권이 이전됩니다. 이전 변수는 무효화됩니다.
    ```rust
    let s1 = String::from("hello");
    let s2 = s1; // s1의 소유권이 s2로 이동
    // println!("{}", s1); // 에러! s1은 더 이상 유효하지 않음
    ```
*   **Clone:** 힙 데이터를 깊은 복사하려면 `.clone()`을 명시적으로 호출해야 합니다.
    ```rust
    let s1 = String::from("hello");
    let s2 = s1.clone(); // s2는 s1의 복사본을 소유
    println!("{}, {}", s1, s2); // OK
    ```
*   **Copy:** 스택에 저장되는 단순 타입(`i32` 등)은 대입 시 값이 복사됩니다. (소유권 이동 없음)

---

## Chapter 5: 에러 처리와 열거형 (Enums & Error Handling)

### 5.1 열거형 (Enums)
관련 있는 값들을 하나의 타입으로 묶는 기능입니다.

### 5.2 `Option<T>`: Null의 부재
Rust에는 `null`이 없습니다. 대신 `Option` 열거형을 사용합니다.
*   `Some(T)`: 값이 존재함
*   `None`: 값이 없음
컴파일러는 개발자가 `None` 케이스를 처리하도록 강제하여 `null` 참조 에러를 원천 차단합니다.

### 5.3 `Result<T, E>`: 예외 처리의 새로운 방식
`try-catch` 대신 `Result` 열거형을 사용합니다.
*   `Ok(T)`: 작업 성공
*   `Err(E)`: 작업 실패
```rust
use std::fs::File;

fn read_file() -> Result<File, std::io::Error> {
    let file_result = File::open("hello.txt");

    match file_result {
        Ok(file) => Ok(file),
        Err(error) => Err(error),
    }
}
```
*   **`?` 연산자:** `Result`가 `Ok`이면 값을 꺼내고 `Err`이면 함수를 즉시 종료하며 에러를 반환하는 단축 문법입니다.

---

## Chapter 6: 실전 예제: 간단한 웹 서버 만들기

**1. 의존성 추가 (`Cargo.toml`):**
```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
axum = "0.7"
```

**2. 서버 코드 작성 (`src/main.rs`):**
```rust
use axum::{routing::get, Router};

async fn hello_world() -> &'static str {
    "Hello, Rust Server!"
}

#[tokio::main]
async fn main() {
    // 라우터 설정
    let app = Router::new().route("/", get(hello_world));

    // 서버 실행
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("Listening on http://127.0.0.1:3000");
    axum::serve(listener, app).await.unwrap();
}
```

**3. 실행:**
```bash
cargo run
```
이제 웹 브라우저에서 `http://127.0.0.1:3000`으로 접속하면 메시지를 확인할 수 있습니다.

---

## Chapter 7: 결론 및 다음 단계

이 가이드는 Rust의 가장 기본적인 내용과 철학을 다룹니다. Rust는 처음에는 "컴파일러와 싸우는" 느낌이 들지만, 그 과정을 통과하면 세상에서 가장 튼튼하고 빠른 프로그램을 만들 수 있다는 자신감을 줍니다. 

**다음 학습 자료:**
*   **The Rust Programming Language (공식 문서):** "The Book"이라 불리는 최고의 교과서입니다.
*   **Rustlings:** 간단한 연습 문제를 풀면서 Rust 문법을 익히는 CLI 프로그램입니다.
