import { axiosClient } from '../lib/axiosClient';
import type { ContactDto, ContactMessage, ApiResponse, ApiPaginatedResponse } from '../types/api';

type UpdateContactDto = Partial<{
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  status: ContactMessage['status'];
  notes: string;
}>;

type CreateContactDto = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status?: ContactMessage['status'];
  notes?: string;
};

export const contactService = {
  async submit(dto: ContactDto): Promise<{ message: string }> {
    const response = await axiosClient.post<ApiResponse<ContactMessage>>('/contact', dto);
    return { message: response.data.message || 'Message sent successfully' };
  },

  async getAllMessages(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    status?: string;
    search?: string;
  }): Promise<ApiPaginatedResponse<ContactMessage>> {
    const response = await axiosClient.get<ApiPaginatedResponse<ContactMessage>>('/contact', { params });
    return response.data;
  },

  async getMessage(id: string): Promise<ApiResponse<ContactMessage>> {
    const response = await axiosClient.get<ApiResponse<ContactMessage>>(`/contact/${id}`);
    return response.data;
  },

  async createContact(dto: CreateContactDto): Promise<ApiResponse<ContactMessage>> {
    const response = await axiosClient.post<ApiResponse<ContactMessage>>('/contact/admin', dto);
    return response.data;
  },

  async updateMessage(id: string, dto: UpdateContactDto): Promise<ApiResponse<ContactMessage>> {
    const response = await axiosClient.patch<ApiResponse<ContactMessage>>(`/contact/${id}`, dto);
    return response.data;
  },

  async markAsRead(id: string): Promise<ApiResponse<ContactMessage>> {
    const response = await axiosClient.patch<ApiResponse<ContactMessage>>(`/contact/${id}/read`);
    return response.data;
  },

  async deleteMessage(id: string): Promise<{ message: string }> {
    const response = await axiosClient.delete<ApiResponse<null>>(`/contact/${id}`);
    return { message: response.data.message || 'Deleted' };
  },

  async bulkDelete(ids: string[]): Promise<{ success: boolean; message: string; data: { deleted: number } }> {
    const response = await axiosClient.delete<{ success: boolean; message: string; data: { deleted: number } }>(
      '/contact/bulk', { data: { ids } }
    );
    return response.data;
  },
};
