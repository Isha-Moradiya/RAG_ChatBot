// Authentication Types
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: number;
  lastLoginAt: number;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  displayName?: string;
}

export interface AuthToken {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

export interface AuthError {
  code: string;
  message: string;
  email?: string;
} 