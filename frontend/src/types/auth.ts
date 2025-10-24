// Authentication types
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'premium' | 'enterprise';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  statusCode: number;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
  success: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  success: false;
  errors?: string[];
}

export interface UserStats {
  plan: string;
  memberSince: string;
}