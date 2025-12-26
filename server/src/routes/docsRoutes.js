const express = require('express');
const router = express.Router();
const docsController = require('../controllers/docsController');
const upload = require('multer')(); 
const authMiddleware = require('../middleware/authMiddleware');

// 문서 검색 (🔐 인증 필요 - 내 문서 및 선택적으로 구독 유저 문서)
router.get('/search', authMiddleware, docsController.searchDocs);

// 모든 문서 구조 조회 (🔐 인증 필요 - 내 문서만 조회)
router.get('/', authMiddleware, docsController.getAllDocs);

// 특정 유저의 문서 구조 조회 (공개/구독자 전용 필터링)
router.get('/user/:userId', authMiddleware, docsController.getUserDocs);

// 문서 생성 (🔐 인증 필요)
router.post('/', authMiddleware, docsController.createDoc);

// 파일 업로드 (🔐 인증 필요)
router.post('/upload', authMiddleware, upload.single('file'), docsController.uploadFile);

// 문서 수정 (🔐 인증 필요)
router.put('/:id', authMiddleware, docsController.updateDoc);

// 문서 삭제 (🔐 인증 필요)
router.delete('/:id', authMiddleware, docsController.deleteDoc);

// 문서/폴더 이동 (🔐 인증 필요)
router.post('/move', authMiddleware, docsController.moveDoc);

// 특정 문서 조회 (공개/비공개 로직은 컨트롤러 내부에서 처리)
router.get('/*', docsController.getDocByPath);

module.exports = router;
