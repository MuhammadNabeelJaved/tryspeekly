// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  phone?: string;
  country?: string;
  avatar?: string;
  createdAt: string;
}

// Auth types
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  role: 'student' | 'teacher';
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface RefreshResponse {
  accessToken: string;
}

// Error types
export interface ApiError {
  message: string;
  fields?: Array<{ field: string; message: string }>;
  statusCode?: number;
}
