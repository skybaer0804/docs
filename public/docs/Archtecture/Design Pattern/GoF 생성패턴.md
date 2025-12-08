# GoF 생성 패턴 문서화 (JavaScript 실무 적용)

## 1. Singleton 패턴

-   **장점**: 단일 인스턴스 보장, 메모리 절약, 전역 접근 용이
-   **단점**: 테스트 어려움, 전역 상태 문제, 병렬 처리 취약
-   **적용 케이스**: DB 연결, 로거, 설정 관리자
-   **실무 서비스 예시**: 사용자 세션 매니저 (React/Vue 앱)

```javascript
// 실무: 전역 UserSessionManager
class UserSessionManager {
    constructor() {
        if (UserSessionManager.instance) {
            return UserSessionManager.instance;
        }
        UserSessionManager.instance = this;
    }
    static instance = null;

    setUser(user) {
        this.currentUser = user;
    }
    getUser() {
        return this.currentUser;
    }
}

const session = new UserSessionManager(); // Netflix 스타일 세션 관리
```

## 2. Factory Method 패턴

-   **장점**: 객체 생성 분리, 서브클래스 확장 용이
-   **단점**: 클래스 수 증가, 복잡도 상승
-   **적용 케이스**: 런타임 타입 결정, 다형성 객체 생성
-   **실무 서비스 예시**: 결제 게이트웨이 팩토리 (KakaoPay, Card 등)

```javascript
// 실무: PaymentFactory - 이커머스 결제
class PaymentFactory {
    static create(type) {
        return type === 'kakaopay' ? new KakaoPay() : new CreditCard();
    }
}

class KakaoPay {
    pay(amount) {
        console.log(`KakaoPay: ${amount}`);
    }
}

class CreditCard {
    pay(amount) {
        console.log(`Card: ${amount}`);
    }
}
// 사용: const payment = PaymentFactory.create('kakaopay'); payment.pay(10000);
```

## 3. Abstract Factory 패턴

-   **장점**: 관련 객체 패밀리 생성, 호환성 보장
-   **단점**: 코드 복잡도 증가, 클래스 폭발
-   **적용 케이스**: UI 테마 (Dark/Light), OS별 컴포넌트
-   **실무 서비스 예시**: 다크모드/라이트모드 UI 팩토리 (웹 대시보드)

```javascript
// 실무: ThemeFactory - Spotify 스타일 테마
class ThemeFactory {
    static createTheme(type) {
        return type === 'dark' ? new DarkThemeFactory() : new LightThemeFactory();
    }
}

class DarkThemeFactory {
    createButton() {
        return { bg: '#333', text: '#fff' };
    }
    createInput() {
        return { bg: '#444', border: '#666' };
    }
}
// 사용: const factory = ThemeFactory.createTheme('dark'); factory.createButton();
```

## 4. Builder 패턴

-   **장점**: 복잡 객체 가독성 높음, 선택적 파라미터
-   **단점**: 추가 클래스 필요, 메모리 오버헤드
-   **적용 케이스**: API 요청 객체, 설정 객체 생성
-   **실무 서비스 예시**: API Response Builder (Spring 스타일)

```javascript
// 실무: ApiResponseBuilder - REST API 응답
class ApiResponseBuilder {
    constructor() {
        this.response = { success: true };
    }
    status(code) {
        this.response.status = code;
        return this;
    }
    data(data) {
        this.response.data = data;
        return this;
    }
    message(msg) {
        this.response.message = msg;
        return this;
    }
    build() {
        return this.response;
    }
}
// 사용: ApiResponseBuilder().status(200).data({user:1}).message('OK').build();
```

## 5. Prototype 패턴

-   **장점**: 생성 비용 절약, 상태 복사 용이
-   **단점**: 깊은 복사 구현 복잡, 참조 문제
-   **적용 케이스**: 비용 높은 객체 복제, 설정 템플릿
-   **실무 서비스 예시**: 차트 설정 복제 (대시보드 위젯)

```javascript
// 실무: ChartPrototype - Grafana 스타일 차트
class ChartPrototype {
    constructor(config) {
        Object.assign(this, config);
    }
    clone() {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }
}

const barChart = new ChartPrototype({ type: 'bar', data: [1, 2, 3] });
const clonedChart = barChart.clone();
clonedChart.data = [4, 5, 6]; // 독립적
```
