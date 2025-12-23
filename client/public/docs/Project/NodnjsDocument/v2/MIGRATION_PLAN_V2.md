# Node.js Document Project v2 마이그레이션 계획

## 1. 개요 (Overview)

본 문서는 기존 정적 파일 기반의 문서 관리 시스템을 **Express.js + PostgreSQL (Supabase)** 기반의 동적 풀스택 애플리케이션으로 전환하기 위한 마이그레이션 계획을 기술합니다.

### 주요 목표

-   **DB 기반 관리**: 파일 시스템 의존성을 제거하고 DB를 통해 문서와 폴더 구조를 관리합니다.
-   **사용자 인증**: JWT 기반 로그인을 도입하여 문서 작성 권한을 관리합니다. (비로그인: 조회만 가능)
-   **SPA 라우팅 해결**: Express 서버를 통해 SPA 새로고침 시 발생하는 404/CSS 깨짐 문제를 해결합니다.
-   **무료 배포 최적화**: Koyeb 및 Supabase 무료 티어를 활용한 지속 가능한 아키텍처를 구축합니다.

---

## 2. 아키텍처 (Architecture)

### 2.1 전체 구조

단일 레포지토리(Monorepo) 내에서 클라이언트와 서버를 분리하여 관리합니다.

```mermaid
graph TD
    Client[Client (React/Vite)] -->|API Request| Server[Server (Express)]
    Server -->|Query| DB[(Supabase PostgreSQL)]
    Browser[User Browser] -->|Load Static Files| Server
```

### 2.2 기술 스택

-   **Frontend**: React/Preact (기존 유지), Vite
-   **Backend**: Node.js, Express.js
-   **Database**: PostgreSQL (Supabase Hosting)
-   **Deployment**: Koyeb (PaaS)

---

## 3. 디렉토리 구조 (Directory Structure)

### 3.1 변경 전 (AS-IS)

```
project-root/
├── src/           # 프론트엔드 소스
├── public/        # 정적 파일
├── package.json
└── vite.config.js
```

### 3.2 변경 후 (TO-BE)

```
project-root/
├── client/                 # (구) 현재 프로젝트 소스 이동
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   └── package.json
├── server/                 # 신규 Express 서버
│   ├── src/
│   │   ├── config/         # DB 연결 등 설정
│   │   ├── controllers/    # 비즈니스 로직
│   │   ├── routes/         # API 라우터
│   │   ├── middleware/     # 인증 미들웨어
│   │   └── app.js          # 앱 진입점
│   ├── package.json
│   └── .env                # 환경 변수
├── package.json            # 전체 빌드/배포 스크립트 관리
└── koyeb.yaml              # 배포 설정
```

---

## 4. 데이터베이스 설계 (Database Schema)

Supabase PostgreSQL을 사용하며, 파일 시스템을 DB로 옮기기 위해 **인접 목록(Adjacency List)** 패턴을 사용합니다.

### 4.1 Users 테이블 (사용자)

로그인 및 권한 관리를 위한 테이블입니다.

```sql
CREATE TABLE users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 4.2 Nodes 테이블 (파일 시스템 통합)

폴더와 파일을 통합 관리하는 테이블입니다. 트리 구조를 표현합니다.

```sql
CREATE TYPE node_type AS ENUM ('FILE', 'DIRECTORY');

CREATE TABLE nodes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid REFERENCES nodes(id) ON DELETE CASCADE, -- 상위 폴더 ID (Root는 NULL)
  type node_type NOT NULL,                               -- 타입: 파일 또는 폴더
  name text NOT NULL,                                    -- 이름 (예: "guide.md")
  content text,                                          -- 내용 (파일인 경우 Markdown 본문)
  path text UNIQUE NOT NULL,                             -- 전체 경로 (예: "/docs/api/intro")
  is_public boolean DEFAULT true,                        -- 공개 여부
  author_id uuid REFERENCES users(id),                   -- 작성자
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- 같은 폴더 내 이름 중복 방지
  UNIQUE(parent_id, name)
);

-- 성능 최적화 인덱스
CREATE INDEX idx_nodes_parent_id ON nodes(parent_id);
CREATE INDEX idx_nodes_path ON nodes(path);
```

---

## 5. 비즈니스 로직 (Business Logic)

### 5.1 인증 (Authentication)
-   **로그인**: Supabase Auth 기능을 사용하거나, 직접 구현 시 Supabase가 발급한 JWT Secret을 사용하여 토큰을 검증합니다.
-   **미들웨어**: API 요청 헤더(`Authorization: Bearer <token>`)에 포함된 토큰을 Supabase의 JWT Secret으로 검증하여 사용자 신원을 확인합니다.


### 5.2 라우팅 및 SPA Fallback (새로고침 문제 해결)

Express 서버가 정적 파일 서빙과 API 처리를 동시에 담당합니다.

```javascript
// server/src/app.js 예시

// 1. API 요청 처리
app.use('/api', apiRouter);

// 2. 정적 파일(Frontend Build) 서빙
app.use(express.static(path.join(__dirname, '../../client/dist')));

// 3. 그 외 모든 요청은 index.html 반환 (SPA 라우팅 지원)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
```

### 5.3 디렉토리 및 파일 관리 (RESTful API)

문서 및 디렉토리에 대한 모든 작업은 RESTful API를 따릅니다.

|   Method   | Endpoint             | 설명                            |   권한    | Request Body / Query                              |
| :--------: | :------------------- | :------------------------------ | :-------: | :------------------------------------------------ |
|  **GET**   | `/api/docs`          | 전체 문서/폴더 구조 조회 (트리) |   전체    | -                                                 |
|  **GET**   | `/api/docs/:path(*)` | 특정 문서 내용 조회             |   전체    | -                                                 |
|  **POST**  | `/api/docs`          | 새 문서 또는 폴더 생성          | 🔐 관리자 | `{ type, parent_path, name, content, is_public }` |
|  **PUT**   | `/api/docs/:id`      | 문서 수정 (내용, 공개여부 등)   | 🔐 관리자 | `{ content, is_public, name }`                    |
| **DELETE** | `/api/docs/:id`      | 문서 또는 폴더 삭제             | 🔐 관리자 | -                                                 |
|  **POST**  | `/api/docs/upload`   | .md 파일 직접 업로드            | 🔐 관리자 | `multipart/form-data` (file)                      |

#### 상세 로직

1.  **문서 조회 (`GET /api/docs/:path(*)`)**
    -   URL 경로(예: `/docs/api/guide`)를 파라미터로 받아 DB의 `path` 컬럼과 매칭합니다.
    -   **권한 체크**:
        -   로그인 사용자(관리자): 모든 문서 조회 가능.
        -   비로그인 사용자: `is_public = true`인 문서만 조회 가능. `false`인 경우 403 Forbidden 또는 404 Not Found 반환.
2.  **문서 생성 (`POST /api/docs`)**

    -   **Input**:
        -   `type`: 'FILE' | 'DIRECTORY'
        -   `parent_path`: 상위 폴더 경로 (예: `/docs/api`)
        -   `name`: 파일명 (예: `intro`)
        -   `content`: 마크다운 본문 (FILE일 경우)
        -   `is_public`: 공개 여부 (기본값 true)
    -   **Logic**:
        -   `parent_path`로 부모 노드의 ID를 찾습니다.
        -   부모 아래에 중복된 `name`이 있는지 확인합니다.
        -   전체 `path`를 생성하고 DB에 저장합니다.

3.  **문서 수정 (`PUT /api/docs/:id`)**

    -   **Input**: `content` (수정된 본문), `is_public` (공개 설정 변경), `name` (이름 변경 시)
    -   **Logic**:
        -   ID로 문서를 찾습니다.
        -   `is_public` 변경 요청이 있으면 업데이트합니다 (비공개 ↔ 전체공개 전환).
        -   이름 변경 시 같은 폴더 내 중복 체크 및 `path` 업데이트가 필요합니다.
        -   `updated_at` 타임스탬프를 갱신합니다.

4.  **파일 업로드 (`POST /api/docs/upload`)**
    -   **기능**: 기존에 작성된 `.md` 파일을 드래그 앤 드롭으로 업로드하여 문서를 생성합니다.
    -   **Logic**:
        -   `multer` 미들웨어를 사용하여 파일 버퍼를 읽습니다.
        -   파일 내용을 텍스트(`utf-8`)로 변환합니다.
        -   파일명(`filename.md`)에서 확장자를 제거하여 `name`으로 사용합니다.
        -   이후 로직은 **문서 생성**과 동일하게 DB에 저장합니다 (`type='FILE'`, `content=파일내용`).

---

## 6. 배포 전략 (Deployment)

**Koyeb**을 사용하여 배포하며, 루트의 `package.json`을 통해 빌드 프로세스를 자동화합니다.

### 6.1 루트 package.json 스크립트

```json
{
    "scripts": {
        "postinstall": "cd client && npm install && cd ../server && npm install",
        "build": "cd client && npm run build",
        "start": "cd server && node src/app.js"
    }
}
```

### 6.2 배포 프로세스

1. GitHub 레포지토리에 코드 푸시.
2. Koyeb이 변경 사항 감지.
3. `npm install` (루트 -> 클라이언트 -> 서버).
4. `npm run build` (클라이언트 빌드 -> `client/dist` 생성).
5. `npm start` (서버 실행 -> `client/dist` 서빙).

---

## 7. 마이그레이션 단계 (Migration Steps)

1. **Step 1: 구조 변경**
    - `client` 폴더 생성 및 기존 소스 이동.
    - `server` 폴더 생성 및 Express 초기화.
2. **Step 2: DB 구축**
    - Supabase 프로젝트 생성.
    - SQL Editor를 통해 테이블 스키마 적용.
3. **Step 3: 백엔드 개발**
    - DB 연결 설정.
    - 인증 및 CRUD API 구현.
4. **Step 4: 프론트엔드 연동**
    - API 호출 로직 구현.
    - 빌드 설정 수정.
5. **Step 5: 배포**
    - Koyeb 연결 및 배포 테스트.
