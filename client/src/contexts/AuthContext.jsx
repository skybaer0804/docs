import { createContext } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
  getToken,
} from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const data = await apiLogin(email, password);
    setUser(data.user);
    return data;
  };

  const signUp = async (username, email, password) => {
    const data = await apiRegister(username, email, password);
    setUser(data.user);
    return data;
  };

  const signOut = async () => {
    apiLogout();
    setUser(null);
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
