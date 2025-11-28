# GoF 구조 패턴 문서화 (JavaScript 실무 적용)

## 1. Adapter 패턴

-   **장점**: 호환되지 않는 인터페이스 연결, 기존 코드 재사용
-   **단점**: 설계 복잡도 증가, 성능 저하 가능성
-   **적용 케이스**: 레거시 시스템 통합, 타사 라이브러리 적응
-   **실무 서비스 예시**: REST API 응답을 내부 모델로 변환하는 어댑터

```javascript
// 실무: API 레거시 응답 어댑터
class ApiResponseAdapter {
    constructor(apiResponse) {
        this.apiResponse = apiResponse;
    }
    getUserName() {
        return this.apiResponse.data.user_name;
    }
}
// 사용: const adapter = new ApiResponseAdapter(response); adapter.getUserName();
```

## 2. Bridge 패턴

-   **장점**: 구현과 추상 분리, 독립적 확장 가능
-   **단점**: 초기 설계 복잡, 클래스 수 증가
-   **적용 케이스**: 다양한 구현체 조합, UI 및 기능 분리
-   **실무 서비스 예시**: 다중 DB 드라이버에 대응하는 DB 클라이언트

```javascript
// 실무: DB 클라이언트 브리지
class DBClient {
    constructor(driver) {
        this.driver = driver;
    }
    query(sql) {
        return this.driver.execute(sql);
    }
}

class MySQLDriver {
    execute(sql) {
        /* MySQL 쿼리 실행 */
    }
}

const client = new DBClient(new MySQLDriver());
client.query('SELECT *');
```

## 3. Composite 패턴

-   **장점**: 부분-전체 계층 동일 처리, 트리 구조 관리
-   **단점**: 복잡한 트리 구조 관리 어려움
-   **적용 케이스**: UI 컴포넌트 뷰, 파일 시스템
-   **실무 서비스 예시**: 트리 뷰 컴포넌트 (React 트리 구조)

```javascript
// 실무: 트리 노드 컴포지트
class TreeNode {
    constructor(name) {
        this.name = name;
        this.children = [];
    }
    add(child) {
        this.children.push(child);
    }
    render() {
        /* 재귀적 렌더링 */
    }
}
```

## 4. Decorator 패턴

-   **장점**: 런타임 확장 용이, 상속 대체
-   **단점**: 많은 작은 객체 생성, 복잡도 증가
-   **적용 케이스**: UI 스타일 추가, 로깅, 인증 기능 부가
-   **실무 서비스 예시**: HTTP 요청에 인증 데코레이터 추가

```javascript
// 실무: 인증 데코레이터
function authDecorator(fn) {
    return function (...args) {
        if (!user.isAuthenticated) {
            throw new Error('Unauthorized');
        }
        return fn(...args);
    };
}

const securedFunction = authDecorator(originalFunction);
```

## 5. Facade 패턴

-   **장점**: 복잡한 서브시스템 단순화, 일관된 인터페이스 제공
-   **단점**: 모든 기능 감추기 어려움
-   **적용 케이스**: 복잡한 API 통합, 초기화 과정 간소화
-   **실무 서비스 예시**: 다양한 마이크로서비스 호출을 감싸는 API 게이트웨이

```javascript
// 실무: API 게이트웨이 팩사드
class ApiGateway {
    fetchUser() {
        return userService.getUser();
    }
    fetchOrders() {
        return orderService.getOrders();
    }
}

const api = new ApiGateway();
api.fetchUser();
```

## 6. Flyweight 패턴

-   **장점**: 객체 공유로 메모리 절약
-   **단점**: 상태 관리 복잡, 공유 불가 객체에는 부적합
-   **적용 케이스**: 텍스트 편집기 글꼴 관리, 다수 객체 공통 속성 공유
-   **실무 서비스 예시**: 게임 캐릭터 스킨 공유

```javascript
// 실무: 스킨 공유 플라이웨이트
class SkinFactory {
    constructor() {
        this.skins = {};
    }
    getSkin(name) {
        if (!this.skins[name]) {
            this.skins[name] = new Skin(name);
        }
        return this.skins[name];
    }
}
```

## 7. Proxy 패턴

-   **장점**: 접근 제어, 지연 로드, 보안 강화
-   **단점**: 성능 오버헤드 가능성
-   **적용 케이스**: 가상 프록시, 보호 프록시, 캐싱
-   **실무 서비스 예시**: 이미지 로딩 지연(레이지 로드) 프록시

```javascript
// 실무: 이미지 로딩 프록시
class ImageProxy {
    constructor(realImage) {
        this.realImage = realImage;
        this.loaded = false;
    }
    display() {
        if (!this.loaded) {
            this.realImage.load();
            this.loaded = true;
        }
        this.realImage.display();
    }
}
```
