import { axiosClient } from '../lib/axiosClient';
import type { Message, Conversation, SendMessageDto } from '../types/api';

export const messagesService = {
  async sendMessage(
    dto: SendMessageDto
  ): Promise<{ success: boolean; data: Message }> {
    const response = await axiosClient.post<{ success: boolean; data: Message }>(
      '/messages',
      dto
    );
    return response.data;
  },

  async getConversations(): Promise<{ success: boolean; data: Conversation[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Conversation[] }>(
      '/messages/conversations'
    );
    return response.data;
  },

  async getConversation(
    userId: string
  ): Promise<{ success: boolean; data: Message[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Message[] }>(
      `/messages/conversation/${userId}`
    );
    return response.data;
  },

  async markAsRead(
    messageId: string
  ): Promise<{ success: boolean; data: Message }> {
    const response = await axiosClient.patch<{ success: boolean; data: Message }>(
      `/messages/${messageId}/read`
    );
    return response.data;
  },

  async deleteMessage(
    messageId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{ success: boolean; message: string }>(
      `/messages/${messageId}`
    );
    return response.data;
  },
};