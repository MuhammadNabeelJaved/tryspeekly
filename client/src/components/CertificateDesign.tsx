import { forwardRef } from 'react'

export interface CertificateData {
  studentName: string
  courseName: string
  date: string          // formatted, e.g. "18 May 2026"
  certificateId: string
  instructorName?: string
  instructorTitle?: string
}

const VIOLET = '#7c3aed'
const DARK = '#1e1b4b'
const GREY = '#64748b'

// Small inline-SVG feature icon (stroke, violet) — self-contained for clean rasterization.
function FeatureIcon({ path }: { path: string }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={VIOLET} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </div>
  )
}

const FEATURES = [
  { label: 'Expert-Led Learning', path: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z' },
  { label: 'Practical Skills', path: 'M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-5.07-2.83 2.83M9.76 14.24l-2.83 2.83m0-10.14 2.83 2.83m4.48 4.48 2.83 2.83' },
  { label: 'Proven Results', path: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3' },
  { label: 'Career Growth', path: 'M3 3v18h18M7 16l4-4 3 3 5-6' },
]

/**
 * Pixel-faithful certificate rendered at a fixed 1000×707 box using only inline
 * styles + hex colors so html2canvas-pro captures it cleanly (no Tailwind oklch).
 * The same element is shown on-screen (scaled) and rasterized to JPG/PDF.
 */
const CertificateDesign = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => {
  const instructorName = data.instructorName || 'EnglishPro Academy'
  const instructorTitle = data.instructorTitle || 'Course Instructor'

  return (
    <div
      ref={ref}
      style={{
        position: 'relative', width: 1000, height: 707, background: '#ffffff',
        fontFamily: "'DM Sans', -apple-system, Segoe UI, Roboto, sans-serif",
        overflow: 'hidden', boxSizing: 'border-box',
      }}
    >
      {/* Decorative geometric corners (SVG so it rasterizes crisply) */}
      <svg width="1000" height="707" viewBox="0 0 1000 707" style={{ position: 'absolute', inset: 0 }}>
        {/* top-left */}
        <polygon points="0,0 240,0 0,200" fill="#7c3aed" />
        <polygon points="0,0 140,0 0,260" fill="#a78bfa" opacity="0.55" />
        {/* bottom-right */}
        <polygon points="1000,707 760,707 1000,507" fill="#7c3aed" />
        <polygon points="1000,707 860,707 1000,447" fill="#a78bfa" opacity="0.55" />
        {/* inner frame */}
        <rect x="26" y="26" width="948" height="655" fill="none" stroke="#ede9fe" strokeWidth="2" rx="6" />
      </svg>

      {/* Header */}
      <div style={{ position: 'absolute', top: 46, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: VIOLET, color: '#fff', fontWeight: 900, fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>E</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: DARK, lineHeight: 1 }}>EnglishPro</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: VIOLET, letterSpacing: 4, marginTop: 2 }}>ACADEMY</div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{ position: 'absolute', top: 118, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: DARK, letterSpacing: 8, lineHeight: 1 }}>CERTIFICATE</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: VIOLET, letterSpacing: 9, marginTop: 8 }}>OF COMPLETION</div>
      </div>

      {/* Seal badge (left) */}
      <div style={{ position: 'absolute', top: 250, left: 70 }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: VIOLET, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(124,58,237,0.35)', border: '4px solid #ddd6fe' }}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>★</span>
          <span style={{ fontSize: 7.5, fontWeight: 800, color: '#fff', letterSpacing: 1.5, marginTop: 4, textAlign: 'center' }}>CERTIFIED<br />ACHIEVEMENT</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ position: 'absolute', top: 232, left: 0, right: 0, textAlign: 'center', padding: '0 90px' }}>
        <div style={{ fontSize: 14, color: GREY, marginBottom: 14 }}>This is proudly presented to</div>
        <div style={{ fontFamily: "'Great Vibes', cursive", fontSize: 62, color: VIOLET, lineHeight: 1, marginBottom: 14 }}>{data.studentName}</div>
        <div style={{ fontSize: 13.5, color: GREY, marginBottom: 8 }}>for successfully completing the course</div>
        <div style={{ fontSize: 23, fontWeight: 800, color: DARK }}>{data.courseName}</div>
      </div>

      {/* Feature row */}
      <div style={{ position: 'absolute', top: 470, left: 90, right: 90, display: 'flex', justifyContent: 'space-between' }}>
        {FEATURES.map(f => (
          <div key={f.label} style={{ width: 180, textAlign: 'center' }}>
            <FeatureIcon path={f.path} />
            <div style={{ fontSize: 12, fontWeight: 700, color: DARK }}>{f.label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 64, left: 90, right: 90, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ textAlign: 'center', width: 220 }}>
          <div style={{ fontFamily: "'Great Vibes', cursive", fontSize: 26, color: DARK, lineHeight: 1, marginBottom: 6 }}>{instructorName}</div>
          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 6 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: DARK }}>{instructorName}</div>
            <div style={{ fontSize: 10, color: GREY, letterSpacing: 0.5 }}>{instructorTitle}</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', width: 200 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: VIOLET, marginBottom: 6 }}>{data.date}</div>
          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 6, fontSize: 10, color: GREY, letterSpacing: 1 }}>DATE OF COMPLETION</div>
        </div>
        <div style={{ textAlign: 'center', width: 220 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: VIOLET, marginBottom: 6, fontFamily: 'monospace' }}>{data.certificateId}</div>
          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 6, fontSize: 10, color: GREY, letterSpacing: 1 }}>CERTIFICATE ID</div>
        </div>
      </div>
    </div>
  )
})

CertificateDesign.displayName = 'CertificateDesign'
export default CertificateDesign
