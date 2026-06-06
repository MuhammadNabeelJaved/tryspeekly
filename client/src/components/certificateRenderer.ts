// ─── Certificate Canvas Renderer ────────────────────────────────────────────
// Draws the certificate directly onto a <canvas> with full pixel control.
// The SAME canvas is shown on-screen and exported to JPG/PDF, so the download
// is always identical to the preview (no html2canvas, no text-overlap bugs).

export interface CertificateData {
  studentName: string
  courseName: string
  date: string // formatted, e.g. "18 May 2026"
  certificateId: string
  instructorName?: string
  instructorTitle?: string
}

export const CERT_W = 1000
export const CERT_H = 707
export const CERT_SCALE = 2 // intrinsic resolution multiplier for crisp export

const VIOLET = '#7c3aed'
const VIOLET_LIGHT = '#a78bfa'
const DARK = '#1e1b4b'
const GREY = '#64748b'
const FRAME = '#ede9fe'

// ─── Text helpers ─────────────────────────────────────────────────────────────

/** Total width of `text` rendered with per-character `tracking` (letter-spacing). */
function trackedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number): number {
  let w = 0
  for (const ch of text) w += ctx.measureText(ch).width + tracking
  return w - tracking
}

/** Draw centered text with letter-spacing. Assumes textAlign='left'. */
function fillTracked(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, tracking: number): void {
  const total = trackedWidth(ctx, text, tracking)
  let x = cx - total / 2
  for (const ch of text) {
    ctx.fillText(ch, x, y)
    x += ctx.measureText(ch).width + tracking
  }
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// ─── Decorative pieces ──────────────────────────────────────────────────────

function drawCorners(ctx: CanvasRenderingContext2D): void {
  // top-left (lighter behind, darker on top → layered fold)
  ctx.fillStyle = VIOLET_LIGHT
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(150, 0); ctx.lineTo(0, 260); ctx.closePath(); ctx.fill()
  ctx.fillStyle = VIOLET
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(245, 0); ctx.lineTo(0, 165); ctx.closePath(); ctx.fill()
  // bottom-right (mirror)
  ctx.fillStyle = VIOLET_LIGHT
  ctx.beginPath(); ctx.moveTo(CERT_W, CERT_H); ctx.lineTo(CERT_W - 150, CERT_H); ctx.lineTo(CERT_W, CERT_H - 260); ctx.closePath(); ctx.fill()
  ctx.fillStyle = VIOLET
  ctx.beginPath(); ctx.moveTo(CERT_W, CERT_H); ctx.lineTo(CERT_W - 245, CERT_H); ctx.lineTo(CERT_W, CERT_H - 165); ctx.closePath(); ctx.fill()
  // inner frame
  ctx.strokeStyle = FRAME
  ctx.lineWidth = 2
  roundRectPath(ctx, 26, 26, CERT_W - 52, CERT_H - 52, 8)
  ctx.stroke()
}

function drawSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const R = 50
  // scalloped edge — ring of small bumps
  const bumps = 18
  ctx.fillStyle = DARK
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2
    const bx = cx + Math.cos(a) * R
    const by = cy + Math.sin(a) * R
    ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill()
  }
  // main disc
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()
  // inner ring
  ctx.strokeStyle = VIOLET_LIGHT
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(cx, cy, R - 9, 0, Math.PI * 2); ctx.stroke()
  // star
  drawStar(ctx, cx, cy - 13, 5, 11, 5, '#fbbf24')
  // stacked label
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.font = "800 7px 'DM Sans', sans-serif"
  fillTracked(ctx, 'CERTIFIED', cx, cy + 8, 1.2)
  fillTracked(ctx, 'ACHIEVEMENT', cx, cy + 18, 1)
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outer: number, inner: number, color: string): void {
  let rot = -Math.PI / 2
  const step = Math.PI / spikes
  ctx.beginPath()
  ctx.moveTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer)
  for (let i = 0; i < spikes; i++) {
    rot += step
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner)
    rot += step
    ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

// Simple stroked line-icons for the feature row (drawn centered on cx, cy).
type IconKind = 'book' | 'target' | 'check' | 'chart'
function drawFeatureIcon(ctx: CanvasRenderingContext2D, kind: IconKind, cx: number, cy: number): void {
  ctx.save()
  ctx.strokeStyle = VIOLET
  ctx.fillStyle = VIOLET
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const s = 13 // half-size
  if (kind === 'book') {
    ctx.beginPath()
    ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx - s, cy + s)
    ctx.lineTo(cx + s, cy + s); ctx.lineTo(cx + s, cy - s)
    ctx.lineTo(cx - 2, cy - s); ctx.lineTo(cx - 2, cy + s)
    ctx.stroke()
  } else if (kind === 'target') {
    ctx.beginPath(); ctx.arc(cx, cy, s, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, s - 6, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, 1.6, 0, Math.PI * 2); ctx.fill()
  } else if (kind === 'check') {
    ctx.beginPath(); ctx.arc(cx, cy, s, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - 6, cy); ctx.lineTo(cx - 1.5, cy + 5); ctx.lineTo(cx + 7, cy - 6)
    ctx.stroke()
  } else {
    // chart: axes + rising line + arrow
    ctx.beginPath()
    ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx - s, cy + s); ctx.lineTo(cx + s, cy + s)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - s + 3, cy + 4); ctx.lineTo(cx - 3, cy - 2); ctx.lineTo(cx + 2, cy + 1); ctx.lineTo(cx + s, cy - s + 3)
    ctx.stroke()
  }
  ctx.restore()
}

const FEATURES: { kind: IconKind; lines: [string, string] }[] = [
  { kind: 'book', lines: ['Expert-Led', 'Learning'] },
  { kind: 'target', lines: ['Practical', 'Skills'] },
  { kind: 'check', lines: ['Proven', 'Results'] },
  { kind: 'chart', lines: ['Career', 'Growth'] },
]

// Footer column: value (violet) + divider + caption.
function drawFooterCol(ctx: CanvasRenderingContext2D, cx: number, baselineY: number, value: string, valueFont: string, valueColor: string, caption: string): void {
  ctx.textAlign = 'center'
  ctx.font = valueFont
  ctx.fillStyle = valueColor
  ctx.fillText(value, cx, baselineY)
  // divider
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(cx - 90, baselineY + 12); ctx.lineTo(cx + 90, baselineY + 12); ctx.stroke()
  // caption
  ctx.textAlign = 'left'
  ctx.font = "700 10px 'DM Sans', sans-serif"
  ctx.fillStyle = GREY
  fillTracked(ctx, caption, cx, baselineY + 28, 1)
}

// ─── Main draw ──────────────────────────────────────────────────────────────

/** Draw the full certificate onto `canvas`. Fonts must be loaded beforehand. */
export function drawCertificate(canvas: HTMLCanvasElement, data: CertificateData): void {
  canvas.width = CERT_W * CERT_SCALE
  canvas.height = CERT_H * CERT_SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(CERT_SCALE, 0, 0, CERT_SCALE, 0, 0)
  ctx.textBaseline = 'alphabetic'

  // background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, CERT_W, CERT_H)

  drawCorners(ctx)

  // ── Header (logo + wordmark, centered) ──
  ctx.font = "800 20px 'DM Sans', sans-serif"
  const brandW = ctx.measureText('TrySpeekly').width
  const logo = 34
  const gap = 10
  const groupW = logo + gap + brandW
  const gx = (CERT_W - groupW) / 2
  const gy = 44
  ctx.fillStyle = VIOLET
  roundRectPath(ctx, gx, gy, logo, logo, 9)
  ctx.fill()
  // speech-bubble mark (matches brand icon)
  const bw = 20
  const bh = 13
  const bx = gx + (logo - bw) / 2
  const by = gy + (logo - bh) / 2 - 1.5
  ctx.fillStyle = '#ffffff'
  roundRectPath(ctx, bx, by, bw, bh, 4.5)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(bx + 3.5, by + bh - 1)
  ctx.lineTo(bx + 1, by + bh + 5)
  ctx.lineTo(bx + 10, by + bh - 1)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = VIOLET
  for (const dx of [-3.4, 3.4]) {
    ctx.beginPath()
    ctx.arc(bx + bw / 2 + dx, by + bh / 2, 1.7, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.textAlign = 'left'
  ctx.fillStyle = DARK
  ctx.font = "800 20px 'DM Sans', sans-serif"
  ctx.fillText('TrySpeekly', gx + logo + gap, gy + 16)
  ctx.fillStyle = VIOLET
  ctx.font = "700 9px 'DM Sans', sans-serif"
  let ax = gx + logo + gap
  for (const ch of 'ACADEMY') { ctx.fillText(ch, ax, gy + 30); ax += ctx.measureText(ch).width + 4 }

  // ── Title ──
  ctx.fillStyle = DARK
  ctx.font = "800 52px 'DM Sans', sans-serif"
  fillTracked(ctx, 'CERTIFICATE', CERT_W / 2, 168, 8)
  ctx.fillStyle = VIOLET
  ctx.font = "700 15px 'DM Sans', sans-serif"
  fillTracked(ctx, 'OF COMPLETION', CERT_W / 2, 194, 9)

  // ── Seal (left) ──
  drawSeal(ctx, 120, 300)

  // ── Body (centered) ──
  ctx.textAlign = 'center'
  ctx.fillStyle = GREY
  ctx.font = "400 14px 'DM Sans', sans-serif"
  ctx.fillText('This is proudly presented to', CERT_W / 2, 250)

  ctx.fillStyle = VIOLET
  ctx.font = "400 60px 'Great Vibes', cursive"
  ctx.fillText(data.studentName, CERT_W / 2, 318)

  ctx.fillStyle = GREY
  ctx.font = "400 13.5px 'DM Sans', sans-serif"
  ctx.fillText('for successfully completing the course', CERT_W / 2, 350)

  // course name — shrink to fit if very long
  ctx.fillStyle = DARK
  let courseSize = 23
  ctx.font = `800 ${courseSize}px 'DM Sans', sans-serif`
  while (ctx.measureText(data.courseName).width > CERT_W - 220 && courseSize > 14) {
    courseSize -= 1
    ctx.font = `800 ${courseSize}px 'DM Sans', sans-serif`
  }
  ctx.fillText(data.courseName, CERT_W / 2, 382)

  // ── Feature row ──
  const left = 90
  const right = CERT_W - 90
  const colW = (right - left) / FEATURES.length
  FEATURES.forEach((f, i) => {
    const cx = left + colW * i + colW / 2
    drawFeatureIcon(ctx, f.kind, cx, 460)
    ctx.textAlign = 'center'
    ctx.fillStyle = DARK
    ctx.font = "700 12px 'DM Sans', sans-serif"
    ctx.fillText(f.lines[0], cx, 492)
    ctx.fillText(f.lines[1], cx, 508)
  })

  // ── Footer ──
  const fy = 606
  const instructorName = data.instructorName || 'TrySpeekly'
  const instructorTitle = data.instructorTitle || 'Course Instructor'

  // Left column: handwritten signature above the divider, printed name + title below.
  ctx.textAlign = 'center'
  ctx.fillStyle = DARK
  ctx.font = "400 28px 'Great Vibes', cursive"
  ctx.fillText(instructorName, 200, fy)
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(110, fy + 14); ctx.lineTo(290, fy + 14); ctx.stroke()
  ctx.fillStyle = DARK
  ctx.font = "700 12.5px 'DM Sans', sans-serif"
  ctx.fillText(instructorName, 200, fy + 30)
  ctx.textAlign = 'left'
  ctx.fillStyle = GREY
  ctx.font = "700 10px 'DM Sans', sans-serif"
  fillTracked(ctx, instructorTitle.toUpperCase(), 200, fy + 44, 1)

  // Middle + right columns: value above divider, caption below.
  drawFooterCol(ctx, CERT_W / 2, fy + 2, data.date, "700 13.5px 'DM Sans', sans-serif", VIOLET, 'DATE OF COMPLETION')
  drawFooterCol(ctx, CERT_W - 200, fy + 2, data.certificateId, "700 13.5px ui-monospace, 'Courier New', monospace", VIOLET, 'CERTIFICATE ID')
}

/** Ensure the web fonts used by the certificate are loaded before drawing. */
export async function ensureCertificateFonts(): Promise<void> {
  if (!document.fonts) return
  try {
    await Promise.all([
      document.fonts.load("800 52px 'DM Sans'"),
      document.fonts.load("700 15px 'DM Sans'"),
      document.fonts.load("400 14px 'DM Sans'"),
      document.fonts.load("400 60px 'Great Vibes'"),
    ])
    await document.fonts.ready
  } catch { /* ignore — fall back to system fonts */ }
}
