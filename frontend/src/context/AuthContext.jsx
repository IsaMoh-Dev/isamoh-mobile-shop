import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while checking session

  // On mount — try to restore session from httpOnly cookie
  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
    toast.success('Logged out successfully.');
  }, []);

  const isLoggedIn     = !!user;
  const isAdmin        = user && ['admin','superadmin'].includes(user.role);
  const isSuperAdmin   = user?.role === 'superadmin';
  const isSeller       = user?.role === 'seller';
  const canAccessAdmin = user && ['admin','superadmin','seller'].includes(user.role);

  return (
    <AuthContext.Provider value={{
      user, setUser, loading,
      login, register, logout,
      isLoggedIn, isAdmin, isSuperAdmin, isSeller, canAccessAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
