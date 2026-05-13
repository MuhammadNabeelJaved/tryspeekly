import { axiosClient } from '../lib/axiosClient';
import type { Course, CreateCourseDto, UpdateCourseDto, CourseListResponse, CourseSingleResponse, ApiResponse } from '../types/api';

export const coursesService = {
  async getAllCourses(params?: {
    level?: string; focus?: string; type?: string;
    search?: string; page?: number; limit?: number; status?: string;
  }): Promise<CourseListResponse> {
    const response = await axiosClient.get<CourseListResponse>('/courses', { params });
    return response.data;
  },

  async getCourseById(id: string): Promise<CourseSingleResponse> {
    const response = await axiosClient.get<CourseSingleResponse>(`/courses/${id}`);
    return response.data;
  },

  async getTeacherCourses(): Promise<CourseListResponse> {
    const response = await axiosClient.get<CourseListResponse>('/courses/teacher/my');
    return response.data;
  },

  async createCourse(dto: CreateCourseDto): Promise<CourseSingleResponse> {
    const response = await axiosClient.post<CourseSingleResponse>('/courses', dto);
    return response.data;
  },

  async updateCourse(id: string, dto: UpdateCourseDto): Promise<CourseSingleResponse> {
    const response = await axiosClient.patch<CourseSingleResponse>(`/courses/${id}`, dto);
    return response.data;
  },

  async updateCourseThumbnail(id: string, file: File): Promise<{ thumbnail: string }> {
    const form = new FormData();
    form.append('image', file);
    const response = await axiosClient.patch<ApiResponse<{ thumbnail: string }>>(
      `/courses/${id}/thumbnail`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },

  async publishCourse(id: string): Promise<CourseSingleResponse> {
    const response = await axiosClient.patch<CourseSingleResponse>(`/courses/${id}`, { status: 'published' });
    return response.data;
  },

  async archiveCourse(id: string): Promise<CourseSingleResponse> {
    const response = await axiosClient.patch<CourseSingleResponse>(`/courses/${id}`, { status: 'archived' });
    return response.data;
  },

  async deleteCourse(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{ success: boolean; message: string }>(`/courses/${id}`);
    return response.data;
  },
};
