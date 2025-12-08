# MySQL vs PostgreSQL 상세 비교 가이드

## 개요

MySQL과 PostgreSQL은 모두 널리 사용되는 오픈소스 관계형 데이터베이스이지만, 설계 철학과 기능에서 중요한 차이가 있습니다. 이 문서에서는 두 데이터베이스의 주요 특징을 비교하고, 각 프로젝트에 맞는 선택 기준을 제시합니다.

---

## 빠른 비교표

| 항목 | MySQL | PostgreSQL |
|------|-------|-----------|
| **데이터베이스 타입** | 관계형 RDBMS | 객체 관계형 ORDBMS |
| **라이선스** | GPL | PostgreSQL License (오픈소스) |
| **동시성 제어** | 잠금 기반 (Lock-based) | MVCC (Multi-Version Concurrency Control) |
| **ACID 준수** | InnoDB만 지원 | 모든 구성에서 완벽 준수 |
| **인덱싱 유형** | B-tree, Hash | B-tree, Hash, GiST, GIN, SP-GiST, BRIN |
| **트리거** | 행 수준만 지원 | BEFORE, AFTER, INSTEAD OF 지원 |
| **저장 프로시저** | SQL 기반만 | PL/pgSQL, Python, Perl 등 다양 |
| **JSON 지원** | 기본 지원 | 고급 지원 (인덱싱, 연산자) |
| **확장성** | 중간 규모까지 | 엔터프라이즈급 확장성 |
| **읽기 성능** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **쓰기 성능** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **학습 난이도** | 낮음 | 중간~높음 |
| **커뮤니티 규모** | 매우 큼 | 중간~큼 |

---

## 상세 비교

### 1. 데이터 무결성과 트랜잭션

#### MySQL
- **InnoDB 스토리지 엔진**에서만 ACID 지원
- 잠금 기반(Lock-based) 동시성 제어 사용
- 읽기 작업이 많을 때 성능이 우수
- 동시 접근 시 대기 시간이 늘어날 수 있음

#### PostgreSQL
- **모든 구성**에서 ACID 완벽 준수
- MVCC(Multi-Version Concurrency Control) 사용
  - 각 트랜잭션이 데이터의 자신의 스냅샷 읽음
  - 읽기/쓰기 충돌 없음
  - 동시성 성능 우수
- 데이터 무결성이 매우 높음

**결론**: 데이터 무결성이 중요한 프로젝트는 PostgreSQL 권장

---

### 2. 성능 특성

#### 읽기 성능
```
MySQL: ⭐⭐⭐⭐⭐ (매우 빠름)
PostgreSQL: ⭐⭐⭐⭐ (빠름)
```

- **MySQL**: 단일 프로세스로 여러 사용자 처리 → 읽기 최적화
- **PostgreSQL**: 프로세스당 연결 생성 → 읽기는 약간 느리지만 안정적

#### 쓰기 성능
```
MySQL: ⭐⭐⭐⭐ (빠름)
PostgreSQL: ⭐⭐⭐⭐⭐ (매우 빠름)
```

- **MySQL**: 기본 쓰기 성능은 좋으나 대량 작업에서 병목
- **PostgreSQL**: 병렬 쿼리 실행, 비동기 I/O로 대량 작업 최적화
  - PostgreSQL 18은 대규모 테이블에서 MySQL 9.5보다 약 30% 빠름

#### 사용 사례
- **읽기 위주** (SNS 피드, 뉴스 조회): MySQL
- **쓰기 위주** (분석, 로깅, 대량 데이터): PostgreSQL

---

### 3. 인덱싱 기능

#### MySQL의 인덱싱
| 인덱스 유형 | 설명 |
|-----------|------|
| B-tree | 일반적인 검색, 범위 쿼리 |
| Hash | 정확한 일치 검색 |

**제한사항**: 복잡한 쿼리 최적화 어려움

#### PostgreSQL의 인덱싱
| 인덱스 유형 | 설명 |
|-----------|------|
| B-tree | 일반적인 검색, 범위 쿼리 |
| Hash | 정확한 일치 검색 |
| GiST | 지리 정보, 텍스트 검색 |
| GIN | 배열, JSON, 전문 검색 |
| SP-GiST | 공간 데이터 |
| BRIN | 매우 큰 테이블 |
| 표현식 인덱스 | 계산된 값 인덱싱 |
| 부분 인덱스 | 조건부 인덱싱 |

**예시: PostgreSQL 표현식 인덱스**
```sql
-- 소문자 이메일로 검색 최적화
CREATE INDEX idx_email_lower ON users(LOWER(email));
```

**결론**: 복잡한 쿼리가 많다면 PostgreSQL

---

### 4. 고급 기능 비교

#### 트리거 (Trigger)

**MySQL**
```sql
-- 행 수준 AFTER 트리거만 지원
CREATE TRIGGER update_timestamp
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE audit_log SET modified_at = NOW();
END;
```

**PostgreSQL**
```sql
-- BEFORE, AFTER, INSTEAD OF 지원
CREATE TRIGGER update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_modified_at();
```

#### 저장 프로시저 (Stored Procedure)

**MySQL**: SQL 기반 논리만 가능

**PostgreSQL**: 다양한 언어 지원
- PL/pgSQL (PostgreSQL 표준)
- PL/Python
- PL/Perl
- PL/Java
- 그 외 다양한 언어

#### 구체화된 뷰 (Materialized View)

| 기능 | MySQL | PostgreSQL |
|------|-------|-----------|
| 일반 뷰 | ✓ | ✓ |
| 구체화된 뷰 | ✗ | ✓ |
| 자동 갱신 | - | ✗ (수동 갱신) |

---

### 5. JSON 지원

#### MySQL의 JSON
```sql
-- JSON 데이터 저장
INSERT INTO products VALUES ('{"name": "Laptop", "price": 1000}');

-- JSON 경로로 조회
SELECT JSON_EXTRACT(data, '$.name') FROM products;
```

**제한사항**: JSON 필드에 인덱스 생성 불가능

#### PostgreSQL의 JSON
```sql
-- JSON과 JSONB 모두 지원 (JSONB 권장)
CREATE TABLE products (
  id SERIAL,
  data JSONB
);

-- JSONB 인덱스 생성 가능
CREATE INDEX idx_product_data ON products USING GIN(data);

-- 더 풍부한 연산자 제공
SELECT * FROM products WHERE data @> '{"category": "electronics"}';
```

**장점**: 인덱싱 가능, 더 많은 연산자, 검색 성능 우수

---

### 6. 확장성

#### MySQL의 확장성
- **수평 확장**: 샤딩 필요 (자동 지원 안 함)
- **클러스터링**: MySQL Cluster, ProxySQL 등 외부 도구 필요
- **적합 규모**: 소~중규모 애플리케이션

#### PostgreSQL의 확장성
- **수평 확장**: Citus (PostgreSQL 확장) 제공
- **클러스터링**: Patroni, pgpool-II 지원
- **읽기 복제본**: Streaming Replication 지원
- **적합 규모**: 엔터프라이즈급 애플리케이션

---

### 7. 커뮤니티와 지원

| 항목 | MySQL | PostgreSQL |
|------|-------|-----------|
| **커뮤니티 규모** | 매우 큼 | 중간~큼 |
| **온라인 리소스** | 매우 많음 | 많음 |
| **상용 지원** | Oracle | EDB, 다양한 업체 |
| **학습 자료** | 매우 풍부 | 풍부 |
| **개발 활동** | 활발 | 매우 활발 |

---

## 선택 가이드

### MySQL을 선택해야 할 때 ✓

1. **프로토타입 개발 및 MVP**
   - 빠른 개발 필요
   - 간단한 데이터 구조

2. **읽기 집약적 애플리케이션**
   - SNS 피드, 뉴스 포탈
   - 캐시 계층 (Redis) 사용

3. **작은 팀, 리소스 제한**
   - 학습 곡선이 낮음
   - 커뮤니티 지원 풍부
   - 저사양 서버에서 운영 가능

4. **웹 호스팅 환경**
   - 공유 호스팅에서 MySQL이 표준
   - WordPress, Drupal 등 레거시 시스템

### PostgreSQL을 선택해야 할 때 ✓

1. **엔터프라이즈급 애플리케이션**
   - 데이터 무결성이 critical
   - 금융, 의료, SaaS 서비스

2. **복잡한 쿼리가 많은 경우**
   - 분석 쿼리, 복합 JOIN
   - 고급 인덱싱 필요

3. **쓰기 작업이 빈번한 경우**
   - 로그 수집, 분석 플랫폼
   - 실시간 데이터 처리

4. **확장성이 중요한 경우**
   - 마이크로서비스 아키텍처
   - 클라우드 기반 SaaS
   - 멀티테넌트 시스템

5. **고급 기능 필요**
   - 복잡한 데이터 타입 (JSON, 배열, 범위 등)
   - 저장 프로시저 복잡도 높음
   - 트리거 활용 많음

---

## 마이그레이션 팁

### MySQL → PostgreSQL

**장점**:
- 더 강력한 데이터 무결성
- 쓰기 성능 향상
- 고급 기능 활용 가능

**고려사항**:
- SQL 문법 일부 다름 (AUTO_INCREMENT → SERIAL)
- 드라이버 변경 필요 (mysql → psycopg2 등)
- 데이터 타입 매핑 필요

### PostgreSQL → MySQL

**장점**:
- 단순화된 설정
- 커뮤니티 자료 풍부

**고려사항**:
- 고급 기능 손실 (MVCC, 복잡한 트리거 등)
- 성능 최적화 필요

---

## 결론

| 상황 | 추천 |
|------|------|
| 스타트업, 빠른 프로토타입 | MySQL |
| 중소 규모 웹 서비스 | MySQL |
| 읽기 위주 SNS, 포탈 | MySQL |
| 엔터프라이즈 애플리케이션 | PostgreSQL |
| 데이터 무결성 critical | PostgreSQL |
| 복잡한 쿼리, 분석 | PostgreSQL |
| 대규모 확장 필요 | PostgreSQL |
| 마이크로서비스 아키텍처 | PostgreSQL |

---

## 참고: 개발 환경 설정

### PostgreSQL 로컬 설정 (macOS + Homebrew)

```bash
# PostgreSQL 설치
brew install postgresql@17

# 서비스 시작
brew services start postgresql@17

# psql 접속
psql -U postgres

# 데이터베이스 생성
createdb -U postgres myapp_db

# 사용자 생성
createuser -U postgres -P app_user
```

### Node.js와의 연결

```javascript
// PostgreSQL (권장)
const { Client } = require('pg');
const client = new Client({
  user: 'app_user',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'myapp_db'
});

// MySQL
const mysql = require('mysql2/promise');
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'myapp_db'
});
```

---

**최종 조언**: 엔터프라이즈급 확장성과 고급 기능을 목표로 하는 프로젝트라면 PostgreSQL을 권장합니다. 특히 마이크로서비스 아키텍처와 클라우드 배포를 계획 중이라면 PostgreSQL의 MVCC, 고급 인덱싱, 확장성이 장기적으로 큰 이점을 제공합니다.