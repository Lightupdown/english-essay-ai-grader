import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

interface AuthContextType {
  loading: boolean;
  canAnalyze: boolean;
  remainingAttempts: number;
  dailyLimit: number;
  recordAttempt: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DAILY_LIMIT = 3;
const ATTEMPTS_KEY = 'daily_attempts';
const LAST_DATE_KEY = 'last_attempt_date';

// 获取今天的日期字符串
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// 获取今天的尝试次数
const getTodayAttempts = (): number => {
  const lastDate = localStorage.getItem(LAST_DATE_KEY);
  const today = getTodayString();
  
  // 如果不是今天，重置计数
  if (lastDate !== today) {
    localStorage.setItem(LAST_DATE_KEY, today);
    localStorage.setItem(ATTEMPTS_KEY, '0');
    return 0;
  }
  
  const attempts = localStorage.getItem(ATTEMPTS_KEY);
  return attempts ? parseInt(attempts, 10) : 0;
};

// 记录一次尝试
const recordAttempt = (): void => {
  const currentAttempts = getTodayAttempts();
  localStorage.setItem(ATTEMPTS_KEY, (currentAttempts + 1).toString());
};

// 检查是否还可以分析
const canAnalyzeToday = (): boolean => {
  return getTodayAttempts() < DAILY_LIMIT;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(getTodayAttempts());

  const canAnalyze = canAnalyzeToday();
  const remainingAttempts = Math.max(0, DAILY_LIMIT - attempts);

  const handleRecordAttempt = useCallback(() => {
    recordAttempt();
    setAttempts(getTodayAttempts());
  }, []);

  // 监听 storage 变化（用于多标签页同步）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ATTEMPTS_KEY || e.key === LAST_DATE_KEY) {
        setAttempts(getTodayAttempts());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: AuthContextType = {
    loading,
    canAnalyze,
    remainingAttempts,
    dailyLimit: DAILY_LIMIT,
    recordAttempt: handleRecordAttempt,
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

// 导出工具函数
export const attemptUtils = {
  getTodayAttempts,
  canAnalyzeToday,
  recordAttempt,
  DAILY_LIMIT,
};
