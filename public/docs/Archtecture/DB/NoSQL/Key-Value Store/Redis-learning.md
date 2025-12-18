# Redis 완벽 학습 가이드 - 개발자용

## 📚 목차
1. [Redis 소개](#1-redis-소개)
2. [설치 및 기본 설정](#2-설치-및-기본-설정)
3. [데이터 구조 및 명령어](#3-데이터-구조-및-명령어)
4. [String 타입](#4-string-타입)
5. [List 타입](#5-list-타입)
6. [Set 타입](#6-set-타입)
7. [Hash 타입](#7-hash-타입)
8. [Sorted Set 타입](#8-sorted-set-타입)
9. [Stream 타입](#9-stream-타입)
10. [메모리 관리 및 영속성](#10-메모리-관리-및-영속성)
11. [트랜잭션과 원자성](#11-트랜잭션과-원자성)
12. [Pub/Sub 메시징](#12-pubsub-메시징)
13. [클러스터와 확장성](#13-클러스터와-확장성)
14. [레플리케이션과 고가용성](#14-레플리케이션과-고가용성)
15. [모니터링과 디버깅](#15-모니터링과-디버깅)
16. [실전 응용 (10%)](#16-실전-응용-10)

---

## 1. Redis 소개

### 1.1 Redis란?

**Redis (REmote DIctionary Server)**는 인메모리 오픈소스 데이터 구조 저장소입니다.

**핵심 특징:**

- **극저지연**: 메모리 기반 저장으로 마이크로초 단위의 응답 시간
- **단순하고 강력한 명령어**: 직관적인 API로 학습 곡선 완만
- **다양한 데이터 구조**: 단순 String부터 복잡한 Stream까지
- **싱글 스레드**: 각 명령이 원자적(Atomic) 실행
- **오픈소스**: 무료, 활발한 커뮤니티, 지속적 업데이트

### 1.2 왜 Redis를 사용하는가?

```
전통 DB                        Redis
├─ 디스크 기반 (느림)           ├─ 메모리 기반 (빠름)
├─ 영구 저장 (안전)             ├─ 휘발성 (재시작 시 손실)
├─ 복잡한 쿼리 지원            └─ 간단하고 빠른 접근
└─ 낮은 처리량
```

### 1.3 Redis의 기본 동작 원리

```
1. 클라이언트가 명령 송신
2. Redis 단일 스레드가 순차적으로 처리
3. 메모리에서 즉시 실행
4. 결과 반환

결과: 마이크로초 단위 응답 시간
```

### 1.4 사용 사례별 특성

| 사용 사례 | 특징 | 메모리 요구도 |
|----------|------|-------------|
| **캐싱** | 빠른 조회 | 낮음 |
| **세션 저장** | 사용자 상태 | 중간 |
| **메시지 큐** | 이벤트 전파 | 중간 |
| **순위표** | 정렬된 데이터 | 낮음 |
| **실시간 분석** | 빠른 계산 | 높음 |

---

## 2. 설치 및 기본 설정

### 2.1 Redis 설치

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Windows (WSL 또는 Docker):**
```bash
# WSL 사용
wsl --install
sudo apt-get install redis-server

# 또는 Docker
docker run -d -p 6379:6379 redis:latest
```

### 2.2 Redis CLI 연결

```bash
# 기본 연결 (localhost:6379)
redis-cli

# 원격 서버 연결
redis-cli -h 192.168.1.100 -p 6379

# 암호 인증
redis-cli -h localhost -a "password"

# 명령 직접 실행
redis-cli SET mykey "Hello"
redis-cli GET mykey
```

### 2.3 Redis 설정 파일 (redis.conf)

```
# 주요 설정 항목

# 포트
port 6379

# 바인드 주소 (모든 인터페이스 수신)
bind 0.0.0.0

# 암호 설정
requirepass "your_password"

# 최대 메모리 (예: 1GB)
maxmemory 1gb

# 메모리 부족 시 정책
maxmemory-policy allkeys-lru

# 로그 레벨
loglevel notice

# 데이터베이스 개수 (기본 16개)
databases 16

# RDB 스냅샷 저장 규칙
save 900 1        # 900초 후 최소 1개 변경 있으면 저장
save 300 10       # 300초 후 최소 10개 변경 있으면 저장
save 60 10000     # 60초 후 최소 10000개 변경 있으면 저장

# AOF 활성화
appendonly no    # 나중에 yes로 변경 가능
```

### 2.4 Redis 성능 확인

```bash
# 기본 정보 확인
redis-cli INFO

# 지연시간 테스트
redis-cli --latency

# 처리량 테스트 (초당 명령어 수)
redis-benchmark -n 100000 -c 50
```

---

## 3. 데이터 구조 및 명령어

### 3.1 Redis 데이터 구조 개요

| 타입 | 설명 | 시간복잡도 | 사용 사례 |
|------|------|----------|---------|
| **String** | 단순 텍스트/숫자 저장 | O(1) | 캐시, 카운터 |
| **List** | 순서 있는 배열 | O(1) at head/tail | 메시지 큐, 타임라인 |
| **Set** | 중복 없는 모음 | O(1) avg | 멤버십, 태그 |
| **Hash** | 필드-값 쌍 모음 | O(1) | 객체 저장, 메타데이터 |
| **Sorted Set** | 점수 기반 정렬 | O(log N) | 순위표, 타임시리즈 |
| **Stream** | 로그 형식 | O(1) append | 이벤트 스트림 |
| **Bitmap** | 비트 연산 | O(N) | 토글 상태, 활동 추적 |
| **HyperLogLog** | 카디널리티 추정 | O(1) | 고유값 개수 추정 |

### 3.2 일반 명령어 (모든 타입)

```
# 키 존재 여부 확인
EXISTS key1 key2
→ 2 (두 키 모두 존재)

# 키 타입 확인
TYPE mykey
→ string / list / set / hash / zset / stream

# 키 삭제
DEL key1 key2 key3
→ 3 (삭제된 키 개수)

# 여러 키 삭제
UNLINK key1 key2  # DEL보다 빠름 (비동기)

# 모든 키 조회 (위험! 프로덕션에서 사용 금지)
KEYS *
KEYS user:*      # 패턴 매칭

# 키 만료 시간 설정 (초 단위)
EXPIRE mykey 3600         # 3600초 후 자동 삭제
PEXPIRE mykey 3600000    # 밀리초 단위

# 남은 만료 시간 확인 (초 단위, -1은 만료 없음)
TTL mykey
PTTL mykey              # 밀리초 단위

# 키 이름 변경
RENAME oldname newname

# 원자적 이름 변경 (새 이름이 존재하면 기존 덮어쓰기)
RENAMENX oldname newname

# 메모리 사용량 조회
MEMORY USAGE mykey
```

### 3.3 키 스캔 명령어 (KEYS 대신 사용)

```
# 기본 SCAN (모든 키 순회, 증분)
SCAN cursor [MATCH pattern] [COUNT count]

redis> SCAN 0
1) "13"      # 다음 cursor
2) 1) "key1"
   2) "key2"

redis> SCAN 13  # 이전 반환된 cursor 사용
1) "0"       # 0이면 순회 완료
2) 1) "key3"

# Set에서 구성원 스캔
SSCAN myset 0

# Hash에서 필드 스캔
HSCAN myhash 0

# Sorted Set에서 스캔
ZSCAN myzset 0
```

---

## 4. String 타입

### 4.1 String 기본 연산

```
# 문자열 저장
SET key value
SET key value EX 3600    # 3600초 TTL 지정
SET key value NX         # key가 없을 때만 저장
SET key value XX         # key가 있을 때만 저장

# 조회
GET key
→ "value"

# 여러 키 한 번에 저장/조회
MSET key1 val1 key2 val2 key3 val3
MGET key1 key2 key3
→ 1) "val1"
   2) "val2"
   3) "val3"

# 삭제
DEL key

# 존재하면 기존값 반환, 없으면 새로 저장
GETSET key newvalue

# 값이 없을 때만 저장하고 상태 반환
SETNX key value
→ 1 (저장됨) 또는 0 (이미 존재)

# 범위 조회 (문자열의 일부)
GETRANGE key 0 3
→ 첫 4자리 반환

# 문자열 길이
STRLEN key
```

### 4.2 String 숫자 연산

```
# 숫자 증가 (정수)
INCR counter
→ 1 (처음), 2, 3...

# 지정된 값만큼 증가
INCRBY counter 5
→ counter에 5 더함

# 부동소수점 증가
INCRBYFLOAT price 0.5
→ price에 0.5 더함

# 숫자 감소
DECR counter
→ counter에서 1 뺌

# 지정된 값만큼 감소
DECRBY counter 3
→ counter에서 3 뺌

# 활용: 조회수 증가
INCR article:123:views
```

### 4.3 String 문자열 연산

```
# 문자열 연결
APPEND key " additional"

# 예제
SET greeting "Hello"
APPEND greeting " World"
GET greeting
→ "Hello World"

# 부분 문자열 설정
SETRANGE key offset value

SET mystring "Hello World"
SETRANGE mystring 6 "Redis"
GET mystring
→ "Hello Redis"

# 비트 연산 (Bitmap으로 사용)
SETBIT key offset 1
GETBIT key offset
```

### 4.4 String 예제 시나리오

```
# 시나리오: 사용자 프로필 캐싱

# 1. 사용자 정보 저장 (JSON)
SET user:1001 '{"name":"John","age":30,"email":"john@example.com"}'
EXPIRE user:1001 3600  # 1시간 캐시

# 2. 조회
GET user:1001

# 3. 조회수 추적
INCR user:1001:views

# 4. 방문 카운트 확인
GET user:1001:views
→ "1547"

# 5. 원자적 업데이트 및 조회
GETSET user:1001 '{"name":"John","age":31,"email":"john@example.com"}'
→ 기존값 반환

# 6. 여러 사용자 정보 한 번에 가져오기
MGET user:1001 user:1002 user:1003
```

---

## 5. List 타입

### 5.1 List 기본 연산

```
# 리스트는 순서가 있는 배열 (중복 허용)
# 양쪽 끝(head/tail)에서 빠르게 추가/제거 가능

# 오른쪽에 추가 (tail)
RPUSH mylist "one" "two" "three"
→ 3 (리스트 길이)

# 왼쪽에 추가 (head)
LPUSH mylist "zero"
→ 4

# 값 나열
# mylist는 이제: ["zero", "one", "two", "three"]

# 리스트 조회 (범위)
LRANGE mylist 0 -1
→ 1) "zero"
   2) "one"
   3) "two"
   4) "three"

LRANGE mylist 0 1
→ 1) "zero"
   2) "one"

# 리스트 길이
LLEN mylist
→ 4

# 왼쪽에서 제거 및 반환
LPOP mylist
→ "zero"

# 오른쪽에서 제거 및 반환
RPOP mylist
→ "three"

# 여러 개 제거 (Redis 6.2+)
LPOP mylist 2
→ 1) "one"
   2) "two"
```

### 5.2 List 고급 연산

```
# 특정 인덱스 값 조회
LINDEX mylist 0
→ 인덱스 0의 요소

# 특정 인덱스에 값 설정
LSET mylist 1 "newvalue"

# 범위 외 요소 제거
LTRIM mylist 0 1
→ 인덱스 0-1만 유지, 나머지 삭제

# 값 찾기 (위치 반환)
LPOS mylist "one"
→ 1 (인덱스)

# 값 제거 (처음 N개만)
LREM mylist 1 "one"
→ 1 (제거된 개수)

# 리스트 A의 원소를 B로 이동
LMOVE lista listb LEFT RIGHT
```

### 5.3 List 블로킹 연산

```
# 리스트가 비어있으면 대기, 값이 추가되면 즉시 반환
BLPOP mylist timeout

예제:
# 터미널 1
redis> BLPOP mylist 10
(대기 중... 10초 타임아웃)

# 터미널 2 (다른 클라이언트)
redis> RPUSH mylist "value"

# 터미널 1 결과
1) "mylist"
2) "value"

# 오른쪽에서 블로킹 제거
BRPOP mylist 10

# 두 리스트를 모니터링
BLPOP list1 list2 10
→ list1 또는 list2에 값이 추가되면 반환

# 리스트 이동 (블로킹)
BRPOPLPUSH source dest 10
→ source 오른쪽에서 제거, dest 왼쪽에 추가
```

### 5.4 List 예제: 메시지 큐

```
# 메시지 생성자
RPUSH task:queue '{"id":1,"task":"process_payment"}'
RPUSH task:queue '{"id":2,"task":"send_email"}'

# 메시지 소비자
BLPOP task:queue 10
→ 1) "task:queue"
   2) '{"id":1,"task":"process_payment"}'

# 타임라인 구현
RPUSH user:1001:timeline '{"type":"like","post_id":123}'
RPUSH user:1001:timeline '{"type":"comment","post_id":456}'

# 최신 10개 조회
LRANGE user:1001:timeline 0 9

# 오래된 것 자동 삭제 (10개 초과)
LTRIM user:1001:timeline 0 9
```

---

## 6. Set 타입

### 6.1 Set 기본 연산

```
# Set: 중복 없는 모음, 순서 무관

# 구성원 추가
SADD myset "one" "two" "three"
→ 3 (추가된 개수)

# 이미 있는 것 추가 시도
SADD myset "one"
→ 0 (이미 존재)

# 모든 구성원 조회
SMEMBERS myset
→ 1) "one"
   2) "two"
   3) "three"

# 구성원 개수
SCARD myset
→ 3

# 구성원 존재 확인
SISMEMBER myset "one"
→ 1 (true)

SISMEMBER myset "four"
→ 0 (false)

# 구성원 제거
SREM myset "one"
→ 1

# 여러 구성원 제거
SREM myset "two" "three"
→ 2

# 임의 구성원 반환
SPOP myset
→ 해당 구성원 제거 후 반환

# 임의 구성원 조회만
SRANDMEMBER myset
→ 제거 없이 반환

# N개의 임의 구성원
SRANDMEMBER myset 2
→ 1) "member1"
   2) "member2"
```

### 6.2 Set 집합 연산

```
# 교집합 (두 Set의 공통 원소)
SINTER set1 set2
SINTER set1 set2 set3

# 교집합 결과를 새로운 Set에 저장
SINTERSTORE dest set1 set2

# 합집합 (모든 원소)
SUNION set1 set2
SUNIONSTORE dest set1 set2

# 차집합 (set1에만 있는 원소)
SDIFF set1 set2
SDIFFSTORE dest set1 set2

예제:
SADD set1 "a" "b" "c"
SADD set2 "b" "c" "d"

SINTER set1 set2
→ 1) "b"
   2) "c"

SUNION set1 set2
→ 1) "a"
   2) "b"
   3) "c"
   4) "d"

SDIFF set1 set2
→ 1) "a"
```

### 6.3 Set 응용

```
# 태그 기반 검색
# 게시물 123에 태그 추가
SADD post:123:tags "redis" "nosql" "database"
SADD post:456:tags "redis" "caching"

# 특정 태그의 게시물 찾기
SMEMBERS post:123:tags

# Redis 태그가 붙은 게시물 찾기 (역인덱싱)
SADD tag:redis:posts 123 456 789

# 사용자 팔로잉 시스템
SADD user:1:following 2 3 4
SADD user:2:following 1 3 5

# 공통 팔로우 찾기
SINTER user:1:following user:2:following
→ 공통으로 팔로우하는 사람들

# 유일한 방문자 추적
SADD date:2025-12-18:visitors "user1" "user2" "user3"
SADD date:2025-12-19:visitors "user2" "user3" "user4"

# 전체 고유 방문자
SUNION date:2025-12-18:visitors date:2025-12-19:visitors
```

---

## 7. Hash 타입

### 7.1 Hash 기본 연산

```
# Hash: 필드-값 쌍 모음 (객체와 유사)

# 필드 설정
HSET myhash field1 "value1"
→ 1 (새로 추가)

# 여러 필드 설정
HSET myhash field2 "value2" field3 "value3"
→ 2

# 필드 값 조회
HGET myhash field1
→ "value1"

# 여러 필드 값 조회
HMGET myhash field1 field2 field3
→ 1) "value1"
   2) "value2"
   3) "value3"

# 모든 필드-값 조회
HGETALL myhash
→ 1) "field1"
   2) "value1"
   3) "field2"
   4) "value2"
   5) "field3"
   6) "value3"

# 모든 필드 이름
HKEYS myhash
→ 1) "field1"
   2) "field2"
   3) "field3"

# 모든 값
HVALS myhash
→ 1) "value1"
   2) "value2"
   3) "value3"

# 필드 개수
HLEN myhash
→ 3

# 필드 존재 확인
HEXISTS myhash field1
→ 1 (true)

# 필드 삭제
HDEL myhash field1
→ 1

# 필드 값 길이
HSTRLEN myhash field2
→ 6
```

### 7.2 Hash 숫자 연산

```
# 필드 값에 정수 더하기
HINCRBY myhash counter 1

# 필드 값에 부동소수점 더하기
HINCRBYFLOAT myhash price 9.99

예제:
HSET user:1001 name "John" age 30 balance 100.50

# 나이 증가
HINCRBY user:1001 age 1
→ 31

# 잔액 증가
HINCRBYFLOAT user:1001 balance 50.25
→ 150.75
```

### 7.3 Hash 예제: 사용자 객체 저장

```
# 사용자 정보 저장
HSET user:1001 \
  name "John Doe" \
  email "john@example.com" \
  age 30 \
  country "USA" \
  created_at "2025-01-01" \
  is_active 1

# 전체 정보 조회
HGETALL user:1001

# 특정 필드만 조회
HGET user:1001 name
HGET user:1001 email

# 여러 필드 조회
HMGET user:1001 name email age

# 필드 목록
HKEYS user:1001

# 나이 증가
HINCRBY user:1001 age 1

# 이메일 업데이트
HSET user:1001 email "newemail@example.com"

# 전체 삭제
DEL user:1001

# 특정 필드 삭제
HDEL user:1001 age country
```

### 7.4 Hash vs String (JSON) 비교

```
# String 방식 (JSON)
SET user:1001 '{"name":"John","age":30,"email":"john@example.com"}'

장점: 복잡한 구조 표현 가능
단점: 일부 필드 업데이트 시 전체 가져오기/저장 필요

# Hash 방식
HSET user:1001 name "John" age 30 email "john@example.com"

장점: 개별 필드 효율적 업데이트, 부분 조회 가능
단점: 중첩된 구조 어려움

→ 선택: 자주 업데이트되는 평면 데이터 → Hash
         복잡한 중첩 구조 → String (JSON)
```

---

## 8. Sorted Set 타입

### 8.1 Sorted Set 기본 연산

```
# Sorted Set: Set + 각 원소에 점수(score) 부여
# 점수로 자동 정렬됨

# 멤버 추가 (점수 포함)
ZADD myzset 1 "one" 2 "two" 3 "three"
→ 3

# 멤버와 점수 조회 (오름차순)
ZRANGE myzset 0 -1
→ 1) "one"
   2) "two"
   3) "three"

# 멤버와 점수 함께 조회
ZRANGE myzset 0 -1 WITHSCORES
→ 1) "one"
   2) "1"
   3) "two"
   4) "2"
   5) "three"
   6) "3"

# 역순 조회 (내림차순)
ZREVRANGE myzset 0 -1 WITHSCORES
→ 1) "three"
   2) "3"
   3) "two"
   4) "2"
   5) "one"
   6) "1"

# 세트 크기
ZCARD myzset
→ 3

# 점수 범위로 조회
ZRANGEBYSCORE myzset 1 2
→ 1) "one"
   2) "two"

# 역순 점수 범위
ZREVRANGEBYSCORE myzset 3 1
→ 1) "three"
   2) "two"
   3) "one"

# 점수 범위 개수
ZCOUNT myzset 1 2
→ 2

# 특정 멤버의 점수
ZSCORE myzset "two"
→ "2"

# 특정 멤버의 순위 (0부터 시작)
ZRANK myzset "two"
→ 1

# 역순 순위
ZREVRANK myzset "two"
→ 1

# 멤버 제거
ZREM myzset "one"
→ 1

# 범위로 제거
ZREMRANGEBYRANK myzset 0 1
→ 점수 0-1의 원소 제거
```

### 8.2 Sorted Set 점수 연산

```
# 점수 증가
ZINCRBY myzset 10 "member"
→ 기존 점수에 10 더함

# 활용: 사용자 점수
ZADD user:scores 100 "user1"
ZADD user:scores 150 "user2"

# 사용자1 점수 50 증가
ZINCRBY user:scores 50 "user1"

# 최신 순위
ZREVRANGE user:scores 0 -1 WITHSCORES
```

### 8.3 Sorted Set 범위 연산

```
# 점수 범위로 제거
ZREMRANGEBYSCORE myzset 1 2
→ 점수 1-2 사이 모두 삭제

# 개수로 제거
ZREMRANGEBYRANK myzset 0 1
→ 첫 2개 (인덱스 0-1) 삭제

# 점수 범위로 개수 반환
ZCOUNT myzset -inf +inf
→ 모든 멤버

ZCOUNT myzset (1 2
→ 1과 2 사이 (1은 제외)

# 렉시콜로그 범위 조회 (문자 기반 정렬)
# 점수가 같을 때 사용
ZRANGEBYLEX myzset - +
```

### 8.4 Sorted Set 예제: 순위표

```
# 게임 점수 추적
ZADD leaderboard 1000 "player1"
ZADD leaderboard 1500 "player2"
ZADD leaderboard 1200 "player3"

# 상위 10명
ZREVRANGE leaderboard 0 9 WITHSCORES

# 특정 플레이어 순위
ZREVRANK leaderboard "player2"
→ 0 (1위)

# 특정 플레이어 점수
ZSCORE leaderboard "player2"
→ "1500"

# 플레이어 점수 업데이트
ZINCRBY leaderboard 100 "player1"

# 1000-1200 점 사이 플레이어
ZRANGEBYSCORE leaderboard 1000 1200

# 예제: 실시간 조회수
ZADD trending:posts 1000 "post:123" 2000 "post:456" 500 "post:789"

# 인기 게시물 상위 5개
ZREVRANGE trending:posts 0 4 WITHSCORES

# 조회수 증가
ZINCRBY trending:posts 10 "post:123"
```

---

## 9. Stream 타입

### 9.1 Stream 기본 개념

```
# Stream: 시간 기반 로그 구조의 데이터
# 메시지 큐 + 영구 저장소
# 각 항목은 자동 생성된 ID로 식별

구조:
Stream = {
  ID1: {field1: value1, field2: value2, ...},
  ID2: {field1: value1, field2: value2, ...},
  ID3: {field1: value1, field2: value2, ...},
}

ID 형식: timestamp-sequence
예: 1734510000000-0 (타임스탬프-시퀀스)
```

### 9.2 Stream 기본 연산

```
# 메시지 추가 (ID 자동 생성)
XADD mystream * field1 value1 field2 value2
→ 1734510000000-0

# 명시적 ID 지정
XADD mystream 1000-0 field1 value1
→ 1000-0

# 생성된 ID 포함 메시지 추가
XADD orders * order_id 12345 status "pending"
→ 1734510100000-0

# 스트림 길이
XLEN mystream
→ 3

# 범위 조회 (오름차순)
XRANGE mystream - +
→ 모든 항목

XRANGE mystream 1734510000000-0 1734510100000-0
→ 범위 내 항목

# 역순 조회
XREVRANGE mystream + -
→ 최신 항목부터

# 최신 N개 항목
XREVRANGE mystream + - COUNT 10

# 특정 ID 이후 항목 조회
XRANGE mystream (1734510000000-0 +
→ 1734510000000-0 제외하고 이후 항목
```

### 9.3 Stream 읽기 연산

```
# 새 항목 읽기 (블로킹)
XREAD BLOCK 1000 STREAMS mystream $
→ $ = 최신 ID (새로운 것 기다림)

# 특정 ID 이후 읽기
XREAD STREAMS mystream 1734510000000-0

# 여러 스트림 모니터링
XREAD STREAMS stream1 stream2 0 0

# Consumer Group (여러 소비자)
# 그룹 생성
XGROUP CREATE mystream mygroup $ MKSTREAM
→ $ = 미처리 메시지부터 시작

# Consumer Group에서 읽기
XREADGROUP GROUP mygroup consumer1 BLOCK 1000 STREAMS mystream >
→ > = 미처리 메시지

# 메시지 처리 완료 (acknowledge)
XACK mystream mygroup 1734510000000-0
```

### 9.4 Stream 예제: 주문 처리

```
# 주문 추가
XADD orders * \
  order_id "ORD-123" \
  customer_id "CUST-001" \
  amount 150.50 \
  status "pending" \
  created_at "2025-12-18T09:00:00Z"
→ 1734510000000-0

# 또 다른 주문
XADD orders * \
  order_id "ORD-124" \
  customer_id "CUST-002" \
  amount 250.00 \
  status "pending"
→ 1734510001000-0

# 모든 주문 조회
XRANGE orders - +

# 최근 5개 주문
XREVRANGE orders + - COUNT 5

# Consumer Group 설정 (주문 처리 팀)
XGROUP CREATE orders order_processing $ MKSTREAM

# 주문 처리 워커 (처리 대기 중)
XREADGROUP GROUP order_processing worker1 BLOCK 0 STREAMS orders >

# 주문 처리 완료
XACK orders order_processing 1734510000000-0

# 처리되지 않은 주문 확인
XPENDING orders order_processing
```

---

## 10. 메모리 관리 및 영속성

### 10.1 메모리 사용량 모니터링

```
# 전체 메모리 정보
INFO memory

# 특정 키의 메모리 사용량
MEMORY USAGE mykey
→ 바이트 단위 반환

# 메모리 상태
MEMORY STATS
→ 세부 메모리 분석

# 메모리 부족 경고 설정
CONFIG SET maxmemory 1gb

# 현재 메모리 확인
INFO memory
→ used_memory: 바이트 단위
→ used_memory_human: 읽기 쉬운 형식
```

### 10.2 메모리 정책 (Eviction Policy)

```
# 메모리 한계 도달 시 정책 설정
CONFIG SET maxmemory-policy {policy}

정책 옵션:

1. noeviction (기본값)
   → 메모리 부족 시 에러 반환, 데이터 제거 안 함

2. volatile-lru
   → TTL 설정된 키 중 최근 사용 안 한 것부터 제거

3. volatile-lfu
   → TTL 설정된 키 중 사용 빈도 낮은 것부터 제거

4. volatile-ttl
   → TTL 설정된 키 중 남은 시간 짧은 것부터 제거

5. volatile-random
   → TTL 설정된 키 중 랜덤으로 제거

6. allkeys-lru
   → 모든 키 중 최근 사용 안 한 것부터 제거

7. allkeys-lfu
   → 모든 키 중 사용 빈도 낮은 것부터 제거

8. allkeys-random
   → 모든 키 중 랜덤으로 제거

추천:
- 캐시 용도: allkeys-lru
- TTL 있는 데이터: volatile-lru
- 저장 필수: noeviction
```

### 10.3 TTL (만료 시간) 관리

```
# 키 만료 시간 설정
EXPIRE key seconds
PEXPIRE key milliseconds

# 시간으로 만료 설정
EXPIREAT key timestamp
PEXPIREAT key timestamp_millis

# 남은 시간 확인
TTL key
→ 남은 초 반환, -1 = 만료 없음, -2 = 키 없음

PTTL key
→ 밀리초 단위

# 만료 제거 (영구 보관)
PERSIST key

# 활용 패턴
SETEX key 3600 value
→ 3600초 TTL과 함께 저장

예제:
# 세션 저장 (1시간 유효)
SET session:abc123 '{"user_id":1001}' EX 3600

# 또는
SET session:abc123 '{"user_id":1001}'
EXPIRE session:abc123 3600

# 남은 시간 확인
TTL session:abc123
→ 2500 (약 40분 남음)

# 영구 보관으로 변경
PERSIST session:abc123
```

### 10.4 RDB (스냅샷) 영속성

```
# RDB 스냅샷: 특정 시점의 메모리 상태를 파일로 저장

설정 (redis.conf):
save 900 1       # 900초(15분) 후 1개 이상 변경 시 저장
save 300 10      # 300초(5분) 후 10개 이상 변경 시 저장
save 60 10000    # 60초 후 10000개 이상 변경 시 저장

# 명령어
SAVE
→ 동기 저장 (블로킹, 느림, 프로덕션 권장 안 함)

BGSAVE
→ 백그라운드 저장 (권장)

# 마지막 저장 시간
LASTSAVE
→ Unix 타임스탬프 반환

# RDB 파일 위치 (기본)
/var/lib/redis/dump.rdb

장점:
- 빠른 로드
- 전체 데이터 스냅샷

단점:
- 마지막 저장 이후 데이터 손실 가능
```

### 10.5 AOF (Append-Only File) 영속성

```
# AOF: 모든 쓰기 명령어를 파일에 기록

설정 (redis.conf):
appendonly yes
appendfsync everysec   # 매초 디스크에 동기화

appendfsync 옵션:
- always: 매 명령마다 디스크 동기화 (느림, 안전함)
- everysec: 매초 동기화 (권장)
- no: OS가 결정 (빠르지만 위험)

# AOF 파일 위치
/var/lib/redis/appendonly.aof

# AOF 파일 압축 (리라이트)
BGREWRITEAOF
→ 같은 결과의 더 짧은 명령어로 압축

# AOF 상태 확인
INFO persistence

장점:
- 모든 쓰기 작업 기록
- 데이터 손실 최소화

단점:
- 파일 크기 커짐
- 로드 시간 느림
```

### 10.6 RDB + AOF 함께 사용

```
# 두 방식 동시 활성화 (권장)

redis.conf:
save 900 1              # RDB 설정
appendonly yes          # AOF 활성화
appendfsync everysec    # 매초 동기화

복구 우선순위:
1. AOF 파일 로드 (더 최신)
2. RDB 파일 로드

실제 권장 설정:
- 개발: appendonly no (빠름)
- 스테이징: appendonly yes, everysec
- 프로덕션: appendonly yes, always (또는 everysec)
```

---

## 11. 트랜잭션과 원자성

### 11.1 MULTI/EXEC 트랜잭션

```
# MULTI: 트랜잭션 시작
MULTI
→ OK

# 명령어들 (큐에 저장, 실행 안 함)
SET key1 value1
→ QUEUED

INCR counter
→ QUEUED

# EXEC: 트랜잭션 실행
EXEC
→ 1) OK
   2) 1

특징:
- 모든 명령이 순차적으로 실행
- 다른 클라이언트 명령 끼어들 수 없음 (원자성)
- 중간에 에러 발생 시에도 나머지 계속 실행

예제:
MULTI
SET balance:user1 100
SET balance:user2 200
INCR counter
EXEC

# 트랜잭션 취소
DISCARD
→ 큐된 명령 모두 취소
```

### 11.2 WATCH를 사용한 낙관적 잠금

```
# WATCH: 키 변경 감시 (Check-and-Set)

# 시나리오: 계좌 이체
GET balance:user1
→ 100

# 다른 클라이언트가 변경할 수 있으므로 WATCH 사용
WATCH balance:user1

MULTI
DECRBY balance:user1 50  # user1에서 50 출금
INCRBY balance:user2 50  # user2에 50 입금
EXEC
→ balance:user1이 변경되지 않으면 성공
→ 변경되었으면 nil 반환 (트랜잭션 실패)

# 재시도
if exec_result is nil:
    재시도()

여러 키 감시:
WATCH key1 key2 key3

감시 해제:
UNWATCH
```

### 11.3 Lua 스크립트를 사용한 원자성

```
# Lua: 서버 측에서 실행되는 원자적 스크립트

# 스크립트 실행
EVAL "return redis.call('SET', 'key', 'value')" 0

# 키와 인자 전달
EVAL "
return redis.call('HMSET', KEYS[1], 'field1', ARGV[1], 'field2', ARGV[2])
" 1 user:1001 John 30

# 자주 사용하는 스크립트는 로드
SCRIPT LOAD "return redis.call('GET', 'key')"
→ SHA1 해시 반환

# 해시로 실행 (빠름)
EVALSHA {SHA1} 0

예제: 조회수 증가 (유효성 검사 포함)
EVAL "
if redis.call('EXISTS', KEYS[1]) == 1 then
  redis.call('INCR', KEYS[1])
  return redis.call('GET', KEYS[1])
else
  return -1
end
" 1 article:123:views

Lua 주의사항:
- redis.call()과 redis.pcall() (에러 처리)
- 스크립트는 원자적이지만 롤백 불가능
- 실패한 작업은 되돌려지지 않음
```

### 11.4 트랜잭션 에러 처리

```
# 문법 에러 (QUEUED 전)
MULTI
SET key value
INCR key  # 문자열에 INCR → 에러
EXEC
→ EXECABORT (트랜잭션 전체 중단)

# 실행 에러 (EXEC 후)
MULTI
SET counter "abc"
INCR counter  # 나중에 실행, 에러 반영
EXEC
→ 1) OK
   2) (error) ...
   → 첫 명령은 성공, 두 번째는 에러
   → 다른 명령은 계속 실행됨

권장: 클라이언트에서 에러 처리
EXEC 결과 배열을 순회하며 각 결과 확인
```

---

## 12. Pub/Sub 메시징

### 12.1 Pub/Sub 기본 개념

```
# Pub/Sub: 발행-구독 패턴 (메시지 브로드캐스트)

Publisher                   Channel              Subscribers
(발행자)                    (채널)              (구독자들)
   ↓                         ↓                    ↓
PUBLISH order:12345    ←→ order:12345      ← SUBSCRIBE
   메시지 발행               (메모리)          실시간 수신

특징:
- 메시지 저장 안 함 (구독자 있을 때만 전달)
- Fire-and-Forget (발행 후 기억 안 함)
- 극저지연
- 구독자 없으면 메시지 손실
```

### 12.2 PUBLISH 명령어

```
# 채널에 메시지 발행
PUBLISH channel message
→ 구독자 수 반환

PUBLISH news "Breaking news!"
→ 3 (3명의 구독자에게 전달)

PUBLISH order:12345 '{"status":"shipped","timestamp":"2025-12-18T09:30:00Z"}'
→ 주문 업데이트 알림
```

### 12.3 SUBSCRIBE 명령어

```
# 채널 구독 (메시지 수신)
SUBSCRIBE channel1 channel2

SUBSCRIBE news alerts
→ 두 채널의 모든 메시지 수신

# 수신한 메시지 형식
1) "subscribe"           # 구독 확인
   "channel"
   1
2) "message"             # 실제 메시지
   "news"
   "Breaking news!"
3) "message"
   "alerts"
   "Alert message"

# 구독 모드 종료
Ctrl+C (클라이언트 종료)

# 또는 다른 클라이언트에서
UNSUBSCRIBE channel1
```

### 12.4 패턴 기반 구독

```
# PSUBSCRIBE: 패턴 매칭으로 구독

PSUBSCRIBE news:*
→ news:sports, news:politics, news:technology 모두 수신

PSUBSCRIBE user:*:notification
→ user:1001:notification, user:1002:notification, ...

패턴 예제:
*           # 모든 채널
order:*     # order: 로 시작
*:alert     # :alert 로 끝남
news:*:*    # news:로 시작해서 2단계 구조

# 패턴 구독 해제
PUNSUBSCRIBE news:*
```

### 12.5 Pub/Sub 예제

```
# 시나리오: 실시간 주문 상태 알림

# Publisher (백엔드)
# 주문 처리 → 상태 변경 → 메시지 발행

PUBLISH order:12345 '{"status":"processing","timestamp":"2025-12-18T09:00:00"}'
PUBLISH order:12345 '{"status":"shipped","timestamp":"2025-12-18T09:30:00"}'
PUBLISH order:12345 '{"status":"delivered","timestamp":"2025-12-18T15:00:00"}'

# Subscriber (클라이언트)
SUBSCRIBE order:12345

→ 실시간으로 주문 상태 업데이트 받음

# 다중 채널 구독
SUBSCRIBE \
  order:12345 \
  order:12346 \
  notifications:user1

→ 여러 주문과 알림 동시 수신

# 패턴 기반 (모든 주문 모니터링)
PSUBSCRIBE order:*
```

### 12.6 Pub/Sub 주의사항

```
# 문제 1: 구독자 없을 때 메시지 손실
PUBLISH test "hello"
→ 0 (구독자 없음)
→ 메시지 손실됨

# 해결: Redis Streams 사용 (메시지 저장)

# 문제 2: 구독자 접속 끊김
SUBSCRIBE channel
→ 연결 끊김
→ 그 동안 받지 못한 메시지 복구 불가

# 해결: 메시지 큐 + DB 백업 전략

# 문제 3: Pub/Sub는 클러스터에서 특별 처리 필요
Redis Cluster에서는 같은 노드의 구독자만 수신
→ 클러스터 환경에서는 Streams 권장
```

---

## 13. 클러스터와 확장성

### 13.1 Redis 클러스터 개념

```
# 클러스터: 여러 Redis 인스턴스로 데이터 분산

싱글 인스턴스:
┌──────────────────┐
│  Redis Server    │
│ (모든 데이터)    │
└──────────────────┘
문제: 메모리 용량 제한, SPOF

클러스터 (6개 노드):
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Node 1  │  │ Node 2  │  │ Node 3  │
│(Master) │  │(Master) │  │(Master) │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
┌────┴────┐  ┌────┴────┐  ┌────┴────┐
│ Replica │  │ Replica │  │ Replica │
│ Node 1' │  │ Node 2' │  │ Node 3' │
└─────────┘  └─────────┘  └─────────┘

각 노드: 해시슬롯의 일부 담당
자동 페일오버 지원
```

### 13.2 해시슬롯과 키 분배

```
# Redis 클러스터: 16384개의 해시슬롯

슬롯 분배 예제 (3개 마스터):
Node 1: 슬롯 0-5460
Node 2: 슬롯 5461-10922
Node 3: 슬롯 10923-16383

키 배치 방식:
slot = CRC16(key) % 16384

예:
key "user:1001"
→ CRC16("user:1001") = 12345
→ 12345 % 16384 = 12345
→ Node 3에 저장 (10923-16383 범위)

# 관련 키를 같은 슬롯에 배치 (해시태그)
{user:1001}:profile
{user:1001}:settings
{user:1001}:preferences
→ {} 내부만 사용해서 같은 슬롯에 배치
```

### 13.3 클러스터 명령어

```
# 클러스터 정보
CLUSTER INFO
→ cluster_state, cluster_slots_assigned, ...

# 노드 정보
CLUSTER NODES
→ 모든 노드의 상태, ID, 슬롯 범위

# 특정 키의 슬롯 확인
CLUSTER KEYSLOT mykey
→ 12345

# 슬롯의 키 개수
CLUSTER COUNTKEYSINSLOT 12345
→ 1000

# 슬롯의 모든 키 조회
CLUSTER GETKEYSINSLOT 12345 10
→ 최대 10개 키 반환
```

### 13.4 클러스터의 제한사항

```
# 1. 멀티 키 트랜잭션
# 같은 슬롯의 키만 가능

MULTI
SET {user:1001}:name "John"      # 같은 슬롯
SET {user:1001}:email "john@..." # 같은 슬롯
EXEC
→ 성공

SET key1 value1      # 다른 슬롯
SET key2 value2      # 다른 슬롯
EXEC
→ 실패 (CROSSSLOT)

# 2. Pub/Sub 제한
# 같은 노드에 연결된 구독자만 수신
→ Redis Streams 권장

# 3. KEYS 명령 사용 불가
# 여러 노드에 분산된 키 조회 복잡
→ SCAN 사용

해결 방법:
- 관련 키 해시태그로 묶기: {prefix}:key1, {prefix}:key2
- 응용에서 키 그룹화
- Streams 사용 (클러스터 친화적)
```

---

## 14. 레플리케이션과 고가용성

### 14.1 Master-Slave 레플리케이션

```
# 레플리케이션: 마스터의 데이터를 슬레이브에 복사

Master (쓰기)     Slave 1 (읽기만)
  ↓                ↓
모든 데이터      모든 데이터 복사
 변경 발생         자동 동기화
  ↓                ↓
Slave 2 (읽기만)  Slave 3 (읽기만)
  ↓                ↓
모든 데이터      모든 데이터 복사
 자동 동기화      자동 동기화

장점:
- 읽기 성능 향상 (슬레이브에서 읽기)
- 고가용성 (마스터 장애 시 슬레이브 승격)
- 백업 (슬레이브에서 스냅샷)
```

### 14.2 레플리케이션 설정

```
# Slave 설정 (redis.conf)
replicaof master_ip master_port

또는 명령어로:
REPLICAOF master_ip master_port

마스터가 암호로 보호되면:
masterauth password

# 마스터 정보 확인
INFO replication

# 레플리케이션 중단
REPLICAOF NO ONE
```

### 14.3 비동기 레플리케이션

```
# Redis 레플리케이션은 비동기 방식

클라이언트              Master           Slave
   ↓                    ↓               ↓
SET key value      저장 후 즉시   비동기로 복제
   ↓                 반환(O)     (약간의 지연)
응답 받음            ↓            ↓
                  변경 스트림    수신 후 저장
                  전송 시작

결과: 마스터와 슬레이브에 일시적 데이터 불일치 가능

마스터 장애 시 최종 변경 손실 가능 → Sentinel로 개선
```

### 14.4 Sentinel을 사용한 자동 페일오버

```
# Sentinel: 마스터 상태 모니터링 및 자동 페일오버

구조:
┌──────────────┐
│   Sentinel   │ (마스터 감시)
│  Sentinel    │
│  Sentinel    │
└──────────────┘
      ↓
┌────────────────────────────────┐
│ Master (다운)  → 감지 → Slave 승격
│ Slave 1        ← 새 마스터
│ Slave 2
└────────────────────────────────┘

설정 (sentinel.conf):
sentinel monitor mymaster 127.0.0.1 6379 2
→ mymaster 마스터 감시, quorum 2

sentinel down-after-milliseconds mymaster 30000
→ 30초 응답 없으면 다운 판정

sentinel parallel-syncs mymaster 1
→ 동시에 몇 개 슬레이브 동기화

# Sentinel 실행
redis-sentinel sentinel.conf
```

---

## 15. 모니터링과 디버깅

### 15.1 INFO 명령어

```
# Redis 상태 정보 조회

INFO
→ 모든 섹션

INFO server
→ Redis 버전, 포트, 프로세스 ID

INFO clients
→ 연결된 클라이언트 수, 메모리 사용

INFO memory
→ 메모리 사용량, 피크, 정책

INFO stats
→ 총 연결 수, 명령 처리 수

INFO replication
→ 마스터/슬레이브 상태

INFO keyspace
→ 데이터베이스별 키 개수

INFO cpu
→ CPU 사용률

# 실시간 모니터링
MONITOR
→ 모든 명령어 실시간 표시
→ Ctrl+C로 종료
```

### 15.2 명령어 성능 분석

```
# 느린 명령어 로그
SLOWLOG GET 10
→ 최근 10개 느린 명령어

→ 1) ID
   2) 타임스탬프
   3) 실행 시간 (마이크로초)
   4) 명령어와 인자
   5) 클라이언트 주소

# 느린 쿼리 임계값 설정
CONFIG SET slowlog-log-slower-than 10000
→ 10ms 이상 걸리는 명령 기록

# 느린 로그 개수 제한
CONFIG SET slowlog-max-len 128

# 느린 로그 초기화
SLOWLOG RESET
```

### 15.3 클라이언트 정보

```
# 연결된 클라이언트 목록
CLIENT LIST
→ 각 클라이언트 상세 정보
   - ID, 주소, 포트
   - 상태, 입력/출력 버퍼
   - 연결 시간

# 클라이언트 이름 설정
CLIENT SETNAME myclient

# 클라이언트 이름 조회
CLIENT GETNAME

# 특정 클라이언트 강제 연결 해제
CLIENT KILL 127.0.0.1:6379

# 모니터링 클라이언트 비활성화
CLIENT PAUSE 1000
→ 1000ms 동안 모든 명령 일시 중단
```

### 15.4 메모리 분석

```
# 메모리 사용 요약
MEMORY STATS

# 각 키의 메모리 사용
MEMORY DOCTOR
→ 메모리 사용 리포트

# 특정 키 메모리
MEMORY USAGE mykey

# 메모리 최적화 팁
- 짧은 키 이름 사용
- 적절한 데이터 구조 선택
- TTL 설정으로 오래된 데이터 자동 삭제
- String 보다 Hash 사용 (객체의 경우)
```

### 15.5 실시간 디버깅

```
# 특정 채널 모니터링
MONITOR

# 명령어 추적
→ 모든 명령어와 인자 실시간 표시

예시:
1387262274.313945 [0 127.0.0.1:52531] "SET" "key" "value"
1387262274.314104 [0 127.0.0.1:52531] "GET" "key"

# 채널 활동 모니터링
SUBSCRIBE mychannel

# 패턴 매칭 모니터링
PSUBSCRIBE order:*

# 나가는 트래픽 모니터링
DEBUG OBJECT mykey
→ 인코딩, 메모리, 접근 패턴
```

---

## 16. 실전 응용 (10%)

### 16.1 주문-채팅 시스템

```
# 주문별 실시간 채팅방

# 주문 생성 시 채팅방 생성
ZADD order:123:chat:messages \
  {timestamp} '{message_json}'

# 채팅 메시지 발행
PUBLISH order:123:chat '{message_json}'

# 구독자들이 실시간 수신
SUBSCRIBE order:123:chat

# 참여자 관리
SADD order:123:chat:participants user_1 user_2
SMEMBERS order:123:chat:participants
```

### 16.2 캐싱 전략

```
# Cache-Aside 패턴

if cache.exists("user:1001"):
    return cache.get("user:1001")
else:
    user = db.query("SELECT * FROM users WHERE id=1001")
    cache.set("user:1001", json.dumps(user), ex=3600)
    return user

# Redis 코드
GET user:1001
→ 캐시 히트

→ 캐시 미스 시:
SET user:1001 '{"id":1001,"name":"John"}' EX 3600
```

### 16.3 세션 관리

```
# 사용자 세션 저장

SET session:abc123 \
  '{"user_id":1001,"login_time":"2025-12-18T09:00:00"}' \
  EX 86400

# 세션 확인
GET session:abc123

# 세션 연장
EXPIRE session:abc123 86400
```

### 16.4 카운터와 통계

```
# 페이지 조회수
INCR page:123:views

# 일일 방문자
SADD date:2025-12-18:visitors user_1 user_2 user_3

# 순위표
ZADD game:scores 1000 "player1" 1500 "player2"
ZREVRANGE game:scores 0 9 WITHSCORES
```

---

## 빠른 참조표

### 시간복잡도 정리

| 연산 | String | List | Set | Hash | Sorted Set | Stream |
|-----|--------|------|-----|------|-----------|---------|
| GET/SET | O(1) | O(1) head/tail | O(1) | O(1) | O(log N) | O(1) |
| RANGE | O(1) | O(N) | - | - | O(log N + M) | O(N) |
| DELETE | O(1) | O(1) | O(1) | O(1) | O(log N) | O(1) |
| INCR | O(1) | - | - | O(1) | - | - |
| SORT | - | O(N log N) | O(N log N) | - | Built-in | - |

### 선택 가이드

| 사용 사례 | 추천 타입 | 이유 |
|---------|---------|------|
| 캐시 | String | 빠른 조회 |
| 메시지 큐 | List | BLPOP으로 소비자 기다림 |
| 멤버십 | Set | 중복 제거, 교집합 |
| 객체 저장 | Hash | 개별 필드 업데이트 |
| 순위표 | Sorted Set | 자동 정렬 |
| 이벤트 로그 | Stream | 영구 저장, 재처리 |
| 실시간 알림 | Pub/Sub | 극저지연 |

---

## 공식 자료

- Redis 공식 문서: https://redis.io/documentation
- Redis 커뮤니티 포럼: https://redis.io/community
- Redis GitHub: https://github.com/redis/redis
- Redis 명령어 레퍼런스: https://redis.io/commands