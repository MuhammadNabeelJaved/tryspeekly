import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft, Sparkle, CheckCircle } from '@phosphor-icons/react'

export interface TourStep {
  target?: string       // data-tour value; omit for a centered welcome/summary card
  title: string
  content: string
}

export type TooltipPlacement = 'below' | 'above' | 'right' | 'left' | 'center'

interface Props {
  steps: TourStep[]
  tourKey: string       // unique per role — used as localStorage key
  onRestartRef?: (fn: () => void) => void
  onFinish?: () => void // called on skip OR on completion
}

const PAD = 10

export function getSpotlightStyle(rect: DOMRect) {
  return {
    top:    Math.max(0, rect.top    - PAD),
    left:   Math.max(0, rect.left   - PAD),
    width:  rect.width  + PAD * 2,
    height: rect.height + PAD * 2,
  }
}

export function computeTipW(): number {
  return Math.min(320, window.innerWidth - 32)
}

export function getTooltipPos(
  rect: DOMRect,
  tipW: number,
): { style: React.CSSProperties; placement: TooltipPlacement } {
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const left = Math.min(rect.left, window.innerWidth - tipW - 16)

  if (spaceBelow >= 210) return {
    style: { top: rect.bottom + PAD + 6, left: Math.max(8, left) },
    placement: 'below',
  }
  if (spaceAbove >= 210) return {
    style: { bottom: window.innerHeight - rect.top + PAD + 6, left: Math.max(8, left) },
    placement: 'above',
  }
  if (window.innerWidth - rect.right >= tipW + 16) return {
    style: { top: Math.max(8, rect.top), left: rect.right + PAD + 6 },
    placement: 'right',
  }
  return {
    style: { top: Math.max(8, rect.top), right: window.innerWidth - rect.left + PAD + 6 },
    placement: 'left',
  }
}

function getArrowStyle(placement: TooltipPlacement): React.CSSProperties {
  switch (placement) {
    case 'below': return { top: -6, left: 20 }
    case 'above': return { bottom: -6, left: 20 }
    case 'right': return { left: -6, top: 20 }
    case 'left':  return { right: -6, top: 20 }
    default:      return {}
  }
}

const ARROW_ZERO_BORDERS: Record<TooltipPlacement, React.CSSProperties> = {
  below:  { borderBottom: 0, borderRight: 0 },
  above:  { borderTop: 0, borderLeft: 0 },
  right:  { borderTop: 0, borderRight: 0 },
  left:   { borderBottom: 0, borderLeft: 0 },
  center: {},
}

export default function TourGuide({ steps, tourKey, onRestartRef, onFinish }: Props) {
  const [active, setActive]       = useState(false)
  const [step, setStep]           = useState(0)
  const [rect, setRect]           = useState<DOMRect | null>(null)
  const [tipW, setTipW]           = useState(computeTipW)
  const [showToast, setShowToast] = useState(false)
  const toastTimer                = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevFocusRef              = useRef<Element | null>(null)
  const dialogRef                 = useRef<HTMLDivElement>(null)
  const stepRef                   = useRef(step)

  useEffect(() => { stepRef.current = step }, [step])

  const finish = useCallback(() => {
    localStorage.setItem(`tour_done_${tourKey}`, 'true')
    setActive(false)
    setStep(0)
    onFinish?.()
  }, [tourKey, onFinish])

  const completeTour = useCallback(() => {
    finish()
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setShowToast(true)
    toastTimer.current = setTimeout(() => setShowToast(false), 3000)
  }, [finish])

  const next = useCallback(() => {
    if (stepRef.current < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      completeTour()
    }
  }, [steps.length, completeTour])

  const prev = useCallback(() => {
    setStep(s => Math.max(0, s - 1))
  }, [])

  const start = useCallback(() => {
    setStep(0)
    setActive(true)
  }, [])

  // expose restart to parent
  useEffect(() => {
    onRestartRef?.(start)
  }, [onRestartRef, start])

  // auto-start once per user — mark seen immediately so refresh never re-triggers
  useEffect(() => {
    if (!localStorage.getItem(`tour_done_${tourKey}`)) {
      const t = setTimeout(() => {
        localStorage.setItem(`tour_done_${tourKey}`, 'true')
        setActive(true)
      }, 900)
      return () => clearTimeout(t)
    }
  }, [tourKey])

  // keyboard navigation
  useEffect(() => {
    if (!active) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { finish() }
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [active, finish, next, prev])

  // update spotlight rect on step change
  useEffect(() => {
    if (!active) return
    const target = steps[step]?.target
    if (!target) { setRect(null); return }
    const el = document.querySelector(`[data-tour="${target}"]`)
    if (!el) { setRect(null); return }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    const t = setTimeout(() => setRect(el.getBoundingClientRect()), 200)
    return () => clearTimeout(t)
  }, [step, active, steps])

  // re-measure on resize + update tipW
  useEffect(() => {
    if (!active) return
    function remeasure() {
      setTipW(computeTipW())
      const target = steps[step]?.target
      if (!target) return
      const el = document.querySelector(`[data-tour="${target}"]`)
      if (el) setRect(el.getBoundingClientRect())
    }
    window.addEventListener('resize', remeasure)
    return () => window.removeEventListener('resize', remeasure)
  }, [active, step, steps])

  // cleanup toast timer on unmount
  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [])

  // save/restore focus on tour open/close
  useEffect(() => {
    if (active) {
      prevFocusRef.current = document.activeElement
      const t = setTimeout(() => {
        dialogRef.current?.querySelector<HTMLElement>('button')?.focus()
      }, 50)
      return () => clearTimeout(t)
    } else {
      if (prevFocusRef.current instanceof HTMLElement) prevFocusRef.current.focus()
    }
  }, [active])

  // trap Tab key inside dialog
  useEffect(() => {
    if (!active) return
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', handleTab)
    return () => window.removeEventListener('keydown', handleTab)
  }, [active])

  if (!active && !showToast) return null
  if (!steps.length) return null

  const current    = steps[step]
  const isCentered = !active || !current?.target || !rect
  const spot       = rect ? getSpotlightStyle(rect) : null
  const tipResult  = rect ? getTooltipPos(rect, tipW) : { style: {} as React.CSSProperties, placement: 'center' as TooltipPlacement }
  const placement: TooltipPlacement = isCentered ? 'center' : tipResult.placement

  return (
    <>
      {active && (
        <div className="fixed inset-0 z-[99998]" role="dialog" aria-modal="true" aria-label="Onboarding tour">

          {/* ── Spotlight overlay ── */}
          {spot ? (
            <>
              <div style={{ position: 'fixed', inset: 0, top: 0,    left: 0, right: 0, height: spot.top,                             background: 'rgba(0,0,0,0.65)' }} />
              <div style={{ position: 'fixed', top: spot.top + spot.height, left: 0, right: 0, bottom: 0,                            background: 'rgba(0,0,0,0.65)' }} />
              <div style={{ position: 'fixed', top: spot.top, left: 0, width: spot.left, height: spot.height,                        background: 'rgba(0,0,0,0.65)' }} />
              <div style={{ position: 'fixed', top: spot.top, left: spot.left + spot.width, right: 0, height: spot.height,           background: 'rgba(0,0,0,0.65)' }} />
              {/* highlight ring */}
              <div style={{
                position: 'fixed', top: spot.top, left: spot.left, width: spot.width, height: spot.height,
                borderRadius: 12, border: '2px solid rgba(124,58,237,0.9)',
                boxShadow: '0 0 0 3px rgba(124,58,237,0.2), 0 0 24px rgba(124,58,237,0.3)',
                pointerEvents: 'none',
              }} />
            </>
          ) : (
            <div className="fixed inset-0 bg-black/65" />
          )}

          {/* ── Tooltip card ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              ref={dialogRef}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.17, ease: 'easeOut' }}
              style={isCentered ? { width: tipW } : { ...tipResult.style, width: tipW }}
              className={`fixed z-[99999] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700
                ${isCentered ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
            >
              {/* Arrow connector */}
              {placement !== 'center' && (
                <div
                  className="absolute w-3 h-3 rotate-45 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700"
                  style={{ ...getArrowStyle(placement), ...ARROW_ZERO_BORDERS[placement] }}
                />
              )}

              {/* Progress bar — overflow-hidden scoped here so arrow can escape the card */}
              <div className="h-1 bg-slate-100 dark:bg-neutral-800 rounded-t-2xl overflow-hidden">
                <motion.div
                  className="h-full bg-violet-500"
                  initial={false}
                  animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkle size={15} weight="fill" className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest">
                        Step {step + 1} of {steps.length}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">{current.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={finish}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
                    aria-label="Close tour"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed mb-4 pl-[42px]">
                  {current.content}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={finish}
                    className="text-xs font-semibold text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors"
                  >
                    Skip tour
                  </button>
                  <div className="flex items-center gap-2">
                    {step > 0 && (
                      <button
                        onClick={prev}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <ArrowLeft size={12} weight="bold" /> Prev
                      </button>
                    )}
                    <button
                      onClick={next}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      {step === steps.length - 1 ? 'Done!' : 'Next'}
                      {step < steps.length - 1 && <ArrowRight size={12} weight="bold" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-1.5 pb-3">
                {steps.map((s, i) => (
                  <button
                    key={`${s.title}-${i}`}
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={`rounded-full transition-all duration-200 ${
                      i === step
                        ? 'w-5 h-1.5 bg-violet-500'
                        : 'w-1.5 h-1.5 bg-slate-200 dark:bg-neutral-700 hover:bg-violet-300 dark:hover:bg-violet-700'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── Success toast ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            role="status"
            className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl px-4 py-3 shadow-2xl"
          >
            <CheckCircle size={18} weight="fill" className="text-violet-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-slate-800 dark:text-white">You're all set! Tour complete.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
