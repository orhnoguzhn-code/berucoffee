import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { registerDeviceToken } from '../services/notification';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  total_purchases?: number;
  used_free_coffee?: number;
  free_balance?: number;
  threshold?: number;
  qr_token?: string;
  wallet_balance?: number;
  lifetime_stars?: number;
  stars_redeemed?: number;
  star_balance?: number;
  phone?: string;
  birthday?: string | null;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<any>;
  loginWithFirebaseIdToken: (idToken: string) => Promise<any>;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkPhone: (phone: string) => Promise<{ exists: boolean; name: string; email: string }>;
  checkEmail: (email: string) => Promise<{ exists: boolean; name: string }>;
  registerWithPhone: (data: { phone: string; name: string; email: string; password?: string }) => Promise<any>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const registerNotifications = useCallback(() => {
    void registerDeviceToken().catch((error) => {
      console.warn('Bildirim cihaz kaydı başarısız:', error);
    });
  }, []);

  const applySession = useCallback(async (newToken: string, userData: User) => {
    await AsyncStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    registerNotifications();
  }, [registerNotifications]);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) {
        setToken(null);
        setUser(null);
        return;
      }

      setToken(storedToken);
      const res = await api.get('/users/profile');
      setUser(res.data.data);
      registerNotifications();
    } catch (error: any) {
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } else {
        console.warn('Kullanıcı bilgileri yüklenemedi:', error?.message || error);
      }
    } finally {
      setLoading(false);
    }
  }, [registerNotifications]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const login = async (identifier: string, password: string) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { token: newToken, user: userData } = res.data.data;
    await applySession(newToken, userData);
    return res.data;
  };

  const checkPhone = async (phone: string) => {
    const res = await api.post('/auth/check-phone', { phone });
    return res.data.data;
  };

  const checkEmail = async (email: string) => {
    const res = await api.post('/auth/check-email', { email });
    return res.data.data;
  };

  const registerWithPhone = async (data: { phone: string; name: string; email: string; password?: string }) => {
    const res = await api.post('/auth/register-phone', data);
    const { token: newToken, user: userData } = res.data.data;
    await applySession(newToken, userData);
    return res.data;
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
      ...(phone ? { phone } : {}),
    });
    const { token: newToken, user: userData } = res.data.data;
    await applySession(newToken, userData);
    return res.data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const loginWithFirebaseIdToken = async (idToken: string) => {
    const res = await api.post('/auth/phone', { idToken });
    const { token: newToken, user: userData } = res.data.data;
    await applySession(newToken, userData);
    return res.data.data;
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await api.put('/users/profile', data);
    setUser((prev) => (prev ? { ...prev, ...res.data.data } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        register,
        loginWithFirebaseIdToken,
        loadUser,
        updateProfile,
        checkPhone,
        checkEmail,
        registerWithPhone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
