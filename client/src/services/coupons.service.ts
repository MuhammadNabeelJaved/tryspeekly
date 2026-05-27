import { axiosClient } from '../lib/axiosClient'

export const couponsService = {
  async validateCoupon(code: string, courseId: string) {
    const res = await axiosClient.post('/coupons/validate', { code, courseId })
    return res.data
  },

  async getCoupons(params?: { page?: number; limit?: number; source?: string; isActive?: boolean; scope?: string }) {
    const res = await axiosClient.get('/coupons', { params })
    return res.data
  },

  async createCoupon(dto: {
    code: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    scope: 'platform' | 'course'
    courseId?: string
    maxUses?: number | null
    expiresAt?: string | null
  }) {
    const res = await axiosClient.post('/coupons', dto)
    return res.data
  },

  async updateCoupon(id: string, dto: {
    isActive?: boolean
    maxUses?: number | null
    expiresAt?: string | null
    discountValue?: number
    discountType?: 'percentage' | 'fixed'
    code?: string
  }) {
    const res = await axiosClient.patch(`/coupons/${id}`, dto)
    return res.data
  },

  async deleteCoupon(id: string) {
    await axiosClient.delete(`/coupons/${id}`)
  },
}
