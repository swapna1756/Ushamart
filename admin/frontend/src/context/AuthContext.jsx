import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('ushamart_admin_token');
    if (!token) { setLoading(false); return; }

    authApi.me()
      .then(res => setUser(res.user))
      .catch(() => {
        localStorage.removeItem('ushamart_admin_token');
        localStorage.removeItem('ushamart_admin_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (!res?.token || !res?.user || !['super_admin', 'store_manager'].includes(res.user.role)) {
      throw new Error('You do not have admin access.');
    }
    localStorage.setItem('ushamart_admin_token', res.token);
    localStorage.setItem('ushamart_admin_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('ushamart_admin_token');
    localStorage.removeItem('ushamart_admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
