import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'candidate' | 'hr' | 'mentor' | 'teacher';
  photo_url?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initFromStorage: () => void;
}

const getInitialState = () => ({ user: null, token: null, isLoading: true });

export const useAuthStore = create<AuthStore>((set) => ({
  ...getInitialState(),
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token, isLoading: false });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isLoading: false });
      window.location.href = '/auth/login';
    }
  },
  initFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isLoading: false });
        return;
      }
    } catch (e) {}
    set({ user: null, token: null, isLoading: false });
  },
}));
