const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// 회원가입 (인증 불필요)
router.post('/register', authController.register);

// 로그인 (인증 불필요)
router.post('/login', authController.login);

// 현재 사용자 정보 조회 (인증 필요)
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
