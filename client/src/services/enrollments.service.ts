import { axiosClient } from '../lib/axiosClient';
import type { Enrollment, CreateEnrollmentDto, EnrollmentListResponse, ApiResponse } from '../types/api';

export const enrollmentsService = {
  async enroll(dto: CreateEnrollmentDto): Promise<{ success: boolean; data: Enrollment }> {
    const response = await axiosClient.post<{ success: boolean; data: Enrollment }>('/enrollments', dto);
    return response.data;
  },

  async getMyEnrollments(): Promise<{ success: boolean; data: Enrollment[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Enrollment[] }>('/enrollments/my');
    return response.data;
  },

  async getTeacherEnrollments(): Promise<{ success: boolean; data: Enrollment[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Enrollment[] }>('/enrollments/teacher/my');
    return response.data;
  },

  async getEnrollmentById(id: string): Promise<{ success: boolean; data: Enrollment }> {
    const response = await axiosClient.get<{ success: boolean; data: Enrollment }>(`/enrollments/${id}`);
    return response.data;
  },

  async getAllEnrollments(params?: { page?: number; limit?: number }): Promise<EnrollmentListResponse> {
    const response = await axiosClient.get<EnrollmentListResponse>('/enrollments', { params });
    return response.data;
  },

  async markAttendance(id: string, dto: { sessionNumber: number; duration?: number }): Promise<ApiResponse<any>> {
    const response = await axiosClient.patch<ApiResponse<any>>(`/enrollments/${id}/attendance`, dto);
    return response.data;
  },

  async adminEnrollWithFinancialAid(dto: { financialAidId: string; courseId: string; studentId?: string }): Promise<ApiResponse<Enrollment>> {
    const response = await axiosClient.post<ApiResponse<Enrollment>>('/enrollments/admin/financial-aid', dto);
    return response.data;
  },

  async getEnrollmentByFinancialAid(aidId: string): Promise<ApiResponse<Enrollment>> {
    const response = await axiosClient.get<ApiResponse<Enrollment>>(`/enrollments/by-financial-aid/${aidId}`);
    return response.data;
  },
};
