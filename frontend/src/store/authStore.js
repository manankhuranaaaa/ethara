import { create } from 'zustand';
import { authApi } from '../api';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isLoading: true,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem('accessToken', token);
    set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await authApi.me();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      get().clearAuth();
    }
  },

  login: async (credentials) => {
    const { data } = await authApi.login(credentials);
    get().setAuth(data.data.user, data.data.accessToken);
    return data.data.user;
  },

  register: async (userData) => {
    const { data } = await authApi.register(userData);
    get().setAuth(data.data.user, data.data.accessToken);
    return data.data.user;
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    get().clearAuth();
  },
}));

export default useAuthStore;
