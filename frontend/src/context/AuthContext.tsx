import React, { createContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { User } from '../types/auth';
import api from '../utils/api';

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 Hours

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const logout = useCallback(() => {
    clearLogoutTimer();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('login_time');
    setToken(null);
    setUser(null);
    if (!window.location.pathname.endsWith('/login')) {
      window.location.href = '/login';
    }
  }, []);

  const scheduleAutoLogout = useCallback((loginTimeMs: number) => {
    clearLogoutTimer();
    const elapsed = Date.now() - loginTimeMs;
    const remainingTime = SESSION_DURATION_MS - elapsed;

    if (remainingTime <= 0) {
      logout();
    } else {
      logoutTimerRef.current = setTimeout(() => {
        logout();
      }, remainingTime);
    }
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedLoginTime = localStorage.getItem('login_time');

      if (storedToken && storedUser) {
        const loginTime = storedLoginTime ? parseInt(storedLoginTime, 10) : Date.now();
        const elapsed = Date.now() - loginTime;

        if (elapsed >= SESSION_DURATION_MS || storedToken.startsWith('mock-jwt-token')) {
          logout();
          setLoading(false);
          return;
        }

        if (!storedLoginTime) {
          localStorage.setItem('login_time', Date.now().toString());
        }

        try {
          const parsed = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsed);
          scheduleAutoLogout(loginTime);
          
          // Verify user exists on backend and refresh profile info
          try {
            const response = await api.get<User>('/auth/me');
            if (response && response.data) {
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            } else {
              logout();
            }
          } catch (apiErr: any) {
            console.warn('User validation failed on backend, logging out', apiErr);
            logout();
          }
        } catch (error) {
          console.error('Failed to parse stored user', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Check expiration when tab regains focus or visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const storedLoginTime = localStorage.getItem('login_time');
        const storedToken = localStorage.getItem('token');
        if (storedToken && storedLoginTime) {
          const loginTime = parseInt(storedLoginTime, 10);
          if (Date.now() - loginTime >= SESSION_DURATION_MS) {
            logout();
          }
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearLogoutTimer();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [logout, scheduleAutoLogout]);

  const login = (newToken: string, newUser: User) => {
    const now = Date.now();
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('login_time', now.toString());
    setToken(newToken);
    setUser(newUser);
    scheduleAutoLogout(now);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
