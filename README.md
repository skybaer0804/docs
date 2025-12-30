# Node.js Docs Project (v2)

Node.js, Express, Preact, 그리고 Supabase를 활용한 현대적인 문서 관리 및 뷰어 시스템입니다. v2 마이그레이션을 통해 안정적인 데이터 관리와 강화된 사용자 경험을 제공합니다.

## 🚀 v2 주요 변경 사항

- **프레임워크 전환**: React에서 가볍고 빠른 **Preact**로 전환 및 **Vite** 빌드 도구 도입
- **상태 관리 및 데이터 페칭**: **TanStack Query (v5)** 도입으로 서버 상태 관리 최적화 및 캐싱 전략 강화
- **백엔드 고도화**: **Supabase** 연동을 통한 인증(Auth) 및 실시간 데이터베이스 시스템 구축
- **아키텍처 개선**: **Presenter/Container 패턴** 및 **Custom Hooks** 도입으로 비즈니스 로직과 UI 관심사 분리
- **이벤트 시스템**: **Observer 패턴**을 도입하여 컴포넌트 간 느슨한 결합 유지
- **사용자 경험(UX)**: 스와이프 네비게이션, PWA 지원, 실시간 알림 시스템 추가
- **안정성**: **Jest**를 활용한 TDD(Test-Driven Development) 환경 구축 및 유틸리티/로직 테스트 강화

## 🛠 기술 스택

### Frontend

- **Library**: Preact
- **Build Tool**: Vite
- **State Management**: TanStack Query v5, Context API
- **Styling**: SCSS (BEM Methodology)
- **Icons**: Tabler Icons
- **Markdown**: Marked

### Backend

- **Server**: Express.js
- **Database & Auth**: Supabase
- **Middleware**: JWT, Multer, Cookie-parser

### DevOps & Testing

- **Testing**: Jest, Preact Testing Library
- **PWA**: Vite PWA Plugin
- **Deployment**: Node.js 환경

## ✨ 주요 기능

- **문서 뷰어**: 마크다운 파일 자동 렌더링 및 디렉토리 트리 구조 시각화
- **파일 관리**: 드래그 앤 드롭(D&D)을 통한 파일/폴더 이동 및 관리, 실시간 편집기
- **네비게이션**: 브라우저 히스토리와 동기화된 상태 기반 네비게이션, 모바일 친화적인 스와이프 동작
- **구독 및 알림**: 문서 변경 시 구독자 알림, 회독 추적(Reading Tracker) 및 타이머 알림
- **사용자 시스템**: Supabase 기반 회원가입/로그인, 프로필 관리 및 구독 목록 확인
- **반응형 디자인**: Grid 시스템을 활용한 다양한 디바이스 최적화 레이아웃

## 🏗 아키텍처 및 디자인 패턴

### 1. Presenter/Container 패턴

UI 렌더링을 담당하는 Presenter와 비즈니스 로직을 담당하는 Container를 분리하여 가독성과 테스트 용이성을 높였습니다.

- `src/containers/`: 데이터 페칭 및 상태 로직
- `src/pages/`, `src/components/`: 순수 UI 컴포넌트

### 2. Custom Hooks 패턴

반복되는 로직이나 복잡한 상태 관리를 Hook으로 캡슐화하여 재사용성을 극대화했습니다.

- `useMarkdownContent`: 마크다운 데이터 로드 로직
- `useSwipeNavigation`: 제스처 기반 네비게이션 로직
- `useDocsTreeQuery`: TanStack Query 기반 트리 데이터 관리

### 3. Observer 패턴

네비게이션이나 사이드바 상태 변경 등 전역적인 이벤트를 처리하기 위해 Observer 패턴을 사용합니다.

- `NavigationObserver`: 페이지 이동 이벤트 통합 관리
- `SidebarObserver`: 레이아웃 상태 변경 감지

## 🎨 코딩 컨벤션

- **SCSS BEM**: `block__element--modifier` 형식을 준수하여 스타일 충돌 방지 및 가독성 확보
- **TDD (Test-Driven Development)**: 주요 로직 및 유틸리티는 Jest 테스트 코드를 먼저 작성하거나 병행하여 안정성 확보
- **모듈화**: 컴포넌트 내부에 스타일과 로직을 포함하여 자율적인 모듈로 구성, Prop Drilling 최소화

## 📁 프로젝트 구조

```text
/
├── client/              # 프론트엔드 (Preact)
│   ├── src/
│   │   ├── components/  # 재사용 가능한 UI 컴포넌트
│   │   ├── containers/  # 로직 담당 컨테이너
│   │   ├── hooks/       # 커스텀 훅
│   │   ├── observers/   # 이벤트 옵저버
│   │   └── pages/       # 페이지 컴포넌트
│   └── tests/           # Jest 테스트 파일
├── server/              # 백엔드 (Express)
│   ├── src/
│   │   ├── controllers/ # 비즈니스 로직
│   │   ├── models/      # 데이터 모델
│   │   └── routes/      # API 라우트
└── package.json         # 전체 프로젝트 관리
```

## 🚀 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
# 클라이언트와 서버 동시 실행
npm run dev
```

### 환경 설정

- `client/env sample`을 참조하여 `.env` 파일을 생성하세요.
- `server/env.example`을 참조하여 `.env` 파일을 생성하세요.
