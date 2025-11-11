# Spark Messaging 통합 워크스페이스 설정 가이드

여러 프로젝트(Frontend Demo, Backend, SDK)를 함께 관리하기 위한 워크스페이스 설정 방법입니다.

## 📁 디렉토리 구조

```
c:\project\
├── spark-messaging-demo\          # 프론트엔드 데모 프로젝트
├── spark-messaging-backend\       # 백엔드 프로젝트
├── spark-messaging-sdk\            # SDK 프로젝트
└── spark-messaging-workspace\      # 통합 워크스페이스 (빈 디렉토리)
    ├── spark-messaging.code-workspace
    └── .cursorrules
```

## 🚀 설정 방법

### 1단계: 통합 워크스페이스 디렉토리 생성

```bash
# 프로젝트 루트에 빈 디렉토리 생성
mkdir c:\project\spark-messaging-workspace
cd c:\project\spark-messaging-workspace
```

### 2단계: 워크스페이스 파일 생성

`spark-messaging.code-workspace` 파일을 생성하고 다음 내용을 추가:

```json
{
    "folders": [
        {
            "name": "📱 Frontend Demo",
            "path": "../spark-messaging-demo"
        },
        {
            "name": "🔧 Backend",
            "path": "../spark-messaging-backend"
        },
        {
            "name": "📦 SDK",
            "path": "../spark-messaging-sdk"
        }
    ],
    "settings": {
        "files.exclude": {
            "**/node_modules": true,
            "**/dist": true,
            "**/build": true,
            "**/.git": false
        },
        "search.exclude": {
            "**/node_modules": true,
            "**/dist": true,
            "**/build": true,
            "**/package-lock.json": true,
            "**/yarn.lock": true
        },
        "files.watcherExclude": {
            "**/node_modules/**": true,
            "**/dist/**": true,
            "**/build/**": true
        }
    },
    "extensions": {
        "recommendations": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode", "bradlc.vscode-tailwindcss"]
    }
}
```

**경로 수정 필요:**

-   실제 프로젝트 폴더명에 맞게 `path` 값을 수정하세요
-   예: `"../실제-백엔드-폴더명"`

### 3단계: Cursor Rules 파일 생성

`.cursorrules` 파일을 생성하고 다음 내용을 추가:

```markdown
# Spark Messaging 프로젝트 규칙

## 프로젝트 구조

-   Frontend: Preact + Vite (spark-messaging-demo)
-   Backend: Node.js 백엔드 서버 (spark-messaging-backend)
-   SDK: @skybaer0804/spark-messaging-client npm 패키지 (spark-messaging-sdk)

## 개발 규칙

-   항상 한국어로 응답
-   UI 컴포넌트와 로직을 함께 모듈화 (prop 전달 최소화)
-   레이아웃 모듈화 시 children 및 이벤트 prop으로 전달
-   MUI 사용 시 7버전 이상 문법 사용
-   반응형 고려하여 Grid 우선 사용

## 코드 스타일

-   TypeScript 사용
-   Preact hooks 사용
-   함수형 컴포넌트 선호

## 프로젝트 간 연동

-   SDK 변경 시 프론트엔드 데모에 반영 확인
-   백엔드 API 변경 시 프론트엔드 및 SDK 확인
-   타입 정의는 SDK에서 제공하도록 권장
-   여러 프로젝트를 함께 검토하여 일관성 유지

## 파일 접근

-   절대 경로로 다른 프로젝트 파일 접근 가능
-   프로젝트 간 의존성 변경 시 모든 관련 프로젝트 확인
```

### 4단계: Cursor에서 워크스페이스 열기

1. Cursor 실행
2. `File > Open Workspace from File...` (또는 `Ctrl+K Ctrl+O`)
3. `c:\project\spark-messaging-workspace\spark-messaging.code-workspace` 선택
4. 사이드바에 세 개의 프로젝트가 함께 표시됩니다

## 📝 사용 팁

### 프로젝트 간 파일 검색

-   `Ctrl+Shift+F`: 모든 프로젝트에서 검색
-   `Ctrl+P`: 파일 이름으로 검색 (모든 프로젝트 포함)

### 프로젝트별 터미널

-   각 프로젝트 폴더에서 우클릭 → "Open in Integrated Terminal"
-   또는 터미널에서 프로젝트별로 `cd` 명령 사용

### Git 관리

-   각 프로젝트는 독립적인 Git 저장소로 관리
-   워크스페이스는 단순히 편의를 위한 통합 뷰

## 🔧 경로가 다른 경우

프로젝트가 다른 위치에 있다면 `spark-messaging.code-workspace` 파일의 `path` 값을 절대 경로로 변경:

```json
{
    "name": "🔧 Backend",
    "path": "C:/다른/경로/spark-messaging-backend"
}
```

또는 상대 경로를 조정:

```json
{
    "name": "🔧 Backend",
    "path": "../../backend/spark-messaging-backend"
}
```

## ✅ 확인 사항

워크스페이스가 제대로 열렸는지 확인:

-   [ ] 사이드바에 3개의 프로젝트 폴더가 표시됨
-   [ ] 각 프로젝트의 파일을 열 수 있음
-   [ ] 검색 시 모든 프로젝트에서 결과가 나옴
-   [ ] Cursor AI가 `.cursorrules` 파일을 인식함

## 🎯 장점

1. **프로젝트 분리**: 데모 프로젝트는 깔끔하게 유지
2. **통합 관리**: 여러 프로젝트를 한 화면에서 관리
3. **컨텍스트 공유**: Cursor AI가 모든 프로젝트를 함께 고려
4. **재사용 가능**: 설정 파일을 버전 관리하여 팀과 공유 가능

## 📚 참고

-   [VS Code Multi-root Workspaces](https://code.visualstudio.com/docs/editor/workspaces)
-   [Cursor Rules Documentation](https://docs.cursor.com/)
