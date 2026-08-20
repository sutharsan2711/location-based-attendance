import api from '../utils/api';
import { LoginResponse } from '../types/auth';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>('/auth/logout');
    return response.data;
  },

  getMe: async (): Promise<any> => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};
