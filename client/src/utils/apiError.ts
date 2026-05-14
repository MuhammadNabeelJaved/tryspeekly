type AxiosLike = {
  response?: {
    data?: {
      error?: { message?: string } | string
      message?: string
    }
  }
  message?: string
}

export function extractApiError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as AxiosLike
  const data = e?.response?.data
  if (!data) return e?.message || fallback
  if (data.error && typeof data.error === 'object' && data.error.message) return data.error.message
  if (typeof data.error === 'string' && data.error) return data.error
  if (data.message) return data.message
  return e?.message || fallback
}
