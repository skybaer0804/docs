const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('SERVER ERROR: JWT_SECRET is missing in .env');
        return next();
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            // 토큰이 잘못되었더라도 에러를 내지 않고 guest로 처리
            return next();
        }

        if (decoded && decoded.id) {
            req.user = decoded;
        }
        next();
    });
};

