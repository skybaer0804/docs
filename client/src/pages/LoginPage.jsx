import { useState } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { route } from 'preact-router';
import './LoginPage.scss';

export function LoginPage() {
    const { signIn, user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // 이미 로그인되어 있으면 홈으로 리다이렉트
    if (user) {
        route('/', true);
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            route('/'); // 로그인 성공 시 홈으로 이동
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1>관리자 로그인</h1>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" value={email} onInput={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" value={password} onInput={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" disabled={loading} className="login-button">
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>
            </div>
        </div>
    );
}
