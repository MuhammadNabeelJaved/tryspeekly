import { useEffect, useState } from 'react'
import { axiosClient } from '../lib/axiosClient'

interface SeoGlobalFields {
  titleSuffix?: string
  defaultOgImage?: string
  googleSiteVerification?: string
}

export interface SeoData {
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
  canonicalUrl?: string
  robots?: { index?: boolean; follow?: boolean; noArchive?: boolean; noSnippet?: boolean }
  og?: { title?: string; description?: string; image?: string; imageAlt?: string; type?: string; url?: string; siteName?: string }
  twitter?: { card?: string; title?: string; description?: string; image?: string; site?: string; creator?: string }
  schemaMarkup?: string
  /** Site-wide global SEO fields (title suffix, default OG image, verification) */
  global?: SeoGlobalFields
}

interface PublicSeoResponse {
  success: boolean
  data: {
    page: (SeoData & Record<string, unknown>) | null
    global: ({ global?: SeoGlobalFields } & Record<string, unknown>) | null
  }
}

export function useSEO(slug: string) {
  const [seo, setSeo] = useState<SeoData | null>(null)

  useEffect(() => {
    let cancelled = false
    axiosClient
      .get<PublicSeoResponse>(`/seo/public/${slug}`)
      .then(res => {
        if (cancelled || !res.data.success) return
        const { page, global } = res.data.data
        setSeo({ ...(page ?? {}), global: global?.global ?? {} })
      })
      .catch(() => {
        if (!cancelled) setSeo(null)
      })
    return () => { cancelled = true }
  }, [slug])

  return seo
}
