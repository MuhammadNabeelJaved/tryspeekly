import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft, Sparkle } from '@phosphor-icons/react'

export interface TourStep {
  target?: string       // data-tour value; omit for a centered welcome/summary card
  title: string
  content: string
}

interface Props {
  steps: TourStep[]
  tourKey: string       // unique per role — used as localStorage key
  onRestartRef?: (fn: () => void) => void   // lets parent wire a "restart" button
}

const PAD = 10          // spotlight padding around target
const TIP_W = 320       // tooltip width estimate for edge-detection

function getSpotlightStyle(rect: DOMRect) {
  return {
    top:    Math.max(0, rect.top    - PAD),
    left:   Math.max(0, rect.left   - PAD),
    width:  rect.width  + PAD * 2,
    height: rect.height + PAD * 2,
  }
}

function getTooltipPos(rect: DOMRect): React.CSSProperties {
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const left = Math.min(rect.left, window.innerWidth - TIP_W - 16)

  if (spaceBelow >= 210) return { top: rect.bottom + PAD + 6, left: Math.max(8, left) }
  if (spaceAbove >= 210) return { bottom: window.innerHeight - rect.top + PAD + 6, left: Math.max(8, left) }
  // Not enough vertical space — go right if possible, else left
  if (window.innerWidth - rect.right >= TIP_W + 16) return { top: Math.max(8, rect.top), left: rect.right + PAD + 6 }
  return { top: Math.max(8, rect.top), right: window.innerWidth - rect.left + PAD + 6 }
}

export default function TourGuide({ steps, tourKey, onRestartRef }: Props) {
  const [active, setActive]   = useState(false)
  const [step,   setStep]     = useState(0)
  const [rect,   setRect]     = useState<DOMRect | null>(null)

  const start = useCallback(() => {
    setStep(0)
    setActive(true)
  }, [])

  // expose restart to parent
  useEffect(() => {
    onRestartRef?.(start)
  }, [onRestartRef, start])

  // auto-start once per role — mark seen immediately so refresh/re-login never re-triggers
  useEffect(() => {
    if (!localStorage.getItem(`tour_done_${tourKey}`)) {
      const t = setTimeout(() => {
        localStorage.setItem(`tour_done_${tourKey}`, 'true')
        setActive(true)
      }, 900)
      return () => clearTimeout(t)
    }
  }, [tourKey])

  // update spotlight rect on step change
  useEffect(() => {
    if (!active) return
    const target = steps[step]?.target
    if (!target) { setRect(null); return }
    const el = document.querySelector(`[data-tour="${target}"]`)
    if (!el) { setRect(null); return }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    // slight delay so scroll settles
    const t = setTimeout(() => setRect(el.getBoundingClientRect()), 200)
    return () => clearTimeout(t)
  }, [step, active, steps])

  // re-measure on resize
  useEffect(() => {
    if (!active) return
    function remeasure() {
      const target = steps[step]?.target
      if (!target) return
      const el = document.querySelector(`[data-tour="${target}"]`)
      if (el) setRect(el.getBoundingClientRect())
    }
    window.addEventListener('resize', remeasure)
    return () => window.removeEventListener('resize', remeasure)
  }, [active, step, steps])

  function next() {
    step < steps.length - 1 ? setStep(s => s + 1) : finish()
  }
  function prev() { setStep(s => Math.max(0, s - 1)) }
  function finish() {
    localStorage.setItem(`tour_done_${tourKey}`, 'true')
    setActive(false)
    setStep(0)
  }

  if (!active) return null

  const current = steps[step]
  const isCentered = !current.target || !rect
  const spot = rect ? getSpotlightStyle(rect) : null
  const tipPos = rect ? getTooltipPos(rect) : {}

  return (
    <div className="fixed inset-0 z-[99998]" aria-modal="true">

      {/* ── Spotlight overlay ── */}
      {spot ? (
        <>
          <div style={{ position:'fixed', inset:0, top:0,    left:0, right:0, height: spot.top,                              background:'rgba(0,0,0,0.65)' }} />
          <div style={{ position:'fixed', inset:0, top: spot.top + spot.height, left:0, right:0, bottom:0,                  background:'rgba(0,0,0,0.65)' }} />
          <div style={{ position:'fixed', top: spot.top, left:0, width: spot.left, height: spot.height,                     background:'rgba(0,0,0,0.65)' }} />
          <div style={{ position:'fixed', top: spot.top, left: spot.left + spot.width, right:0, height: spot.height,        background:'rgba(0,0,0,0.65)' }} />
          {/* highlight ring */}
          <div style={{ position:'fixed', top: spot.top, left: spot.left, width: spot.width, height: spot.height,
            borderRadius: 12, border:'2px solid rgba(124,58,237,0.9)',
            boxShadow:'0 0 0 3px rgba(124,58,237,0.2), 0 0 24px rgba(124,58,237,0.3)',
            pointerEvents:'none' }} />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/65" />
      )}

      {/* ── Tooltip card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity:0, y:8, scale:0.96 }}
          animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:-6, scale:0.96 }}
          transition={{ duration:0.17, ease:'easeOut' }}
          style={isCentered ? {} : tipPos}
          className={`fixed z-[99999] w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 overflow-hidden
            ${isCentered ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
        >
          {/* Progress bar */}
          <div className="h-1 bg-slate-100 dark:bg-neutral-800">
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
            {steps.map((_, i) => (
              <button
                key={i}
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
  )
}
