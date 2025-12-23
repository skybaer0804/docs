# Rust 심화: 5가지 대표 아키텍처와 구현 가이드

Rust는 단순한 언어를 넘어, **소유권(Ownership)**과 **동시성(Concurrency)**을 극대화할 수 있는 독특한 아키텍처 패턴들을 발전시켜 왔습니다. "Rust다운" 코드를 작성하기 위해 꼭 알아야 할 5가지 대표 아키텍처의 개념과 실제 구현 코드를 정리했습니다.

---

## 1. 클린 아키텍처 (Clean / Hexagonal Architecture)
**"엔터프라이즈 백엔드의 표준"**

### 1.1 개념
자바의 Spring이나 Node.js의 NestJS에서 흔히 볼 수 있는 계층형 아키텍처를 Rust의 **Trait(트레이트)**를 활용해 구현한 방식입니다. 
핵심은 비즈니스 로직(Domain)을 외부 의존성(DB, HTTP, Framework)으로부터 완전히 격리하는 것입니다.

### 1.2 특징
*   **Dependency Injection (DI):** 자바처럼 리플렉션을 쓰지 않고, **제네릭(Generics)**과 **`Arc<dyn Trait>`**(동적 디스패치)를 사용하여 컴파일 타임 혹은 런타임에 의존성을 주입합니다.
*   **테스트 용이성:** DB 없이 도메인 로직만 단위 테스트(Unit Test)하기 매우 쉽습니다.

### 1.3 구현 예제 (Example Code)

```rust
// 1. [Port] 도메인 영역 (외부 의존성 0%)
// 저장소가 갖춰야 할 기능을 인터페이스(Trait)로 정의
pub trait UserRepository {
    fn find_user(&self, id: u32) -> Option<String>;
}

// 2. [Domain] 비즈니스 로직
// 구체적인 DB가 무엇인지 모르며, 오직 Trait만 믿고 동작함
pub struct UserService<R: UserRepository> {
    repository: R, // 의존성 주입 (Generic)
}

impl<R: UserRepository> UserService<R> {
    pub fn new(repository: R) -> Self {
        Self { repository }
    }

    pub fn get_welcome_message(&self, id: u32) -> String {
        match self.repository.find_user(id) {
            Some(name) => format!("Welcome back, {}!", name),
            None => "Who are you?".to_string(),
        }
    }
}

// 3. [Adapter] 인프라 영역 (실제 구현)
struct PostgresRepository;

impl UserRepository for PostgresRepository {
    fn find_user(&self, _id: u32) -> Option<String> {
        // 실제 DB 쿼리 로직 (예: SELECT * FROM users...)
        Some("Alice".to_string())
    }
}

fn main() {
    let repo = PostgresRepository; // 구현체 생성
    let service = UserService::new(repo); // 주입 (DI)
    println!("{}", service.get_welcome_message(1));
}
```

---

## 2. 액터 모델 (Actor Model)
**"동시성(Concurrency)의 제왕"**

### 2.1 개념
모든 컴포넌트를 **'액터(Actor)'**라는 독립적인 단위로 쪼개고, 이들끼리 **'메시지(Message)'**를 주고받으며 통신하는 방식입니다. 공유 메모리(Lock) 대신 메시지 패싱을 사용하여 데드락(Deadlock) 없는 동시성을 구현합니다. (대표 라이브러리: **Actix**, **Tokio**)

### 2.2 특징
*   **소유권 이동(Move):** 메시지를 보낼 때 데이터의 소유권을 아예 넘겨버리는 방식이 Rust의 소유권 모델과 완벽하게 부합합니다.
*   **Zero-cost:** Erlang/Akka와 달리 Rust의 액터는 매우 가볍습니다.

### 2.3 구현 예제 (Example Code)

```rust
use tokio::sync::mpsc;

// 1. 메시지 정의
enum Message {
    Ping,
    Pong,
}

// 2. 액터 (Actor) 정의
struct MyActor {
    receiver: mpsc::Receiver<Message>,
    count: u32, // 자신만의 상태 (외부 접근 불가)
}

impl MyActor {
    async fn run(mut self) {
        // 메시지가 올 때까지 대기 (이벤트 루프)
        while let Some(msg) = self.receiver.recv().await {
            match msg {
                Message::Ping => {
                    self.count += 1;
                    println!("Ping received! Count: {}", self.count);
                }
                Message::Pong => println!("Pong!"),
            }
        }
    }
}

#[tokio::main]
async fn main() {
    // 채널 생성 (송신자 tx, 수신자 rx)
    let (tx, rx) = mpsc::channel(32);

    // 액터 실행 (별도 태스크로 스폰)
    let actor = MyActor { receiver: rx, count: 0 };
    tokio::spawn(actor.run());

    // 메시지 전송 (소유권 이동)
    tx.send(Message::Ping).await.unwrap();
    tx.send(Message::Pong).await.unwrap();
}
```

---

## 3. ECS (Entity Component System)
**"성능(Performance)의 극한"**

### 3.1 개념
데이터(Component)와 행동(System)을 철저히 분리하고, 데이터를 **메모리에 연속적으로 배치**하여 CPU 캐시 히트율을 극대화하는 아키텍처입니다. 주로 게임이나 시뮬레이션에서 사용됩니다.

### 3.2 특징
*   **Borrow Checker 우회:** 복잡한 객체 간 참조를 피하고, 데이터를 배열(Table) 형태로 관리하여 Rust의 엄격한 규칙 안에서도 유연성을 확보합니다.
*   **자동 병렬화:** 시스템 간 데이터 의존성이 없으면 프레임워크가 알아서 병렬 실행합니다.

### 3.3 구현 예제 (Example Code)

```rust
// 1. Components (순수 데이터)
struct Position { x: f32, y: f32 }
struct Velocity { dx: f32, dy: f32 }

// 2. World (데이터 저장소 - 실제론 ID와 배열로 관리됨)
struct World {
    positions: Vec<Option<Position>>, // 배열로 연속 배치 (Cache Friendly)
    velocities: Vec<Option<Velocity>>,
}

// 3. System (로직)
fn physics_system(world: &mut World) {
    // Position과 Velocity가 둘 다 있는 엔티티만 찾아서 업데이트
    for (pos, vel) in world.positions.iter_mut().zip(world.velocities.iter()) {
        if let (Some(p), Some(v)) = (pos, vel) {
            p.x += v.dx;
            p.y += v.dy;
            println!("Moved to ({}, {})", p.x, p.y);
        }
    }
}
```

---

## 4. 타입 상태 패턴 (Typestate Pattern)
**"컴파일러를 통한 상태 머신 강제"**

### 4.1 개념
객체의 **상태(State)**를 타입 시스템(`Generic`)으로 인코딩하여, 잘못된 메서드 호출을 **컴파일 시점**에 원천 봉쇄하는 패턴입니다. Rust에서 가장 강력하게 사용할 수 있는 패턴 중 하나입니다.

### 4.2 구현 예제 (Example Code)

```rust
use std::marker::PhantomData;

// 상태 정의 (빈 구조체)
struct Draft;
struct Published;

// 게시글 구조체 (State 제네릭을 가짐)
struct Post<State> {
    content: String,
    _state: PhantomData<State>,
}

impl Post<Draft> {
    fn new(content: &str) -> self {
        Post {
            content: content.to_string(),
            _state: PhantomData,
        }
    }

    // Draft 상태에서만 호출 가능하며, 호출 후 Published 상태로 변환됨
    fn publish(self) -> Post<Published> {
        println!("Publishing...");
        Post {
            content: self.content,
            _state: PhantomData,
        }
    }
}

impl Post<Published> {
    // Published 상태에서만 호출 가능
    fn share(&self) {
        println!("Sharing: {}", self.content);
    }
}

fn main() {
    let draft = Post::new("Rust is cool");
    // draft.share(); // ❌ 컴파일 에러! (Draft 상태에는 share 메서드가 없음)

    let post = draft.publish(); // 상태 변환
    post.share(); // ✅ OK
}
```

---

## 5. 공유 상태 패턴 (Shared State / Arc<Mutex>)
**"가장 일반적인 서버 아키텍처"**

### 5.1 개념
액터 모델이 너무 복잡하거나, 단순한 상태 공유가 필요할 때 사용하는 패턴입니다. 스마트 포인터(`Arc`)와 락(`Mutex`, `RwLock`)을 조합하여 여러 스레드가 안전하게 데이터에 접근합니다.

### 5.2 구현 예제 (Example Code)

```rust
use std::sync::{Arc, Mutex};
use std::thread;

struct AppState {
    counter: u32,
}

fn main() {
    // 1. 데이터를 힙에 올리고(Arc), 락으로 감쌈(Mutex)
    let state = Arc::new(Mutex::new(AppState { counter: 0 }));
    let mut handles = vec![];

    for _ in 0..10 {
        let state_clone = state.clone(); // 참조 카운트 증가 (비용 저렴)
        
        let handle = thread::spawn(move || {
            // 락 획득 (블로킹) -> 스코프 끝나면 자동 해제
            let mut data = state_clone.lock().unwrap();
            data.counter += 1;
        });
        handles.push(handle);
    }

    for h in handles { h.join().unwrap(); }
    println!("Result: {}", state.lock().unwrap().counter); // 10
}
```
