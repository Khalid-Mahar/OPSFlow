import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  companyId: string;
  permissions: string[];
  employee?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
  isRole: (...roles: string[]) => boolean;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(r => { setUser(r.data.data); localStorage.setItem('user', JSON.stringify(r.data.data)); })
        .catch(() => { localStorage.clear(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const r = await authAPI.login({ email, password });
    const { token, refreshToken, user } = r.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.clear();
    setUser(null);
  };

  const can = (permission: string) => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    return user.permissions.includes(permission);
  };

  const isRole = (...roles: string[]) => roles.includes(user?.role || '');
  const isSuperAdmin = () => user?.role === 'Super Admin';
  const isAdmin = () => ['Super Admin', 'Admin'].includes(user?.role || '');

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can, isRole, isSuperAdmin, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
