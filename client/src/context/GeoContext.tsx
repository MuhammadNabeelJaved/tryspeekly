import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { axiosClient } from '@/lib/axiosClient'

interface GeoData {
  country: string
  currency: 'PKR' | 'USD'
  isBlocked: boolean
  loading: boolean
}

const CACHE_KEY = 'geo_cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

const GeoContext = createContext<GeoData>({
  country: 'PK',
  currency: 'PKR',
  isBlocked: false,
  loading: true,
})

export function GeoProvider({ children }: { children: ReactNode }) {
  const [geo, setGeo] = useState<GeoData>(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const { data, expiresAt } = JSON.parse(raw)
        if (Date.now() < expiresAt) return { ...data, loading: false }
      }
    } catch {}
    return { country: 'PK', currency: 'PKR', isBlocked: false, loading: true }
  })

  useEffect(() => {
    if (!geo.loading) return

    axiosClient.get<{ success: boolean; data: { country: string; currency: string; isBlocked: boolean } }>('/geo/detect')
      .then(res => {
        const data = {
          country: res.data.data.country || 'PK',
          currency: (res.data.data.currency as 'PKR' | 'USD') || 'PKR',
          isBlocked: !!res.data.data.isBlocked,
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, expiresAt: Date.now() + CACHE_TTL_MS }))
        setGeo({ ...data, loading: false })
      })
      .catch(() => {
        setGeo({ country: 'PK', currency: 'PKR', isBlocked: false, loading: false })
      })
  }, [geo.loading])

  return <GeoContext.Provider value={geo}>{children}</GeoContext.Provider>
}

export function useGeo() {
  return useContext(GeoContext)
}
