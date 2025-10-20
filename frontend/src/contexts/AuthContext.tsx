import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import authService from '../services/authService';
import type { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const initializeAuth = async () => {
      try {
        // Check for OAuth success callback first
        if (authService.checkOAuthSuccess()) {
          try {
            const result = await authService.handleOAuthCallback();
            if (result?.success) {
              setUser(result.data.user);
              // Clean OAuth params from URL
              authService.cleanOAuthParams();
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('OAuth callback error:', error);
            authService.cleanOAuthParams();
          }
        }

        // Check for OAuth error
        const oauthError = authService.checkOAuthError();
        if (oauthError) {
          console.error('OAuth error:', oauthError);
          authService.cleanOAuthParams();
        }

        // Standard authentication check
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
        // Clear invalid tokens
        await authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      setUser(response.data.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.register({ name, email, password });
      setUser(response.data.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if logout request fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { name?: string; email?: string }) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};