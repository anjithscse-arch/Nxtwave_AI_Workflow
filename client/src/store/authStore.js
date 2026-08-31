import { create } from 'zustand';
import api from '../services/api.js';

function getInitialUser() {
  try {
    const raw = localStorage.getItem('campusmind_user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse user from localStorage:', err);
    localStorage.removeItem('campusmind_user');
    return null;
  }
}

export const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  token: localStorage.getItem('campusmind_token') || null,
  isAuthenticated: Boolean(localStorage.getItem('campusmind_token')),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data;

      localStorage.setItem('campusmind_token', token);
      localStorage.setItem('campusmind_user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true, user };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  register: async ({ name, email, password, role }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { user, token } = response.data.data;

      localStorage.setItem('campusmind_token', token);
      localStorage.setItem('campusmind_user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true, user };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('campusmind_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const user = response.data?.data;
      if (user && typeof user === 'object') {
        localStorage.setItem('campusmind_user', JSON.stringify(user));
        set({ user, isAuthenticated: true });
      } else {
        throw new Error('Invalid user profile response');
      }
    } catch (error) {
      localStorage.removeItem('campusmind_token');
      localStorage.removeItem('campusmind_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  logout: () => {
    localStorage.removeItem('campusmind_token');
    localStorage.removeItem('campusmind_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
  },

  clearError: () => set({ error: null })
}));

export default useAuthStore;
