# JWT 인증 마이그레이션 가이드

Supabase Authentication에서 자체 JWT 토큰 인증으로 전환하는 가이드입니다.

## 중요 사항

⚠️ **Supabase Authentication만 제거하고, Supabase PostgreSQL 데이터베이스는 계속 사용합니다.**

- ✅ **Supabase PostgreSQL**: 데이터베이스로 계속 사용 (`users`, `nodes` 테이블 등)
- ❌ **Supabase Authentication**: 제거하고 자체 JWT 인증으로 대체
- ✅ **Supabase 클라이언트**: 백엔드에서 데이터베이스 접근용으로 계속 사용

## 변경 사항 요약

### 백엔드
- ✅ Supabase Auth 제거, 자체 JWT 인증 구현
- ✅ `/api/auth/login` 엔드포인트 추가
- ✅ `/api/auth/me` 엔드포인트 추가
- ✅ `authMiddleware`를 자체 JWT Secret으로 변경
- ✅ `bcrypt`를 사용한 비밀번호 해싱
- ✅ **Supabase PostgreSQL 데이터베이스 계속 사용** (`server/src/config/supabase.js`)

### 클라이언트
- ✅ Supabase Auth 클라이언트 제거 (프론트엔드에서)
- ✅ 자체 API 호출로 변경
- ✅ 토큰을 localStorage에 저장

## 설정 방법

### 1. 데이터베이스 설정

**Supabase PostgreSQL 데이터베이스는 계속 사용합니다.** (`SUPABASE_URL`, `SUPABASE_ANON_KEY` 환경변수 필요)

Supabase PostgreSQL에서 `users` 테이블을 생성합니다:

```sql
-- server/src/migrations/create_users_table.sql 파일 실행
```

또는 Supabase 대시보드의 SQL Editor에서 직접 실행:

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### 2. 환경변수 설정

#### 백엔드 (server/.env)

```env
PORT=5000

# Supabase PostgreSQL 데이터베이스 설정 (계속 사용)
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]

# JWT 인증 설정 (새로 추가)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
```

**중요**: 
- `SUPABASE_URL`과 `SUPABASE_ANON_KEY`는 **데이터베이스 접근용**으로 계속 필요합니다.
- `JWT_SECRET`은 최소 32자 이상의 랜덤 문자열로 설정하세요.

#### 클라이언트 (client/.env)

클라이언트 환경변수는 더 이상 필요하지 않습니다. (Supabase Auth 클라이언트 제거됨)

**참고**: 백엔드에서만 Supabase 클라이언트를 사용하여 데이터베이스에 접근합니다.

### 3. 의존성 설치

```bash
cd server
npm install
```

`bcrypt` 패키지가 자동으로 설치됩니다.

### 4. 초기 관리자 계정 생성

```bash
cd server
node src/scripts/createAdminUser.js admin@example.com yourpassword
```

이 명령어는:
- 이메일과 비밀번호를 받아서
- 비밀번호를 bcrypt로 해싱하고
- `users` 테이블에 저장합니다

### 5. 서버 실행

```bash
cd server
npm run dev
```

## API 엔드포인트

### POST /api/auth/login

로그인 요청

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/auth/me

현재 사용자 정보 조회 (인증 필요)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

## 클라이언트 사용법

### 로그인

```javascript
import { login } from './utils/api';

try {
  const { token, user } = await login('admin@example.com', 'password');
  console.log('Logged in:', user);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### 현재 사용자 정보 조회

```javascript
import { getCurrentUser } from './utils/api';

try {
  const { user } = await getCurrentUser();
  console.log('Current user:', user);
} catch (error) {
  console.error('Failed to get user:', error.message);
}
```

### 로그아웃

```javascript
import { logout } from './utils/api';

logout();
```

### AuthContext 사용

```javascript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;
  
  return (
    <div>
      <p>Logged in as: {user.email}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

## 보안 고려사항

1. **JWT_SECRET**: 프로덕션 환경에서는 강력한 랜덤 문자열을 사용하세요.
2. **비밀번호 해싱**: bcrypt의 salt rounds는 10으로 설정되어 있습니다.
3. **토큰 만료**: 기본값은 7일입니다. `JWT_EXPIRES_IN` 환경변수로 변경 가능합니다.
4. **HTTPS**: 프로덕션에서는 반드시 HTTPS를 사용하세요.
5. **토큰 저장**: 현재는 localStorage에 저장되지만, XSS 공격에 취약할 수 있습니다. 필요시 httpOnly 쿠키로 변경을 고려하세요.

## 문제 해결

### "JWT_SECRET is missing" 에러

서버 `.env` 파일에 `JWT_SECRET`이 설정되어 있는지 확인하세요.

### "User not found" 에러

초기 관리자 계정이 생성되었는지 확인하세요:
```bash
node src/scripts/createAdminUser.js admin@example.com password
```

### "Invalid token" 에러

토큰이 만료되었거나 유효하지 않습니다. 다시 로그인하세요.

### 데이터베이스 연결 에러

`SUPABASE_URL`과 `SUPABASE_ANON_KEY`가 올바르게 설정되어 있는지 확인하세요.

**참고**: Supabase PostgreSQL 데이터베이스는 계속 사용하므로, 이 환경변수들은 필수입니다.

