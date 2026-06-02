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

  async bulkDeleteCoupons(ids: string[]) {
    const res = await axiosClient.delete('/coupons/bulk', { data: { ids } })
    return res.data as { success: boolean; message: string; data: { deleted: number } }
  },

  async getUsageTracking(params?: {
    page?: number
    limit?: number
    type?: 'coupon' | 'offer'
  }) {
    const res = await axiosClient.get('/coupons/tracking', { params })
    return res.data as {
      success: boolean
      data: Array<{
        _id: string
        student: { _id: string; name: string; email: string } | null
        course: { _id: string; title: string; price?: number; priceUSD?: number; currency?: string } | null
        coupon: { _id: string; code: string; discountType: string; discountValue: number; source: string } | null
        offer: { _id: string; title: string; discountType: string; discountValue: number } | null
        discountApplied: number
        offerDiscountApplied: number
        totalDiscount: number
        isActive: boolean
        enrolledAt: string
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }
  },
}
