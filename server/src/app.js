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
app.use(express.static(path.join(__dirname, '../../client/dist')));

// API Routes
app.use('/api/docs', require('./routes/docsRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));

// SPA Fallback
// API 요청이 아닌 모든 GET 요청은 index.html을 반환하여 리액트 라우팅을 지원합니다.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Server Start
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
