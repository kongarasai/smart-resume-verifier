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
}

// In a real app, you would use @react-native-async-storage/async-storage
// For this conversion, we will keep the state in memory, and you can add persistence later.
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  setAuth: (user, token) => {
    set({ user, token, isLoading: false });
  },
  logout: () => {
    set({ user: null, token: null, isLoading: false });
    // In mobile, we navigate to the 'Login' screen via the navigation ref
  },
}));
