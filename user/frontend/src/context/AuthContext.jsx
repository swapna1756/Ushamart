import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ushamart_user_token');
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then(r => setUser(r.user))
      .catch(() => { localStorage.removeItem('ushamart_user_token'); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (phone) => {
    const res = await authApi.login(phone);
    localStorage.setItem('ushamart_user_token', res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('ushamart_user_token');
    setUser(null);
  };

  const updateUser = (updated) => setUser(prev => ({ ...prev, ...updated }));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
