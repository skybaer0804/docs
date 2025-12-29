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

// 사용자 프로필 업데이트 (인증 필요)
router.put('/profile', authMiddleware, authController.updateProfile);

// 사용자 검색 (인증 필요 - 본인 제외 및 팔로우 여부 확인용)
router.get('/search', authMiddleware, authController.searchUsers);

module.exports = router;
