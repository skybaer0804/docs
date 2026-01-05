const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Static files (Client Build)
// 개발 중에는 별도 포트(5173)를 쓰지만, 프로덕션 배포 시에는 여기서 정적 파일을 서빙합니다.
app.use(express.static(path.join(__dirname, '../../client/dist'), {
  setHeaders: (res, filePath) => {
    // Service Worker와 manifest는 캐시하지 않도록 설정
    if (filePath.endsWith('sw.js') || filePath.endsWith('manifest.webmanifest')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
    // 버전 해시가 포함된 정적 에셋(js, css)은 길게 캐시해도 됨
    else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/) && filePath.includes('assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// API Routes
app.use('/api/docs', require('./routes/docsRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/study-timer', require('./routes/studyTimerRoutes'));

// SPA Fallback
// API 요청이 아닌 모든 GET 요청은 index.html을 반환하여 리액트 라우팅을 지원합니다.
app.get('*', (req, res) => {
  // 요청 경로에 확장자가 있는 경우(예: .js, .css) index.html을 보내지 않고 404를 반환합니다.
  // 이는 존재하지 않는 에셋에 대해 HTML을 반환하여 발생하는 MIME type 에러를 방지합니다.
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    return res.status(404).send('Not found');
  }

  // index.html은 항상 최신 상태를 유지하도록 캐시를 비활성화합니다.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Server Start
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
