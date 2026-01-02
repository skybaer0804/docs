const express = require('express');
const router = express.Router();
const studyTimerController = require('../controllers/studyTimerController');
const authMiddleware = require('../middleware/authMiddleware');

// 모든 라우트에 인증 필요
router.use(authMiddleware);

router.post('/start', studyTimerController.startSession);
router.put('/end/:id', studyTimerController.endSession);

module.exports = router;

