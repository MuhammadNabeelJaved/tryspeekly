import { axiosClient } from '../lib/axiosClient';
import type { ApiResponse } from '../types/api';

interface LiveClass {
  _id: string;
  course: {
    _id: string;
    title: string;
    totalSessions: number;
  };
  teacher: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  meetingLink: string;
  classNumber: number;
  scheduledAt: string | null;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export const liveClassService = {
  async startLiveClass(dto: {
    courseId: string;
    meetingLink: string;
    classNumber: number;
  }): Promise<ApiResponse<LiveClass>> {
    const response = await axiosClient.post<ApiResponse<LiveClass>>('/live-classes', dto);
    return response.data;
  },

  async updateLiveClass(id: string, meetingLink: string): Promise<ApiResponse<LiveClass>> {
    const response = await axiosClient.patch<ApiResponse<LiveClass>>(`/live-classes/${id}`, { meetingLink });
    return response.data;
  },

  async completeLiveClass(id: string): Promise<ApiResponse<LiveClass>> {
    const response = await axiosClient.patch<ApiResponse<LiveClass>>(`/live-classes/${id}/complete`);
    return response.data;
  },

  async cancelLiveClass(id: string): Promise<ApiResponse<LiveClass>> {
    const response = await axiosClient.patch<ApiResponse<LiveClass>>(`/live-classes/${id}/cancel`);
    return response.data;
  },

  async getTeacherLiveClasses(): Promise<ApiResponse<LiveClass[]>> {
    const response = await axiosClient.get<ApiResponse<LiveClass[]>>('/live-classes/teacher');
    return response.data;
  },

  async getActiveLiveClasses(): Promise<ApiResponse<LiveClass[]>> {
    const response = await axiosClient.get<ApiResponse<LiveClass[]>>('/live-classes/active');
    return response.data;
  },

  async getLiveClassByCourse(courseId: string): Promise<ApiResponse<LiveClass | null>> {
    const response = await axiosClient.get<ApiResponse<LiveClass | null>>(`/live-classes/course/${courseId}`);
    return response.data;
  },

  async getTeacherCompletedClasses(): Promise<ApiResponse<LiveClass[]>> {
    const response = await axiosClient.get<ApiResponse<LiveClass[]>>('/live-classes/teacher/completed');
    return response.data;
  },

  async scheduleClass(dto: { courseId: string; scheduledAt: string }): Promise<ApiResponse<LiveClass>> {
    const response = await axiosClient.post<ApiResponse<LiveClass>>('/live-classes/schedule', dto);
    return response.data;
  },

  async updateSchedule(id: string, scheduledAt: string): Promise<ApiResponse<LiveClass>> {
    const response = await axiosClient.patch<ApiResponse<LiveClass>>(`/live-classes/${id}/reschedule`, { scheduledAt });
    return response.data;
  },

  async deleteSchedule(id: string): Promise<ApiResponse<null>> {
    const response = await axiosClient.delete<ApiResponse<null>>(`/live-classes/${id}/schedule`);
    return response.data;
  },
};
