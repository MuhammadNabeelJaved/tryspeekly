import { axiosClient } from '../lib/axiosClient'

export const referralsService = {
  async getPublicSettings() {
    const res = await axiosClient.get('/referrals/public-settings')
    return res.data
  },

  async generateCode(courseId?: string) {
    const res = await axiosClient.post('/referrals/generate', { courseId })
    return res.data
  },

  async getMyCodes() {
    const res = await axiosClient.get('/referrals/my-codes')
    return res.data
  },

  async getMyRewards(params?: { page?: number; limit?: number }) {
    const res = await axiosClient.get('/referrals/my-rewards', { params })
    return res.data
  },

  async getMyWallet() {
    const res = await axiosClient.get('/referrals/my-wallet')
    return res.data
  },

  async createPayoutRequest(amount: number) {
    const res = await axiosClient.post('/referrals/payout-request', { amount })
    return res.data
  },

  async getAllRewards(params?: { page?: number; limit?: number; status?: string }) {
    const res = await axiosClient.get('/referrals', { params })
    return res.data
  },

  async getPayoutRequests(params?: { page?: number; limit?: number; status?: string }) {
    const res = await axiosClient.get('/referrals/payout-requests', { params })
    return res.data
  },

  async processPayoutRequest(requestId: string, action: 'approve' | 'reject', adminNote?: string) {
    const res = await axiosClient.patch(`/referrals/payout-requests/${requestId}`, { action, adminNote })
    return res.data
  },

  async getReferralSettings() {
    const res = await axiosClient.get('/referrals/settings')
    return res.data
  },

  async updateReferralSettings(dto: {
    enabled?: boolean
    refereeDiscountType?: 'percentage' | 'fixed'
    refereeDiscountValue?: number
    referrerRewardType?: 'percentage' | 'fixed'
    referrerRewardValue?: number
  }) {
    const res = await axiosClient.patch('/referrals/settings', dto)
    return res.data
  },
}
