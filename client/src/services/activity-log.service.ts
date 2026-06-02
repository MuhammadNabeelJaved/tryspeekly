import { axiosClient } from '../lib/axiosClient'

export interface ActivityLogEntry {
  _id: string
  teamMember: { _id: string; name: string; profileImage?: string; jobTitle?: string } | null
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'send' | 'other'
  resource: string
  resourceId: string | null
  resourceName: string
  details: string
  ip: string
  createdAt: string
}

export interface ActivitySummaryEntry {
  _id: string
  count: number
  lastAction: string
  member: { _id: string; name: string; profileImage?: string; jobTitle?: string } | null
}

export const activityLogService = {
  async getLogs(params?: {
    page?: number
    limit?: number
    teamMember?: string
    resource?: string
    startDate?: string
    endDate?: string
  }) {
    const res = await axiosClient.get<{
      success: boolean
      data: ActivityLogEntry[]
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>('/activity-logs', { params })
    return res.data
  },

  async getSummary() {
    const res = await axiosClient.get<{ success: boolean; data: ActivitySummaryEntry[] }>('/activity-logs/summary')
    return res.data
  },
}
