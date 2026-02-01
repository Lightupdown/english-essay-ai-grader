import axios from 'axios';

// 使用相对路径，让Vite代理处理开发环境的请求转发
// 生产环境使用环境变量或相对路径
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,  // 2分钟超时（OCR可能较慢）
});

// 请求拦截器：添加 JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRedirecting = false;

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      // Token 过期，清除并跳转到登录页（只执行一次）
      isRedirecting = true;
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
