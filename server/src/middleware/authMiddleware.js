const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Access token is missing' });
    }

    // 2. 자체 JWT Secret으로 검증
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('SERVER ERROR: JWT_SECRET is missing in .env');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            console.error('authMiddleware: Token verification failed', { error: err.message });
            return res.status(403).json({ error: 'Invalid token' });
        }

        // 3. 검증 성공 시 req.user에 사용자 정보 저장
        // 토큰에는 { id: 'user_id', email: 'user@example.com' } 등이 들어있음
        if (!decoded || !decoded.id) {
            console.error('authMiddleware: Decoded token missing id', { decoded });
            return res.status(403).json({ error: 'Invalid token: missing user ID' });
        }

        req.user = decoded;
        console.log('authMiddleware: User authenticated', { userId: req.user.id, email: req.user.email });
        next();
    });
};
