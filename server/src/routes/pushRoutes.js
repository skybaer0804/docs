const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const authMiddleware = require('../middleware/authMiddleware');

// 모든 푸시 관련 요청은 로그인이 필요함
router.use(authMiddleware);

router.post('/subscribe', pushController.subscribe);
router.post('/send-test', pushController.sendTestNotification);

module.exports = router;
