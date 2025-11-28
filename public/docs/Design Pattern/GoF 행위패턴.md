# GoF 행위 패턴 문서화 (JavaScript 실무 적용)

## 1. Observer 패턴

-   **장점**: 상태 변화 실시간 통지, 느슨한 결합
-   **단점**: 이벤트 과다 발생 시 성능 저하 가능
-   **적용 케이스**: UI 이벤트, 데이터 바인딩
-   **실무 서비스 예시**: React 상태 관리 라이브러리 구현

```javascript
// 실무: 이벤트 등록 및 알림
class Subject {
    constructor() {
        this.observers = [];
    }
    subscribe(fn) {
        this.observers.push(fn);
    }
    notify(data) {
        this.observers.forEach((fn) => fn(data));
    }
}
// 사용: subject.subscribe((data) => console.log(data));
```

## 2. Strategy 패턴

-   **장점**: 알고리즘 교체 용이, 코드 깔끔
-   **단점**: 많은 전략 클래스 필요
-   **적용 케이스**: 결제 수단, 정렬 알고리즘 선택
-   **실무 서비스 예시**: 결제 수단별 로직 분리 (PayPal, Card 등)

```javascript
// 실무: 전략 패턴으로 결제 처리
class PaymentContext {
    constructor(strategy) {
        this.strategy = strategy;
    }
    pay(amount) {
        this.strategy.pay(amount);
    }
}

class PayPal {
    pay(amount) {
        console.log(`PayPal: ${amount}`);
    }
}

class Card {
    pay(amount) {
        console.log(`Card: ${amount}`);
    }
}
// 사용: new PaymentContext(new PayPal()).pay(100);
```

## 3. State 패턴

-   **장점**: 상태별 행위 분리, 코드 명확
-   **단점**: 상태 클래스 증가 가능
-   **적용 케이스**: UI 상태 변경, 작업 흐름 관리
-   **실무 서비스 예시**: 주문 상태 처리(주문, 배송, 완료)

```javascript
// 실무: 주문 상태에 따른 행동
class Order {
    constructor(state) {
        this.state = state;
    }
    setState(state) {
        this.state = state;
    }
    process() {
        this.state.handle(this);
    }
}

class PendingState {
    handle(order) {
        console.log('주문 대기');
        order.setState(new ShippedState());
    }
}

class ShippedState {
    handle(order) {
        console.log('배송 중');
        order.setState(new DeliveredState());
    }
}

class DeliveredState {
    handle(order) {
        console.log('배송 완료');
    }
}
// 사용: let order = new Order(new PendingState()); order.process();
```

## 4. Template Method 패턴

-   **장점**: 공통 알고리즘 골격 제공, 부분 구현 다양성
-   **단점**: 상속 강제, 유연성 제한 가능
-   **적용 케이스**: 데이터 처리, 알고리즘 단계별 구현
-   **실무 서비스 예시**: 파일 처리 파이프라인

```javascript
// 실무: 템플릿 메서드
class DataProcessor {
    process() {
        this.load();
        this.transform();
        this.save();
    }
    load() {
        throw 'Subclass must implement';
    }
    transform() {
        throw 'Subclass must implement';
    }
    save() {
        throw 'Subclass must implement';
    }
}

class CSVProcessor extends DataProcessor {
    load() {
        console.log('CSV 읽기');
    }
    transform() {
        console.log('CSV 변환');
    }
    save() {
        console.log('CSV 저장');
    }
}
// 사용: new CSVProcessor().process();
```

## 5. Chain of Responsibility 패턴

-   **장점**: 요청 처리 객체 분리, 유연한 요청 전달
-   **단점**: 요청 처리 지연, 디버깅 어려움
-   **적용 케이스**: 이벤트 처리, 필터 체인
-   **실무 서비스 예시**: 미들웨어 체인 (Express.js)

```javascript
// 실무: 미들웨어 체인 구조
function logger(req, res, next) {
    console.log(req.url);
    next();
}

function auth(req, res, next) {
    if (!req.user) {
        res.status(401);
    } else {
        next();
    }
}
// 사용: app.use(logger); app.use(auth);
```

## 6. Command 패턴

-   **장점**: 요청 캡슐화, 실행 취소 및 큐잉 가능
-   **단점**: 클래스 수 증가
-   **적용 케이스**: 작업 실행, 취소 기능
-   **실무 서비스 예시**: 에디터 실행 취소/재실행

```javascript
// 실무: 명령 객체
class Command {
    execute() {}
}

class AddTextCommand extends Command {
    constructor(text) {
        super();
        this.text = text;
    }
    execute() {
        editor.addText(this.text);
    }
}
```

## 7. Interpreter 패턴

-   **장점**: 문법표현 구조화, 유연한 해석
-   **단점**: 복잡한 문법 구현 어려움
-   **적용 케이스**: 쿼리 파서, 수식 계산기
-   **실무 서비스 예시**: 간단한 명령어 해석기

```javascript
// 실무: 간단 명령어 해석기
class Interpreter {
    interpret(command) {
        if (command === 'start') {
            console.log('작업 시작');
        } else if (command === 'stop') {
            console.log('작업 종료');
        }
    }
}
```

## 8. Iterator 패턴

-   **장점**: 내부 구조 은닉, 일관된 순회
-   **단점**: 새로운 인터페이스 필요
-   **적용 케이스**: 컬렉션 순회
-   **실무 서비스 예시**: 커스텀 배열 반복자

```javascript
// 실무: 커스텀 iterator
class CustomArray {
    constructor(items) {
        this.items = items;
    }
    [Symbol.iterator]() {
        let i = 0;
        let items = this.items;
        return {
            next() {
                return i < items.length ? { value: items[i++], done: false } : { done: true };
            },
        };
    }
}
```

## 9. Mediator 패턴

-   **장점**: 객체 간 복잡한 의존성 감소
-   **단점**: Mediator가 복잡해질 수 있음
-   **적용 케이스**: 채팅 서버, UI 객체 통신
-   **실무 서비스 예시**: 채팅방 메시지 중재기

```javascript
// 실무: 채팅방 Mediator
class ChatRoom {
    constructor() {
        this.users = [];
    }
    register(user) {
        this.users.push(user);
    }
    send(message, from) {
        this.users.forEach((u) => {
            if (u !== from) {
                u.receive(message);
            }
        });
    }
}
```

## 10. Memento 패턴

-   **장점**: 객체 상태 저장 및 복원
-   **단점**: 메모리 사용 증가
-   **적용 케이스**: Undo 기능
-   **실무 서비스 예시**: 텍스트 에디터 상태 저장

```javascript
// 실무: 상태 저장 및 복원
class EditorMemento {
    constructor(content) {
        this.content = content;
    }
    getContent() {
        return this.content;
    }
}

class Editor {
    constructor() {
        this.content = '';
    }
    save() {
        return new EditorMemento(this.content);
    }
    restore(memento) {
        this.content = memento.getContent();
    }
}
```

## 11. Visitor 패턴

-   **장점**: 객체 구조 변경 없이 기능 추가
-   **단점**: 새 요소 추가 시 기존 코드 수정 필요
-   **적용 케이스**: 복잡 객체 구조 탐색 및 처리
-   **실무 서비스 예시**: AST(Abstract Syntax Tree) 해석기

```javascript
// 실무: Visitor 패턴
class Element {
    accept(visitor) {
        visitor.visit(this);
    }
}

class Visitor {
    visit(element) {
        console.log('처리:', element);
    }
}
```
