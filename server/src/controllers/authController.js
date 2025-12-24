const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

/**
 * 로그인 컨트롤러
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 입력 검증
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 사용자 조회
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    );

    // 사용자 정보 반환 (비밀번호 해시 제외)
    const userInfo = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };

    res.json({
      token,
      user: userInfo,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 회원가입 컨트롤러
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 입력 검증
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    // username 검증
    if (username.trim().length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters long' });
    }

    // 이메일 형식 검증 (간단한 정규식)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // 비밀번호 길이 검증 (최소 6자)
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // 이메일 중복 체크
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // 비밀번호 해싱
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 사용자 생성
    const user = await UserModel.create(username, email, passwordHash);

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    );

    // 사용자 정보 반환 (비밀번호 해시 제외)
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    };

    res.status(201).json({
      token,
      user: userInfo,
    });
  } catch (err) {
    console.error('Register error:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint,
      stack: err.stack,
    });

    // Supabase 에러인 경우 더 자세한 정보 제공
    if (err.code) {
      if (err.code === '42P01') {
        return res.status(500).json({
          error: 'Users table does not exist. Please create the users table in Supabase.',
          details: 'Run the SQL migration in server/src/migrations/create_users_table.sql',
        });
      }
      return res.status(500).json({
        error: 'Database error',
        code: err.code,
        message: err.message,
      });
    }

    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};

/**
 * 토큰 검증 및 사용자 정보 반환
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    // authMiddleware에서 req.user가 설정되어 있음
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    };

    res.json({ user: userInfo });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
