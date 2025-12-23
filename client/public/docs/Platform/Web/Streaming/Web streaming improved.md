# 웹 스트리밍 완벽 가이드: 라이브 스트리밍, 영상/오디오 전송 및 수신

## 목차
1. [웹 스트리밍 기술의 진화](#웹-스트리밍-기술의-진화)
2. [스트리밍의 기본 개념](#스트리밍의-기본-개념)
3. [주요 스트리밍 프로토콜](#주요-스트리밍-프로토콜)
4. [프로토콜 비교 분석](#프로토콜-비교-분석)
5. [실제 구현 예제](#실제-구현-예제)
6. [트러블슈팅 및 최적화](#트러블슈팅-및-최적화)

---

## 웹 스트리밍 기술의 진화

### 과거: RTMP와 Flash의 시대 (2000년대~2010년대 중반)

#### RTMP가 지배하던 시대

2000년대 초, **RTMP(Real Time Messaging Protocol)**는 웹 스트리밍의 거의 유일한 표준이었습니다.

```
2005-2015년경 웹 스트리밍 구조:

OBS Studio / Webcam
    ↓
RTMP 인코딩 (TCP 1935 포트)
    ↓
Nginx + RTMP 모듈 (서버)
    ↓
Flash Player 필수 설치
    ↓
사용자 (FLV 형식 재생)
```

#### 왜 RTMP를 썼을까?

1. **유일한 실시간 스트리밍 솔루션**
   - 당시 HTTP는 실시간성이 떨어짐
   - 저지연(1-3초)이 가능한 유일한 프로토콜

2. **Flash Player의 보편화**
   - 2000년대 중후반, 거의 모든 브라우저에 Flash 플러그인 설치
   - 유튜브도 초기에 Flash 기반

3. **구현의 단순성**
   - 개발자 입장에서는 비교적 간단한 구조
   - OBS에서 RTMP URL만 입력하면 되는 수준

### RTMP가 쇠퇴한 이유

#### 1. Flash의 몰락 (2010년대 중반~후반)

```timeline
2010: Apple이 iPhone/iPad에서 Flash 지원 거부
      → 모바일 사용자 급증 (Flash 미지원)
      
2015: 대부분의 브라우저가 Flash 보안 문제로 경고 표시
      → 사용자 경험 악화
      
2020: 모든 주요 브라우저에서 Flash 완전 제거
      → RTMP 기술 사실상 죽음
```

**Flash가 거부당한 이유:**

- **보안 취약점**: 매년 수십 개의 보안 결함 발견
- **성능 문제**: CPU/배터리 소비가 많음
- **모바일 미지원**: iPhone/iPad/Android가 Flash 미지원
- **표준화 불가**: 독점 기술로 표준화 어려움
- **대체 기술 등장**: HTML5, JavaScript 발전

#### 2. 모바일 시대의 도래

```
스마트폰 사용량 추이:

2008: iPhone 출시 (Flash 미지원)
2010: 모바일 사용률 5%
2015: 모바일 사용률 50% 돌파
2023: 모바일 사용률 70% 이상

결과: Flash 기반 RTMP는 모바일에서 작동 불가능
     → 서비스 제공 불가능
```

#### 3. 브라우저 표준의 발전

```
2010년대 중반 이후 나타난 새로운 기술들:

- WebRTC: 브라우저 간 P2P 통신 (2011년 표준화)
- HTTP Live Streaming: Apple 개발 (2009년)
- DASH: 국제 표준 (2012년)
- MediaSource Extensions: 동적 버퍼링 API (2013년)

→ Flash 없이도 모든 스트리밍 기능 가능!
```

### 현재: HTTP 기반 프로토콜의 대세 (2015년~현재)

#### 왜 HTTP 기반 프로토콜로 전환했을까?

```
RTMP 시대의 문제점:
┌─────────────────────────────────────┐
│ 1. 플래시 필수 → 모바일 접속 불가  │
│ 2. 보안 문제 → 사용자 신뢰 하락     │
│ 3. 성능 저하 → 배터리 소비 많음     │
│ 4. 크로스 플랫폼 지원 불가          │
│ 5. CDN 호환성 낮음                   │
└─────────────────────────────────────┘

HTTP 기반 프로토콜의 장점:
┌─────────────────────────────────────┐
│ 1. 모든 브라우저/기기 지원          │
│ 2. 방화벽 친화적 (포트 80/443)      │
│ 3. CDN 완벽 지원 (캐싱 가능)       │
│ 4. 플러그인 불필요 (HTML5)        │
│ 5. 보안 강화 (HTTPS 가능)          │
│ 6. 표준화 (ISO/IEC 표준)            │
└─────────────────────────────────────┘
```

#### 주요 전환점

| 시기 | 사건 | 영향 |
|------|------|------|
| 2009 | Apple, HLS 개발 | 스트리밍 HTTP 기반화 시작 |
| 2011 | WebRTC 표준화 | 브라우저 네이티브 통신 가능 |
| 2012 | MPEG-DASH 표준 | 국제 표준 스트리밍 프로토콜 |
| 2014 | 유튜브, RTMP 중단 | 업계 최강자의 의사 결정 |
| 2015 | 트위치, HLS 전환 | 게임 스트리밍도 HLS로 |
| 2017 | Flash 보안 경고 증가 | 사용자 경험 급악화 |
| 2020 | 모든 브라우저 Flash 제거 | RTMP 기술 완전 사실상 폐기 |

### 웹 개발자 입장에서의 변화

#### 과거 (RTMP 시대)

```javascript
// Flash 플레이어가 필요했음
<embed src="player.swf" 
  flashvars="videoFile=rtmp://server/stream">

// 개발자가 할 일:
// 1. Flash 플레이어 배포
// 2. RTMP 서버 구축 (Nginx + RTMP 모듈)
// 3. OBS에서 RTMP 주소 설정
// 4. 모바일? → 따로 솔루션 필요
```

#### 현재 (HTTP 기반 시대)

```javascript
// 순수 HTML5 + JavaScript만으로 충분
<video id="player" controls>
  <source src="stream.m3u8" type="application/vnd.apple.mpegurl">
</video>

<script src="https://cdn.jsdelivr.net/npm/hls.js"></script>
<script>
  const hls = new Hls();
  hls.loadSource('stream.m3u8');
  hls.attachMedia(document.getElementById('player'));
</script>

// 개발자가 할 일:
// 1. 표준 HTML5 비디오 태그만 사용
// 2. HLS 라이브러리 추가 (선택)
// 3. 모든 브라우저/기기 자동 지원
// 4. CORS, HTTPS 설정만 하면 됨
```

### 현재 웹 개발자가 알아야 할 프로토콜들

```
┌─────────────────────────────────────────────────────┐
│          웹 개발자용 스트리밍 프로토콜 맵           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  일반적인 라이브/VOD 스트리밍                       │
│  ↓                                                  │
│  HLS 또는 MPEG-DASH (거의 항상 이것)               │
│  • 모든 브라우저/기기 지원                          │
│  • CDN 최적화                                       │
│  • 적응형 비트레이트                                │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  저지연이 중요한 경우                               │
│  ↓                                                  │
│  LL-HLS 또는 WebRTC                                 │
│  • 2-6초 또는 100-300ms 지연시간                    │
│  • 실시간 양방향 통신                               │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  화상 회의/실시간 통신                              │
│  ↓                                                  │
│  WebRTC (필수)                                      │
│  • 브라우저 네이티브 지원                           │
│  • P2P 통신                                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 결론: RTMP는 "옛날 기술"

**웹 개발자가 RTMP를 알아야 할까?**

| 상황 | 필요성 | 이유 |
|------|--------|------|
| 웹 개발 입문자 | ❌ 불필요 | 과거 기술, 모바일 미지원 |
| 현재 웹 서비스 개발 | ❌ 불필요 | HLS/DASH로 충분 |
| 스트리밍 서버 운영 | ⚠️ 선택 | 레거시 시스템 유지할 때만 |
| 라이브 스트리밍 송출 | ⭕ 알면 좋음 | OBS에서 RTMP 사용 가능 |
| 기술 역사 이해 | ⭕ 권장 | 산업 흐름 이해 (당신처럼!) |

**"RTMP는 역사일 뿐, 현재 웹 개발자에게는 필요 없는 기술입니다."**

---

## 스트리밍의 기본 개념

### 스트리밍이란?

스트리밍은 파일 전체를 다운로드하지 않고, **연속적으로 데이터를 전송하며 즉시 재생**하는 기술입니다. 사용자는 데이터를 받으면서 동시에 이미 받은 부분을 감상할 수 있습니다.

### HTTP/2.0의 한계

HTTP/2.0은 웹 페이지 로딩 속도 최적화에는 탁월하지만, **실시간 영상/오디오 스트리밍에는 특화된 프로토콜**이 따로 필요합니다. 그 이유는:

- **요청-응답 방식**: HTTP는 클라이언트의 요청에만 응답하므로 실시간성이 떨어짐
- **지연시간**: 일반적인 웹 통신에 비해 엄격한 저지연 요구
- **적응형 스트리밍**: 네트워크 상태에 따른 동적 품질 조절 필요

---

## 주요 스트리밍 프로토콜

### 1. HLS (HTTP Live Streaming) - 웹 개발자의 첫 선택

#### 개요

```
프로토콜: HLS
개발사: Apple
기본 포트: 80, 443
전송 방식: HTTP/HTTPS 기반
파일 형식: .m3u8 (재생목록), .ts (세그먼트)
브라우저 지원: 거의 모든 브라우저 (iOS, Android, 웹)
```

#### 특징

- Apple에서 개발한 **적응형 비트레이트 스트리밍**
- **지연시간**: 6-30초
- **거의 모든 브라우저와 기기 지원** (iOS, Android, 웹)
- HTTP 기반이므로 CDN 친화적
- **웹 개발자가 가장 많이 사용하는 프로토콜**

#### 동작 원리

```
1. 원본 영상 수신
   ↓
2. 작은 세그먼트로 분할 (보통 10초 단위)
   → segment1.ts, segment2.ts, segment3.ts, ...
   ↓
3. M3U8 재생목록 생성
   → 각 세그먼트의 순서와 정보 기록
   ↓
4. HTTP 서버에 배포
   ↓
5. 클라이언트가 M3U8 읽기
   ↓
6. 클라이언트가 .ts 파일 다운로드 및 재생
   ↓
7. 네트워크 상태에 따라 다른 품질의 .ts 선택
```

#### M3U8 재생목록 구조

```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0

#EXTINF:10.0,
segment0.ts
#EXTINF:10.0,
segment1.ts
#EXTINF:10.0,
segment2.ts
#EXTINF:10.0,
segment3.ts

#EXT-X-ENDLIST
```

**주요 태그 설명:**
- `#EXTM3U`: M3U8 파일 시작
- `#EXT-X-VERSION`: HLS 버전
- `#EXT-X-TARGETDURATION`: 각 세그먼트의 최대 지속시간
- `#EXT-X-MEDIA-SEQUENCE`: 첫 번째 세그먼트 번호
- `#EXTINF`: 세그먼트 지속시간
- `#EXT-X-ENDLIST`: 스트림 종료 (VOD의 경우)

#### 적응형 비트레이트 (다중 품질)

```m3u8
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000,RESOLUTION=1920x1080
stream-hd.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=640000,RESOLUTION=1280x720
stream-sd.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=320000,RESOLUTION=640x360
stream-ld.m3u8
```

플레이어는 네트워크 상태에 따라 가장 적절한 품질의 스트림을 자동으로 선택합니다.

#### 장점

- 네트워크 대역폭에 따른 자동 품질 조절
- 안정적인 스트리밍 (HTTP 기반)
- 광범위한 기기 호환성
- CDN을 통한 쉬운 확장
- 캐싱이 용이함
- 웹 개발자 입장에서 배우기 쉬움

#### 단점

- 상대적으로 높은 지연시간 (6-30초)
- 많은 세그먼트 생성 필요
- 서버 부하 증가 가능성

#### 언제 사용할까?

```
✓ 사용하기 좋은 상황:
  - 영화, 드라마, 뉴스 VOD
  - 대규모 라이브 스포츠 (수천 명 이상 시청)
  - 유튜브 라이브 같은 대중적 서비스
  - CDN으로 전 세계 배포 필요

✗ 사용하면 안 되는 상황:
  - 1:1 화상 회의
  - 초 단위 동기화 필요한 게임
  - 극저지연(2초 이내) 필수 요구
```

---

### 2. MPEG-DASH (Dynamic Adaptive Streaming over HTTP)

#### 개요

```
프로토콜: MPEG-DASH
표준: ISO/IEC 23009-1 (국제 표준)
기본 포트: 80, 443
전송 방식: HTTP/HTTPS 기반
파일 형식: .mpd (재생목록), .m4s (세그먼트)
```

#### 특징

- **국제 표준**이므로 벤더 독점 기술 아님
- HLS보다 더 **유연하고 정교한 적응형 스트리밍**
- 모든 비디오 코덱 지원 (H.264, H.265, VP9, AV1, 등)
- 지연시간: 6-30초

#### HLS와의 주요 차이

| 항목 | HLS | MPEG-DASH |
|------|-----|-----------|
| 표준 | Apple 독점 | 국제 표준 (ISO/IEC) |
| 재생목록 | M3U8 (텍스트) | MPD (XML) |
| 유연성 | 제한적 | 매우 유연 |
| 코덱 지원 | 제한적 | 광범위 |
| DRM | 기본 | 다양한 DRM 지원 |
| 모바일 | iOS 최적화 | 모든 기기 |

#### 장점

- 국제 표준으로 인한 호환성
- 매우 유연한 구조
- 다양한 DRM 지원
- 향후 기술 확장에 용이

#### 단점

- 구현 복잡도 높음
- 학습곡선이 가파름
- HLS보다 도구와 라이브러리 적음

#### 언제 사용할까?

```
✓ 사용하기 좋은 상황:
  - 대형 스트리밍 서비스 (Netflix 수준)
  - 다양한 DRM 보안 필요
  - 다양한 코덱 지원 필요
  - 국제 표준 준수 필요

✗ 사용하면 안 되는 상황:
  - 소규모 개발팀 (복잡도 높음)
  - 빠른 개발 필요
  - DRM 불필요
```

---

### 3. WebRTC (Web Real-Time Communication)

#### 개요

```
프로토콜: WebRTC
기반: UDP 기반 P2P 통신
지연시간: 100-300ms (매우 낮음)
통신 방식: Peer-to-Peer (직접 연결)
브라우저 지원: 모든 모던 브라우저
```

#### 특징

- 브라우저 간 **직접 피어-투-피어 통신**
- 플러그인 불필요 (표준 웹 API)
- **극저지연** (100-300ms)
- 실시간 양방향 통신 지원
- 오디오, 비디오, 데이터 채널 모두 지원

#### 아키텍처

```
클라이언트 A                STUN/TURN 서버                클라이언트 B
(브라우저)                  (네트워크 정보)                (브라우저)
    ↓                            ↓                          ↓
    └────────────────────────────────────────────────────┘
              P2P 연결 (비디오, 오디오, 데이터)
```

#### 주요 컴포넌트

1. **ICE (Interactive Connectivity Establishment)**
   - P2P 연결을 위한 경로 탐색
   - STUN과 TURN 활용

2. **STUN (Session Traversal Utilities for NAT)**
   - 공인 IP 주소 확인

3. **TURN (Traversal Using Relays around NAT)**
   - NAT 우회 중계

#### 사용 처

- 화상 회의 (1:1, 그룹)
- 소규모 라이브 스트리밍
- 실시간 양방향 채팅
- 파일 공유
- 게임 플레이

#### 기본 WebRTC 예제 (JavaScript)

```javascript
// 1. 로컬 미디어 스트림 얻기
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  console.log('로컬 스트림 획득:', stream);
  
  // 2. 로컬 비디오에 표시
  document.getElementById('localVideo').srcObject = stream;
});

// 3. Peer Connection 생성
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

// 4. 로컬 스트림 추가
stream.getTracks().forEach(track => {
  peerConnection.addTrack(track, stream);
});

// 5. 원격 스트림 수신
peerConnection.ontrack = (event) => {
  console.log('원격 스트림 수신:', event.streams[0]);
  document.getElementById('remoteVideo').srcObject = event.streams[0];
};

// 6. Offer 생성 (발신자)
peerConnection.createOffer()
  .then(offer => {
    return peerConnection.setLocalDescription(offer);
  })
  .then(() => {
    console.log('Offer 생성 완료:', peerConnection.localDescription);
    // 이 Offer를 원격지로 전송
  });

// 7. Answer 수신 (수신자)
peerConnection.setRemoteDescription(
  new RTCSessionDescription(receivedAnswer)
);
```

#### 장점

- 극저지연 (실시간 통신)
- 플러그인 불필요
- 표준 웹 API
- 브라우저 간 직접 통신
- 모든 모던 브라우저 지원

#### 단점

- 복잡한 구현 (STUN/TURN 서버 필요)
- 방화벽 통과 어려움
- 대규모 확산에 적합하지 않음 (1:N 방송 불가)

#### 언제 사용할까?

```
✓ 사용하기 좋은 상황:
  - 화상 회의
  - 1:1 실시간 통신
  - 극저지연 필수
  - 양방향 통신 필요

✗ 사용하면 안 되는 상황:
  - 대규모 라이브 방송 (1,000명 이상)
  - 일방향 스트리밍 (보기만 함)
  - 단순 VOD 서비스
```

---

### 4. Apple Low Latency HLS (LL-HLS)

#### 개요

```
프로토콜: LL-HLS
기반: HLS 확장
지연시간: 2-6초 (HLS보다 10배 이상 빠름)
표준: Apple IETF Draft
```

#### 특징

- HLS의 **저지연 버전**
- 기존 HLS보다 빠른 응답성
- Apple 기기에 최적화
- 실시간 이벤트에 특화

#### 개선사항

1. **청크 단위 전송**
   - 전체 세그먼트를 기다리지 않고 청크로 전송
   - 클라이언트가 청크 완료 전에 재생 시작 가능

2. **부분 세그먼트 지원**
   - 작은 단위의 부분 세그먼트 (200-500ms)

3. **실시간 이벤트 최적화**
   - 스포츠 경기, 라이브 뉴스에 최적

#### 장점

- HLS의 안정성 + 저지연성
- 광범위한 기기 지원
- 적응형 스트리밍 유지
- 실시간 이벤트에 최적

#### 단점

- 주로 Apple 기기 지원
- 새로운 표준이므로 도구 제한

#### 언제 사용할까?

```
✓ 사용하기 좋은 상황:
  - 라이브 스포츠 중계 (2-6초 지연 필요)
  - 라이브 뉴스 방송
  - 실시간 이벤트
  - iOS 사용자 많은 환경

✗ 사용하면 안 되는 상황:
  - VOD 서비스
  - 극저지연 필수 (WebRTC 사용)
  - Android 사용자만 있는 환경
```

---

### 5. SRT (Secure Reliable Transport)

#### 개요

```
프로토콜: SRT
기반: UDP 기반
지연시간: 100-300ms (설정 가능)
특징: 오픈소스, 방송 산업 표준
```

#### 특징

- **방송 산업 표준**
- 매우 낮은 지연시간
- UDP 기반이지만 신뢰성 보장
- 암호화 지원
- 네트워크 복구 능력 우수

#### 사용 처

- 스포츠 경기 중계
- 뉴스 라이브 송출
- 상위 브로드캐스트 링크
- 실시간 이벤트

#### 웹 개발자 입장에서의 역할

```
웹 개발자 사용 범위:

❌ 거의 사용 안 함 (브라우저 미지원)

⭕ 알면 도움이 되는 경우:
  - 라이브 스트리밍 서비스 개발
  - OBS에서 송출 설정할 때
  - 스트리밍 서버 구축할 때
```

---

### RTMP (역사적 참고용) - 현대 웹 개발에서는 사용 금지

#### 개요

```
프로토콜: RTMP
개발사: Adobe
기본 포트: 1935
전송 방식: TCP 기반
재생: Flash Player 필수 (2020년 완전 폐기됨)
```

#### 특징

- Adobe에서 개발한 실시간 스트리밍의 대명사
- **지연시간**: 1-3초 (당시에는 매우 낮음)
- 플래시 플레이어 필수 (현재 모든 브라우저에서 제거됨)

#### 왜 이제 사용 금지?

```
RTMP 폐기 타임라인:

2020.12.31: Flash 공식 종료
            → 모든 브라우저에서 Flash Player 제거
            
2021: 유튜브, 라이브 RTMP 지원 완전 종료
2021: 트위치, RTMP 직접 송출 폐기 (RTMPS만 중간 지원)
2022: 대부분의 스트리밍 플랫폼 RTMP 완전 폐기

현재 상태:
  - 브라우저에서 RTMP 재생 불가능
  - RTMP 라이브러리 유지보수 안 됨
  - 보안 취약점 패치 안 됨
  - 모바일 미지원
```

#### 현대 웹 개발자가 RTMP를 봐야 할 이유

```
1. 기술 역사 이해
   → "왜 과거 기술이 폐기되었는가"를 배우는 것

2. OBS 설정 시 인식
   → OBS에서 여전히 RTMP 옵션 보임
   → "아, 저건 서버로 송출할 때 쓰는 거구나"

3. 레거시 시스템 유지보수 (드물게)
   → 2010년대 만든 레거시 서비스 유지할 때만

결론: 알아두되, 절대 새 프로젝트에 사용하면 안 됨
```

---

## 프로토콜 비교 분석

### 프로토콜별 특성 비교

| 프로토콜 | 표준 | 지연시간 | 브라우저 지원 | 주용도 | 난이도 | 현재 추천 |
|---------|------|---------|------------|--------|--------|---------|
| **HLS** | Apple | 6-30초 | 거의 모든 브라우저 | VOD, 라이브 | 쉬움 | ⭐⭐⭐⭐⭐ |
| **MPEG-DASH** | ISO/IEC | 6-30초 | 모던 브라우저 | VOD, 라이브 | 어려움 | ⭐⭐⭐⭐ |
| **WebRTC** | W3C 표준 | 100-300ms | 모던 브라우저 | 화상 회의 | 어려움 | ⭐⭐⭐⭐⭐ |
| **LL-HLS** | Apple | 2-6초 | Safari, 모던 브라우저 | 라이브 이벤트 | 중간 | ⭐⭐⭐⭐ |
| **SRT** | 오픈소스 | 100-300ms | 특수 클라이언트 | 방송 송출 | 중간 | ⭐⭐⭐ |
| **RTMP** | Adobe (폐기됨) | 1-3초 | Flash (제거됨) | 사용 금지 | - | ❌ 절대 금지 |

### 웹 개발자를 위한 선택 가이드 (2025년 기준)

#### 상황 1: 유튜브 라이브 같은 대규모 라이브 스트리밍

```
권장: HLS (또는 MPEG-DASH)
이유:
  - CDN 완벽 지원
  - 수천 명 이상 동시 시청 가능
  - 안정적
  - 웹 개발자 배우기 쉬움

구현:
1. 원본 영상 수신
2. FFmpeg로 HLS 세그먼트 생성
3. HTTP 서버에 배포
4. HTML5 <video> 태그에 .m3u8 URL 지정
```

#### 상황 2: 화상 회의 서비스

```
권장: WebRTC (필수)
이유:
  - 브라우저 네이티브 지원
  - 극저지연 (중요!)
  - 양방향 통신 필수
  - P2P로 대역폭 효율

구현:
1. 시그널링 서버 구축 (Node.js + Socket.io)
2. WebRTC API 사용
3. 모던 브라우저만으로 구현 가능
```

#### 상황 3: 실시간 스포츠 중계 (저지연 필요)

```
권장: LL-HLS (2-6초) 또는 WebRTC
이유:
  - 일반 HLS보다 10배 빠름
  - 아직 모든 기기 완벽 지원 아님
  - WebRTC는 대규모 확산 불가

구현:
1. LL-HLS 지원 인코더/서버 필요
2. HLS와 비슷하지만 청크 단위 전송
3. Safari 먼저 지원 (모던 브라우저 점진적 추가)
```

#### 상황 4: 영화/드라마 VOD 서비스

```
권장: HLS 또는 MPEG-DASH
이유:
  - 지연시간 덜 중요 (사전 녹화)
  - 안정성 최우선
  - CDN 확장성 필요
  - 다양한 DRM 고려 시 DASH

구현:
1. 완전히 다양한 품질로 미리 인코딩
2. CDN 배포
3. DRM 필요 시 Widevine, PlayReady 등 추가
```

#### 상황 5: 소규모 팀의 간단한 라이브 스트리밍

```
권장: HLS (가장 간단)
이유:
  - 배우기 간단
  - 인코더 많음 (OBS 등)
  - 개발 복잡도 낮음
  - 모든 기기 지원

구현:
1. OBS → RTMP 송출 → Nginx + FFmpeg로 HLS 변환
2. 정적 파일로 제공
3. HTML5 플레이어로 재생
```

---

## 실제 구현 예제

### 예제 1: Node.js HLS 스트리밍 서버

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // M3U8 재생목록 제공
  if (req.url === '/stream.m3u8') {
    res.writeHead(200, { 
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache'
    });
    
    const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0

#EXTINF:10.0,
segment0.ts
#EXTINF:10.0,
segment1.ts
#EXTINF:10.0,
segment2.ts
#EXTINF:10.0,
segment3.ts
#EXTINF:10.0,
segment4.ts

#EXT-X-ENDLIST`;
    
    res.end(playlist);
  } 
  // 비디오 세그먼트 제공
  else if (req.url.endsWith('.ts')) {
    const segmentName = path.basename(req.url);
    const filePath = path.join(__dirname, 'segments', segmentName);
    
    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Segment not found');
      return;
    }
    
    res.writeHead(200, { 
      'Content-Type': 'video/mp2t',
      'Cache-Control': 'public, max-age=3600'
    });
    
    fs.createReadStream(filePath).pipe(res);
  } 
  // HTML 플레이어 페이지
  else if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>HLS 스트리밍 플레이어</title>
        <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
        <style>
          body { margin: 0; padding: 20px; background: #222; font-family: Arial; }
          video { width: 100%; max-width: 800px; border: 1px solid #999; }
          h1 { color: #fff; }
        </style>
      </head>
      <body>
        <h1>HLS 스트리밍 플레이어</h1>
        <video id="video" controls></video>
        
        <script>
          const video = document.getElementById('video');
          const videoSrc = 'http://localhost:8000/stream.m3u8';
          
          if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(videoSrc);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play();
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari에서 HLS 지원
            video.src = videoSrc;
          }
        </script>
      </body>
      </html>
    `);
  } 
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(8000, () => {
  console.log('✓ HLS 스트리밍 서버 시작: http://localhost:8000');
  console.log('✓ 세그먼트 폴더를 생성하고 .ts 파일을 추가하세요');
  console.log('  - 폴더: ./segments/');
  console.log('  - 파일: segment0.ts, segment1.ts, ...');
});
```

**서버 실행 방법:**

```bash
# 세그먼트 폴더 생성
mkdir segments

# 테스트 비디오 세그먼트 생성 (FFmpeg 필요)
ffmpeg -i input.mp4 -c:v libx264 -c:a aac -f hls -hls_time 10 \
  -hls_list_size 0 segments/segment%d.ts

# 서버 실행
node hls-server.js

# 플레이어 접속
# http://localhost:8000
```

---

### 예제 2: 적응형 비트레이트 HLS (다중 품질)

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const QUALITIES = [
  { name: 'hd', bandwidth: '5000000', resolution: '1920x1080' },
  { name: 'sd', bandwidth: '2500000', resolution: '1280x720' },
  { name: 'ld', bandwidth: '1000000', resolution: '640x360' }
];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 마스터 재생목록 (다중 품질)
  if (req.url === '/stream.m3u8') {
    res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
    
    let playlist = '#EXTM3U\n#EXT-X-VERSION:3\n';
    
    QUALITIES.forEach(q => {
      playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${q.bandwidth},RESOLUTION=${q.resolution}\n`;
      playlist += `stream-${q.name}.m3u8\n`;
    });
    
    res.end(playlist);
  }
  // 품질별 재생목록
  else if (/stream-(hd|sd|ld)\.m3u8/.test(req.url)) {
    const match = req.url.match(/stream-(hd|sd|ld)\.m3u8/);
    const quality = match[1];
    
    res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
    
    const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0

#EXTINF:10.0,
${quality}-segment0.ts
#EXTINF:10.0,
${quality}-segment1.ts
#EXTINF:10.0,
${quality}-segment2.ts

#EXT-X-ENDLIST`;
    
    res.end(playlist);
  }
  // 품질별 세그먼트
  else if (req.url.endsWith('.ts')) {
    const filePath = path.join(__dirname, 'segments', path.basename(req.url));
    
    if (!fs.existsSync(filePath)) {
      // 테스트용 더미 데이터
      res.writeHead(200, { 'Content-Type': 'video/mp2t' });
      res.end(Buffer.alloc(1000)); // 1KB 더미 데이터
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'video/mp2t' });
    fs.createReadStream(filePath).pipe(res);
  }
  // HTML 플레이어
  else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>적응형 HLS 플레이어</title>
        <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
        <style>
          body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          video { width: 100%; border: 1px solid #ddd; margin-bottom: 20px; }
          .info { background: #e8f4f8; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          .stats { font-size: 12px; color: #666; }
          h2 { color: #333; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>적응형 HLS 스트리밍 플레이어</h2>
          <video id="video" controls></video>
          
          <div class="info">
            <p><strong>현재 품질:</strong> <span id="quality">로딩중...</span></p>
            <p><strong>해상도:</strong> <span id="resolution">-</span></p>
            <p><strong>대역폭:</strong> <span id="bandwidth">-</span></p>
            <p class="stats">네트워크 상태에 따라 자동으로 품질이 조절됩니다.</p>
          </div>
        </div>
        
        <script>
          const video = document.getElementById('video');
          
          if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource('http://localhost:8000/stream.m3u8');
            hls.attachMedia(video);
            
            // 레벨 변경 모니터링
            hls.on(Hls.Events.LEVEL_SWITCHING, (data) => {
              const level = hls.levels[data.level];
              document.getElementById('resolution').textContent = 
                \`\${level.width}x\${level.height}\`;
              document.getElementById('bandwidth').textContent = 
                \`\${(level.bitrate / 1000000).toFixed(1)} Mbps\`;
            });
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play();
              document.getElementById('quality').textContent = 
                \`\${hls.levels.length}개 품질 지원\`;
            });
          }
        </script>
      </body>
      </html>
    `);
  }
});

server.listen(8000, () => {
  console.log('✓ 적응형 HLS 서버 시작: http://localhost:8000');
});
```

---

### 예제 3: 간단한 WebRTC 1:1 화상 회의

```javascript
// server.js - Node.js 서버
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

app.use(express.static('public'));

// 사용자 연결 관리
const users = new Map();

io.on('connection', (socket) => {
  console.log('새 사용자 연결:', socket.id);
  users.set(socket.id, { id: socket.id });

  // 다른 사용자에게 새 사용자 알림
  socket.broadcast.emit('user-joined', {
    userId: socket.id,
    users: Array.from(users.values())
  });

  // Offer 전송
  socket.on('offer', (data) => {
    io.to(data.to).emit('offer', {
      from: socket.id,
      offer: data.offer
    });
  });

  // Answer 전송
  socket.on('answer', (data) => {
    io.to(data.to).emit('answer', {
      from: socket.id,
      answer: data.answer
    });
  });

  // ICE 후보 전송
  socket.on('ice-candidate', (data) => {
    io.to(data.to).emit('ice-candidate', {
      from: socket.id,
      candidate: data.candidate
    });
  });

  // 연결 해제
  socket.on('disconnect', () => {
    users.delete(socket.id);
    socket.broadcast.emit('user-left', { userId: socket.id });
    console.log('사용자 연결 해제:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('✓ WebRTC 시그널링 서버: http://localhost:3000');
});
```

```html
<!-- public/index.html - 클라이언트 -->
<!DOCTYPE html>
<html>
<head>
  <title>WebRTC 화상 회의</title>
  <script src="/socket.io/socket.io.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #222;
      font-family: Arial;
      color: #fff;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 { text-align: center; }
    .videos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    video {
      width: 100%;
      background: #000;
      border: 2px solid #999;
      border-radius: 4px;
    }
    .controls {
      text-align: center;
      margin-top: 20px;
    }
    button {
      padding: 10px 20px;
      margin: 5px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover { background: #45a049; }
    .user-list {
      background: #333;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .user-list h3 { margin-top: 0; }
    .user-item {
      background: #444;
      padding: 10px;
      margin: 5px 0;
      border-radius: 4px;
      cursor: pointer;
    }
    .user-item:hover { background: #555; }
  </style>
</head>
<body>
  <div class="container">
    <h1>WebRTC 1:1 화상 회의</h1>
    
    <div class="user-list">
      <h3>온라인 사용자</h3>
      <div id="userList"></div>
    </div>

    <div class="videos">
      <div>
        <h3>내 화면</h3>
        <video id="localVideo" autoplay playsinline muted></video>
      </div>
      <div>
        <h3>상대 화면</h3>
        <video id="remoteVideo" autoplay playsinline></video>
      </div>
    </div>

    <div class="controls">
      <button onclick="startCall()">통화 시작</button>
      <button onclick="endCall()">통화 종료</button>
      <button onclick="toggleVideo()" id="videoBtn">비디오 끄기</button>
      <button onclick="toggleAudio()" id="audioBtn">오디오 끄기</button>
    </div>
  </div>

  <script>
    const socket = io();
    let peerConnection;
    let localStream;
    let remoteStream;
    let currentCall = null;

    const ICE_SERVERS = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    // 로컬 미디어 시작
    async function startMedia() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
        document.getElementById('localVideo').srcObject = localStream;
        console.log('✓ 로컬 미디어 획득');
      } catch (error) {
        console.error('미디어 접근 오류:', error);
        alert('카메라/마이크 접근 권한이 필요합니다.');
      }
    }

    // Peer Connection 초기화
    function initPeerConnection() {
      peerConnection = new RTCPeerConnection(ICE_SERVERS);

      // 로컬 스트림 추가
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });
      }

      // 원격 스트림 수신
      peerConnection.ontrack = (event) => {
        console.log('✓ 원격 스트림 수신');
        remoteStream = event.streams[0];
        document.getElementById('remoteVideo').srcObject = remoteStream;
      };

      // ICE 후보 전송
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && currentCall) {
          socket.emit('ice-candidate', {
            to: currentCall,
            candidate: event.candidate
          });
        }
      };

      // 연결 상태 모니터링
      peerConnection.onconnectionstatechange = () => {
        console.log('연결 상태:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed') {
          console.error('연결 실패');
          endCall();
        }
      };
    }

    // 통화 시작
    async function startCall() {
      const userList = document.getElementById('userList');
      const users = userList.querySelectorAll('.user-item');
      
      if (users.length === 0) {
        alert('다른 사용자가 없습니다.');
        return;
      }

      // 첫 번째 사용자와 통화
      const targetUser = users[0].getAttribute('data-user-id');
      currentCall = targetUser;

      initPeerConnection();

      try {
        const offer = await peerConnection.createOffer({
          offerToReceiveVideo: true,
          offerToReceiveAudio: true
        });
        
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', {
          to: targetUser,
          offer: offer
        });
        console.log('✓ Offer 전송:', targetUser);
      } catch (error) {
        console.error('Offer 생성 오류:', error);
      }
    }

    // 통화 종료
    function endCall() {
      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
      }
      if (document.getElementById('remoteVideo').srcObject) {
        document.getElementById('remoteVideo').srcObject = null;
      }
      currentCall = null;
      console.log('✓ 통화 종료');
    }

    // 비디오 토글
    function toggleVideo() {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        document.getElementById('videoBtn').textContent = 
          videoTrack.enabled ? '비디오 끄기' : '비디오 켜기';
      }
    }

    // 오디오 토글
    function toggleAudio() {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        document.getElementById('audioBtn').textContent = 
          audioTrack.enabled ? '오디오 끄기' : '오디오 켜기';
      }
    }

    // Socket 이벤트 리스너
    socket.on('user-joined', (data) => {
      console.log('새 사용자 접속:', data.users);
      updateUserList(data.users);
    });

    socket.on('user-left', (data) => {
      console.log('사용자 퇴장:', data.userId);
      if (currentCall === data.userId) {
        endCall();
      }
    });

    socket.on('offer', async (data) => {
      console.log('✓ Offer 수신:', data.from);
      currentCall = data.from;
      
      initPeerConnection();

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('answer', {
          to: data.from,
          answer: answer
        });
        console.log('✓ Answer 전송');
      } catch (error) {
        console.error('Answer 생성 오류:', error);
      }
    });

    socket.on('answer', async (data) => {
      console.log('✓ Answer 수신:', data.from);
      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      } catch (error) {
        console.error('Answer 처리 오류:', error);
      }
    });

    socket.on('ice-candidate', async (data) => {
      try {
        if (peerConnection && data.candidate) {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (error) {
        console.error('ICE 후보 추가 오류:', error);
      }
    });

    // 사용자 목록 업데이트
    function updateUserList(users) {
      const userList = document.getElementById('userList');
      userList.innerHTML = '';
      
      users.forEach(user => {
        if (user.id !== socket.id) {
          const userItem = document.createElement('div');
          userItem.className = 'user-item';
          userItem.setAttribute('data-user-id', user.id);
          userItem.textContent = \`사용자: \${user.id.substring(0, 8)}...\`;
          userList.appendChild(userItem);
        }
      });
    }

    // 초기화
    startMedia();
  </script>
</body>
</html>
```

**WebRTC 서버 실행:**

```bash
npm install express socket.io

node server.js

# 브라우저에서 http://localhost:3000 접속 (2개 탭 열기)
```

---

### 예제 4: 오디오 스트리밍 (WebAudio API)

```javascript
// 라이브 오디오 수신 및 처리
class AudioStreamer {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sourceNode = null;
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
  }

  // 마이크 오디오 스트림 시작
  async startMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      
      const sourceNode = this.audioContext.createMediaStreamSource(stream);
      sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      console.log('✓ 마이크 오디오 시작');
      return stream;
    } catch (error) {
      console.error('마이크 접근 오류:', error);
    }
  }

  // 음성 데이터 분석 (음량 시각화)
  getAudioData() {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // 음성 감지 (음성 활동 감지, VAD)
  isVoiceActive(threshold = 30) {
    const dataArray = this.getAudioData();
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    return average > threshold;
  }

  // 오디오 스트림 정지
  stopMicrophone(stream) {
    stream.getTracks().forEach(track => track.stop());
    console.log('✓ 마이크 오디오 정지');
  }
}

// 사용 예제
const streamer = new AudioStreamer();

// 실시간 음량 시각화
async function visualizeAudio() {
  const stream = await streamer.startMicrophone();
  const canvas = document.getElementById('audioCanvas');
  const ctx = canvas.getContext('2d');

  function draw() {
    const dataArray = streamer.getAudioData();
    
    ctx.fillStyle = 'rgb(200, 200, 200)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgb(0, 100, 200)';
    
    const barWidth = canvas.width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth;
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// 음성 활동 감지
setInterval(() => {
  if (streamer.isVoiceActive(30)) {
    console.log('음성 감지됨');
  }
}, 100);
```

---

### 예제 5: FFmpeg를 사용한 HLS 생성

```bash
# 1. 단순 HLS 변환
ffmpeg -i input.mp4 \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 128k \
  -f hls -hls_time 10 -hls_list_size 0 \
  output/stream.m3u8

# 2. 적응형 비트레이트 HLS (다중 품질)
# 1080p
ffmpeg -i input.mp4 \
  -c:v libx264 -s 1920x1080 -b:v 5000k -preset medium \
  -c:a aac -b:a 128k \
  -f hls -hls_time 10 -hls_list_size 0 \
  output/stream-1080p.m3u8 &

# 720p
ffmpeg -i input.mp4 \
  -c:v libx264 -s 1280x720 -b:v 2500k -preset medium \
  -c:a aac -b:a 128k \
  -f hls -hls_time 10 -hls_list_size 0 \
  output/stream-720p.m3u8 &

# 360p
ffmpeg -i input.mp4 \
  -c:v libx264 -s 640x360 -b:v 1000k -preset medium \
  -c:a aac -b:a 96k \
  -f hls -hls_time 10 -hls_list_size 0 \
  output/stream-360p.m3u8

# 3. 라이브 스트리밍 (카메라 입력)
ffmpeg -f dshow -i video="Camera" -f dshow -i audio="Microphone" \
  -c:v libx264 -preset ultrafast -b:v 2500k \
  -c:a aac -b:a 128k \
  -f hls -hls_time 10 -hls_list_size 3 \
  rtmp://localhost:1935/live/stream

# 4. 화면 녹화 HLS 스트리밍 (Windows)
ffmpeg -f gdigrab -i desktop \
  -c:v libx264 -preset ultrafast -b:v 2500k \
  -f hls -hls_time 10 -hls_list_size 3 \
  output/screen.m3u8
```

---

## 트러블슈팅 및 최적화

### 일반적인 문제와 해결책

#### 1. 높은 지연시간 (Latency)

**문제:** HLS 스트리밍의 지연시간이 30초 이상

**원인 및 해결:**
```
원인 1: 세그먼트 길이가 너무 김
해결: 세그먼트 길이를 6-10초로 단축
ffmpeg ... -hls_time 6 ...

원인 2: 버퍼 설정 과다
해결: 클라이언트 버퍼 크기 조정
// HLS.js 설정
const hls = new Hls({
  maxBufferLength: 30,        // 30초 버퍼
  maxMaxBufferLength: 50,     // 최대 50초
  lowLatencyMode: true        // 저지연 모드
});

원인 3: 네트워크 지연
해결: LL-HLS 또는 WebRTC 사용, CDN 배포
```

#### 2. 재생 끊김 (Buffering)

**문제:** 영상이 자주 멈춤

**원인 및 해결:**
```
원인 1: 네트워크 대역폭 부족
해결: 인코딩 비트레이트 조정
ffmpeg ... -b:v 1000k ...  (1Mbps로 감소)

원인 2: 서버 부하
해결: 로드 밸런싱, CDN 사용

원인 3: 클라이언트 성능 부족
해결: 낮은 해상도 선택, 다른 기기 사용
```

#### 3. 동기화 문제 (A/V Sync)

**문제:** 오디오와 비디오가 맞지 않음

**원인 및 해결:**
```
// FFmpeg 인코딩 시 명시적 동기화
ffmpeg -i input.mp4 \
  -c:v libx264 -vsync vfr \    # 비디오 프레임 동기화
  -c:a aac \
  -async 1 \                    # 오디오 동기화
  output.mp4
```

#### 4. 플레이어 호환성 문제

**문제:** 특정 브라우저에서 재생 안 됨

**해결:**
```html
<!-- 다양한 형식 지원 -->
<video controls>
  <source src="stream.m3u8" type="application/vnd.apple.mpegurl">
  <source src="stream.mpd" type="application/dash+xml">
  <source src="stream.mp4" type="video/mp4">
  브라우저가 지원하지 않습니다.
</video>

<!-- HLS.js 폴백 -->
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script src="https://cdn.dashjs.org/latest/dash.all.min.js"></script>
<script>
  const video = document.getElementById('video');
  
  // HLS 지원
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource('stream.m3u8');
    hls.attachMedia(video);
  }
  // DASH 지원
  else if (dashjs.supportsMediaSource()) {
    const dash = dashjs.MediaPlayer().create();
    dash.initialize(video, 'stream.mpd', true);
  }
  // 기본 HTML5 비디오
  else {
    video.src = 'stream.mp4';
  }
</script>
```

### 성능 최적화 팁

#### 1. 인코딩 최적화

```bash
# 중간 품질 (균형잡힌 속도)
ffmpeg -i input.mp4 \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 128k \
  output.mp4

# 빠른 인코딩 (라이브 방송)
ffmpeg -i input.mp4 \
  -c:v libx264 -preset ultrafast -crf 28 \
  -c:a aac -b:a 96k \
  output.mp4

# 높은 품질
ffmpeg -i input.mp4 \
  -c:v libx264 -preset slow -crf 18 \
  -c:a aac -b:a 192k \
  output.mp4
```

#### 2. 대역폭 적응 (ABR)

```javascript
// HLS.js 자동 품질 조정
const hls = new Hls({
  abrEwmaFastLive: 0.5,      // 실시간 빠른 적응
  abrEwmaSlowLive: 0.9,      // 실시간 느린 적응
  maxAutoLevel: 3,            // 최대 3개 레벨만 사용
  startLevel: 1               // 1번 레벨부터 시작 (중간 품질)
});
```

#### 3. CDN 활용

```nginx
# Nginx를 CDN으로 사용
http {
  server {
    listen 80;
    
    # 캐싱 설정
    location ~* \\.m3u8$ {
      add_header Cache-Control "no-cache, no-store";
      proxy_pass http://origin-server;
    }
    
    location ~* \\.ts$ {
      add_header Cache-Control "public, max-age=3600";
      proxy_cache my_cache;
      proxy_pass http://origin-server;
    }
    
    # gzip 압축
    gzip on;
    gzip_types application/vnd.apple.mpegurl text/plain;
  }
}
```

---

## 결론

### 현대 웹 개발자가 알아야 할 것

```
❌ 절대 배우지 말아야 할 것:
  - RTMP (이미 사라짐)
  - Flash 기반 기술
  - 2010년대 이전 스트리밍 기술

⭕ 반드시 배워야 할 것:
  1. HLS (필수) - 대부분의 경우 첫 선택
  2. WebRTC (필수) - 실시간 양방향 통신
  3. MPEG-DASH (권장) - 대형 서비스 개발 시

⚠️ 알면 좋을 것:
  1. LL-HLS - 저지연 라이브 필요 시
  2. SRT - 방송 국을 이해할 때
  3. FFmpeg - 비디오 인코딩 필요 시
```

### 빠른 시작 가이드

**"지금 바로 라이브 스트리밍 서비스를 만들고 싶다면?"**

```
1단계: HLS 이해하기
  → .m3u8 재생목록, .ts 세그먼트 구조 이해

2단계: FFmpeg 설치
  → 비디오를 HLS 세그먼트로 변환

3단계: Node.js 서버 구축
  → 기본 예제로 충분 (위 예제 1 참고)

4단계: HTML5 플레이어 추가
  → HLS.js 라이브러리로 재생

5단계: 배포
  → CDN으로 확장 가능
```

### 웹 개발자로서의 방향성

```
RTMP 폐기 이유를 이해하면...
↓
"왜 이 기술이 필요한가?"를 묻게 되고
↓
"웹 표준이 무엇인가?"를 배우게 되고
↓
"더 나은 기술 선택"이 가능해집니다.

당신의 질문이 정말 좋은 질문이었습니다! 🎓
```