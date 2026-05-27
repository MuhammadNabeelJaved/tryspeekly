import type { Offer } from '@/services/offers.service'

export interface DiscountResult {
  originalPrice: number
  discountedPrice: number
  discountLabel: string
  hasDiscount: boolean
  offer: Offer | null
}

/**
 * Mirrors the server-side getEffectivePrice logic.
 * courseId — the course _id string
 * originalPrice — PKR price (course.price or pricePKR)
 * offers — from offersService.getActiveOffers()
 */
export function getDiscountedPrice(
  courseId: string,
  originalPrice: number,
  offers: Offer[]
): DiscountResult {
  const empty: DiscountResult = {
    originalPrice,
    discountedPrice: originalPrice,
    discountLabel: '',
    hasDiscount: false,
    offer: null,
  }

  if (originalPrice == null || originalPrice <= 0 || offers.length === 0) return empty

  const now = new Date()
  const active = offers.filter(o => {
    if (!o.isActive) return false
    if (o.startsAt && new Date(o.startsAt) > now) return false
    if (o.endsAt && new Date(o.endsAt) < now) return false
    return true
  })

  const courseOffers = active.filter(
    o => o.scope === 'course' && o.course?._id === courseId
  )
  const platformOffers = active.filter(o => o.scope === 'platform')
  const candidates = courseOffers.length > 0 ? courseOffers : platformOffers

  if (candidates.length === 0) return empty

  const best = candidates.reduce((prev, curr) => {
    const prevAmt =
      prev.discountType === 'percentage'
        ? (originalPrice * prev.discountValue) / 100
        : prev.discountValue
    const currAmt =
      curr.discountType === 'percentage'
        ? (originalPrice * curr.discountValue) / 100
        : curr.discountValue
    return currAmt > prevAmt ? curr : prev
  })

  const discountAmount =
    best.discountType === 'percentage'
      ? Math.round((originalPrice * best.discountValue) / 100)
      : Math.min(best.discountValue, originalPrice)

  const discountedPrice = Math.max(0, originalPrice - discountAmount)
  const discountLabel =
    best.discountType === 'percentage'
      ? `${best.discountValue}% OFF`
      : `PKR ${best.discountValue} OFF`

  return {
    originalPrice,
    discountedPrice,
    discountLabel,
    hasDiscount: true,
    offer: best,
  }
}
