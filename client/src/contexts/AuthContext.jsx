import { createContext } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
  getToken,
} from '../utils/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    // 토큰이 있으면 사용자 정보 조회
    const token = getToken();
    if (token) {
      getCurrentUser()
        .then((data) => {
          setUser(data.user);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to get user:', err);
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email, password) => {
    try {
      const data = await apiLogin(email, password);
      setUser(data.user);
      showSuccess('로그인되었습니다');
      return data;
    } catch (error) {
      showError(error.message || '로그인에 실패했습니다');
      throw error;
    }
  };

  const signUp = async (username, email, password) => {
    try {
      const data = await apiRegister(username, email, password);
      setUser(data.user);
      showSuccess('회원가입이 완료되었습니다');
      return data;
    } catch (error) {
      showError(error.message || '회원가입에 실패했습니다');
      throw error;
    }
  };

  const signOut = async () => {
    apiLogout();
    setUser(null);
    showSuccess('로그아웃되었습니다');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
