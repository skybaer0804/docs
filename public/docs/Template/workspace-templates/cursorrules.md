# Spark Messaging 프로젝트 규칙

## 프로젝트 구조
- Frontend: Preact + Vite (spark-messaging-demo)
- Backend: Node.js 백엔드 서버 (spark-messaging-backend)
- SDK: @skybaer0804/spark-messaging-client npm 패키지 (spark-messaging-sdk)

## 개발 규칙
- 항상 한국어로 응답
- UI 컴포넌트와 로직을 함께 모듈화 (prop 전달 최소화)
- 레이아웃 모듈화 시 children 및 이벤트 prop으로 전달
- MUI 사용 시 7버전 이상 문법 사용
- 반응형 고려하여 Grid 우선 사용

## 코드 스타일
- TypeScript 사용
- Preact hooks 사용
- 함수형 컴포넌트 선호

## 프로젝트 간 연동
- SDK 변경 시 프론트엔드 데모에 반영 확인
- 백엔드 API 변경 시 프론트엔드 및 SDK 확인
- 타입 정의는 SDK에서 제공하도록 권장
- 여러 프로젝트를 함께 검토하여 일관성 유지

## 파일 접근
- 절대 경로로 다른 프로젝트 파일 접근 가능
- 프로젝트 간 의존성 변경 시 모든 관련 프로젝트 확인

