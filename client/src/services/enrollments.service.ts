import { axiosClient } from '../lib/axiosClient';
import type { Enrollment, CreateEnrollmentDto, EnrollmentListResponse } from '../types/api';

export const enrollmentsService = {
  async enroll(dto: CreateEnrollmentDto): Promise<{ success: boolean; data: Enrollment }> {
    const response = await axiosClient.post<{ success: boolean; data: Enrollment }>(
      '/enrollments',
      dto
    );
    return response.data;
  },

  async getEnrollments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<EnrollmentListResponse> {
    const response = await axiosClient.get<EnrollmentListResponse>('/enrollments', { params });
    return response.data;
  },

  async getEnrollmentById(id: string): Promise<{ success: boolean; data: Enrollment }> {
    const response = await axiosClient.get<{ success: boolean; data: Enrollment }>(
      `/enrollments/${id}`
    );
    return response.data;
  },

  async cancelEnrollment(id: string): Promise<{ success: boolean; data: Enrollment }> {
    const response = await axiosClient.patch<{ success: boolean; data: Enrollment }>(
      `/enrollments/${id}/cancel`
    );
    return response.data;
  },

  async completeSession(
    id: string
  ): Promise<{ success: boolean; data: Enrollment }> {
    const response = await axiosClient.patch<{ success: boolean; data: Enrollment }>(
      `/enrollments/${id}/complete-session`
    );
    return response.data;
  },

  async getCourseStudents(
    courseId: string
  ): Promise<{ success: boolean; data: any[] }> {
    const response = await axiosClient.get<{ success: boolean; data: any[] }>(
      `/courses/${courseId}/students`
    );
    return response.data;
  },
};