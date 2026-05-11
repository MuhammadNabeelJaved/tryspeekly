import { axiosClient } from '../lib/axiosClient';
import type {
  Course,
  CreateCourseDto,
  UpdateCourseDto,
  CourseListResponse,
  CourseSingleResponse,
} from '../types/api';

export const coursesService = {
  async getAllCourses(params?: {
    level?: string;
    focus?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<CourseListResponse> {
    const response = await axiosClient.get<CourseListResponse>('/courses', { params });
    return response.data;
  },

  async getCourseById(id: string): Promise<CourseSingleResponse> {
    const response = await axiosClient.get<CourseSingleResponse>(`/courses/${id}`);
    return response.data;
  },

  async getTeacherCourses(): Promise<CourseListResponse> {
    const response = await axiosClient.get<CourseListResponse>('/courses/teacher/my-courses');
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

  async deleteCourse(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{ success: boolean; message: string }>(`/courses/${id}`);
    return response.data;
  },

  async publishCourse(id: string): Promise<CourseSingleResponse> {
    const response = await axiosClient.post<CourseSingleResponse>(`/courses/${id}/publish`);
    return response.data;
  },

  async archiveCourse(id: string): Promise<CourseSingleResponse> {
    const response = await axiosClient.post<CourseSingleResponse>(`/courses/${id}/archive`);
    return response.data;
  },

  async getCourseStudents(courseId: string): Promise<{ success: boolean; data: any[] }> {
    const response = await axiosClient.get<{ success: boolean; data: any[] }>(
      `/courses/${courseId}/students`
    );
    return response.data;
  },
};