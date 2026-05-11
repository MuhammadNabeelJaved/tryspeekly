import { axiosClient } from '../lib/axiosClient';
import type {
  User,
  UpdateProfileDto,
  ChangePasswordDto,
  ApiResponse,
} from '../types/api';

export const usersService = {
  async getProfile(): Promise<User> {
    const response = await axiosClient.get<ApiResponse<User>>('/users/profile');
    return response.data.data;
  },

  async updateProfile(dto: UpdateProfileDto): Promise<User> {
    const response = await axiosClient.patch<ApiResponse<User>>('/users/profile', dto);
    return response.data.data;
  },

  async changePassword(dto: ChangePasswordDto): Promise<{ message: string }> {
    const response = await axiosClient.post<ApiResponse<{ message: string }>>('/users/change-password', dto);
    return response.data;
  },

  async deleteAccount(password: string): Promise<{ message: string }> {
    const response = await axiosClient.delete<ApiResponse<{ message: string }>>('/users/account', {
      data: { password },
    });
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await axiosClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },
};