import { axiosClient } from '../lib/axiosClient'

export interface Offer {
  _id: string
  title: string
  bannerText: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  scope: 'platform' | 'course'
  course: { _id: string; title: string } | null
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
}

export const offersService = {
  async getActiveOffers(): Promise<{ success: boolean; data: Offer[] }> {
    const res = await axiosClient.get('/offers/active')
    return res.data
  },

  async getAdminOffers(): Promise<{ success: boolean; data: Offer[] }> {
    const res = await axiosClient.get('/offers')
    return res.data
  },

  async createOffer(dto: {
    title: string
    bannerText: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    scope: 'platform' | 'course'
    courseId?: string
    isActive: boolean
    startsAt?: string | null
    endsAt?: string | null
  }): Promise<{ success: boolean; data: Offer }> {
    const res = await axiosClient.post('/offers', dto)
    return res.data
  },

  async updateOffer(
    id: string,
    dto: Partial<{
      title: string
      bannerText: string
      discountType: 'percentage' | 'fixed'
      discountValue: number
      scope: 'platform' | 'course'
      courseId: string | null
      isActive: boolean
      startsAt: string | null
      endsAt: string | null
    }>
  ): Promise<{ success: boolean; data: Offer }> {
    const res = await axiosClient.patch(`/offers/${id}`, dto)
    return res.data
  },

  async deleteOffer(id: string): Promise<void> {
    await axiosClient.delete(`/offers/${id}`)
  },
}
