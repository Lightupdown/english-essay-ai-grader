import api from './api';
import { User, AuthResponse } from '../types';

export const register = async (
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', { email, password, name });
  localStorage.setItem('token', response.data.token);
  return response.data;
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', response.data.token);
  return response.data;
};

export const getProfile = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data.user;
};

export const logout = () => {
  localStorage.removeItem('token');
};
