# Redis 심화 학습 가이드 - 클러스터 & Geo 명령어

## 📚 목차
1. [Redis 클러스터 개요](#1-redis-클러스터-개요)
2. [클러스터 기본 개념](#2-클러스터-기본-개념)
3. [해시슬롯과 키 분배](#3-해시슬롯과-키-분배)
4. [클러스터 설치 및 구성](#4-클러스터-설치-및-구성)
5. [클러스터 명령어](#5-클러스터-명령어)
6. [슬롯 마이그레이션 (Resharding)](#6-슬롯-마이그레이션-resharding)
7. [클러스터 페일오버](#7-클러스터-페일오버)
8. [클러스터 토폴로지 관리](#8-클러스터-토폴로지-관리)
9. [Redis Geo 명령어 소개](#9-redis-geo-명령어-소개)
10. [Geo 기본 연산](#10-geo-기본-연산)
11. [Geo 거리 계산](#11-geo-거리-계산)
12. [Geo 범위 검색](#12-geo-범위-검색)
13. [Geo 고급 기능](#13-geo-고급-기능)
14. [실전 응용 예제](#14-실전-응용-예제)
15. [클러스터 운영 팁](#15-클러스터-운영-팁)

---

## 1. Redis 클러스터 개요

### 1.1 클러스터가 필요한 이유

```
싱글 인스턴스 한계:

문제 1: 메모리 제한
├─ 싱글 서버의 물리적 메모리로 제한
└─ 대용량 데이터 저장 불가능

문제 2: 처리량 제한
├─ 싱글 스레드 처리
└─ 동시성 확장 어려움

문제 3: 가용성 문제
├─ 서버 장애 = 전체 서비스 중단
└─ SPOF (Single Point Of Failure)

해결책: Redis 클러스터
└─ 여러 인스턴스로 데이터 분산
└─ 수평 확장 가능
└─ 자동 페일오버 지원
```

### 1.2 클러스터 vs Sentinel

```
Redis Sentinel:
├─ 마스터-슬레이브 구조 유지
├─ 자동 페일오버 제공
└─ 읽기만 확장 가능 (쓰기는 마스터 1개)

Redis Cluster:
├─ 데이터 샤딩으로 저장소 확장
├─ 자동 페일오버
├─ 읽기/쓰기 모두 확장
└─ 더 복잡하지만 확장성 우수
```

---

## 2. 클러스터 기본 개념

### 2.1 클러스터 구조

```
물리 구성:

Master Node 1          Master Node 2          Master Node 3
├─ Slot: 0-5460        ├─ Slot: 5461-10922    ├─ Slot: 10923-16383
└─ 1KB-1MB 데이터      └─ 1MB-2MB 데이터      └─ 2MB-3MB 데이터
  ↓                       ↓                       ↓
Replica 1            Replica 2               Replica 3
(읽기 전용)          (읽기 전용)             (읽기 전용)

특징:
- 각 마스터가 슬롯의 일부 담당
- 각 마스터는 레플리카로 백업됨
- 자동 페일오버 지원
```

### 2.2 클러스터 토폴로지

```
최소 요구사항:
- 3개 이상의 마스터 노드
- 각 마스터마다 최소 1개 레플리카 권장
- 권장: 3 마스터 + 3 레플리카 (6개 노드)

예제 1: 소규모 (3노드)
Node1 (Master) ← Node2 (Replica)
Node3 (Master)
(1개 노드만 있어도 클러스터 가능하지만 권장 안 함)

예제 2: 표준 (6노드)
Master1 ↔ Replica1
Master2 ↔ Replica2
Master3 ↔ Replica3

예제 3: 대규모 (9노드)
Master1 ↔ Replica1 ↔ Replica1-2
Master2 ↔ Replica2 ↔ Replica2-2
Master3 ↔ Replica3 ↔ Replica3-2
```

### 2.3 클러스터의 특성

```
고가용성 (High Availability):
- 마스터 장애 → 자동으로 레플리카 승격
- 약 15-30초 내 자동 페일오버

확장성 (Scalability):
- 새 노드 추가 → 기존 슬롯 재배치
- 수평 확장으로 용량 증가

분산성 (Distribution):
- 데이터가 여러 노드에 분산
- 각 노드는 독립적으로 작동
```

---

## 3. 해시슬롯과 키 분배

### 3.1 해시슬롯 개념

```
Redis Cluster는 16384개의 해시슬롯 사용

# 슬롯 범위 계산
0 ~ 16383 (총 16384개)

# 16384 = 2^14
→ 14비트로 표현 가능
→ CRC16 해시값을 16384로 나눈 나머지 = 슬롯 번호

슬롯 할당 예제 (3 마스터):
┌─────────────────────────────────┐
│ Master Node 1                   │
│ Slot: 0 - 5460                  │
│ 담당 데이터: ~5461개 키        │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Master Node 2                   │
│ Slot: 5461 - 10922              │
│ 담당 데이터: ~5462개 키        │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Master Node 3                   │
│ Slot: 10923 - 16383             │
│ 담당 데이터: ~5461개 키        │
└─────────────────────────────────┘
```

### 3.2 키에서 슬롯 계산

```
슬롯 계산 알고리즘:
slot_number = CRC16(key) % 16384

예제 1:
key = "user:1001"
CRC16("user:1001") = 51234
51234 % 16384 = 2466
→ 슬롯 2466 (Master Node 1에 저장)

예제 2:
key = "post:5000"
CRC16("post:5000") = 72500
72500 % 16384 = 7348
→ 슬롯 7348 (Master Node 2에 저장)

예제 3:
key = "order:99999"
CRC16("order:99999") = 123456
123456 % 16384 = 13600
→ 슬롯 13600 (Master Node 3에 저장)
```

### 3.3 해시태그 (Hash Tag)

```
문제: 관련 키들이 다른 슬롯에 분산되면 멀티키 트랜잭션 불가능

해결: 해시태그로 같은 슬롯에 강제 배치

해시태그 문법:
key_name = prefix{hash_tag}suffix

슬롯 계산:
- {} 내부만 CRC16으로 계산
- {} 밖의 부분은 무시됨

예제:
key1 = "user:{1001}:profile"    → CRC16("1001") % 16384
key2 = "user:{1001}:settings"   → CRC16("1001") % 16384
key3 = "user:{1001}:preferences" → CRC16("1001") % 16384

결과: 3개 키 모두 같은 슬롯에 저장됨

# 검증
CLUSTER KEYSLOT user:{1001}:profile
→ 1234

CLUSTER KEYSLOT user:{1001}:settings
→ 1234

CLUSTER KEYSLOT user:{1001}:preferences
→ 1234

활용: 멀티키 트랜잭션
MULTI
SET user:{1001}:profile {...}
SET user:{1001}:settings {...}
SET user:{1001}:preferences {...}
EXEC
→ 성공! (같은 슬롯이므로)
```

### 3.4 슬롯 할당 전략

```
균등 분배 (Balanced Distribution):

3 마스터인 경우:
- 마스터1: 슬롯 0-5460 (5461개)
- 마스터2: 슬롯 5461-10922 (5462개)
- 마스터3: 슬롯 10923-16383 (5461개)

6 마스터인 경우:
- 각 마스터: 2730개 슬롯 (16384/6)

불균등 분배 (Unbalanced Distribution):
→ 운영 중 발생 가능 (새 노드 추가 전)
→ resharding으로 재균등화 필요

# 슬롯 분배 확인
CLUSTER NODES

결과 예:
f1502d9387e91c1e36cb0c309a5d57ac55bd74bb 192.168.40.170:6001@16001
slots:[0-5460] (5461 slots) master
1 additional replica(s)

361e4fdd5a8f9e0eb0c594cc1ef797a07441c0f6 192.168.40.180:6001@16001
slots:[5461-10922] (5462 slots) master
1 additional replica(s)

2f35603cb4b0fc89241af0c0fc44b36181f9c298 192.168.40.190:6001@16001
slots:[10923-16383] (5461 slots) master
1 additional replica(s)
```

---

## 4. 클러스터 설치 및 구성

### 4.1 사전 준비

```
필수 요구사항:
- Redis 3.0 이상 (권장: Redis 6.0+)
- Python 2.7 또는 Python 3.3+ (redis-trib.rb 사용 시)
- 또는 redis-cli 6.0+ (내장 --cluster 옵션 사용)

권장 시스템 사양:
- CPU: 2코어 이상
- RAM: 마스터당 2GB 이상
- 디스크: 데이터 크기의 2배 이상
```

### 4.2 클러스터 설정 파일

```redis.conf 예제:

# 포트 설정
port 7000

# 클러스터 활성화
cluster-enabled yes

# 클러스터 설정 파일 (자동 생성됨)
cluster-config-file nodes-7000.conf

# 노드 타임아웃 (노드 다운 판정 시간, ms)
cluster-node-timeout 15000

# 클러스터 요구 커버리지 (모든 슬롯 커버 필수)
cluster-require-full-coverage yes

# 마이그레이션 배리어
cluster-migration-barrier 1

# 영속성 설정
appendonly yes
appendfsync everysec

# 로깅
loglevel notice
logfile "7000.log"

# 메모리 관리
maxmemory 1gb
maxmemory-policy allkeys-lru

# 바인드 주소
bind 0.0.0.0

# 데이터베이스 (클러스터에서는 DB 0만 사용)
databases 1

# 보호 모드 비활성화 (클러스터에서는 필수)
protected-mode no
```

### 4.3 클러스터 생성

```bash
# Step 1: 각 노드별로 Redis 서버 실행

redis-server redis-7000.conf  # 터미널 1
redis-server redis-7001.conf  # 터미널 2
redis-server redis-7002.conf  # 터미널 3
redis-server redis-7003.conf  # 터미널 4
redis-server redis-7004.conf  # 터미널 5
redis-server redis-7005.conf  # 터미널 6

# Step 2: 클러스터 생성 (Redis 5.0+)

redis-cli --cluster create \
  127.0.0.1:7000 \
  127.0.0.1:7001 \
  127.0.0.1:7002 \
  127.0.0.1:7003 \
  127.0.0.1:7004 \
  127.0.0.1:7005 \
  --cluster-replicas 1

# --cluster-replicas 1: 각 마스터마다 1개 레플리카 자동 할당

# 예상 출력:
>>> Performing hash slots allocation on 6 nodes...
Master[0] -> Slots 0 - 5460
Master[1] -> Slots 5461 - 10922
Master[2] -> Slots 10923 - 16383
Adding replica 127.0.0.1:7003 to 127.0.0.1:7000
Adding replica 127.0.0.1:7004 to 127.0.0.1:7001
Adding replica 127.0.0.1:7005 to 127.0.0.1:7002

>>> Nodes configuration updated
>>> Assign a different config epoch to each node
>>> Sending CLUSTER MEET messages to join the cluster

# Step 3: 클러스터 상태 확인

redis-cli -p 7000 cluster info
→ cluster_state:ok
→ cluster_slots_assigned:16384
→ cluster_slots_ok:16384
→ cluster_slots_pfail:0
→ cluster_slots_fail:0
→ cluster_known_nodes:6
→ cluster_size:3
```

### 4.4 nodes.conf 파일 구조

```
# nodes.conf (자동 생성, 수동 편집 금지)

f1502d9387e91c1e36cb0c309a5d57ac55bd74bb 127.0.0.1:7000@17000 myself,master - 0 1387262274 1 connected 0-5460
361e4fdd5a8f9e0eb0c594cc1ef797a07441c0f6 127.0.0.1:7001@17001 master - 0 1387262278 2 connected 5461-10922
2f35603cb4b0fc89241af0c0fc44b36181f9c298 127.0.0.1:7002@17002 master - 0 1387262279 3 connected 10923-16383
ea3f9475069cc8a93a26af8d649136ae1617f07c 127.0.0.1:7003@17003 slave f1502d9387e91c1e36cb0c309a5d57ac55bd74bb 0 1387262277 1 connected
5fadaa2a1b3a06b0fcf88e29e754ed053dce8e9a 127.0.0.1:7004@17004 slave 361e4fdd5a8f9e0eb0c594cc1ef797a07441c0f6 0 1387262276 2 connected
2bedffc625d87413758125d695ee53f69b14cc5f 127.0.0.1:7005@17005 slave 2f35603cb4b0fc89241af0c0fc44b36181f9c298 0 1387262278 3 connected

필드 설명:
[ID] [주소:포트] [마크] [설정에포크] [핑시간] [퐁시간] [에포크] [슬롯범위]

마크:
- myself: 자신을 나타냄
- master: 마스터 노드
- slave: 슬레이브 노드
- fail: 장애 노드
- migrating: 슬롯 마이그레이션 중
- importing: 슬롯 임포트 중
```

---

## 5. 클러스터 명령어

### 5.1 클러스터 정보 조회

```
# 클러스터 전체 정보
CLUSTER INFO

결과:
cluster_state:ok              # 상태 (ok/fail)
cluster_slots_assigned:16384  # 할당된 슬롯 수
cluster_slots_ok:16384        # 정상 슬롯 수
cluster_slots_pfail:0         # 부분 실패 슬롯
cluster_slots_fail:0          # 완전 실패 슬롯
cluster_known_nodes:6         # 알려진 노드 수
cluster_size:3                # 마스터 노드 수
cluster_current_epoch:3       # 현재 에포크
cluster_my_epoch:1            # 자신의 에포크
cluster_stats_messages_sent:123456    # 보낸 메시지
cluster_stats_messages_received:123456 # 받은 메시지
```

### 5.2 노드 정보 조회

```
# 모든 노드 상세 정보
CLUSTER NODES

결과:
f1502d9387e91c1e36cb0c309a5d57ac55bd74bb 127.0.0.1:7000 myself,master - 0 1387262274 1 connected 0-5460
361e4fdd5a8f9e0eb0c594cc1ef797a07441c0f6 127.0.0.1:7001 master - 0 1387262278 2 connected 5461-10922
2f35603cb4b0fc89241af0c0fc44b36181f9c298 127.0.0.1:7002 master - 0 1387262279 3 connected 10923-16383
...

# 슬롯별 노드 정보
CLUSTER SLOTS

결과:
1) 1) 0              # 슬롯 시작
   2) 5460          # 슬롯 끝
   3) 1) "127.0.0.1" # 마스터 주소
      2) 7000       # 마스터 포트
   4) 1) "127.0.0.1" # 레플리카 주소
      2) 7003

2) 1) 5461
   2) 10922
   ...

# 특정 키의 슬롯 정보
CLUSTER KEYSLOT mykey
→ 12345 (슬롯 번호)

# 슬롯의 키 개수
CLUSTER COUNTKEYSINSLOT 12345
→ 1000 (슬롯 12345에 있는 키 개수)

# 슬롯의 키 목록 (최대 N개)
CLUSTER GETKEYSINSLOT 12345 10
→ key1, key2, key3, ... (최대 10개)
```

### 5.3 노드별 정보

```
# 특정 노드 정보
CLUSTER NODE INFO {node_id}

# 현재 연결된 노드 정보
INFO cluster

결과:
cluster_enabled:1          # 클러스터 활성화 여부
cluster_state:ok           # 클러스터 상태
cluster_slots_assigned:16384
cluster_size:3
cluster_my_epoch:1
cluster_known_nodes:6
...

# 노드 연결 확인
PING
→ PONG

# 원격 노드 연결 상태
CLUSTER NODES | grep {node_id}
```

### 5.4 슬롯 상태 조회

```
# 특정 슬롯의 주인 노드
CLUSTER NODES | grep "slots:.*{slot}"

# 슬롯 상태 (현재 마이그레이션 중인 슬롯)
CLUSTER SLOTS

상태 값:
- connected: 정상 상태
- migrating: 출발 노드에서 마이그레이션 중
- importing: 도착 노드에서 임포트 중

# 모든 슬롯 커버 확인
redis-cli --cluster check 127.0.0.1:7000
→ All 16384 slots covered (성공)
→ Slots not covered (실패)
```

---

## 6. 슬롯 마이그레이션 (Resharding)

### 6.1 마이그레이션이 필요한 경우

```
경우 1: 새 노드 추가
├─ 기존 3개 노드에 4번째 노드 추가
└─ 기존 노드들의 슬롯을 새 노드으로 분산

경우 2: 노드 제거
├─ 6개 노드에서 1개 노드 제거
└─ 제거할 노드의 슬롯을 다른 노드로 이동

경우 3: 수동 리밸런싱
├─ 불균등한 슬롯 분배 재정렬
└─ 데이터 크기 차이 조정

경우 4: 성능 최적화
├─ 부하 많은 노드의 슬롯 분산
└─ 균등 분배 유지
```

### 6.2 마이그레이션 프로세스

```
마이그레이션 5단계 프로세스:

Step 1: MIGRATING 상태
┌─────────────┐       [마이그레이션 중]      ┌─────────────┐
│Source Node  │ ◄────────────────────────────► │Dest Node    │
│(출발노드)   │       CLUSTER SETSLOT X       │(도착노드)   │
│             │       MIGRATING dest_id       │             │
│Slot Status  │       (소스에서 선언)        │Slot Status  │
│MIGRATING    │                               │IMPORTING    │
└─────────────┘                               └─────────────┘

Step 2: IMPORTING 상태
도착 노드에서도 임포트 상태로 선언

Step 3: 데이터 이동
MIGRATE 명령어로 키 하나씩 이동
(또는 배치로 여러 키 동시 이동)

Step 4: 마이그레이션 완료
모든 키가 이동됨

Step 5: STABLE 상태
슬롯을 완전히 도착 노드로 이동
CLUSTER SETSLOT X NODE dest_node_id
```

### 6.3 redis-cli --cluster reshard 사용

```bash
# 자동 resharding (권장)

redis-cli --cluster reshard 127.0.0.1:7000 \
  --cluster-from <source_node_id> \
  --cluster-to <dest_node_id> \
  --cluster-slots <slot_count> \
  --cluster-yes

예제 1: 노드1에서 노드2로 1000개 슬롯 이동
redis-cli --cluster reshard 127.0.0.1:7000 \
  --cluster-from f1502d9387e91c1e36cb0c309a5d57ac55bd74bb \
  --cluster-to 361e4fdd5a8f9e0eb0c594cc1ef797a07441c0f6 \
  --cluster-slots 1000 \
  --cluster-yes

예제 2: 노드1의 모든 슬롯을 노드4로 이동 (노드 제거)
# 노드1의 슬롯: 5461 (노드1이 5461개 슬롯 가짐)
redis-cli --cluster reshard 127.0.0.1:7000 \
  --cluster-from f1502d9387e91c1e36cb0c309a5d57ac55bd74bb \
  --cluster-to 361e4fdd5a8f9e0eb0c594cc1ef797a07441c0f6 \
  --cluster-slots 5461 \
  --cluster-yes

# 진행 상황
>>> Performing Cluster Reshard

[err]: Slot 5461 is already assigned to node f1502d9387e91c1e36cb0c309a5d57ac55bd74bb.

# 모니터링
redis-cli -p 7000 CLUSTER NODES
→ 슬롯 상태가 실시간으로 변함 (migrating/importing)

# 완료 확인
redis-cli --cluster check 127.0.0.1:7000
→ [OK] All slots covered
```

### 6.4 수동 마이그레이션

```bash
# 수동 마이그레이션 (더 세밀한 제어)

# Step 1: 소스 노드에서 마이그레이션 선언
redis-cli -p 7000 CLUSTER SETSLOT 1000 MIGRATING {dest_node_id}

# Step 2: 도착 노드에서 임포트 선언
redis-cli -p 7001 CLUSTER SETSLOT 1000 IMPORTING {source_node_id}

# Step 3: 키 이동 (수동)
redis-cli -p 7000 MIGRATE 127.0.0.1 7001 key1 0 1000
redis-cli -p 7000 MIGRATE 127.0.0.1 7001 key2 0 1000
redis-cli -p 7000 MIGRATE 127.0.0.1 7001 key3 0 1000
...

# Step 4: 마이그레이션 완료
redis-cli -p 7000 CLUSTER SETSLOT 1000 STABLE

# Step 5: 모든 노드에 알림
for port in 7000 7001 7002 7003 7004 7005; do
  redis-cli -p $port CLUSTER SETSLOT 1000 NODE {dest_node_id}
done
```

### 6.5 마이그레이션 중 클라이언트 동작

```
마이그레이션 중 클라이언트가 키에 접근하면:

시나리오 1: MIGRATING 상태 중 읽기
Client → [Source Node]
← MOVED redirect (도착 노드로 이동하라)
Client → [Dest Node]
← 데이터 (또는 데이터 없음)

시나리오 2: MIGRATING 상태 중 쓰기
Client → [Source Node]
← TRYAGAIN (나중에 다시 시도)
→ Client 자동 재시도

에러 처리:
MOVED {slot} {ip}:{port}
→ 도착 노드로 연결 변경

ASKING {slot} {ip}:{port}
→ 임시로 도착 노드에 접근

TRYAGAIN
→ 마이그레이션 중, 나중에 재시도
```

---

## 7. 클러스터 페일오버

### 7.1 자동 페일오버

```
시나리오: 마스터 노드 다운

Timeline:

[0초] Master1 다운
      ├─ 다른 노드들이 다운 감지 시작

[3초] Failure Detection
      ├─ 여러 마스터가 동시에 다운 인지
      ├─ Gossip 프로토콜로 정보 전파
      └─ Cluster Node Timeout (기본 15초) 임박

[15초] Node Timeout 초과
       ├─ Master1 = PFAIL (Possibly FAIL)
       └─ Replica1 재연결 시도

[17초] Consensus 결정
       ├─ 다수 마스터가 Master1 다운 동의
       ├─ Master1 = FAIL (확정 다운)
       └─ Replica1 = slave 상태

[17초~20초] 페일오버 실행
            ├─ Replica1이 Master1을 대체
            ├─ Replica1 → Replica1 (마스터 승격)
            ├─ Replica1 슬롯 소유권 주장
            └─ 다른 노드가 Replica1 승인

[20초] 완료
      ├─ Replica1이 새 Master1
      ├─ Master1 (구 마스터) = FAIL 상태
      └─ 서비스 정상화
```

### 7.2 페일오버 메커니즘

```
페일오버 요구사항:

1. Quorum 확보
   ├─ 전체 마스터의 과반 이상 동의 필요
   ├─ 예: 3마스터 → 2개 이상 동의
   └─ 예: 5마스터 → 3개 이상 동의

2. Replication Offset 확인
   ├─ 가장 최신 데이터를 가진 레플리카 선택
   └─ Offset 가장 큰 레플리카가 마스터 승격

3. Configuration Epoch
   ├─ 각 노드마다 고유 에포크 번호
   ├─ 페일오버 시 에포크 증가
   └─ 높은 에포크 = 최신 설정

자동 페일오버 구성:

cluster-node-timeout 15000
→ 15초 이상 응답 없으면 다운 판정

cluster-require-full-coverage yes
→ 모든 슬롯 커버 필수 (기본값)
→ no: 일부 슬롯 실패해도 작동
```

### 7.3 수동 페일오버

```bash
# 레플리카에서 수동으로 마스터 승격

# 레플리카 노드에서 실행
redis-cli -p 7003 CLUSTER FAILOVER
→ Replica1이 Master1을 강제로 승격

# 즉시 페일오버 (FORCE)
redis-cli -p 7003 CLUSTER FAILOVER FORCE
→ Quorum 확보 없이 즉시 승격
→ 데이터 손실 가능 (위험)

# Takeover 방식 (TAKEOVER)
redis-cli -p 7003 CLUSTER FAILOVER TAKEOVER
→ 마스터와 통신 없이 승격
→ 분할 상황에서 사용
→ 대기 시간 없음
```

### 7.4 페일오버 모니터링

```
# 페일오버 상태 모니터링

CLUSTER INFO
→ cluster_state: ok/fail

CLUSTER NODES
→ 노드 상태 확인 (master/slave/fail)

INFO replication (마스터에서)
→ role:master
→ connected_slaves:N

INFO replication (레플리카에서)
→ role:slave
→ master_host:...
→ master_port:...
→ slave_read_only:yes

# 실시간 모니터링
MONITOR
→ 모든 작업 실시간 표시

# 로그 확인
tail -f 7000.log
→ "Slave promoted" 메시지
→ "CLUSTER failover detected" 메시지
```

---

## 8. 클러스터 토폴로지 관리

### 8.1 노드 추가

```bash
# Step 1: 새 Redis 인스턴스 시작

redis-server redis-7006.conf
redis-server redis-7007.conf
(마스터 1개 + 레플리카 1개)

# Step 2: 기존 클러스터에 조인

redis-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000
→ New node 127.0.0.1:7006 added
→ Node id: new_node_id

redis-cli --cluster add-node 127.0.0.1:7007 127.0.0.1:7000 \
  --cluster-slave \
  --cluster-master-id {new_node_id}
→ New replica 127.0.0.1:7007 added

# Step 3: 슬롯 재할당 (resharding)

redis-cli --cluster reshard 127.0.0.1:7000 \
  --cluster-slots 5461 \
  --cluster-yes
→ 기존 노드의 슬롯을 새 노드로 분산

# 또는 수동 복수 리샤드
for i in {0..1365}; do
  redis-cli --cluster reshard 127.0.0.1:7000 \
    --cluster-from <old_node_id> \
    --cluster-to new_node_id \
    --cluster-slots 1 \
    --cluster-yes
done
```

### 8.2 노드 제거

```bash
# Step 1: 제거할 노드의 슬롯 이동

redis-cli --cluster reshard 127.0.0.1:7000 \
  --cluster-from {node_to_remove_id} \
  --cluster-to {other_node_id} \
  --cluster-slots 5461 \
  --cluster-yes
→ 제거할 노드의 모든 슬롯을 다른 노드로 이동

# Step 2: 노드가 슬롯 없음 확인

redis-cli -p 7000 CLUSTER NODES
→ 제거 대상 노드에 "slots: (0 slots)" 표시

# Step 3: 노드 제거

redis-cli --cluster del-node 127.0.0.1:7000 {node_to_remove_id}
→ Removing node ...
→ Sending CLUSTER FORGET ...
→ Sending CLUSTER RESET SOFT ...

# Step 4: 노드 종료

redis-cli -p 7006 SHUTDOWN
→ 해당 Redis 서버 종료
```

### 8.3 레플리카 변경

```bash
# 레플리카의 마스터 변경

# Step 1: 새 마스터 선택
# (예: Master3을 따를 레플리카를 Master1을 따르도록)

# Step 2: 기존 레플리카 제거 (옵션)
redis-cli --cluster del-node 127.0.0.1:7000 {replica_node_id}

# Step 3: 새 레플리카 추가
redis-cli --cluster add-node 127.0.0.1:7007 127.0.0.1:7000 \
  --cluster-slave \
  --cluster-master-id {new_master_id}

# 또는 수동 변경 (Redis 명령어)
redis-cli -p 7007 CLUSTER REPLICATE {new_master_id}
→ 레플리카 7007이 new_master를 따르도록 변경
```

### 8.4 토폴로지 검증

```bash
# 전체 클러스터 상태 확인

redis-cli --cluster check 127.0.0.1:7000

결과 예:
Cluster Info:
cluster_state: ok
cluster_known_nodes: 6
cluster_size: 3
...

Master Nodes:
[0] 127.0.0.1:7000 - Master, Slots 0-5460
[1] 127.0.0.1:7001 - Master, Slots 5461-10922
[2] 127.0.0.1:7002 - Master, Slots 10923-16383

Replica Nodes:
[0] 127.0.0.1:7003 - Replica of [0]
[1] 127.0.0.1:7004 - Replica of [1]
[2] 127.0.0.1:7005 - Replica of [2]

[OK] All 16384 slots assigned.
[OK] All slots have at least one replica.
[OK] No keys in cluster.
[OK] Cluster is consistent.

# 상세 정보
redis-cli -p 7000 CLUSTER NODES

# 슬롯 분배 시각화
redis-cli -p 7000 CLUSTER SLOTS
```

---

## 9. Redis Geo 명령어 소개

### 9.1 Geo 개념

```
Redis Geo란?
├─ 지리적 좌표 저장 및 검색 기능
├─ 위도(latitude), 경도(longitude) 기반
└─ Sorted Set 기반 구현 (내부적으로)

사용 사례:
├─ 택시/배달 앱 (근처 드라이버 찾기)
├─ 소셜 네트워크 (근처 친구 찾기)
├─ 지도 앱 (반경 내 가게 검색)
├─ 실시간 위치 추적 (버스/배송 추적)
└─ 지오펜싱 (특정 지역 알림)

좌표 범위:
- 위도: -85.05112878 ~ 85.05112878
- 경도: -180 ~ 180

정확도:
- Geohash 사용 (11비트 당 1.4m 정확도)
- Redis는 52비트 Geohash 사용
```

### 9.2 Geo 데이터 구조

```
내부 구현:

Redis Geo = Sorted Set (변환된 형태)

예제:
GEOADD buses 13.361389 38.115556 "Palermo"
GEOADD buses 15.087269 37.502669 "Catania"

내부 Sorted Set:
{
  "Palermo": 3479099956230698,  # 인코딩된 Geohash
  "Catania": 3479447370796909   # 인코딩된 Geohash
}

Geohash 인코딩:
- 위도/경도를 52비트로 인터리빙
- 인터리빙 = 두 비트 시퀀스 섞기
- 결과 = Sorted Set의 score
```

### 9.3 Geo vs 다른 방법

```
방법 1: 위도/경도를 별도 저장 (비효율)
SET location:123 '{"lat": 40.7, "lng": -74.0}'

문제점:
- 범위 검색 어려움
- 거리 계산 매번 필요
- 정렬 불가능

방법 2: Redis Geo (권장)
GEOADD locations 40.7 -74.0 "location:123"

장점:
- 범위 검색 내장 (GEOSEARCH)
- 거리 계산 내장 (GEODIST)
- 정렬 자동
- 성능 최적화됨

방법 3: Elasticsearch / PostGIS
- 더 복잡한 쿼리 지원
- 더 높은 정확도
- 하지만 더 무거움
```

---

## 10. Geo 기본 연산

### 10.1 GEOADD 명령어

```
# 위치 추가

GEOADD key longitude latitude member [longitude latitude member ...]

주의: 순서가 longitude(경도) -> latitude(위도)

# 단일 위치 추가
GEOADD buses 13.361389 38.115556 "Palermo"
→ 1 (1개 추가됨)

# 여러 위치 동시 추가
GEOADD buses \
  13.361389 38.115556 "Palermo" \
  15.087269 37.502669 "Catania" \
  12.583333 37.316667 "Messina"
→ 3 (3개 추가됨)

# 기존 위치 업데이트
GEOADD buses 13.361390 38.115557 "Palermo"
→ 0 (새로 추가되지 않음, 업데이트됨)

# 옵션: 새로 추가된 것만 + 거리 반환
GEOADD buses NX CH WITHSCORES \
  13.361389 38.115556 "Palermo" \
  15.087269 37.502669 "Catania"

옵션 설명:
- NX: 새로운 항목만 추가 (기존 항목 무시)
- XX: 기존 항목만 업데이트 (새 항목 추가 X)
- CH: 변경된 항목 수 반환 (추가 + 업데이트)
- WITHSCORES: Geohash 점수 함께 반환

# 실전 예제: 배송 드라이버 위치 등록

GEOADD delivery_drivers \
  -73.97 40.77 "driver_123" \
  -74.00 40.71 "driver_456" \
  -73.98 40.75 "driver_789"
```

### 10.2 GEOPOS 명령어

```
# 저장된 위치 조회

GEOPOS key member [member ...]

# 단일 위치 조회
GEOPOS buses "Palermo"
→ 1) 1) "13.36138945817947"     # 경도 (약간의 정밀도 손실)
      2) "38.11555394437902"     # 위도

# 여러 위치 조회
GEOPOS buses "Palermo" "Catania" "Messina"
→ 1) 1) "13.36138945817947"
      2) "38.11555394437902"
   2) 1) "15.08726744890213"
      2) "37.50266901493193"
   3) 1) "12.58333444595337"
      2) "37.31666565811963"

# 없는 위치
GEOPOS buses "NonExistent"
→ 1) (nil)

# 부분 성공/실패
GEOPOS buses "Palermo" "NonExistent" "Catania"
→ 1) 1) "13.36138945817947"
      2) "38.11555394437902"
   2) (nil)
   3) 1) "15.08726744890213"
      2) "37.50266901493193"
```

### 10.3 GEOHASH 명령어

```
# Geohash 값 조회 (인코딩된 형태)

GEOHASH key member [member ...]

# Geohash는 위도/경도를 Base32로 인코딩한 문자열

# 단일 Geohash 조회
GEOHASH buses "Palermo"
→ "sqc8b49rnz0"  # 11문자 Base32 Geohash

# 여러 Geohash 조회
GEOHASH buses "Palermo" "Catania"
→ 1) "sqc8b49rnz0"
   2) "sq9sm01mnz0"

# Geohash 활용:
# - 인접한 지역 찾기
# - 그리드 기반 검색
# - 데이터 클러스터링
# - 공간 인덱싱

# 예: Geohash 프리픽스로 검색
ZRANGE buses 0 -1 BYLEX -\(sqc8b4 +\(sqc8b5
→ Geohash가 "sqc8b4"로 시작하는 항목 찾기
```

---

## 11. Geo 거리 계산

### 11.1 GEODIST 명령어

```
# 두 위치 간 거리 계산

GEODIST key member1 member2 [unit]

# 거리 단위:
# - m: 미터 (기본값)
# - km: 킬로미터
# - ft: 피트
# - mi: 마일

# 예제 1: 팔레르모와 카타니아 사이 거리

GEODIST buses "Palermo" "Catania"
→ "166274.1516"  # 약 166274미터 (166km)

# 킬로미터 단위
GEODIST buses "Palermo" "Catania" km
→ "166.2741516"  # 약 166km

# 마일 단위
GEODIST buses "Palermo" "Catania" mi
→ "103.3182"  # 약 103마일

# 피트 단위
GEODIST buses "Palermo" "Catania" ft
→ "545537.6274"  # 약 54만 피트

# 존재하지 않는 멤버
GEODIST buses "Palermo" "NonExistent"
→ (nil)

# 실전 예제: 배송 거리 계산

# 고객 위치
GEOADD delivery 40.7128 -74.0060 "customer_nyc"

# 드라이버 위치
GEOADD delivery 40.7614 -73.9776 "driver_123"

# 거리 계산
GEODIST delivery "customer_nyc" "driver_123" km
→ "9.2541"  # 약 9.25km

# 배송료 계산 로직
distance = GEODIST(...)
if distance <= 5:
    fee = 5000
elif distance <= 10:
    fee = 10000
else:
    fee = 15000 + (distance - 10) * 500
```

### 11.2 거리 기반 필터링

```
# 여러 거리 계산으로 범위 내 항목 찾기

# 드라이버들의 거리 계산
drivers = ["driver_123", "driver_456", "driver_789"]
customer_location = "customer_nyc"

distances = []
for driver in drivers:
    dist = GEODIST(delivery, customer_location, driver, "km")
    distances.append((driver, dist))

# 5km 이내 드라이버 필터
nearby_drivers = [d for d, dist in distances if dist <= 5]

# 가장 가까운 드라이버 선택
closest_driver = min(nearby_drivers, key=lambda x: x[1])
```

---

## 12. Geo 범위 검색

### 12.1 GEORADIUS 명령어 (레거시)

```
# 특정 좌표로부터 반경 내 항목 검색

GEORADIUS key longitude latitude radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count] [ASC|DESC]

# 기본 검색 (뉴욕으로부터 10km 이내)
GEORADIUS delivery -74.0060 40.7128 10 km
→ 1) "driver_123"
   2) "driver_456"

# 거리 표시
GEORADIUS delivery -74.0060 40.7128 10 km WITHDIST
→ 1) 1) "driver_123"
      2) "5.234"      # km
   2) 1) "driver_456"
      2) "8.912"

# 좌표 표시
GEORADIUS delivery -74.0060 40.7128 10 km WITHCOORD
→ 1) 1) "driver_123"
      2) 1) "-73.97"
         2) "40.75"
   2) 1) "driver_456"
      2) 1) "-73.98"
         2) "40.76"

# 거리 + 좌표
GEORADIUS delivery -74.0060 40.7128 10 km WITHDIST WITHCOORD
→ 결합된 정보 반환

# 정렬 (거리 순)
GEORADIUS delivery -74.0060 40.7128 10 km ASC
→ 가까운 순서로 정렬

GEORADIUS delivery -74.0060 40.7128 10 km DESC
→ 먼 순서로 정렬

# 개수 제한
GEORADIUS delivery -74.0060 40.7128 10 km COUNT 3
→ 최대 3개만 반환

# 모든 옵션 조합
GEORADIUS delivery -74.0060 40.7128 10 km \
  WITHDIST WITHCOORD COUNT 5 ASC
→ 가장 가까운 5개 (거리, 좌표 표시)
```

### 12.2 GEOSEARCH 명령어 (권장, Redis 6.2+)

```
# 더 강력한 범위 검색 (권장)

GEOSEARCH key [FROMMEMBER member] [FROMLONLAT longitude latitude] \
  [BYBOX width height m|km|ft|mi] [BYRADIUS radius m|km|ft|mi] \
  [ASC|DESC] [COUNT count] [WITHCOORD] [WITHDIST] [WITHHASH]

# 타입 1: 멤버를 중심으로 반경 검색
GEOSEARCH delivery FROMMEMBER "customer_nyc" \
  BYRADIUS 10 km \
  WITHDIST ASC COUNT 5
→ 가장 가까운 5개 드라이버

# 타입 2: 좌표를 중심으로 반경 검색
GEOSEARCH delivery FROMLONLAT -74.0060 40.7128 \
  BYRADIUS 10 km \
  WITHDIST ASC
→ 지정된 좌표로부터 10km 이내

# 타입 3: 상자 범위 검색 (BYBOX)
GEOSEARCH delivery FROMLONLAT -74.0060 40.7128 \
  BYBOX 10 10 km \
  WITHDIST ASC
→ 중심에서 10km × 10km 상자 내 항목

# 타입 4: 모든 옵션 포함
GEOSEARCH delivery FROMMEMBER "customer_nyc" \
  BYRADIUS 15 km \
  WITHDIST WITHCOORD WITHHASH \
  ASC COUNT 10
→ 거리 · 좌표 · 해시 포함, 근처순 정렬, 최대 10개

# GEOSEARCH vs GEORADIUS
│ 기능 | GEORADIUS | GEOSEARCH │
├──────────────┼───────────┼──────────┤
│ 멤버 중심 | ○ | ○ (권장) │
│ 좌표 중심 | ○ | ○ |
│ 상자 검색 | ✗ | ○ |
│ Geohash | ✗ | ○ (WITHHASH) │
└──────────────┴───────────┴──────────┘
```

### 12.3 GEORADIUSBYMEMBER 명령어 (레거시)

```
# 저장된 멤버를 중심으로 반경 검색

GEORADIUSBYMEMBER key member radius m|km|ft|mi \
  [WITHCOORD] [WITHDIST] [COUNT count] [ASC|DESC]

# 팔레르모로부터 200km 이내 모든 버스
GEORADIUSBYMEMBER buses "Palermo" 200 km WITHDIST ASC
→ 1) 1) "Palermo"
      2) "0.0000"
   2) 1) "Catania"
      2) "166.2741"

# 고객 근처 드라이버 찾기
GEORADIUSBYMEMBER delivery "customer_nyc" 10 km COUNT 5 ASC
→ 가장 가까운 5명의 드라이버

# GEOSEARCH로 대체 (권장)
GEOSEARCH delivery FROMMEMBER "customer_nyc" \
  BYRADIUS 10 km COUNT 5 ASC
```

---

## 13. Geo 고급 기능

### 13.1 GEOSEARCHSTORE 명령어

```
# 범위 검색 결과를 새로운 Sorted Set에 저장

GEOSEARCHSTORE destination source \
  [FROMMEMBER member | FROMLONLAT longitude latitude] \
  [BYBOX width height m|km|ft|mi | BYRADIUS radius m|km|ft|mi] \
  [ASC|DESC] [COUNT count] [STOREDIST]

# 기본 저장
GEOSEARCHSTORE nearby_drivers delivery \
  FROMMEMBER "customer_nyc" \
  BYRADIUS 10 km

# 결과 확인
ZRANGE nearby_drivers 0 -1
→ 저장된 드라이버 목록

# 거리 점수로 저장 (STOREDIST)
GEOSEARCHSTORE nearby_drivers_dist delivery \
  FROMMEMBER "customer_nyc" \
  BYRADIUS 10 km \
  STOREDIST

# 점수 확인 (거리로 정렬됨)
ZRANGE nearby_drivers_dist 0 -1 WITHSCORES
→ 1) "driver_456"
   2) "5.234"     # 거리(km)
   2) "driver_123"
   3) "8.912"

# 활용: TTL과 함께 사용
GEOSEARCHSTORE nearby_temp delivery \
  FROMMEMBER "customer_nyc" \
  BYRADIUS 10 km
EXPIRE nearby_temp 300
→ 5분간만 보관
```

### 13.2 동적 위치 업데이트

```
# 이동하는 객체의 위치 업데이트

# 드라이버 위치 업데이트 (매 5초)
GEOADD delivery -73.98 40.75 "driver_123"    # 시간 T
GEOADD delivery -73.97 40.76 "driver_123"    # 시간 T+5
GEOADD delivery -73.96 40.77 "driver_123"    # 시간 T+10

# 현재 위치 조회
GEOPOS delivery "driver_123"
→ 최신 위치

# 역사 추적 (별도 Sorted Set 사용)
ZADD driver_123_history \
  {timestamp1} '{"lat":40.75,"lng":-73.98}' \
  {timestamp2} '{"lat":40.76,"lng":-73.97}' \
  {timestamp3} '{"lat":40.77,"lng":-73.96}'

# TTL로 자동 삭제
EXPIRE driver_123_path 86400  # 24시간
```

### 13.3 Geo와 Sorted Set 혼합

```
# Geo 정보 + 추가 속성 저장

# 방법 1: Hash + Geo 조합
GEOADD delivery -73.98 40.75 "driver_123"
HSET driver:123:info \
  name "John" \
  status "available" \
  rating 4.8 \
  vehicle "Toyota"

# 범위 검색
GEOSEARCH delivery FROMMEMBER "customer_nyc" \
  BYRADIUS 10 km COUNT 5

# 각 드라이버 정보 조회
for driver in result:
    HGETALL driver:{driver}:info

# 방법 2: 별도 Sorted Set으로 순위 추가
GEOADD delivery -73.98 40.75 "driver_123"
ZADD driver_ratings 4.8 "driver_123"
ZADD driver_earnings 12500 "driver_123"  # 오늘 수익

# 범위 검색 후 추가 정렬
nearby = GEOSEARCH(...)
rated = ZRANGE(driver_ratings, nearby)
sorted = SORT by earnings
```

### 13.4 실시간 지오펜싱

```
# Geofencing: 사용자가 특정 영역에 진입/퇴출 감지

# 설정: 가게 위치 저장
GEOADD stores -74.0060 40.7128 "store_123"  # 뉴욕 5번 거리

# 타이머 기반 위치 체크
loop every 10 seconds:
    current_location = get_user_location()
    
    # 가게로부터 500m 이내인가?
    distance = GEODIST stores "store_123" current_location m
    
    if distance <= 500:
        # 지오펜스 내부
        if NOT user_in_zone:
            on_enter_zone()  # 진입 알림
            user_in_zone = true
    else:
        # 지오펜스 외부
        if user_in_zone:
            on_exit_zone()   # 퇴출 알림
            user_in_zone = false

# Redis 구현
# 진입/퇴출 기록
LPUSH store_123:entry_log {timestamp}
EXPIRE store_123:entry_log 86400  # 24시간

# 일일 방문 통계
INCR store_123:daily_visits
EXPIRE store_123:daily_visits 86400
```

---

## 14. 실전 응용 예제

### 14.1 택시 매칭 시스템

```
# 시나리오: 고객이 택시를 요청, 근처 택시 매칭

# 1. 모든 택시 위치 저장
GEOADD taxis -73.98 40.75 "taxi_001"
GEOADD taxis -73.97 40.76 "taxi_002"
GEOADD taxis -73.99 40.77 "taxi_003"
GEOADD taxis -74.01 40.73 "taxi_004"

# 2. 고객 위치에서 근처 택시 검색 (2km 이내, 최대 5개)
GEOSEARCH taxis FROMLONLAT -73.98 40.75 \
  BYRADIUS 2 km \
  WITHDIST ASC COUNT 5

결과:
1) 1) "taxi_002"
   2) "0.184"      # 0.184km = 184m
2) 1) "taxi_001"
   2) "0.256"      # 0.256km = 256m
3) 1) "taxi_003"
   2) "0.642"

# 3. 최우선 택시에 요청 전송
selected_taxi = "taxi_002"

# 4. 탑승 중 거리 추적
GEODIST taxis "taxi_002" "customer_location" km
→ 실시간 거리 업데이트

# 5. 도착 후 위치 제거
ZREM taxis "taxi_002"
```

### 14.2 배송 추적

```
# 시나리오: 배송 드라이버 위치 실시간 추적

# 1. 배송 드라이버들의 위치 저장
GEOADD delivery_drivers -74.00 40.71 "driver_A"
GEOADD delivery_drivers -73.98 40.75 "driver_B"
GEOADD delivery_drivers -73.99 40.77 "driver_C"

# 2. 특정 배송점 근처 드라이버 찾기
GEOSEARCH delivery_drivers FROMLONLAT -73.99 40.74 \
  BYRADIUS 5 km \
  WITHDIST WITHCOORD \
  ASC COUNT 3

# 3. 드라이버 정보 조회
HGET driver_A:info \
  name status vehicle contact_info

# 4. 고객에게 도착 예상 시간 계산
distance = GEODIST delivery_drivers "driver_A" customer_location km
speed = 50  # km/h 평균 속도
eta_minutes = (distance / speed) * 60

# 5. 배송 완료 후 위치 제거
ZREM delivery_drivers "driver_A"

# 6. 배송 통계 (일일)
INCR delivery_completed_today
INCR delivery_total_distance_meters 5000
INCRBY driver_A:daily_deliveries 1
```

### 14.3 근처 가게 검색

```
# 시나리오: 사용자 위치로부터 카페 찾기

# 1. 모든 카페 위치 저장
GEOADD coffee_shops \
  -73.98 40.75 "shop:starbucks:123" \
  -74.00 40.71 "shop:bluebottle:456" \
  -73.99 40.77 "shop:nespresso:789" \
  -73.97 40.73 "shop:peet:101"

# 2. 카페 정보 저장 (Hash)
HSET shop:starbucks:123 \
  name "Starbucks Broadway" \
  rating 4.5 \
  reviews 234 \
  hours "6am-10pm" \
  address "123 Broadway" \
  phone "555-1234"

# 3. 반경 5km 내 카페 검색
GEOSEARCH coffee_shops FROMLONLAT -74.00 40.71 \
  BYRADIUS 5 km \
  WITHDIST ASC

# 4. 상세 정보 조회
for shop_id in result:
    info = HGETALL shop_id
    rating = HGET shop_id rating
    
# 5. 사용자 방문 기록
LPUSH user:123:visited_shops \
  '{"shop":"starbucks:123","date":"2025-12-18"}'

EXPIRE user:123:visited_shops 2592000  # 30일
```

---

## 15. 클러스터 운영 팁

### 15.1 성능 최적화

```
최적화 1: 슬롯 균형 유지
├─ 주기적으로 슬롯 분배 확인
├─ 불균형 발생 시 즉시 리밸런싱
└─ 자동화 스크립트로 모니터링

최적화 2: 해시태그 사용 최소화
├─ 멀티키 연산 필요한 부분만 사용
├─ {} 없는 키도 최대한 활용
└─ 클러스터 확장성 유지

최적화 3: 노드 다운타임 최소화
├─ 비피크 시간에 유지보수 진행
├─ Blue-Green 배포 전략 사용
└─ 충분한 레플리카 구성 (최소 1:1)

최적화 4: 네트워크 대역폭
├─ 마이그레이션 시간 계획 (데이터량 고려)
├─ 낮은 대역폭 환경에서는 점진적 마이그레이션
└─ MIGRATE timeout 조정
```

### 15.2 모니터링

```
모니터링 항목:

1. 클러스터 상태
   CLUSTER INFO 주기적 확인
   - cluster_state
   - cluster_slots_assigned/ok/fail
   - cluster_known_nodes

2. 노드 상태
   CLUSTER NODES
   - master/slave/fail 상태
   - 슬롯 할당 불균형

3. 성능 지표
   INFO stats
   - total_connections_received
   - total_commands_processed
   - instantaneous_ops_per_sec

4. 메모리 사용
   INFO memory
   - used_memory
   - used_memory_rss
   - mem_fragmentation_ratio

5. 레플리케이션 지연
   INFO replication
   - replication_backlog_size
   - slave_repl_offset
```

### 15.3 장애 대응

```
시나리오 1: 마스터 노드 다운
├─ 자동 페일오버 대기 (15-30초)
├─ 레플리카 승격 확인
└─ CLUSTER INFO로 상태 확인

시나리오 2: 마이그레이션 중단
├─ CLUSTER NODES로 MIGRATING 상태 확인
├─ 대역폭/메모리 부족 여부 확인
├─ 진행률 모니터링
└─ 필요 시 중단 후 재시도

시나리오 3: 불균형 슬롯 분배
├─ CLUSTER INFO로 슬롯 상태 확인
├─ 영향받은 노드 식별
├─ Resharding 실행
└─ 완료 후 검증

시나리오 4: 네트워크 분할 (Split Brain)
├─ 현재 마스터 수 파악
├─ Quorum 확인 (대부분의 마스터 가용)
├─ 소수 파티션의 마스터는 자동 읽기전용
└─ 네트워크 회복 후 자동 병합
```

### 15.4 백업 및 복구

```
# 백업 전략

1. 각 마스터와 레플리카에서 RDB 생성
   redis-cli -p 7000 BGSAVE

2. 생성된 dump.rdb 파일 수집
   scp -r redis_node_1:/path/to/dump.rdb ./backup/

3. 정기적 백업 (일일)
   # Cron job
   0 2 * * * redis-cli -p 7000 BGSAVE && tar -czf backup_$(date +%Y%m%d).tar.gz /var/lib/redis/

# 복구 프로세스

1. 기존 클러스터 중단
   redis-cli -p 7000 SHUTDOWN
   redis-cli -p 7001 SHUTDOWN
   ...

2. 백업 파일로 복구
   cp backup/dump.rdb /var/lib/redis/

3. 클러스터 재시작
   redis-server redis-7000.conf
   redis-server redis-7001.conf
   ...

4. 클러스터 상태 확인
   redis-cli -p 7000 CLUSTER INFO
```

### 15.5 확장 계획

```
확장 시나리오:

단계 1: 싱글 인스턴스 (개발)
└─ Redis 1개, 메모리 1GB

단계 2: Sentinel (스테이징)
└─ Master 1 + Replica 2
└─ 메모리 2-3GB

단계 3: 클러스터 (프로덕션 초기)
└─ 3 Master + 3 Replica
└─ 메모리 20-30GB
└─ 처리량: ~10만 ops/sec

단계 4: 대규모 클러스터 (대용량)
└─ 6 Master + 6 Replica
└─ 메모리 100GB+
└─ 처리량: ~100만 ops/sec

확장 체크리스트:
- [ ] 예상 데이터 크기 계산
- [ ] 필요 처리량 추정
- [ ] 가용성 요구사항 확인
- [ ] 비용 계산
- [ ] 테스트 환경 구성
- [ ] 마이그레이션 계획 수립
- [ ] 모니터링 시스템 준비
- [ ] 장애 복구 계획 수립
```

---

## 핵심 요약

### Redis 클러스터

| 개념 | 설명 |
|------|------|
| **해시슬롯** | 16384개 슬롯으로 데이터 분산 (CRC16) |
| **마이그레이션** | Resharding으로 슬롯 이동 |
| **페일오버** | 자동/수동 마스터-레플리카 전환 |
| **토폴로지** | 노드 추가/제거로 유연한 확장 |

### Redis Geo

| 명령어 | 용도 |
|--------|------|
| **GEOADD** | 위치 저장 |
| **GEOPOS** | 위치 조회 |
| **GEODIST** | 거리 계산 |
| **GEOSEARCH** | 범위 검색 (권장) |
| **GEOHASH** | 인코딩된 위치 조회 |
| **GEOSEARCHSTORE** | 검색 결과 저장 |

---

## 공식 자료

- Redis 클러스터: https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/
- Redis Geo: https://redis.io/docs/latest/develop/data-types/geospatial/
- 클러스터 스펙: https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/