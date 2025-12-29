const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/authMiddleware');

// 모든 구독 관련 기능은 로그인이 필요함
router.use(authMiddleware);

// 팔로우/언팔로우
router.post('/', subscriptionController.follow);
router.delete('/', subscriptionController.unfollow);

// 통계 및 리스트 조회 (ID 기반)
router.get('/:id/stats', subscriptionController.getSubscriptionStats);
router.get('/:id/list', subscriptionController.getSubscriptions);

// 내가 구독한 사람들의 노드 조회
router.get('/following-nodes', subscriptionController.getFollowingNodes);

module.exports = router;
