import type { Offer } from '@/services/offers.service'
import type { CSSProperties } from 'react'

interface Props {
  offers: Offer[]
  onNavigate?: () => void
  className?: string
}

export default function OffersMarquee({ offers, onNavigate, className = '' }: Props) {
  const visibleOffers = offers.filter(offer => offer.bannerText?.trim())
  if (visibleOffers.length === 0) return null

  const speedSeconds = Math.min(
    120,
    Math.max(20, visibleOffers.find(offer => offer.marqueeSpeedSeconds)?.marqueeSpeedSeconds ?? 60)
  )
  const reps = Math.max(16, Math.ceil(32 / visibleOffers.length))
  const segment = Array.from({ length: reps }, (_, i) => visibleOffers[i % visibleOffers.length])
  const items = [...segment, ...segment]

  const inner = (
    <>
      <style>{`
        @keyframes offers-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        .offers-marquee-track {
          min-width: 200%;
          display: flex;
          align-items: center;
          width: max-content;
          will-change: transform;
          animation: offers-marquee var(--offers-marquee-speed, 60s) linear infinite;
        }
        .offers-marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .offers-marquee-track {
            animation-duration: 120s;
          }
        }
      `}</style>
      <div
        className="offers-marquee-track h-full"
        style={{ '--offers-marquee-speed': `${speedSeconds}s` } as CSSProperties}
      >
        {items.map((offer, index) => (
          <span
            key={`${offer._id}-${index}`}
            className="flex h-full items-center gap-2 px-6 text-[11px] font-black uppercase tracking-[0.08em] text-white whitespace-nowrap sm:text-xs"
          >
            <span className="text-violet-200">%</span>
            {offer.bannerText}
            <span className="mx-1 text-violet-300">/</span>
          </span>
        ))}
      </div>
    </>
  )

  const baseClassName = `relative h-8 w-full flex-shrink-0 overflow-hidden bg-gradient-to-r from-violet-700 via-violet-600 to-purple-600 ${className}`

  if (onNavigate) {
    return (
      <button
        type="button"
        onClick={onNavigate}
        title="Click to manage offers"
        aria-label="Active offers - click to manage"
        className={`${baseClassName} text-left cursor-pointer`}
      >
        {inner}
      </button>
    )
  }

  return (
    <div className={baseClassName} aria-label="Active offers">
      {inner}
    </div>
  )
}
