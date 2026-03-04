import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiLogin as apiLoginFn, apiGetMe } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('gait_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiGetMe()
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('gait_token');
          localStorage.removeItem('gait_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email, password, expectedRole) => {
    try {
      const data = await apiLoginFn(email, password, expectedRole);
      localStorage.setItem('gait_token', data.token);
      localStorage.setItem('gait_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('gait_token');
    localStorage.removeItem('gait_user');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
