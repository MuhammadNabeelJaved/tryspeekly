import { axiosClient } from '../lib/axiosClient';
import type { Payment, CreatePaymentDto, AdminCreatePaymentDto, DirectApprovePaymentDto, UnpaidEnrollment, ApiResponse, ApiPaginatedResponse } from '../types/api';

export const paymentsService = {
  async createPayment(dto: CreatePaymentDto): Promise<{ success: boolean; data: Payment }> {
    const form = new FormData();
    form.append('courseId', dto.courseId);
    form.append('teacherId', dto.teacherId);
    form.append('method', dto.method);
    form.append('amount', String(dto.amount));
    form.append('currency', dto.currency || 'PKR');
    if (dto.transactionId) form.append('transactionId', dto.transactionId);
    if (dto.couponCode) form.append('couponCode', dto.couponCode);
    form.append('screenshot', dto.screenshot);

    const response = await axiosClient.post<{ success: boolean; data: Payment }>(
      '/payments',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async getMyPayments(): Promise<{ success: boolean; data: Payment[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Payment[] }>('/payments/my');
    return response.data;
  },

  async getAllPayments(params?: { page?: number; limit?: number; status?: string }): Promise<ApiPaginatedResponse<Payment>> {
    const response = await axiosClient.get<ApiPaginatedResponse<Payment>>('/payments', { params });
    return response.data;
  },

  async approvePayment(id: string, adminNote?: string): Promise<{ success: boolean; data: Payment }> {
    const response = await axiosClient.patch<{ success: boolean; data: Payment }>(
      `/payments/${id}/approve`,
      { adminNote }
    );
    return response.data;
  },

  async rejectPayment(id: string, rejectionReason: string): Promise<{ success: boolean; data: Payment }> {
    const response = await axiosClient.patch<{ success: boolean; data: Payment }>(
      `/payments/${id}/reject`,
      { rejectionReason }
    );
    return response.data;
  },

  async adminCreatePayment(dto: AdminCreatePaymentDto): Promise<{ success: boolean; data: Payment }> {
    const response = await axiosClient.post<{ success: boolean; data: Payment }>(
      '/payments/admin',
      dto
    );
    return response.data;
  },

  async directApprovePayment(dto: DirectApprovePaymentDto): Promise<{ success: boolean; data: Payment }> {
    const response = await axiosClient.post<{ success: boolean; data: Payment }>(
      '/payments/admin/direct-approve',
      dto
    );
    return response.data;
  },

  async getUnpaidEnrollments(): Promise<ApiPaginatedResponse<UnpaidEnrollment>> {
    const response = await axiosClient.get<ApiPaginatedResponse<UnpaidEnrollment>>(
      '/enrollments/admin/unpaid'
    );
    return response.data;
  },
};
