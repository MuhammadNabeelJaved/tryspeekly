import { axiosClient } from '../lib/axiosClient';
import type { Assignment, ApiResponse } from '../types/api';

export const assignmentsService = {
  async getCourseAssignments(courseId: string): Promise<{ success: boolean; data: Assignment[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Assignment[] }>(
      `/assignments/course/${courseId}`
    );
    return response.data;
  },

  async getAssignment(assignmentId: string): Promise<{ success: boolean; data: Assignment }> {
    const response = await axiosClient.get<{ success: boolean; data: Assignment }>(
      `/assignments/${assignmentId}`
    );
    return response.data;
  },

  async submitAssignment(
    assignmentId: string,
    payload: { enrollmentId: string; file: File }
  ): Promise<ApiResponse<{ _id: string; fileUrl: string; status: string }>> {
    const form = new FormData();
    form.append('file', payload.file);
    form.append('enrollmentId', payload.enrollmentId);
    const response = await axiosClient.post<ApiResponse<{ _id: string; fileUrl: string; status: string }>>(
      `/assignments/${assignmentId}/submit`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async gradeSubmission(
    assignmentId: string,
    submissionId: string,
    payload: { grade: number; feedback?: string }
  ): Promise<ApiResponse<{ _id: string; grade: number; feedback?: string; status: string }>> {
    const response = await axiosClient.patch<
      ApiResponse<{ _id: string; grade: number; feedback?: string; status: string }>
    >(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, payload);
    return response.data;
  },

  async getInstructorAssignments(): Promise<{ success: boolean; data: Assignment[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Assignment[] }>(
      '/assignments/instructor/my'
    );
    return response.data;
  },

  async getMyAssignments(): Promise<{ success: boolean; data: Assignment[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Assignment[] }>(
      '/assignments/my'
    );
    return response.data;
  },
};
