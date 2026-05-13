import { axiosClient } from '../lib/axiosClient';
import type { Message, Conversation, SendMessageDto } from '../types/api';

export const messagesService = {
  async sendMessage(dto: SendMessageDto): Promise<{ success: boolean; data: Message }> {
    const response = await axiosClient.post<{ success: boolean; data: Message }>('/messages', dto);
    return response.data;
  },

  async getConversations(): Promise<{ success: boolean; data: Conversation[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Conversation[] }>('/messages/conversations');
    return response.data;
  },

  async getMessagesWith(userId: string, params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: Message[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Message[] }>(
      `/messages/${userId}`,
      { params }
    );
    return response.data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await axiosClient.get<{ success: boolean; data: { count: number } }>('/messages/unread/count');
    return response.data.data;
  },
};
