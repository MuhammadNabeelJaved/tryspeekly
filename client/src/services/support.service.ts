import { axiosClient } from '../lib/axiosClient';
import type { SupportTicket, CreateTicketDto, ApiResponse, ApiPaginatedResponse } from '../types/api';

export const supportService = {
  async createTicket(dto: CreateTicketDto): Promise<ApiResponse<SupportTicket>> {
    const response = await axiosClient.post<ApiResponse<SupportTicket>>('/support', dto);
    return response.data;
  },

  async getMyTickets(): Promise<{ success: boolean; data: SupportTicket[] }> {
    const response = await axiosClient.get<{ success: boolean; data: SupportTicket[] }>('/support/my');
    return response.data;
  },

  async getTicketById(id: string): Promise<ApiResponse<SupportTicket>> {
    const response = await axiosClient.get<ApiResponse<SupportTicket>>(`/support/${id}`);
    return response.data;
  },

  async replyToTicket(id: string, content: string): Promise<ApiResponse<any>> {
    const response = await axiosClient.post<ApiResponse<any>>(`/support/${id}/reply`, { content });
    return response.data;
  },

  async getAllTickets(params?: { page?: number; limit?: number; status?: string; priority?: string }): Promise<ApiPaginatedResponse<SupportTicket>> {
    const response = await axiosClient.get<ApiPaginatedResponse<SupportTicket>>('/support', { params });
    return response.data;
  },

  async updateTicketStatus(id: string, status: 'open' | 'pending' | 'closed'): Promise<ApiResponse<SupportTicket>> {
    const response = await axiosClient.patch<ApiResponse<SupportTicket>>(`/support/${id}/status`, { status });
    return response.data;
  },
};
