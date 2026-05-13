import { axiosClient } from '../lib/axiosClient';
import type { Notification, ApiResponse, ApiPaginatedResponse } from '../types/api';

export const notificationsService = {
  async getMyNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<ApiPaginatedResponse<Notification>> {
    const response = await axiosClient.get<ApiPaginatedResponse<Notification>>('/notifications', { params });
    return response.data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await axiosClient.get<ApiResponse<{ count: number }>>('/notifications/unread/count');
    return response.data.data;
  },

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    const response = await axiosClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ message: string }> {
    const response = await axiosClient.patch<ApiResponse<null>>('/notifications/read-all');
    return { message: response.data.message || 'All marked as read' };
  },
};
