import { axiosClient } from '@/lib/axiosClient'
import type { TeamMember, TeamChatMessage, CreateTeamMemberDto, UpdateTeamMemberDto } from '@/types/api'

export const teamService = {
  listMembers: async (): Promise<{ success: boolean; data: TeamMember[] }> => {
    const res = await axiosClient.get('/team')
    return res.data
  },

  getMember: async (id: string): Promise<{ success: boolean; data: TeamMember }> => {
    const res = await axiosClient.get(`/team/${id}`)
    return res.data
  },

  createMember: async (dto: CreateTeamMemberDto): Promise<{ success: boolean; data: TeamMember }> => {
    const res = await axiosClient.post('/team', dto)
    return res.data
  },

  updateMember: async (id: string, dto: UpdateTeamMemberDto): Promise<{ success: boolean; data: TeamMember }> => {
    const res = await axiosClient.put(`/team/${id}`, dto)
    return res.data
  },

  deleteMember: async (id: string): Promise<{ success: boolean }> => {
    const res = await axiosClient.delete(`/team/${id}`)
    return res.data
  },

  // Admin chat
  getAdminThread: async (memberId: string): Promise<{ success: boolean; data: TeamChatMessage[] }> => {
    const res = await axiosClient.get(`/team/chat/${memberId}`)
    return res.data
  },

  sendAdminMessage: async (memberId: string, message: string): Promise<{ success: boolean; data: TeamChatMessage }> => {
    const res = await axiosClient.post(`/team/chat/${memberId}`, { message })
    return res.data
  },

  markAdminThreadRead: async (memberId: string): Promise<void> => {
    await axiosClient.patch(`/team/chat/${memberId}/read`)
  },

  // Team member chat
  getMemberThread: async (): Promise<{ success: boolean; data: TeamChatMessage[] }> => {
    const res = await axiosClient.get('/team/chat/me')
    return res.data
  },

  sendMemberMessage: async (message: string): Promise<{ success: boolean; data: TeamChatMessage }> => {
    const res = await axiosClient.post('/team/chat/me', { message })
    return res.data
  },

  markMemberThreadRead: async (): Promise<void> => {
    await axiosClient.patch('/team/chat/me/read')
  },
}
