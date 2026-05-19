import { axiosClient } from '../lib/axiosClient';
import type { Course, CreateCourseDto, UpdateCourseDto, CourseListResponse, CourseSingleResponse, ApiResponse, CourseMaterial, SyllabusTopic } from '../types/api';

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
    const response = await axiosClient.patch<{ success: boolean; thumbnail: string }>(
      `/courses/${id}/thumbnail`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async updateCourseVideoPreview(id: string, file: File): Promise<{ videoPreview: string }> {
    const form = new FormData();
    form.append('video', file);
    const response = await axiosClient.patch<{ success: boolean; videoPreview: string }>(
      `/courses/${id}/video-preview`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
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

  async getAdminCourses(params?: {
    status?: string; search?: string; page?: number; limit?: number;
  }): Promise<CourseListResponse> {
    const response = await axiosClient.get<CourseListResponse>('/courses/admin/all', { params });
    return response.data;
  },

  async reviewCourse(id: string, action: 'approve' | 'reject', reason?: string): Promise<CourseSingleResponse> {
    const response = await axiosClient.patch<CourseSingleResponse>(`/courses/${id}/review`, { action, reason });
    return response.data;
  },

  async submitForReview(id: string): Promise<CourseSingleResponse> {
    const response = await axiosClient.patch<CourseSingleResponse>(`/courses/${id}/submit`);
    return response.data;
  },

  // ─── Materials ────────────────────────────────────────────────────────────────

  async getMaterials(courseId: string): Promise<ApiResponse<CourseMaterial[]>> {
    const response = await axiosClient.get<ApiResponse<CourseMaterial[]>>(`/courses/${courseId}/materials`);
    return response.data;
  },

  async addMaterial(courseId: string, dto: { title: string; link: string }): Promise<ApiResponse<CourseMaterial>> {
    const response = await axiosClient.post<ApiResponse<CourseMaterial>>(`/courses/${courseId}/materials`, dto);
    return response.data;
  },

  async updateMaterial(courseId: string, materialId: string, dto: { title?: string; link?: string }): Promise<ApiResponse<CourseMaterial>> {
    const response = await axiosClient.patch<ApiResponse<CourseMaterial>>(`/courses/${courseId}/materials/${materialId}`, dto);
    return response.data;
  },

  async deleteMaterial(courseId: string, materialId: string): Promise<ApiResponse<null>> {
    const response = await axiosClient.delete<ApiResponse<null>>(`/courses/${courseId}/materials/${materialId}`);
    return response.data;
  },

  // ─── Syllabus ─────────────────────────────────────────────────────────────────

  async getSyllabus(courseId: string): Promise<ApiResponse<SyllabusTopic[]>> {
    const response = await axiosClient.get<ApiResponse<SyllabusTopic[]>>(`/courses/${courseId}/syllabus`);
    return response.data;
  },

  async addSyllabusTopic(courseId: string, dto: { week: number; title: string; description?: string; status?: string }): Promise<ApiResponse<SyllabusTopic>> {
    const response = await axiosClient.post<ApiResponse<SyllabusTopic>>(`/courses/${courseId}/syllabus`, dto);
    return response.data;
  },

  async updateSyllabusTopic(courseId: string, topicId: string, dto: { week?: number; title?: string; description?: string; status?: string }): Promise<ApiResponse<SyllabusTopic>> {
    const response = await axiosClient.patch<ApiResponse<SyllabusTopic>>(`/courses/${courseId}/syllabus/${topicId}`, dto);
    return response.data;
  },

  async deleteSyllabusTopic(courseId: string, topicId: string): Promise<ApiResponse<null>> {
    const response = await axiosClient.delete<ApiResponse<null>>(`/courses/${courseId}/syllabus/${topicId}`);
    return response.data;
  },
};
