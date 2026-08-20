import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import api from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── LOGIN BYPASS ─────────────────────────────────────────────────────────────
// Set BYPASS_LOGIN = true to skip the login page and auto-authenticate.
// Set BYPASS_LOGIN = false (or remove) to restore normal login flow.
const BYPASS_LOGIN = true;
const BYPASS_CREDENTIALS = { email: 'admin@eclearnix.com', password: 'admin@123' };
// ──────────────────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // ── Bypass: silent login with real credentials so all API calls work ──
      if (BYPASS_LOGIN) {
        // Re-use cached token if already present to avoid re-login on every refresh
        const cachedToken = localStorage.getItem('admin_token');
        const cachedUser  = localStorage.getItem('admin_user');
        if (cachedToken && cachedUser) {
          try {
            setToken(cachedToken);
            setUser(JSON.parse(cachedUser));
            const response = await api.get<User>('/auth/me');
            if (response.data.role === 'ADMIN') {
              setUser(response.data);
              localStorage.setItem('admin_user', JSON.stringify(response.data));
              setLoading(false);
              return;
            }
          } catch {
            // cached token expired – fall through to fresh login
          }
        }
        try {
          const response = await api.post<{ token: string; user: User }>('/auth/login', BYPASS_CREDENTIALS);
          localStorage.setItem('admin_token', response.data.token);
          localStorage.setItem('admin_user', JSON.stringify(response.data.user));
          setToken(response.data.token);
          setUser(response.data.user);
        } catch (err) {
          console.error('[BYPASS] Auto-login failed:', err);
        }
        setLoading(false);
        return;
      }
      // ─────────────────────────────────────────────────────────────────────

      const storedToken = localStorage.getItem('admin_token');
      const storedUser = localStorage.getItem('admin_user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Verify token is still valid
          const response = await api.get<User>('/auth/me');
          // Block non-admins
          if (response.data.role !== 'ADMIN') {
            logout();
            return;
          }
          setUser(response.data);
          localStorage.setItem('admin_user', JSON.stringify(response.data));
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
