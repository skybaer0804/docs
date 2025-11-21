# HTTP/2.0 완벽 가이드: 이해와 구현

## 목차
1. [HTTP/2.0 개요](#개요)
2. [HTTP/1.1과의 비교](#http11과의-비교)
3. [HTTP/2.0의 핵심 특징](#http20의-핵심-특징)
4. [크롬 브라우저에서 프로토콜 확인하기](#크롬-브라우저에서-프로토콜-확인하기)
5. [백엔드 구현 (Node.js/Express)](#백엔드-구현)
6. [React 프론트엔드 구현](#react-프론트엔드-구현)
7. [HTTP/2.0 구현 코드 예제](#구현-코드-예제)
8. [영상/오디오 스트리밍 프로토콜](#영상오디오-스트리밍-프로토콜)
9. [HTTP/3.0 소개](#http30-소개)

---

## 개요

**HTTP/2.0**은 2015년 발표된 HTTP 프로토콜의 두 번째 메이저 버전으로, HTTP/1.1의 성능 저하 문제를 해결하기 위해 설계되었습니다. HTTP/1.1의 개념과 의미론을 유지하면서도 **전송 계층의 구현을 완전히 개선**한 프로토콜입니다.

### 성능 향상
일반적으로 HTTP/2.0을 사용만 해도 웹 응답 속도가 HTTP/1.1 대비 **15~50% 향상**됩니다.

### 개발 배경
- **원조: SPDY 프로토콜** - 2009년 Google에서 개발한 프로토콜
- SPDY의 성공적인 성능 개선으로 인해 IETF HTTP 작업그룹이 HTTP/2 표준화 추진
- 2012~2015년 3년간의 개발 과정을 거쳐 공식 표준 발행

---

## HTTP/1.1과의 비교

| 항목 | HTTP/1.1 | HTTP/2.0 |
|------|----------|----------|
| **전송 방식** | 텍스트 기반 | 바이너리 프레이밍 |
| **다중 요청 처리** | 순차적 처리 (HOLB 문제) | 멀티플렉싱 (병렬 처리) |
| **연결** | 요청마다 새 커넥션 필요 | 단일 TCP 연결 유지 |
| **헤더 압축** | 미지원 (중복 헤더 낭비) | HPACK 압축 지원 |
| **서버 푸시** | 미지원 | 지원 (리소스 사전 전송) |
| **우선순위 설정** | 미지원 | 스트림 우선순위 지원 |
| **성능** | 느림 (여러 커넥션 필요) | 빠름 (단일 커넥션, 병렬 처리) |

### HTTP/1.1의 문제점

**1. Head of Line Blocking (HOLB)**
- 하나의 TCP 연결에서 한 번에 하나의 파일만 전송 가능
- 선행 파일의 전송이 지연되면 뒤의 파일들도 대기 상태 발생
- 파이프라이닝으로 개선 시도했으나 HOLB 문제 여전함

**2. 리소스 낭비**
- 요청마다 새로운 TCP 연결을 만들어야 함
- 핸드셰이크 오버헤드 발생
- 헤더 정보가 압축되지 않아 메모리 낭비

**3. 비효율적인 병렬 요청**
- 수십~수백 개의 요청 처리 시 다중 TCP 연결 필요
- 매번 Keep-Alive로 연결 유지 필요
- 브라우저의 연결 수 제한으로 인한 병목 현상

---

## HTTP/2.0의 핵심 특징

### 1. Binary Framing Layer (바이너리 프레이밍)

HTTP/1.1은 텍스트 기반이었으나 HTTP/2는 **모든 메시지를 바이너리 프레임으로 인코딩**합니다.

```
┌─────────────────┐
│ 바이너리 프레임  │ ← 3 bytes: 길이
├─────────────────┤
│ Frame Type      │ ← 1 byte: 프레임 타입
├─────────────────┤
│ Flags           │ ← 1 byte: 플래그
├─────────────────┤
│ Stream ID       │ ← 4 bytes: 스트림 식별자
├─────────────────┤
│ Frame Payload   │ ← 실제 데이터
└─────────────────┘
```

**장점:**
- 데이터 파싱 속도 증가
- 오류 발생 가능성 감소
- 헤더와 바디가 layer로 구분되어 명확한 경계

### 2. Stream과 Frame 단위 통신

HTTP/2는 요청/응답을 더 작은 단위로 분해합니다.

```
Connection (TCP 연결 1개)
├── Stream 1 (요청/응답)
│   ├── HEADERS Frame
│   ├── DATA Frame
│   └── DATA Frame
├── Stream 3 (동시 처리)
│   ├── HEADERS Frame
│   └── DATA Frame
└── Stream 5 (동시 처리)
    ├── HEADERS Frame
    ├── DATA Frame
    └── DATA Frame
```

**용어 정의:**
- **Frame**: 통신의 최소 단위 (HEADERS 또는 DATA)
- **Message**: 요청/응답으로 다수의 Frame으로 구성
- **Stream**: Connection 내에서 양방향 메시지 흐름
- **Connection**: 클라이언트-서버 간 TCP 연결

**특징:**
- 모든 스트림은 31비트의 고유한 식별자 보유
- 클라이언트 생성 스트림: 홀수 ID
- 서버 생성 스트림: 짝수 ID
- 한 번 사용한 ID는 재사용 불가

### 3. Multiplexing (멀티플렉싱)

**정의:** 바이너리 프레임으로 분해된 메시지를 단일 TCP 연결에서 **응답 순서에 관계없이** 동시에 주고받는 방식

```
HTTP/1.1 통신 방식:
요청1 → TCP 연결1 → (대기) → 응답1 → 요청2 → TCP 연결2 → 응답2
(비효율적: 여러 연결 필요, 대기 시간 발생)

HTTP/2.0 통신 방식:
요청1,2,3,4 → (단일 TCP 연결) → 응답1,2,3,4 (순서 무관)
(효율적: 단일 연결, 병렬 처리)
```

**이점:**
- RTT (Round Trip Time) 감소
- 네트워크 효율 향상
- 특히 클라우드 시스템에서 비용 감소

### 4. Server Push (서버 푸시)

클라이언트의 요청을 받은 후, 미래에 필요할 리소스를 **서버가 먼저 전송**하는 기능입니다.

```
클라이언트 요청: index.html
↓
서버 분석: "이 HTML은 style.css, script.js, image.png를 사용함"
↓
서버가 자동으로 푸시:
- style.css 먼저 전송
- script.js 먼저 전송
- image.png 먼저 전송
↓
클라이언트의 브라우저 캐시에 미리 저장
↓
HTML 파싱 후 리소스 필요 시 이미 캐시된 리소스 사용
```

**효과:**
- 클라이언트가 HTML을 파싱하고 리소스를 다시 요청하는 대기시간 제거
- 총 로드 시간 감소
- 네트워크 트래픽 및 RTT 감소

### 5. Stream Prioritization (스트림 우선순위)

여러 요청을 동시에 처리할 때 **리소스 간의 우선순위**를 설정합니다.

```
우선순위 지정 트리:
1-256 가중치 설정 (높을수록 우선)
├── CSS 파일 (가중치: 256) ← 가장 먼저 처리
├── 이미지 (가중치: 128)
└── JS 파일 (가중치: 64)
```

**방식:**
- 클라이언트가 각 요청 자원에 1-256 가중치 지정
- 서버가 높은 우선순위 응답을 먼저 전달
- 최신 브라우저는 자동으로 최적의 우선순위 결정
  - 리소스 종류
  - 페이지 로드 위치
  - 이전 방문 기록 기반

### 6. HTTP Header Data Compression (HPACK 압축)

HTTP 메시지의 **헤더를 압축**하여 전송하고, 중복 헤더를 최적화합니다.

```
HTTP/1.1 (압축 없음):
Header1: value1          ← 압축 안 됨
Header2: value2
Header1: value1          ← 중복된 헤더 재전송
Header3: value3

HTTP/2.0 (HPACK 압축):
- Static Header Table: 공통 헤더는 인덱스로 참조
- Dynamic Header Table: 이전 요청 헤더 캐싱
- Huffman Encoding: 중복되지 않은 헤더 호프만 인코딩 압축
```

**결과:** 헤더 크기 **50-90% 감소**

---

## 크롬 브라우저에서 프로토콜 확인하기

### 단계별 확인 방법

**1단계: 개발자 도구 열기**
- **Windows/Linux:** `F12` 또는 `Ctrl + Shift + I`
- **macOS:** `Cmd + Option + I`

**2단계: Network 탭 선택**
- 개발자 도구에서 "Network" 탭 클릭

**3단계: Protocol 열 활성화**
- Network 탭의 열 헤더 영역에서 우클릭
- "Protocol" 항목 체크 (활성화)

**4단계: 웹사이트 새로고침**
- `F5` 또는 `Cmd + R`로 페이지 새로고침

**5단계: Protocol 열 확인**
- **h2**: HTTP/2 사용
- **http/1.1**: HTTP/1.1 사용
- **http/3**: HTTP/3 사용

### 예시 화면
```
Name          | Method | Status | Type       | Protocol
--------------|--------|--------|------------|----------
index.html    | GET    | 200    | document   | h2
style.css     | GET    | 200    | stylesheet | h2
script.js     | GET    | 200    | script     | h2
image.png     | GET    | 200    | image      | h2
api/data      | GET    | 200    | xhr        | h2
```

### curl 명령어로 확인

```bash
# HTTP/1.1 요청
curl -I --http1.1 https://example.com 2>/dev/null | grep HTTP

# HTTP/2 요청
curl -I --http2 https://example.com 2>/dev/null | grep HTTP

# HTTP/3 요청
curl -I --http3 https://example.com 2>/dev/null | grep HTTP
```

---

## 백엔드 구현

### Node.js + Express에서 HTTP/2.0 설정

#### 1. 기본 설정 방법

**필수 요구사항:**
- SSL/TLS 인증서 (HTTPS 필수)
- Node.js 내장 `http2` 모듈

**설치 및 인증서 생성:**

```bash
# 프로젝트 초기화
npm init -y

# Express 설치 (옵션)
npm install express

# 자가 서명 인증서 생성 (개발 용도)
openssl req -x509 -newkey rsa:2048 -keyout server.key -out server.cert -days 365 -nodes
```

#### 2. Express 없이 기본 HTTP/2 서버

```javascript
const http2 = require('http2');
const fs = require('fs');

// SSL 인증서 읽기
const options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.cert')
};

// HTTP/2 보안 서버 생성
const server = http2.createSecureServer(options, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.write('<h1>HTTP/2.0 서버에 오신 것을 환영합니다!</h1>');
  res.end();
});

server.listen(443, () => {
  console.log('HTTP/2 서버가 포트 443에서 실행 중입니다.');
});
```

#### 3. Express와 함께 HTTP/2 서버

```javascript
const http2 = require('http2');
const spdy = require('spdy');
const express = require('express');
const fs = require('fs');

const app = express();

// 미들웨어 설정
app.use(express.json());

// 라우트 설정
app.get('/', (req, res) => {
  res.json({ message: 'HTTP/2.0 서버 응답' });
});

app.get('/api/data', (req, res) => {
  res.json({ 
    data: '샘플 데이터',
    protocol: 'HTTP/2.0'
  });
});

// SSL 옵션
const options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.cert')
};

// HTTP/2 서버 생성 (spdy 사용)
spdy.createServer(options, app)
  .listen(443, () => {
    console.log('HTTP/2 + Express 서버가 포트 443에서 실행 중입니다.');
  });
```

**spdy 설치:**
```bash
npm install spdy
```

#### 4. 서버 푸시 구현

```javascript
const http2 = require('http2');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.cert')
};

const server = http2.createSecureServer(options, (req, res) => {
  // 메인 HTML 요청
  if (req.url === '/') {
    // 클라이언트에게 푸시할 리소스 정의
    res.pushStream('/style.css', {}, (err, pushRes) => {
      if (!err) {
        pushRes.end(fs.readFileSync('./style.css'));
      }
    });

    res.pushStream('/script.js', {}, (err, pushRes) => {
      if (!err) {
        pushRes.end(fs.readFileSync('./script.js'));
      }
    });

    // 메인 HTML 응답
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync('./index.html'));
  }

  // CSS 요청
  if (req.url === '/style.css') {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(fs.readFileSync('./style.css'));
  }

  // JS 요청
  if (req.url === '/script.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(fs.readFileSync('./script.js'));
  }
});

server.listen(443, () => {
  console.log('HTTP/2 서버 푸시 활성화: 포트 443');
});
```

#### 5. Nginx에서 HTTP/2 설정

```nginx
# /etc/nginx/nginx.conf
server {
    listen 443 ssl http2;  # HTTP/2 활성화
    server_name example.com;

    # SSL 인증서
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # HTTP/2 푸시 설정
    http2_push_preload on;

    location / {
        proxy_pass http://backend;
        
        # 헤더 최적화
        proxy_set_header Connection "";
        proxy_http_version 1.1;
    }

    location ~* \.(css|js|png|jpg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Nginx 재시작:**
```bash
sudo nginx -t  # 설정 검증
sudo systemctl restart nginx
```

---

## React 프론트엔드 구현

### React에서 HTTP/2 사용하기

React는 **HTTP/2를 자동으로 지원**합니다. 프로토콜 선택은 브라우저와 서버가 협상하므로 개발자가 별도로 설정할 필요가 없습니다.

#### 1. 기본 HTTP 요청 (axios)

```javascript
import axios from 'axios';
import { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // HTTP/2를 지원하는 서버에 요청 시
    // 자동으로 HTTP/2 프로토콜 사용
    axios.get('https://api.example.com/data')
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('요청 실패:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>로딩 중...</div>;
  return <div>{JSON.stringify(data)}</div>;
}

export default App;
```

#### 2. Fetch API 사용

```javascript
import { useEffect, useState } from 'react';

function DataComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('https://api.example.com/data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // HTTP/2는 자동으로 사용됨
    })
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error(err));
  }, []);

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

export default DataComponent;
```

#### 3. 여러 동시 요청 (HTTP/2 멀티플렉싱 활용)

```javascript
import { useEffect, useState } from 'react';
import axios from 'axios';

function MultipleRequests() {
  const [results, setResults] = useState({});

  useEffect(() => {
    // HTTP/2 멀티플렉싱으로 동시에 처리됨
    Promise.all([
      axios.get('https://api.example.com/users'),
      axios.get('https://api.example.com/posts'),
      axios.get('https://api.example.com/comments'),
      axios.get('https://api.example.com/images')
    ])
      .then(([users, posts, comments, images]) => {
        setResults({
          users: users.data,
          posts: posts.data,
          comments: comments.data,
          images: images.data
        });
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
}

export default MultipleRequests;
```

#### 4. React 프로젝트에서 개발 서버 HTTP/2 설정

**Vite 사용:**

```javascript
// vite.config.js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('./server.key'),
      cert: fs.readFileSync('./server.cert')
    },
    http2: true,
    port: 3000
  }
});
```

**Create React App (CRA):**
- CRA는 기본적으로 개발 서버가 HTTP/1.1 사용
- 프로덕션 빌드 시 HTTPS 설정된 서버에서 HTTP/2 지원

```bash
# 환경 변수 설정
export HTTPS=true
export PORT=3000

# 개발 서버 실행
npm start
```

#### 5. 라이브러리 추천

| 라이브러리 | 설명 | HTTP/2 지원 |
|-----------|------|-----------|
| **axios** | 인기 있는 HTTP 클라이언트 | ✅ 자동 |
| **fetch** | 브라우저 내장 API | ✅ 자동 |
| **react-query** | 데이터 페칭 및 캐싱 | ✅ 자동 |
| **SWR** | 데이터 페칭 라이브러리 | ✅ 자동 |

---

## 구현 코드 예제

### 간단한 HTTP/2.0 서버 푸시 예제

**파일 구조:**
```
project/
├── server.js
├── server.key
├── server.cert
├── index.html
├── style.css
└── script.js
```

**server.js:**
```javascript
const http2 = require('http2');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync(path.join(__dirname, 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
};

const server = http2.createSecureServer(options, (req, res) => {
  console.log(`요청: ${req.url}`);

  // 루트 경로: HTML 파일 응답 및 리소스 푸시
  if (req.url === '/') {
    // CSS 푸시
    res.pushStream('/style.css', {}, (err, pushRes) => {
      if (!err) {
        pushRes.writeHead(200, { 'Content-Type': 'text/css' });
        pushRes.end(fs.readFileSync(path.join(__dirname, 'style.css')));
        console.log('✓ style.css 푸시됨');
      }
    });

    // JavaScript 푸시
    res.pushStream('/script.js', {}, (err, pushRes) => {
      if (!err) {
        pushRes.writeHead(200, { 'Content-Type': 'application/javascript' });
        pushRes.end(fs.readFileSync(path.join(__dirname, 'script.js')));
        console.log('✓ script.js 푸시됨');
      }
    });

    // HTML 응답
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
    console.log('✓ index.html 응답됨');
  }
  // 개별 파일 요청
  else if (req.url === '/style.css') {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(fs.readFileSync(path.join(__dirname, 'style.css')));
  } else if (req.url === '/script.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(fs.readFileSync(path.join(__dirname, 'script.js')));
  } else {
    res.writeHead(404);
    res.end('찾을 수 없음');
  }
});

server.listen(443, () => {
  console.log('🚀 HTTP/2 서버가 https://localhost:443 에서 실행 중입니다.');
});
```

**index.html:**
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTTP/2.0 데모</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="container">
    <h1>HTTP/2.0 서버 푸시 데모</h1>
    <p>이 페이지의 CSS와 JavaScript는 서버 푸시로 미리 전송되었습니다!</p>
    <button id="btn">클릭하세요</button>
  </div>
  <script src="/script.js"></script>
</body>
</html>
```

**style.css:**
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 500px;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

p {
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
}

button {
  padding: 12px 30px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background: #764ba2;
}
```

**script.js:**
```javascript
document.getElementById('btn').addEventListener('click', function() {
  alert('HTTP/2.0 멀티플렉싱으로 효율적으로 전송되었습니다!');
  console.log('프로토콜 확인: 크롬 개발자 도구 > Network 탭 > Protocol 열');
});

console.log('%cHTTP/2.0 서버 푸시 데모', 'font-size: 20px; color: #667eea;');
console.log('개발자 도구 Network 탭에서 Protocol 열을 확인하세요!');
```

**실행 방법:**
```bash
# 포트 443 권한 필요 (Linux/Mac의 경우)
sudo node server.js

# 또는 포트 3000 사용
# server.js에서 server.listen(3000) 변경 후
node server.js
```

---

## 영상/오디오 스트리밍 프로토콜

HTTP/2.0은 웹 페이지 속도에 최적화되었으나, **실시간 영상/오디오 스트리밍에는 특화된 프로토콜**이 따로 있습니다.

### 1. RTMP (Real Time Messaging Protocol)

```
특징:
- Adobe에서 개발한 실시간 스트리밍 프로토콜
- 지연시간: 1-3초 (낮음)
- 플래시 플레이어 필수 (현재 deprecated)

흐름:
OBS Studio → RTMP 인코딩 → Nginx/RTMP 모듈 → FLV 변환
```

**사용 사례:**
- 라이브 방송 송출
- 게임 스트리밍 (과거)
- 실시간 이벤트

### 2. HLS (HTTP Live Streaming)

```
특징:
- Apple에서 개발한 적응형 비트레이트 스트리밍
- 지연시간: 6-30초
- 모든 브라우저/기기 지원

구조:
원본 영상 → 세그먼트 분할 (.ts 파일)
         → M3U8 재생목록 생성
         → 클라이언트가 M3U8 읽고 .ts 다운로드

방식:
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:9.9,
segment1.ts
#EXTINF:9.9,
segment2.ts
#EXTINF:9.9,
segment3.ts
```

**장점:**
- 네트워크 상태에 따라 자동 품질 조절
- 안정적인 스트리밍
- 광범위한 브라우저 지원

**단점:**
- 지연시간 길음
- 많은 세그먼트 필요

### 3. MPEG-DASH (Dynamic Adaptive Streaming over HTTP)

```
특징:
- 국제 표준 (ISO/IEC)
- 모든 비디오 코덱 지원 (H.264, H.265, VP9, AV1)
- 지연시간: 6-30초

HLS와의 차이:
- 더 유연한 적응형 스트리밍
- MPD (Media Presentation Description) 사용
- 다양한 DRM 지원
```

### 4. WebRTC

```
특징:
- 브라우저 간 직접 통신
- 지연시간: 100-300ms (매우 낮음)
- P2P 방식

사용 처:
- 화상 회의
- 소규모 라이브 스트리밍
- 실시간 양방향 통신
```

### 5. Apple Low Latency HLS (LL-HLS)

```
특징:
- HLS의 저지연 버전
- 지연시간: 2-6초
- 최신 표준

개선사항:
- 청크 단위 전송
- 부분 세그먼트 지원
- 실시간 이벤트 최적화
```

### 스트리밍 프로토콜 비교

| 프로토콜 | 기술 | 지연시간 | 브라우저 지원 | 용도 |
|---------|------|---------|------------|------|
| **RTMP** | TCP 기반 | 1-3초 | Flash (deprecated) | 라이브 송출 |
| **HLS** | HTTP 기반 | 6-30초 | 모든 브라우저 | VOD, 라이브 |
| **MPEG-DASH** | HTTP 기반 | 6-30초 | 모던 브라우저 | VOD, 라이브 |
| **WebRTC** | P2P 통신 | 100-300ms | 모던 브라우저 | 화상 회의, 실시간 채팅 |
| **LL-HLS** | HTTP 기반 | 2-6초 | Safari, 모던 브라우저 | 실시간 라이브 이벤트 |
| **SRT** | UDP 기반 | 100-300ms | 특수 클라이언트 | 스포츠, 뉴스 송출 |

### 실제 구현 예 (Node.js + HLS)

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  if (req.url === '/stream.m3u8') {
    // HLS 재생목록 제공
    res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
    const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
segment1.ts
#EXTINF:10.0,
segment2.ts
#EXTINF:10.0,
segment3.ts
#EXT-X-ENDLIST`;
    res.end(playlist);
  } else if (req.url.endsWith('.ts')) {
    // 비디오 세그먼트 제공
    const filePath = path.join(__dirname, 'segments', req.url);
    res.writeHead(200, { 'Content-Type': 'video/mp2t' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(8000, () => {
  console.log('HLS 스트리밍 서버: http://localhost:8000/stream.m3u8');
});
```

---

## HTTP/3.0 소개

### 핵심 개념

**HTTP/3은 TCP를 버리고 UDP 기반의 QUIC 프로토콜을 사용합니다.**

```
HTTP/1.1, HTTP/2: TCP 기반
HTTP/3: UDP 기반 (QUIC)
```

### TCP의 문제점 (HTTP/2가 해결하지 못한 부분)

**1. 3-Way Handshake 오버헤드**
```
TCP: SYN → SYN-ACK → ACK (3번의 왕복, ~100ms)
TLS: Client Hello → Server Hello → ... (추가 왕복)
총 2-3 RTT 소비
```

**2. TCP Head of Line Blocking**
```
TCP는 패킷이 순서대로 처리되어야 함
중간 패킷 손실 시 뒤의 모든 패킷 대기
(HTTP/2의 멀티플렉싱도 해결 불가)
```

### QUIC (Quick UDP Internet Connections)의 장점

#### 1. 0-RTT Connection

```
기존 방식:
클라이언트 → (1 RTT) → 서버 연결
클라이언트 → (1 RTT) → TLS 협상
클라이언트 → (1 RTT) → 데이터 전송
총 3 RTT 필요

QUIC 방식:
클라이언트 → (0 RTT) → 연결 + TLS + 데이터 동시 전송
총 0 RTT (초기 연결만)
```

#### 2. 멀티플렉싱 개선

```
TCP의 HOLB:
패킷1 손실 → 패킷2,3,4 모두 대기

QUIC의 해결:
각 스트림이 독립적 패킷 번호 보유
패킷1 손실해도 패킷2,3,4는 즉시 처리
```

#### 3. Connection Migration

```
특징:
- WiFi에서 LTE로 전환 시 연결 유지
- 기존 TCP: 연결 끊김 → 재연결 필요
- QUIC: Connection ID로 자동 마이그레이션
```

#### 4. 헤더 압축 (QPACK)

```
HPACK (HTTP/2): 선형적 처리
QPACK (HTTP/3): 비선형적 처리
- 손실된 패킷의 영향 최소화
- 더 나은 압축률
```

### HTTP/3.0 vs HTTP/2.0 비교

| 항목 | HTTP/2.0 | HTTP/3.0 |
|------|----------|----------|
| **전송 프로토콜** | TCP | UDP (QUIC) |
| **연결 설정** | 1-2 RTT | 0 RTT |
| **헤더 압축** | HPACK | QPACK |
| **멀티플렉싱** | 스트림 기반 | 개선된 멀티플렉싱 |
| **HOLB 문제** | TCP 계층에서 발생 | 완전 해결 |
| **연결 유지** | TCP 커넥션 | Connection ID |
| **성능** | 15-50% 향상 | 20-100% 향상 |
| **네트워크 전환** | 재연결 필요 | 자동 마이그레이션 |
| **보안** | TLS 추가 | TLS 통합 |

### HTTP/3.0 채택 현황

**2023년 기준 브라우저 트래픽:**
- Chrome: ~20-30% (계속 증가 중)
- Safari: ~7% (iOS 15부터 지원)
- Firefox: 실험적 지원
- Edge: Chrome 기반으로 동일 수준

**CDN 지원:**
- Cloudflare: 2022년부터 전 고객 지원
- AWS CloudFront: 2021년부터 지원
- Google Cloud CDN: 지원

### 주요 채택 서비스

```
Google: YouTube, Gmail, Google Search
Facebook: 메인 서비스
Uber: 모바일 앱
Instagram: 앱 트래픽
Cloudflare: 모든 고객 기본 지원
```

### 개발자를 위한 HTTP/3.0 정보

**현재 상태:**
- 표준화 완료 (RFC 9000)
- 대부분의 브라우저 지원
- 서버/CDN 지원 증가

**적용 전략:**
1. 기존 HTTP/2 서버 유지
2. QUIC/HTTP/3 동시 지원 추가
3. 브라우저가 자동으로 최적 프로토콜 선택

**테스트 방법:**

```bash
# HTTP/3 지원 여부 확인
curl --version | grep h3  # quiche 또는 ngtcp2 필요

# HTTP/3로 요청
curl --http3 https://www.google.com
```

---

## 정리

### HTTP/2.0 도입의 이점

1. **성능 향상**: 15-50% 속도 개선
2. **단일 연결**: 리소스 효율성 증대
3. **멀티플렉싱**: 병렬 처리로 HOLB 문제 해결 (응용 계층)
4. **헤더 압축**: 네트워크 대역폭 절약
5. **서버 푸시**: 사용자 경험 개선
6. **우선순위**: 중요 리소스 우선 처리

### 구현 체크리스트

- [ ] HTTPS 인증서 설정
- [ ] 백엔드 HTTP/2 설정 (Node.js, Nginx 등)
- [ ] 개발 및 프로덕션 환경 설정
- [ ] 브라우저 개발자 도구에서 프로토콜 확인
- [ ] 성능 테스트 및 모니터링
- [ ] CDN HTTP/2 활성화
- [ ] 클라이언트 라이브러리 업데이트

### 미래 트렌드

- **HTTP/3.0 도입**: QUIC 기반, 지연시간 추가 감소
- **Connection Coalescing**: 여러 도메인 단일 연결
- **Zero RTT Resume**: 세션 재개 시 지연시간 제거

---

## 참고 자료

- RFC 7540 (HTTP/2 표준)
- RFC 9000 (HTTP/3 표준)
- [MDN Web Docs - HTTP/2](https://developer.mozilla.org/en-US/docs/Glossary/HTTP/2)
- [Google Web Fundamentals - Performance](https://web.dev/performance/)
- Cloudflare Learning Center - HTTP/3
