import { axiosClient } from '../lib/axiosClient'
import type { ApiResponse, ApiPaginatedResponse } from '../types/api'

export interface EmailSetting {
  _id: string
  type: string
  name: string
  description: string
  category: string
  enabled: boolean
}

export interface EmailTemplate {
  _id: string
  type: string
  name: string
  subject: string
  htmlBody?: string
  variables: string[]
  isCustomized: boolean
}

export interface EmailLog {
  _id: string
  type: string
  to: string
  toName: string
  subject: string
  status: 'sent' | 'failed' | 'skipped'
  resendId: string
  error: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface EmailStats {
  total: number
  sent: number
  failed: number
  skipped: number
  recentByType: { _id: string; count: number }[]
}

export const emailService = {
  // Settings
  async getSettings(): Promise<ApiResponse<EmailSetting[]>> {
    const r = await axiosClient.get<ApiResponse<EmailSetting[]>>('/email/settings')
    return r.data
  },
  async updateSetting(type: string, enabled: boolean): Promise<ApiResponse<EmailSetting>> {
    const r = await axiosClient.patch<ApiResponse<EmailSetting>>(`/email/settings/${type}`, { enabled })
    return r.data
  },
  async bulkUpdateSettings(updates: { type: string; enabled: boolean }[]): Promise<ApiResponse<null>> {
    const r = await axiosClient.patch<ApiResponse<null>>('/email/settings', { updates })
    return r.data
  },

  // Templates
  async getTemplates(): Promise<ApiResponse<EmailTemplate[]>> {
    const r = await axiosClient.get<ApiResponse<EmailTemplate[]>>('/email/templates')
    return r.data
  },
  async getTemplate(type: string): Promise<ApiResponse<EmailTemplate>> {
    const r = await axiosClient.get<ApiResponse<EmailTemplate>>(`/email/templates/${type}`)
    return r.data
  },
  async updateTemplate(type: string, data: { subject: string; htmlBody: string }): Promise<ApiResponse<EmailTemplate>> {
    const r = await axiosClient.put<ApiResponse<EmailTemplate>>(`/email/templates/${type}`, data)
    return r.data
  },
  async resetTemplate(type: string): Promise<ApiResponse<EmailTemplate>> {
    const r = await axiosClient.post<ApiResponse<EmailTemplate>>(`/email/templates/${type}/reset`)
    return r.data
  },

  // Logs
  async getLogs(params?: { page?: number; limit?: number; status?: string; type?: string; search?: string }): Promise<ApiPaginatedResponse<EmailLog>> {
    const r = await axiosClient.get<ApiPaginatedResponse<EmailLog>>('/email/logs', { params })
    return r.data
  },
  async clearLogs(): Promise<ApiResponse<null>> {
    const r = await axiosClient.delete<ApiResponse<null>>('/email/logs')
    return r.data
  },

  // Test & Stats
  async sendTestEmail(type: string, to: string): Promise<ApiResponse<null>> {
    const r = await axiosClient.post<ApiResponse<null>>('/email/test', { type, to })
    return r.data
  },
  async getStats(): Promise<ApiResponse<EmailStats>> {
    const r = await axiosClient.get<ApiResponse<EmailStats>>('/email/stats')
    return r.data
  },
}
