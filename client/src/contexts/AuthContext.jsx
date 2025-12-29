import { createContext } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';
import { getCurrentUser, getToken, login as apiLogin, logout as apiLogout, register as apiRegister } from '../utils/api';
import { useToast } from './ToastContext';
import { queryClient } from '../query/queryClient';

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
      queryClient.clear(); // 로그인 시 이전 유저 캐시 삭제
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
      queryClient.clear(); // 회원가입 시 캐시 초기화
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
    queryClient.clear(); // 로그아웃 시 모든 캐시 삭제
    setUser(null);
    showSuccess('로그아웃되었습니다');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
