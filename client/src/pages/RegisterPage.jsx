import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import './RegisterPage.scss';

export function RegisterPage({ onNavigate }) {
  const { user, signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 이미 로그인되어 있으면 홈으로 리다이렉트
  useEffect(() => {
    if (user && onNavigate) {
      onNavigate('/', { force: true });
    }
  }, [user, onNavigate]);

  if (user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // username 검증
    if (!username || username.trim().length < 2) {
      setError('사용자명은 최소 2자 이상이어야 합니다.');
      return;
    }

    // 비밀번호 확인 검증
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      await signUp(username, email, password);
      // 회원가입 성공 시 홈으로 이동
      if (onNavigate) {
        onNavigate('/', { force: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    if (onNavigate) {
      onNavigate('/login', { force: true });
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h1>회원가입</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">사용자명</label>
            <input
              type="text"
              id="username"
              value={username}
              onInput={(e) => setUsername(e.target.value)}
              required
              placeholder="사용자명을 입력하세요"
              minLength={2}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onInput={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onInput={(e) => setPassword(e.target.value)}
              required
              placeholder="최소 6자 이상"
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onInput={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="비밀번호 확인"
              minLength={6}
            />
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="register-button">
            {loading ? '가입 중...' : '회원가입'}
          </Button>
        </form>
        <div className="register-footer">
          <span>이미 계정이 있으신가요?</span>
          <button type="button" className="link-button" onClick={handleLoginClick}>
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}

