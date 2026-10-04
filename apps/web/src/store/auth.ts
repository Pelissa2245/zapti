// ZapTI Web — Auth Store
import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isSuperadmin: boolean;
  twoFactorEnabled: boolean;
  onboardingCompleted: boolean;
  tenants: Tenant[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthState {
  user: User | null;
  currentTenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isSuperadmin: boolean;

  // Actions
  login: (email: string, password: string, rememberMe?: boolean, twoFactorToken?: string) => Promise<{ requiresTwoFactor: boolean }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  setCurrentTenant: (tenant: Tenant) => void;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
}

/**
 * All requests go through Next.js route handlers (same origin). The API URL is
 * only used server-side (see src/actions/auth.ts); the browser never talks to
 * the Fastify API directly, so httpOnly session cookies are always set on the
 * web app's own domain.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  currentTenant: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isSuperadmin: false,

  login: async (email, password, rememberMe = false, twoFactorToken?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe, twoFactorToken }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.error || 'Credenciais inválidas';
        set({ error: message, isLoading: false });
        throw new Error(message);
      }

      if (data.requiresTwoFactor) {
        set({ isLoading: false });
        return { requiresTwoFactor: true };
      }

      // Session cookies were set server-side by the route handler. Fetch the
      // real user to populate the store.
      await useAuthStore.getState().fetchCurrentUser();
      set({ isLoading: false });
      return { requiresTwoFactor: false };
    } catch (error: any) {
      const message = error.message || 'Erro ao fazer login';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      set({
        user: null,
        currentTenant: null,
        isAuthenticated: false,
        isLoading: false,
        isSuperadmin: false,
        error: null,
      });
    }
  },

  logoutAll: async () => {
    set({ isLoading: true });
    try {
      await fetch('/api/auth/logout-all', { method: 'POST' });
    } finally {
      set({
        user: null,
        currentTenant: null,
        isAuthenticated: false,
        isLoading: false,
        isSuperadmin: false,
        error: null,
      });
    }
  },

  setCurrentTenant: (tenant: Tenant) => {
    set({ currentTenant: tenant });
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/me');

      if (!response.ok) {
        throw new Error('Não autenticado');
      }

      const session = await response.json();
      const user: User = session.user;
      const currentTenant = user.tenants[0] || null;

      set({
        user,
        currentTenant,
        isAuthenticated: true,
        isLoading: false,
        isSuperadmin: user.isSuperadmin || false,
      });
    } catch {
      set({
        user: null,
        currentTenant: null,
        isAuthenticated: false,
        isLoading: false,
        isSuperadmin: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
