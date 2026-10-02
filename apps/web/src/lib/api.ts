// ZapTI Web — API Client
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    this.setupInterceptors();
    this.loadTokens();
  }

  private loadTokens() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  private setupInterceptors() {
    // Request interceptor - add auth header
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401 and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return this.client.request(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      if (!this.refreshToken) throw new Error('No refresh token');

      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: this.refreshToken,
      });

      const { accessToken, refreshToken } = response.data;
      this.saveTokens(accessToken, refreshToken);
      this.refreshPromise = null;
      return accessToken;
    })();

    return this.refreshPromise;
  }

  // Auth methods
  async login(email: string, password: string, rememberMe = false) {
    const response = await this.client.post('/auth/login', { email, password, rememberMe });
    const { accessToken, refreshToken, requiresTwoFactor } = response.data;

    if (!requiresTwoFactor) {
      this.saveTokens(accessToken, refreshToken);
    }

    return response.data;
  }

  async register(name: string, email: string, password: string, tenantName: string) {
    const response = await this.client.post('/auth/register', { name, email, password, tenantName });
    const { accessToken, refreshToken } = response.data;

    this.saveTokens(accessToken, refreshToken);

    return response.data;
  }

  async verify2FA(token: string) {
    // This would be called after login returns requiresTwoFactor: true
    // The login endpoint already handles 2FA verification, but we could have a separate endpoint
    return this.client.post('/auth/2fa/verify', { token });
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
  }

  async logoutAll() {
    try {
      await this.client.post('/auth/logout-all');
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Generic request methods
  async get<T>(url: string, params?: object) {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: object) {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: object) {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: object) {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string, data?: object) {
    const response = await this.client.delete<T>(url, { data });
    return response.data;
  }

  // File upload
  async uploadFile(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  // Tenant management (superadmin)
  async getTenants(params?: object) {
    return this.get('/tenants', params);
  }

  async getTenant(id: string) {
    return this.get(`/tenants/${id}`);
  }

  async createTenant(data: object) {
    return this.post('/tenants', data);
  }

  async updateTenant(id: string, data: object) {
    return this.patch(`/tenants/${id}`, data);
  }

  async suspendTenant(id: string) {
    return this.post(`/tenants/${id}/suspend`);
  }

  async unsuspendTenant(id: string) {
    return this.post(`/tenants/${id}/unsuspend`);
  }

  async deleteTenant(id: string, confirmation: string) {
    return this.delete(`/tenants/${id}`, { data: { confirmation } });
  }

  // Users
  async getUsers(params?: object) {
    return this.get('/users', params);
  }

  async getUser(id: string) {
    return this.get(`/users/${id}`);
  }

  async createUser(data: object) {
    return this.post('/users', data);
  }

  async updateUser(id: string, data: object) {
    return this.patch(`/users/${id}`, data);
  }

  async forcePasswordReset(id: string) {
    return this.post(`/users/${id}/force-password-reset`);
  }

  async deleteUser(id: string, confirmation: string) {
    return this.delete(`/users/${id}`, { data: { confirmation } });
  }

  // Teams
  async getTeams(params?: object) {
    return this.get('/teams', params);
  }

  async getTeam(id: string) {
    return this.get(`/teams/${id}`);
  }

  async createTeam(data: object) {
    return this.post('/teams', data);
  }

  async updateTeam(id: string, data: object) {
    return this.patch(`/teams/${id}`, data);
  }

  async deleteTeam(id: string, confirmation: string) {
    return this.delete(`/teams/${id}`, { data: { confirmation } });
  }

  // Sessions (admin)
  async getSessions(params?: object) {
    return this.get('/sessions', params);
  }

  async revokeSession(sessionId: string) {
    return this.delete(`/sessions/${sessionId}`);
  }

  async revokeAllUserSessions(userId: string) {
    return this.post(`/sessions/revoke-user/${userId}`);
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

// Singleton instance
export const api = new ApiClient();

// Export class for testing
export { ApiClient };
