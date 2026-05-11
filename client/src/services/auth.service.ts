import { axiosClient } from '../lib/axiosClient';
import type {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponse,
  ApiResponse,
} from '../types/api';

export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/auth/login', dto);
    return response.data.data;
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/auth/register', dto);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await axiosClient.post('/auth/logout');
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await axiosClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return response.data.data;
  },

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const response = await axiosClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', dto);
    return response.data;
  },

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const response = await axiosClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', dto);
    return response.data;
  },
};