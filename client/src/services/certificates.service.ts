import { axiosClient } from '../lib/axiosClient';
import type { Certificate, ApiResponse, ApiPaginatedResponse } from '../types/api';

export const certificatesService = {
  async getMyCertificates(): Promise<{ success: boolean; data: Certificate[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Certificate[] }>('/certificates/my');
    return response.data;
  },

  async claimCertificate(enrollmentId: string): Promise<ApiResponse<Certificate>> {
    const response = await axiosClient.post<ApiResponse<Certificate>>('/certificates/claim', { enrollmentId });
    return response.data;
  },

  async verifyCertificate(certificateId: string): Promise<ApiResponse<Certificate>> {
    const response = await axiosClient.get<ApiResponse<Certificate>>(`/certificates/verify/${certificateId}`);
    return response.data;
  },

  async getCertificate(id: string): Promise<ApiResponse<Certificate>> {
    const response = await axiosClient.get<ApiResponse<Certificate>>(`/certificates/${id}`);
    return response.data;
  },

  async issueCertificate(enrollmentId: string, credentialUrl?: string): Promise<ApiResponse<Certificate>> {
    const response = await axiosClient.post<ApiResponse<Certificate>>('/certificates', { enrollmentId, credentialUrl });
    return response.data;
  },

  async getAllCertificates(params?: { page?: number; limit?: number; status?: string }): Promise<ApiPaginatedResponse<Certificate>> {
    const response = await axiosClient.get<ApiPaginatedResponse<Certificate>>('/certificates', { params });
    return response.data;
  },

  async revokeCertificate(id: string): Promise<ApiResponse<Certificate>> {
    const response = await axiosClient.patch<ApiResponse<Certificate>>(`/certificates/${id}/revoke`);
    return response.data;
  },

  async deleteCertificate(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{ success: boolean; message: string }>(`/certificates/${id}`);
    return response.data;
  },

  async bulkDelete(ids: string[]): Promise<{ success: boolean; message: string; data: { deleted: number } }> {
    const response = await axiosClient.delete<{ success: boolean; message: string; data: { deleted: number } }>(
      '/certificates/bulk', { data: { ids } }
    );
    return response.data;
  },
};
