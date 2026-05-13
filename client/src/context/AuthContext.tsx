import {
  createContext, useContext, useState, useEffect,
  useCallback, type ReactNode,
} from 'react';
import { authService } from '../services/auth.service';
import { usersService, normalizeUser } from '../services/users.service';
import type {
  User, RegisterDto, LoginDto, VerifyEmailDto,
  UpdateProfileDto, AuthResponse,
} from '../types/api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<AuthResponse>;
  register: (dto: RegisterDto) => Promise<{ message: string }>;
  verifyEmail: (dto: VerifyEmailDto) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (dto: UpdateProfileDto) => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const persistAuth = (data: AuthResponse) => {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
};

const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate auth state on mount — verify token is still valid
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setIsLoading(false); return; }

    usersService
      .getProfile()
      .then((userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      })
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (dto: LoginDto): Promise<AuthResponse> => {
    const data = await authService.login(dto);
    persistAuth(data);
    setUser(normalizeUser(data.user));
    return data;
  }, []);

  const register = useCallback(async (dto: RegisterDto): Promise<{ message: string }> => {
    return authService.register(dto);
    // Registration does NOT auto-login — user must verify email first
  }, []);

  const verifyEmail = useCallback(async (dto: VerifyEmailDto): Promise<void> => {
    const data = await authService.verifyEmail(dto);
    persistAuth(data);
    setUser(normalizeUser(data.user));
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* proceed even if API fails */ }
    clearAuth();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (dto: UpdateProfileDto) => {
    const updated = await usersService.updateProfile(dto);
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      login, register, verifyEmail, logout, updateProfile, setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
