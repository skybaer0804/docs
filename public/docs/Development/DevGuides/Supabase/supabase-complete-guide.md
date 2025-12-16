# Supabase 완전 가이드 문서

## 📌 목차
1. [Supabase 개요](#1-supabase-개요)
2. [호스팅 vs 셀프호스팅 비용](#2-호스팅-vs-셀프호스팅-비용-비교)
3. [셀프호스팅 최소 요구사항](#3-셀프호스팅-최소-요구사항)
4. [Docker vs 네이티브 설치](#4-docker-vs-네이티브-설치)
5. [운영 자동화 및 유지보수](#5-운영-자동화--유지보수-추천)
6. [분리 리포지토리 관리](#6-분리-리포지토리-관리)
7. [CI/CD 파이프라인 구축](#7-cicd-파이프라인)
8. [호스팅 서비스 연동 가이드](#8-호스팅-서비스-연동-가이드)
9. [셀프호스팅 연동 가이드](#9-셀프호스팅-연동-가이드)

---

## 1. Supabase 개요

### Supabase란?
- **정의**: PostgreSQL 기반의 오픈소스 Backend-as-a-Service (BaaS)
- **Firebase 대안**: Google Firebase와 유사하지만 완전 오픈소스
- **핵심 기능**:
  - PostgreSQL 데이터베이스
  - REST/GraphQL API 자동 생성
  - JWT 기반 인증 (Auth)
  - Row Level Security (RLS) - 행 단위 보안
  - 실시간 WebSocket 구독
  - S3 호환 파일 스토리지
  - Deno 기반 Edge Functions (서버리스)
  - 벡터 임베딩 (AI 통합)

### 사용 방식
- **클라우드 호스팅**: supabase.com에서 관리 (권장)
- **셀프호스팅**: Docker로 직접 설치 (고급)

---

## 2. 호스팅 vs 셀프호스팅 비용 비교

### Supabase 호스팅 가격 플랜

| 플랜 | 월간 비용 | 포함 사항 | 초과 요금 |
|------|----------|---------|---------|
| **Free** | $0 | 500MB DB, 1GB 스토리지, 50K MAU | 제한 있음 |
| **Pro** | $25 + $10 크레딧 | 8GB DB, 100GB 스토리지, 100K MAU | DB: $0.125/GB, 스토리지: $0.021/GB, MAU: $0.00325/명 |
| **Team** | $599 | 200GB DB, 500GB 스토리지, 1M MAU | 커스텀 |
| **Enterprise** | 맞춤 | 무제한 | 맞춤 |

### 셀프호스팅 비용

| 항목 | 비용 |
|------|------|
| VPS (Hetzner 기준) | €3-50/월 ($3-55) |
| S3 스토리지 | $0.02/GB |
| DevOps 인력 | $120K-240K/년 |
| 다운타임 리스크 | 사업 손실 |

### 비용 비교 결론
- **개발/프로토타입**: 호스팅 Free 티어 (무료)
- **소규모 프로젝트** (1-10명): 호스팅 Pro ($25/월)
- **중규모** (10-50명): 호스팅 Team ($599/월)
- **대규모 + DevOps 팀**: 셀프호스팅

---

## 3. 셀프호스팅 최소 요구사항

### 하드웨어 사양

| 항목 | 개발/테스트 | 생산 환경 |
|------|-----------|---------|
| **CPU** | 2코어 | 4-8코어 |
| **RAM** | 8GB | 16-32GB |
| **스토리지** | 30GB SSD | 80GB+ NVMe |
| **네트워크** | 1Gbps | 1Gbps+ |

### 소프트웨어 요구사항
- **OS**: Ubuntu 20.04+ (또는 Linux)
- **Docker**: 최신 버전
- **Git**: 저장소 클론용

### 적용 시나리오
- DigitalOcean Droplet: 1GB RAM (25GB SSD) → 기본 작동
- 트래픽 증가: 16GB RAM + 8vCPU 업그레이드
- 20M+ 행 데이터: 32GB RAM + 전용 Postgres 고려

---

## 4. Docker vs 네이티브 설치

### Docker 기반 (권장) ⭐

| 특징 | 설명 |
|------|------|
| **설치 시간** | 5분 (docker-compose up) |
| **종속성** | 자동 관리 |
| **배포** | 로컬/VPS/Kubernetes 호환 |
| **업데이트** | `docker pull` + 재시작 |
| **이식성** | 높음 (모든 환경) |
| **공식 지원** | ✅ 완전 지원 |

### 네이티브 설치 (비추천) ❌

| 특징 | 설명 |
|------|------|
| **설치 시간** | 수 시간~일 |
| **종속성** | 수동 컴파일 (libpq, Node 등) |
| **배포** | Linux 특정 OS만 |
| **업데이트** | 패치 동기화 수동 |
| **이식성** | 낮음 |
| **공식 지원** | ❌ 커뮤니티만 |
| **버전 관리** | 복잡 |

### 결론
**Docker를 반드시 사용하세요.** 네이티브 설치는 공식 미지원이며, 운영 부담이 극도로 높습니다.

---

## 5. 운영 자동화 & 유지보수 추천

### 호스팅 서비스 (강력 추천) ⭐⭐⭐

**자동으로 제공되는 기능:**
- ✅ 자동 백업 (PITR, 7-30일 보관)
- ✅ 보안 패치 자동 적용
- ✅ 버전 업그레이드 무중단
- ✅ 자동 스케일링
- ✅ 내장 모니터링 대시보드
- ✅ 99.9% SLA (엔터프라이즈)

**운영 부담**: 거의 없음 (로그인만)

### 셀프호스팅 (부담 큼) ⚠️

**수동으로 관리 필요:**
- ❌ 백업 스크립트 직접 작성 (gpg 암호화)
- ❌ 모니터링 구축 (Prometheus/Grafana)
- ❌ 보안 패치 적용 (수동)
- ❌ 버전 업그레이드 (다운타임 발생)
- ❌ 장애 복구 직접 담당
- ❌ Edge Functions 일부 미지원

**인력 비용**: $120K-240K/년

### 유지보수 체크리스트 (셀프호스팅)
```
매일: docker compose logs 확인
주간: pg_dumpall > backup.sql
월간: docker compose pull && up -d
```

### 추천
- **팀 규모 1-50명**: 호스팅 Pro/Team
- **DevOps 팀 있음**: 셀프호스팅 또는 관리형 (Supascale)

---

## 6. 분리 리포지토리 관리

### 구조 개요
- **앱 리포** (`my-app-frontend`): 프론트엔드만
- **Infra 리포** (`my-app-supabase`): Supabase 설정 + 마이그레이션
- **장점**: 팀 분업, 독립 배포, 다중 프론트엔드 공유 가능

### 앱 리포지토리 구조

```
my-app-frontend/
├── src/
│   ├── components/          # React/Vue 컴포넌트
│   ├── pages/              # 라우트
│   └── lib/supabase.ts     # Supabase 클라이언트 초기화
├── public/                 # 정적 에셋
├── .env.local              # 환경 변수 (로컬)
├── .env.production         # 프로덕션 환경 변수
├── package.json            # @supabase/supabase-js 의존성
├── next.config.js          # Next.js 설정
└── .github/workflows/deploy.yml
```

**lib/supabase.ts**:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Infra 리포지토리 구조

```
my-app-supabase/
├── supabase/
│   ├── config.toml                    # Supabase 설정
│   ├── migrations/                    # DB 마이그레이션
│   │   ├── 20251201120000_init.sql   # CREATE TABLE users
│   │   └── 20251202150000_add_rls.sql # RLS 정책
│   ├── seed.sql                       # 초기 데이터
│   └── functions/                     # Edge Functions
│       └── hello-world/
│           ├── index.ts
│           └── deno.json
├── .env                    # 로컬 개발 (SUPABASE_DB_URL)
├── .gitignore
├── .github/workflows/
│   └── deploy.yml         # CI/CD 파이프라인
└── README.md              # 설정 가이드
```

### 환경 변수

**앱 리포 (.env.local)**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

**Infra 리포 (.env)**:
```
SUPABASE_DB_URL=postgresql://user:pass@localhost:5432/postgres
SUPABASE_ACCESS_TOKEN=sbp_...
```

### 배포 워크플로우
1. Infra PR 병합 → `supabase db push` → DB 마이그레이션
2. 앱 PR 병합 → Vercel/Netlify 배포 → 프론트엔드 배포
3. Supabase Branching: dev/staging/prod 자동 프로모션

---

## 7. CI/CD 파이프라인

### 앱 리포 CI/CD (`my-app-frontend/.github/workflows/deploy.yml`)

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
    - run: npm ci
    - run: npm run lint
    - run: npm test
    - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm run build
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Infra 리포 CI/CD (`my-app-supabase/.github/workflows/deploy.yml`)

```yaml
name: Deploy Supabase Infrastructure

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: supabase/setup-cli@v1
      with:
        version: latest
    - run: supabase db diff --local  # 스키마 검증

  deploy:
    needs: lint
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v4
    - uses: supabase/setup-cli@v1
      with:
        version: latest
    
    - name: Link Supabase Project
      run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
      env:
        SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    
    - name: Push Database Changes
      run: supabase db push
    
    - name: Deploy Edge Functions
      run: supabase functions deploy hello-world --no-verify-jwt
```

### Secrets 설정 (GitHub)
GitHub Settings → Secrets and variables → Actions:
- `SUPABASE_PROJECT_REF`: 프로젝트 ID
- `SUPABASE_ACCESS_TOKEN`: `supabase login`에서 생성
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### 환경별 배포 전략

| 환경 | 브랜치 | 트리거 | 대상 |
|------|--------|--------|------|
| **Preview** | feature/* | PR | Supabase Preview, Vercel Preview |
| **Staging** | staging | push | Staging 프로젝트, Netlify Staging |
| **Production** | main | push | Production 프로젝트, Vercel Production |

---

## 8. 호스팅 서비스 연동 가이드

### 📋 사전 준비
1. [supabase.com](https://supabase.com) 가입
2. New Project → 프로젝트명, 지역(ap-northeast), DB 비밀번호 입력
3. 생성 대기 (2-3분)

### 1단계: API 키 복사
Supabase 대시보드 → Settings → API:
- `SUPABASE_URL`: `https://xyz.supabase.co`
- `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIs...`

### 2단계: 프론트앱 환경 변수 설정

**Next.js (.env.local)**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 3단계: SDK 설치
```bash
npm install @supabase/supabase-js
```

### 4단계: 클라이언트 초기화

**lib/supabase.ts**:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 5단계: 기본 기능 테스트

```typescript
import { supabase } from '@/lib/supabase'

// 데이터 삽입
await supabase
  .from('todos')
  .insert([{ task: 'Hello Supabase!' }])

// 데이터 조회
const { data } = await supabase
  .from('todos')
  .select('*')
console.log(data)  // [{ id: 1, task: 'Hello Supabase!', created_at: ... }]
```

### 6단계: Vercel 배포

**옵션 1: Vercel 직접 연동**
1. Vercel 대시보드 → New Project
2. GitHub 저장소 선택
3. Environment Variables 추가
4. `git push` → 자동 배포

**옵션 2: Vercel CLI**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel deploy --prod
```

### 7단계: RLS 설정 (선택)

Supabase 대시보드 → SQL Editor:
```sql
-- RLS 활성화
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자 읽기 허용
CREATE POLICY "Enable read access for all users" 
ON todos FOR SELECT 
USING (true);

-- 정책: 자신의 todos만 수정
CREATE POLICY "Enable update for own todos" 
ON todos FOR UPDATE 
USING (auth.uid() = user_id);
```

### 8단계: 인증 설정 (선택)

Supabase 대시보드 → Authentication:
- ✅ Email & Password
- ✅ Google OAuth
- ✅ GitHub OAuth

### 배포된 앱 확인
```
https://your-app.vercel.app
```

### Free 티어 한도
| 항목 | 한도 |
|------|------|
| DB | 500MB |
| 스토리지 | 1GB |
| MAU | 50K명 |
| Edge Functions | 500K 호출/월 |
| Bandwidth | 5GB/월 |

---

## 9. 셀프호스팅 연동 가이드

### 📋 사전 준비
- Ubuntu 20.04+ VPS (DigitalOcean, Hetzner, AWS 등)
- SSH 접속 가능
- 도메인 (선택사항)

### 1단계: Docker 및 Docker Compose 설치

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 확인 (v2 포함됨)
docker compose version
```

### 2단계: Supabase 저장소 클론

```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
```

### 3단계: 환경 설정

```bash
cp .env.example .env
```

**.env 파일 수정:**
```bash
# JWT 시크릿 생성 (터미널에서)
openssl rand -base64 32

# .env에서 수정할 주요 항목:
JWT_SECRET=your-generated-secret-here
ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key
POSTGRES_PASSWORD=your-secure-password
```

### 4단계: 서비스 시작

```bash
docker compose up -d
```

**확인:**
```bash
docker compose ps  # 모든 컨테이너 실행 확인
```

### 5단계: 대시보드 접속

- **URL**: `http://your-server-ip:8000`
- **기본 계정**: `supabase` / `admin`
- **⚠️ 필수**: 초기 로그인 후 비밀번호 변경

### 6단계: 프론트앱 연동

**앱의 .env.local 수정:**
```
NEXT_PUBLIC_SUPABASE_URL=http://your-server-ip:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-dashboard
```

**클라이언트 초기화** (호스팅과 동일):
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 7단계: HTTPS 설정 (프로덕션)

```bash
# Nginx + Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d your-domain.com

# docker-compose.yml에서 포트 매핑 수정
# 8000:8000 → 443:8000
docker compose restart
```

### 8단계: 백업 스크립트

**backup.sh:**
```bash
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# PostgreSQL 백업
docker compose exec -T postgres pg_dumpall -U postgres > \
  $BACKUP_DIR/backup_$TIMESTAMP.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

**Cron 작업 (매일 자동 실행):**
```bash
# crontab -e
0 2 * * * /home/ubuntu/backup.sh
```

### 9단계: 모니터링 (선택)

```bash
# 실시간 로그 확인
docker compose logs -f postgres
docker compose logs -f api

# 리소스 사용량
docker stats
```

### 10단계: 마이그레이션 및 시딩

SQL Editor에서 직접 실행:
```sql
-- 테이블 생성
CREATE TABLE todos (
  id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  task TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS 활성화
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 정책
CREATE POLICY "Users view own todos" ON todos FOR SELECT USING (auth.uid() = user_id);
```

### 11단계: CI/CD 파이프라인 (선택)

Infra 리포에서:
```bash
supabase link --project-ref local
supabase db push
supabase functions deploy
```

### 문제 해결

| 증상 | 해결책 |
|------|--------|
| 대시보드 접속 불가 | `docker compose logs` 확인 |
| API 응답 없음 | `docker compose restart api` |
| DB 연결 실패 | PostgreSQL 비밀번호 확인 |
| 메모리 부족 | VPS RAM 업그레이드 또는 컨테이너 제한 설정 |

### 셀프호스팅 체크리스트
- [ ] Docker 설치 확인
- [ ] .env 파일 보안 설정
- [ ] 프로덕션 비밀번호 변경
- [ ] HTTPS 설정
- [ ] 백업 스크립트 구성
- [ ] 모니터링 설정
- [ ] 방화벽 설정 (필요시)

---

## 📊 최종 선택 가이드

### 호스팅 서비스 선택 기준 ⭐⭐⭐ (추천)
```
✅ 개발 시작
✅ 프로토타입 (Free)
✅ 소규모 팀 (Pro)
✅ 중규모 (Team)
✅ DevOps 없는 팀
✅ 빠른 배포 원함
```

### 셀프호스팅 선택 기준 ⚠️
```
✅ 데이터 주권 필요
✅ 고도 커스텀 필요
✅ DevOps 팀 보유
✅ 운영 비용 절감 (대규모)
⚠️ 운영 부담 감수
⚠️ 인력 투자 가능
```

### 관리형 셀프호스팅 (折衷案)
- Supascale: 자동 백업 + 모니터링
- Render: Docker 배포 + 관리형

---

## 🔗 참고 자료
- Supabase 공식 문서: https://supabase.com/docs
- GitHub: https://github.com/supabase/supabase
- Supabase 커뮤니티: https://discord.supabase.com
