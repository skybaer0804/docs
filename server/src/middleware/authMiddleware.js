const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Access token is missing' });
    }

    // 2. Supabase JWT Secret으로 검증
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
        console.error('SERVER ERROR: SUPABASE_JWT_SECRET is missing in .env');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        // 3. 검증 성공 시 req.user에 사용자 정보 저장
        // Supabase 토큰에는 { sub: 'user_uuid', role: 'authenticated', ... } 등이 들어있음
        req.user = user;
        next();
    });
};
