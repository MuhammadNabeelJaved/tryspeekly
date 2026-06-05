import { axiosClient } from '../lib/axiosClient'

export interface SeoRobots { index: boolean; follow: boolean; noArchive: boolean; noSnippet: boolean }
export interface SeoOg { title: string; description: string; image: string; imageAlt: string; type: string; url: string; siteName: string; locale: string }
export interface SeoTwitter { card: string; title: string; description: string; image: string; site: string; creator: string }
export interface SeoSitemap { priority: number; changeFreq: string; include: boolean }
export interface SeoGlobal { titleSuffix: string; defaultOgImage: string; googleAnalyticsId: string; googleSiteVerification: string; bingVerification: string; facebookPixelId: string; robotsTxt: string }

export interface SeoPage {
  _id: string
  pageSlug: string
  pageName: string
  pageUrl: string
  isPublic: boolean
  metaTitle: string
  metaDescription: string
  metaKeywords: string[]
  canonicalUrl: string
  robots: SeoRobots
  og: SeoOg
  twitter: SeoTwitter
  schemaMarkup: string
  sitemap: SeoSitemap
  global: SeoGlobal
  lastModified: string
  updatedAt: string
  updatedBy?: { _id: string; name: string; profileImage?: string; jobTitle?: string } | null
}

const BASE = '/seo'

export const seoService = {
  async getAll(): Promise<SeoPage[]> {
    const res = await axiosClient.get(BASE)
    return res.data.data
  },
  async getPage(slug: string): Promise<SeoPage> {
    const res = await axiosClient.get(`${BASE}/${slug}`)
    return res.data.data
  },
  async upsert(slug: string, data: Partial<SeoPage>): Promise<SeoPage> {
    const res = await axiosClient.put(`${BASE}/${slug}`, data)
    return res.data.data
  },
  async createPage(data: { pageSlug: string; pageName: string; pageUrl: string }): Promise<SeoPage> {
    const res = await axiosClient.post(BASE, data)
    return res.data.data
  },
  async deletePage(slug: string): Promise<void> {
    await axiosClient.delete(`${BASE}/${slug}`)
  },
}
