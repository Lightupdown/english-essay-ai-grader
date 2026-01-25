import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User } from '../types';
import { login as authLogin, register as authRegister, getProfile, logout as authLogout } from '../services/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  isTrial: boolean;
  trialCount: number;
  trialLimit: number;
  canAnalyze: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TRIAL_LIMIT = 3;
const TRIAL_KEY = 'trial_essays';

// 试用模式工具函数
const getTrialEssays = (): string[] => {
  const data = localStorage.getItem(TRIAL_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const getTrialCount = (): number => {
  return getTrialEssays().length;
};

const canAnalyzeTrial = (): boolean => {
  return getTrialCount() < TRIAL_LIMIT;
};

const recordTrialEssay = (essayId: string) => {
  const essays = getTrialEssays();
  if (!essays.find(e => e === essayId)) {
    essays.unshift(essayId);
    // 只保留最近 TRIAL_LIMIT 篇
    localStorage.setItem(TRIAL_KEY, JSON.stringify(essays.slice(0, TRIAL_LIMIT)));
  }
};

const clearTrialEssays = () => {
  localStorage.removeItem(TRIAL_KEY);
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialCount, setTrialCount] = useState(getTrialCount());

  const isAuthenticated = !!user;
  const isTrial = !isAuthenticated;
  const canAnalyze = isAuthenticated || canAnalyzeTrial();

  const refreshAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Token验证失败:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    // 监听storage变化，更新试用计数
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TRIAL_KEY) {
        setTrialCount(getTrialCount());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user: userData } = await authLogin(email, password);
      setUser(userData);
      // 登录后清除试用数据（可选）
      // clearTrialEssays();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      const { user: userData } = await authRegister(email, password, name);
      setUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
    isTrial,
    trialCount,
    trialLimit: TRIAL_LIMIT,
    canAnalyze,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

// 导出试用模式工具函数
export const trialUtils = {
  getTrialCount,
  canAnalyzeTrial,
  recordTrialEssay,
  clearTrialEssays,
  TRIAL_LIMIT,
};