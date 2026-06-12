import { forwardRef, useEffect, useRef, useState } from 'react'
import { TrendingUp, BookOpen, Award, CalendarDays, ShieldCheck } from 'lucide-react'

import type { CertificateData } from '@/components/certificateRenderer'

const CERT_W = 1211
const CERT_H = 963

const CertificateTemplate = forwardRef<HTMLDivElement, { data: CertificateData }>(
  ({ data }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    useEffect(() => {
      const el = wrapperRef.current
      if (!el) return
      const update = () => setScale(el.offsetWidth / CERT_W)
      update()
      const ro = new ResizeObserver(update)
      ro.observe(el)
      return () => ro.disconnect()
    }, [])

    const instructor = data.instructorName || 'Sarah'
    const instructorTitle = data.instructorTitle || 'Head of Learning'

    return (
      <div
        ref={wrapperRef}
        className="w-full overflow-hidden"
        style={{ height: `${CERT_H * scale}px` }}
      >
        {/* ref forwarded to inner cert div — used by html2canvas for export */}
        <div
          ref={ref}
          className="relative w-[1211px] h-[963px] bg-[#fcfcfc] border border-[#545454] overflow-hidden select-none"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >

          {/* ── Left background blob (Figma Vector 1) ────────────────────── */}
          <img
            src="/cert-assets/cert-bg-blob.svg"
            alt=""
            aria-hidden="true"
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: 251, height: 499 }}
          />

          {/* ── Seal badge — Figma layered images ────────────────────────── */}

          {/* Layer 1: outer white circle (230×230 at left:41, top:209) */}
          <img
            src="/cert-assets/cert-seal-outer.svg"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{ left: 41, top: 209, width: 230, height: 230 }}
          />

          {/* Layer 2: scalloped purple badge (172×171, inset within 178×178 at left:67, top:235) */}
          <img
            src="/cert-assets/cert-seal-star.svg"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{ left: 70, top: 238, width: 172, height: 171 }}
          />

          {/* Layer 3: inner white circle (145×145 at left:84, top:252) */}
          <img
            src="/cert-assets/cert-seal-white.svg"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{ left: 84, top: 252, width: 145, height: 145 }}
          />

          {/* Layer 4: inner purple gradient circle (81×81 at left:116, top:284) */}
          <img
            src="/cert-assets/cert-seal-purple.svg"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{ left: 116, top: 284, width: 81, height: 81 }}
          />

          {/* Layer 5: TrySpeekly icon (42×42 at left:136, top:304) */}
          <img
            src="/cert-assets/cert-seal-icon.svg"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{ left: 136, top: 304, width: 42, height: 42 }}
          />

          {/* Layer 6: arc text overlay — "TrySpeekly" top, "ACHIEVEMENT" bottom */}
          <svg
            className="absolute pointer-events-none"
            style={{ left: 41, top: 209, width: 230, height: 230 }}
            viewBox="0 0 230 230"
            fill="none"
            overflow="visible"
          >
            <defs>
              {/* sweep=1 clockwise → arc rises through the TOP → letters face outward */}
              <path id="cert-top-arc" d="M 20 115 A 95 95 0 0 1 210 115" />
              {/* sweep=0 CCW left-to-right through BOTTOM → letters hang inward, read L→R */}
              <path id="cert-bot-arc" d="M 14 115 A 101 101 0 0 0 216 115" />
            </defs>
            <text fill="#353535" fontSize="11" fontWeight="700" fontFamily="DM Sans, sans-serif" letterSpacing="2">
              <textPath href="#cert-top-arc" startOffset="50%" textAnchor="middle">
                TrySpeekly
              </textPath>
            </text>
            <text fill="#353535" fontSize="11" fontWeight="700" fontFamily="DM Sans, sans-serif" letterSpacing="2">
              <textPath href="#cert-bot-arc" startOffset="50%" textAnchor="middle">
                ACHIEVEMENT
              </textPath>
            </text>
          </svg>

          {/* ── Brand header — logo at (477,43), wordmark at (550,48) ────── */}
          <div className="absolute left-[477px] top-[43px] flex items-center gap-[12px]">
            <svg width="61" height="61" viewBox="0 0 61 61" fill="none" className="shrink-0">
              <defs>
                <linearGradient id="logo-bg-g" x1="30.5" y1="61" x2="30.5" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8022fe" />
                  <stop offset="1" stopColor="#9612fa" />
                </linearGradient>
                <linearGradient id="logo-pill-g" x1="30.5" y1="24" x2="30.5" y2="38" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8022fe" />
                  <stop offset="1" stopColor="#9612fa" />
                </linearGradient>
              </defs>
              <rect width="61" height="61" rx="12" fill="url(#logo-bg-g)" />
              <rect x="1" y="1" width="59" height="59" rx="11" stroke="white" strokeWidth="2" fill="none" />
              <rect x="12" y="12" width="37" height="37" rx="10" fill="white" />
              <rect x="19" y="24" width="23" height="14" rx="7" fill="url(#logo-pill-g)" />
              <circle cx="27" cy="31" r="2.5" fill="white" />
              <circle cx="35" cy="31" r="2.5" fill="white" />
              <path d="M 27 38 L 23 44 L 32 38 Z" fill="white" />
            </svg>
            <span className="text-[43px] font-extrabold leading-none pt-[5px] bg-gradient-to-r from-[#8021fe] to-[#9512fa] bg-clip-text text-transparent">
              TrySpeekly
            </span>
          </div>

          {/* ── "CERTIFICATE" ─────────────────────────────────────────────── */}
          <p className="absolute left-[327px] top-[146px] w-[608px] text-center text-[94px] font-extrabold text-[#353535] leading-none">
            CERTIFICATE
          </p>

          {/* ── "OF COMPLETION" with flanking lines ───────────────────────── */}
          <div className="absolute left-[327px] top-[260px] w-[608px] flex items-center justify-center gap-[14px]">
            <div className="w-[82px] h-[2px] rounded-full bg-[#9513fa] shrink-0" />
            <span className="text-[23px] font-bold tracking-[0.36em] whitespace-nowrap bg-gradient-to-r from-[#8121fe] to-[#9512fa] bg-clip-text text-transparent">
              OF COMPLETION
            </span>
            <div className="w-[82px] h-[2px] rounded-full bg-[#9513fa] shrink-0" />
          </div>

          {/* ── Body text ─────────────────────────────────────────────────── */}
          <p className="absolute left-[327px] top-[328px] w-[608px] text-center text-[22px] font-semibold text-[#353535]">
            This is proudly presented to
          </p>
          <p className="absolute left-[327px] top-[359px] w-[608px] text-center text-[94px] font-extrabold leading-none truncate bg-gradient-to-r from-[#8121fe] to-[#9512fa] bg-clip-text text-transparent">
            {data.studentName}
          </p>
          <p className="absolute left-[327px] top-[477px] w-[608px] text-center text-[22px] font-semibold text-[#545454]">
            for successfully completing the course
          </p>

          {/* Course name */}
          <p className="absolute left-[327px] top-[512px] w-[608px] text-center text-[38px] font-extrabold leading-none truncate bg-gradient-to-r from-[#8121fe] to-[#9512fa] bg-clip-text text-transparent">
            {data.courseName}
          </p>

          {/* ── Feature icons ─────────────────────────────────────────────── */}
          <div className="absolute left-[462px] top-[604px] -translate-x-1/2 flex flex-col items-center gap-[10px]">
            <TrendingUp size={40} strokeWidth={1.5} className="text-[#9513fa]" />
            <p className="text-[16px] font-semibold text-[#545454] text-center leading-snug">Career<br />Growth</p>
          </div>
          <div className="absolute left-[619px] top-[602px] -translate-x-1/2 flex flex-col items-center gap-[10px]">
            <BookOpen size={44} strokeWidth={1.5} className="text-[#9513fa]" />
            <p className="text-[16px] font-semibold text-[#545454] text-center leading-snug">Expert-led<br />Learning</p>
          </div>
          <div className="absolute left-[788px] top-[604px] -translate-x-1/2 flex flex-col items-center gap-[10px]">
            <Award size={40} strokeWidth={1.5} className="text-[#9513fa]" />
            <p className="text-[16px] font-semibold text-[#545454] text-center leading-snug">Proven<br />Results</p>
          </div>

          {/* ── Footer ────────────────────────────────────────────────────── */}

          {/* Signature */}
          <div className="absolute left-[239px] top-[819px] -translate-x-1/2 flex flex-col items-center">
            <span className="font-script text-[32px] text-[#a351f5] leading-none">{instructor}</span>
            <div className="w-[210px] h-[2px] bg-[#a351f5] mt-[12px]" />
            <span className="text-[14px] font-bold text-[#2f2f2f] mt-[6px]">{instructor}</span>
            <span className="text-[14px] font-semibold text-[#545454] mt-[6px]">{instructorTitle}</span>
          </div>

          {/* Date */}
          <div className="absolute left-[656px] top-[798px] -translate-x-1/2 flex flex-col items-center">
            <CalendarDays size={39} strokeWidth={1.5} className="text-[#9513fa]" />
            <span className="text-[16px] font-bold text-[#a351f5] mt-[8px]">{data.date}</span>
            <div className="w-[156px] h-[1px] bg-[#9513fa] mt-[8px]" />
            <span className="text-[14px] font-semibold text-[#545454] mt-[4px]">DATE OF COMPLETION</span>
          </div>

          {/* Certificate ID */}
          <div className="absolute left-[1022px] top-[798px] -translate-x-1/2 flex flex-col items-center">
            <ShieldCheck size={39} strokeWidth={1.5} className="text-[#9513fa]" />
            <span className="text-[16px] font-bold text-[#a351f5] mt-[8px]">{data.certificateId}</span>
            <div className="w-[108px] h-[1px] bg-[#9513fa] mt-[8px]" />
            <span className="text-[14px] font-semibold text-[#545454] mt-[4px]">CERTIFICATE ID</span>
          </div>

        </div>
      </div>
    )
  },
)

CertificateTemplate.displayName = 'CertificateTemplate'
export default CertificateTemplate
