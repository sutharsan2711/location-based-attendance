import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import api from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── LOGIN BYPASS ─────────────────────────────────────────────────────────────
// Set BYPASS_LOGIN = true to skip the login page and auto-authenticate.
// Set BYPASS_LOGIN = false (or remove) to restore normal login flow.
const BYPASS_LOGIN = true;
const BYPASS_CREDENTIALS = { email: 'john@company.com', password: 'Password@123' };
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
        const cachedToken = localStorage.getItem('token');
        const cachedUser  = localStorage.getItem('user');
        if (cachedToken && cachedUser) {
          try {
            setToken(cachedToken);
            setUser(JSON.parse(cachedUser));
            const response = await api.get<User>('/auth/me');
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            setLoading(false);
            return;
          } catch {
            // cached token expired – fall through to fresh login
          }
        }
        try {
          const response = await api.post<{ token: string; user: User }>('/auth/login', BYPASS_CREDENTIALS);
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setToken(response.data.token);
          setUser(response.data.user);
        } catch (err) {
          console.error('[BYPASS] Auto-login failed:', err);
        }
        setLoading(false);
        return;
      }
      // ─────────────────────────────────────────────────────────────────────

      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token and refresh user info from backend
          const response = await api.get<User>('/auth/me');
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Failed to verify token', error);
          // Token is invalid/expired
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
