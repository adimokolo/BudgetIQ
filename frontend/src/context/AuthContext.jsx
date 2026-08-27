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

  // Register no longer logs the user in directly - the account must be
  // verified with the OTP emailed to them first.
  const register = useCallback(async (fullName, email, password, currency) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/register', { fullName, email, password, currency });
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create your account. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (email, code) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post('/auth/verify-otp', { email, code });
      persistSession(data.token, data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Could not verify that code. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendOtp = useCallback(async (email) => {
    setError(null);
    try {
      await apiClient.post('/auth/resend-otp', { email });
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend the code. Please try again.');
      return false;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      persistSession(data.token, data.user);
      return { ok: true };
    } catch (err) {
      const body = err.response?.data;
      if (body?.code === 'EMAIL_NOT_VERIFIED') {
        return { ok: false, needsVerification: true, email: body.email };
      }
      setError(body?.error || 'Unable to log in. Please try again.');
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email, token, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/reset-password', { email, token, newPassword });
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset your password. Please try again.');
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
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        verifyOtp,
        resendOtp,
        login,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
