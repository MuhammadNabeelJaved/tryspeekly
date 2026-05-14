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
  login: (dto: LoginDto, remember?: boolean) => Promise<AuthResponse>;
  register: (dto: RegisterDto) => Promise<{ message: string }>;
  verifyEmail: (dto: VerifyEmailDto, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (dto: UpdateProfileDto) => Promise<void>;
  setUser: (user: User | null) => void;
}

// Default value keeps isLoading:true so ProtectedRoute shows a loader
// (instead of crashing) if a consumer renders before the provider mounts,
// which can happen transiently during Vite HMR module graph updates.
const defaultValue: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: (_dto, _remember?) => Promise.reject(new Error('AuthProvider not mounted')),
  register: () => Promise.reject(new Error('AuthProvider not mounted')),
  verifyEmail: (_dto, _remember?) => Promise.reject(new Error('AuthProvider not mounted')),
  logout: () => Promise.resolve(),
  updateProfile: () => Promise.reject(new Error('AuthProvider not mounted')),
  setUser: () => undefined,
};

const AuthContext = createContext<AuthContextValue>(defaultValue);

const persistAuth = (data: AuthResponse, remember = true) => {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('accessToken', data.accessToken);
  storage.setItem('refreshToken', data.refreshToken);
  storage.setItem('user', JSON.stringify(data.user));
};

const clearAuth = () => {
  ['accessToken', 'refreshToken', 'user'].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate auth state on mount — verify token is still valid
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (!token) { setIsLoading(false); return; }

    // Safety net: never leave the app stuck in a loading state
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 8000);

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
      .finally(() => {
        clearTimeout(safetyTimer);
        setIsLoading(false);
      });

    return () => clearTimeout(safetyTimer);
  }, []);

  const login = useCallback(async (dto: LoginDto, remember = true): Promise<AuthResponse> => {
    const data = await authService.login(dto);
    persistAuth(data, remember);
    setUser(normalizeUser(data.user));
    return data;
  }, []);

  const register = useCallback(async (dto: RegisterDto): Promise<{ message: string }> => {
    return authService.register(dto);
  }, []);

  const verifyEmail = useCallback(async (dto: VerifyEmailDto, remember = true): Promise<void> => {
    const data = await authService.verifyEmail(dto);
    persistAuth(data, remember);
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
  return useContext(AuthContext);
}
