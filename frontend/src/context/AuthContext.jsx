import { createContext, useContext, useState, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('budgetiq_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const persistSession = (token, userData) => {
    localStorage.setItem('budgetiq_token', token);
    localStorage.setItem('budgetiq_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      persistSession(data.token, data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to log in. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (fullName, email, password, currency) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post('/auth/register', {
        fullName,
        email,
        password,
        currency,
      });
      persistSession(data.token, data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create your account. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('budgetiq_token');
    localStorage.removeItem('budgetiq_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
