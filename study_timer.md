# 📝 순공부 시간 측정 기능 설계서 (최종 보강본)

## 1. 목표 및 요구사항
PWA 환경에서 모바일 잠금 화면 제어를 포함한 안정적인 순공부 시간 측정 기능을 제공한다.

### 1.1 핵심 기능
- **잠금 화면 제어**: Media Session API와 무음 오디오를 활용하여 잠금 화면에서 시작/일시정지/종료 제어.
- **전역 유지**: 페이지 이동과 관계없이 타이머 작동.
- **데이터 안정성**: 브라우저 종료, 로그아웃, 세션 만료(401), 네트워크 오류 시에도 기록 유실 방지.
- **UI/UX**: BEM 네이밍 규칙 및 SCSS 기반 반응형 Grid 레이아웃 적용.

---

## 2. DB 스키마 (PostgreSQL / Supabase)
### 2.1 study_sessions 테이블
```sql
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  pure_duration INTEGER DEFAULT 0, -- 초 단위
  status VARCHAR(20) DEFAULT 'recording', -- 'recording', 'paused', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own study sessions" 
ON study_sessions FOR ALL USING (auth.uid() = user_id);
```

---

## 3. 프론트엔드 아키텍처

### 3.1 레이어 구조
- **Observer (`StudyTimerObserver.js`)**: 오디오, Media Session, 실시간 상태 관리 (싱글톤).
- **Storage (`studyTimerStorage.js`)**: localStorage를 통한 데이터 백업 및 오프라인 동기화.
- **Context (`StudyTimerContext.jsx`)**: React 컴포넌트 트리에 상태 전파.
- **UI (`StudyTimerContainer.jsx`, `StudyTimerPresenter.jsx`)**: 로직과 UI 분리 및 BEM 스타일 적용.

### 3.2 핵심 로직: 세션 관리 및 복구
- **시작**: DB 세션 생성 -> `sessionId` 획득 -> `localStorage` 백업 -> 오디오/MediaSession 활성화.
- **복구**: 앱 로드 시 `localStorage`에 완료되지 않은 세션이 있으면 '복구 모달' 노출.
- **오류 대응**: 
  - 401(세션만료): 즉시 일시정지 및 로컬 백업.
  - 종료 시 네트워크 오류: `pendingSync`에 저장 후 온라인 시 재시도.

---

## 4. UI 설계 가이드
### 4.1 BEM 네이밍 규칙
- Block: `study-timer`
- Elements: `study-timer__display`, `study-timer__display-time`, `study-timer__controls`
- Modifiers: `study-timer__button--start`, `study-timer__button--pause`

### 4.2 반응형 레이아웃
- MUI 대신 `display: grid`와 `gap`을 활용하여 모바일 최적화 레이아웃 구성.

---

## 5. 단계별 구현 계획
1. **1단계**: DB 테이블 생성 및 API 엔드포인트(필요시) 준비.
2. **2단계**: `StudyTimerObserver` 구현 및 TDD 검증.
3. **3단계**: React Context 및 커스텀 훅 연동.
4. **4단계**: UI 컴포넌트 제작 및 SCSS 스타일링.
5. **5단계**: 복구 로직 및 인증 시스템(AuthContext) 연동.
