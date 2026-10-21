import * as SecureStore from '@/lib/storage';
import { create } from 'zustand';
import { ApiError, api, setAuthToken, setUnauthorizedHandler } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { User } from '@/types';

const TOKEN_KEY = 'ff_token';
const USER_KEY = 'ff_user';

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthState {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: User | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

async function persistSession(token: string, user: User) {
  setAuthToken(token);
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

async function clearSession() {
  setAuthToken(null);
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
  queryClient.clear();
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,

  hydrate: async () => {
    setUnauthorizedHandler(() => {
      void get().logout();
    });

    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ status: 'signedOut', user: null });
        return;
      }
      setAuthToken(token);

      try {
        const { user } = await api.get<{ user: User }>('/auth/me');
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
        set({ status: 'signedIn', user });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await clearSession();
          set({ status: 'signedOut', user: null });
          return;
        }
        // Offline / server down: keep the session using the cached profile.
        const cached = await SecureStore.getItemAsync(USER_KEY);
        set({ status: 'signedIn', user: cached ? (JSON.parse(cached) as User) : null });
      }
    } catch {
      set({ status: 'signedOut', user: null });
    }
  },

  login: async (email, password) => {
    const { token, user } = await api.post<AuthResponse>('/auth/login', { email, password });
    await persistSession(token, user);
    set({ status: 'signedIn', user });
  },

  register: async (name, email, password) => {
    const { token, user } = await api.post<AuthResponse>('/auth/register', { name, email, password });
    await persistSession(token, user);
    set({ status: 'signedIn', user });
  },

  loginWithGoogle: async (idToken) => {
    const { token, user } = await api.post<AuthResponse>('/auth/google', { idToken });
    await persistSession(token, user);
    set({ status: 'signedIn', user });
  },

  setUser: (user) => {
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)).catch(() => {});
    set({ user });
  },

  logout: async () => {
    await clearSession();
    set({ status: 'signedOut', user: null });
  },
}));
