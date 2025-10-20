import axios, { type AxiosResponse } from 'axios';
import type { AuthResponse, RegisterData, LoginData, User, UserStats } from '../types/auth';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'}/users/refresh-token`,
            { refreshToken },
            { withCredentials: true }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

class AuthService {
  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post('/users/register', data);
    
    if (response.data.success) {
      const { accessToken, refreshToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    return response.data;
  }

  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post('/users/login', data);
    
    if (response.data.success) {
      const { accessToken, refreshToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    return response.data;
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post('/users/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<{ data: User }> = await api.get('/users/me');
    return response.data.data;
  }

  // Update user profile
  async updateProfile(data: { name?: string; email?: string }): Promise<User> {
    const response: AxiosResponse<{ data: User }> = await api.patch('/users/update-profile', data);
    return response.data.data;
  }

  // Change password
  async changePassword(data: { oldPassword: string; newPassword: string }): Promise<void> {
    await api.patch('/users/change-password', data);
  }

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    const response: AxiosResponse<{ data: UserStats }> = await api.get('/users/stats');
    return response.data.data;
  }

  // Refresh access token
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await api.post('/users/refresh-token', { refreshToken });
    
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return response.data.data;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    // For cookie-based auth (OAuth), we can't check httpOnly cookies directly
    // The AuthContext will determine authentication state by trying to get current user
    return !!token;
  }

  // Get stored access token
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Get stored refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // Test API connection
  async testConnection(): Promise<{ message: string; timestamp: string; version: string }> {
    const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/health`);
    return response.data;
  }

  // Google OAuth - Redirect to Google login
  initiateGoogleLogin(): void {
    const googleAuthUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'}/users/google`;
    window.location.href = googleAuthUrl;
  }

  // Handle OAuth callback (for popup/redirect flows)
  async handleOAuthCallback(): Promise<AuthResponse | null> {
    try {
      // The backend has already set cookies during redirect
      // We just need to get the current user to populate the context
      const user = await this.getCurrentUser();
      
      // Return a successful response (cookies are already set by backend)
      return {
        statusCode: 200,
        success: true,
        message: 'OAuth authentication successful',
        data: {
          user,
          accessToken: 'cookie-based',  // Indicate tokens are in cookies
          refreshToken: 'cookie-based'
        }
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return null;
    }
  }

  // Check if OAuth was successful (from URL params)
  checkOAuthSuccess(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('oauth_success') === 'true';
  }

  // Check if OAuth failed (from URL params)
  checkOAuthError(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('error');
  }

  // Clean OAuth params from URL
  cleanOAuthParams(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('oauth_success');
    url.searchParams.delete('error');
    window.history.replaceState({}, document.title, url.toString());
  }
}

export default new AuthService();
export { api };