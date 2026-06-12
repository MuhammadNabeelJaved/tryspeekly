// ─── Certificate Canvas Renderer (Design v2 — TrySpeekly Figma) ─────────────
// Pixel-faithful redraw matching the Figma design:
//   VOksQQjM5kQwfurFWHKO7L node 17:124
// All coordinates are in CERT_W × CERT_H logical space (CERT_SCALE multiplies
// the intrinsic canvas for crisp export). The same canvas is used on-screen and
// for JPG/PDF download, so the download always matches the preview exactly.

export interface CertificateData {
  studentName: string
  courseName: string
  date: string          // e.g. "18 May 2026"
  certificateId: string
  instructorName?: string
  instructorTitle?: string
}

export const CERT_W     = 1211
export const CERT_H     = 963
export const CERT_SCALE = 2

// ─── Color tokens ────────────────────────────────────────────────────────────
const BG          = '#fcfcfc'
const BORDER      = '#545454'
const DARK        = '#353535'
const GREY        = '#545454'
const PURPLE_1    = '#8021fe'
const PURPLE_2    = '#9512fa'
const PURPLE_LITE = '#a351f5'
const PURPLE_ACC  = '#9513fa'

// ─── Gradient helpers ─────────────────────────────────────────────────────────

function horizGrad(ctx: CanvasRenderingContext2D, cx: number, halfW: number): CanvasGradient {
  const g = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0)
  g.addColorStop(0, PURPLE_1)
  g.addColorStop(1, PURPLE_2)
  return g
}

function vertGrad(ctx: CanvasRenderingContext2D, y1: number, y2: number): CanvasGradient {
  const g = ctx.createLinearGradient(0, y1, 0, y2)
  g.addColorStop(0, PURPLE_1)
  g.addColorStop(1, PURPLE_2)
  return g
}

// ─── Shape helpers ────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

function trackedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number): number {
  let w = 0
  for (const ch of text) w += ctx.measureText(ch).width + tracking
  return w - tracking
}

function fillTracked(
  ctx: CanvasRenderingContext2D,
  text: string, cx: number, y: number, tracking: number,
): void {
  const total = trackedWidth(ctx, text, tracking)
  let x = cx - total / 2
  for (const ch of text) {
    ctx.fillText(ch, x, y)
    x += ctx.measureText(ch).width + tracking
  }
}

// ─── Background ───────────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, CERT_W, CERT_H)
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, CERT_W - 1, CERT_H - 1)
}

// ─── Left decoration ──────────────────────────────────────────────────────────
// Organic curved blob in top-left — gradient #a351f5 → #5155e8 (Figma Vector 1)

function drawLeftDecoration(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(126, 0, 0, 499)
  g.addColorStop(0, '#a351f5')
  g.addColorStop(1, '#5155e8')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(180, 10,  251, 90,  190, 210)
  ctx.bezierCurveTo(155, 300, 175, 370, 110, 455)
  ctx.bezierCurveTo(70,  510, 0,   499, 0,   499)
  ctx.closePath()
  ctx.fill()
}

// ─── Seal badge (left side) ───────────────────────────────────────────────────
// Center (156, 324): outer white circle r=115, star r=89, inner white r=72,
// inner purple circle r=40, certificate icon, arc text.

function drawSeal(ctx: CanvasRenderingContext2D): void {
  const cx = 156, cy = 324

  // Outer white circle
  ctx.beginPath()
  ctx.arc(cx, cy, 115, 0, Math.PI * 2)
  ctx.fillStyle = BG
  ctx.fill()

  // 12-point star with purple gradient
  drawStarShape(ctx, cx, cy, 89, 76)

  // Inner white circle
  ctx.beginPath()
  ctx.arc(cx, cy, 72, 0, Math.PI * 2)
  ctx.fillStyle = BG
  ctx.fill()

  // Inner purple gradient circle
  const ig = ctx.createLinearGradient(cx, cy - 40, cx, cy + 40)
  ig.addColorStop(0, '#8022fe')
  ig.addColorStop(1, '#9613fb')
  ctx.beginPath()
  ctx.arc(cx, cy, 40, 0, Math.PI * 2)
  ctx.fillStyle = ig
  ctx.fill()

  // White certificate icon
  drawCertIcon(ctx, cx, cy - 1)

  // Arc text: TrySpeekly (top) / ACHIEVEMENT (bottom)
  drawSealArcText(ctx, cx, cy, 100)
}

function drawStarShape(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, outerR: number, innerR: number,
): void {
  const spikes = 12
  const step   = Math.PI / spikes
  const g      = ctx.createLinearGradient(cx - outerR, cy - outerR, cx + outerR, cy + outerR)
  g.addColorStop(0, '#8122fe')
  g.addColorStop(1, '#9512fa')
  ctx.fillStyle = g
  ctx.beginPath()
  let rot = -Math.PI / 2
  ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR)
  for (let i = 0; i < spikes; i++) {
    rot += step
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR)
    rot += step
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR)
  }
  ctx.closePath()
  ctx.fill()
}

function drawCertIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save()
  ctx.strokeStyle = BG
  ctx.lineWidth   = 2
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
  // Document outline
  roundRect(ctx, cx - 13, cy - 14, 26, 30, 3)
  ctx.stroke()
  // Horizontal lines inside
  ctx.lineWidth = 1.5
  const lineY = [cy - 5, cy + 1, cy + 7]
  lineY.forEach((y, i) => {
    const hw = i === 2 ? 5 : 9
    ctx.beginPath()
    ctx.moveTo(cx - hw, y); ctx.lineTo(cx + hw, y)
    ctx.stroke()
  })
  ctx.restore()
}

function drawSealArcText(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
): void {
  ctx.save()
  ctx.font         = "700 9.5px 'DM Sans', sans-serif"
  ctx.fillStyle    = DARK
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'

  const placeArc = (
    text: string,
    centerAngle: number,
    spanRad: number,
    flipBottom: boolean,
  ) => {
    const step = spanRad / Math.max(text.length - 1, 1)
    for (let i = 0; i < text.length; i++) {
      // Bottom arc: start from left side (high angle) → right side (low angle)
      // so characters appear in reading order left-to-right.
      const a = flipBottom
        ? centerAngle + spanRad / 2 - step * i
        : centerAngle - spanRad / 2 + step * i
      const px = cx + Math.cos(a) * r
      const py = cy + Math.sin(a) * r
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(a + (flipBottom ? -Math.PI / 2 : Math.PI / 2))
      ctx.fillText(text[i], 0, 0)
      ctx.restore()
    }
  }

  placeArc('TrySpeekly',   -Math.PI / 2, 1.15,  false)
  placeArc('ACHIEVEMENT',   Math.PI / 2, 1.35,  true)

  ctx.restore()
}

// ─── Brand logo (top center-right) ───────────────────────────────────────────
// Logo box at (477,43) 61×61 r=12 + TrySpeekly wordmark (43px gradient)

function drawBrand(ctx: CanvasRenderingContext2D): void {
  const lx = 477, ly = 43, ls = 61, lr = 12

  // Logo box gradient (bottom→top to match Figma transform)
  const lg = ctx.createLinearGradient(lx, ly + ls, lx, ly)
  lg.addColorStop(0, '#8022fe')
  lg.addColorStop(1, '#9612fa')
  roundRect(ctx, lx, ly, ls, ls, lr)
  ctx.fillStyle = lg
  ctx.fill()

  // White border
  ctx.strokeStyle = BG
  ctx.lineWidth   = 2
  roundRect(ctx, lx, ly, ls, ls, lr)
  ctx.stroke()

  // Inner white rounded rect 37×37 at (489, 55) r=10
  ctx.fillStyle = BG
  roundRect(ctx, 489, 55, 37, 37, 10)
  ctx.fill()

  // Purple pill inside white rect 23×14 at (496, 67) r=7
  const pg = vertGrad(ctx, 67, 81)
  ctx.fillStyle = pg
  roundRect(ctx, 496, 67, 23, 14, 7)
  ctx.fill()

  // Two white dots (speech-bubble eyes) — Figma Ellipse 1 & 2
  ctx.fillStyle = BG
  ;[[504, 74], [512, 74]].forEach(([dx, dy]) => {
    ctx.beginPath(); ctx.arc(dx, dy, 2.5, 0, Math.PI * 2); ctx.fill()
  })

  // Speech-bubble tail (small white downward pointer below purple pill)
  ctx.fillStyle = BG
  ctx.beginPath()
  ctx.moveTo(504, 81); ctx.lineTo(500, 87); ctx.lineTo(509, 81)
  ctx.closePath()
  ctx.fill()

  // "TrySpeekly" wordmark — 43px DM Sans 600, left-to-right gradient
  // text top at normalized y=48 (Figma absolute y:77 − 29)
  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'
  ctx.font         = "800 43px 'DM Sans', sans-serif"
  const tw  = ctx.measureText('TrySpeekly').width
  const wg  = ctx.createLinearGradient(550, 0, 550 + tw, 0)
  wg.addColorStop(0, PURPLE_1)
  wg.addColorStop(1, PURPLE_2)
  ctx.fillStyle = wg
  ctx.fillText('TrySpeekly', 550, 48)

  ctx.textBaseline = 'alphabetic'
}

// ─── Certificate title ────────────────────────────────────────────────────────
// "CERTIFICATE" 94px dark + "OF COMPLETION" 23px gradient + flanking lines

function drawTitle(ctx: CanvasRenderingContext2D): void {
  const cx = 631  // center of the 608-wide text frames (327 + 304)

  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'

  // "CERTIFICATE"
  ctx.font      = "800 94px 'DM Sans', sans-serif"
  ctx.fillStyle = DARK
  ctx.fillText('CERTIFICATE', cx, 146)

  // "OF COMPLETION" with 36% letter-spacing
  const tracking = 23 * 0.36
  ctx.font = "700 23px 'DM Sans', sans-serif"
  const ofW = trackedWidth(ctx, 'OF COMPLETION', tracking)
  ctx.fillStyle = horizGrad(ctx, cx, ofW / 2 + 20)
  fillTracked(ctx, 'OF COMPLETION', cx, 260, tracking)

  // Flanking decorative lines
  ctx.strokeStyle = PURPLE_ACC
  ctx.lineWidth   = 2
  ctx.lineCap     = 'round'
  const gapFromText = 14
  const lineLen    = 82
  const lx = cx + ofW / 2 + gapFromText
  const rx = cx - ofW / 2 - gapFromText
  ctx.beginPath(); ctx.moveTo(lx, 274); ctx.lineTo(lx + lineLen, 274); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(rx, 274); ctx.lineTo(rx - lineLen, 274); ctx.stroke()

  ctx.textBaseline = 'alphabetic'
}

// ─── Body — presented to / name / course ─────────────────────────────────────

function drawBody(ctx: CanvasRenderingContext2D, data: CertificateData): void {
  const cx = 631

  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'

  // "This is proudly presented to"
  ctx.fillStyle = DARK
  ctx.font      = "600 22px 'DM Sans', sans-serif"
  ctx.fillText('This is proudly presented to', cx, 328)

  // Student name — 94px gradient, shrinks to fit 750px
  let nameSize = 94
  ctx.font = `800 ${nameSize}px 'DM Sans', sans-serif`
  while (ctx.measureText(data.studentName).width > 750 && nameSize > 28) {
    nameSize -= 2
    ctx.font = `800 ${nameSize}px 'DM Sans', sans-serif`
  }
  const nw = ctx.measureText(data.studentName).width
  ctx.fillStyle = horizGrad(ctx, cx, nw / 2 + 20)
  ctx.fillText(data.studentName, cx, 359)

  // "for successfully completing the course"
  ctx.fillStyle = GREY
  ctx.font      = "600 22px 'DM Sans', sans-serif"
  ctx.fillText('for successfully completing the course', cx, 477)

  // Course name — bold, dark, below
  let courseSize = 26
  ctx.font = `800 ${courseSize}px 'DM Sans', sans-serif`
  while (ctx.measureText(data.courseName).width > 750 && courseSize > 14) {
    courseSize -= 1
    ctx.font = `800 ${courseSize}px 'DM Sans', sans-serif`
  }
  ctx.fillStyle = DARK
  ctx.fillText(data.courseName, cx, 508)

  ctx.textBaseline = 'alphabetic'
}

// ─── Feature icons (3 cols) ───────────────────────────────────────────────────
// Career Growth | Expert-led Learning | Proven Results
// Icon centers at x = 462, 619, 788  (from Figma Frame 12 layout)

const FEATURES = [
  { icon: 'chart' as const, lines: ['Career', 'Growth'] },
  { icon: 'book'  as const, lines: ['Expert-led', 'Learning'] },
  { icon: 'award' as const, lines: ['Proven', 'Results'] },
]

function drawFeatures(ctx: CanvasRenderingContext2D): void {
  const iconY  = 600
  const labelY = 650
  const cols   = [462, 619, 788] as const

  FEATURES.forEach((f, i) => {
    const cx = cols[i]
    drawFeatureIcon(ctx, f.icon, cx, iconY)
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle    = GREY
    ctx.font         = "600 16px 'DM Sans', sans-serif"
    ctx.fillText(f.lines[0], cx, labelY)
    ctx.fillText(f.lines[1], cx, labelY + 22)
    ctx.textBaseline = 'alphabetic'
  })
}

function drawFeatureIcon(
  ctx: CanvasRenderingContext2D,
  kind: 'chart' | 'book' | 'award',
  cx: number, cy: number,
): void {
  ctx.save()
  ctx.strokeStyle = PURPLE_ACC
  ctx.fillStyle   = PURPLE_ACC
  ctx.lineWidth   = 2
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'

  if (kind === 'chart') {
    // Axes
    ctx.beginPath()
    ctx.moveTo(cx - 20, cy - 18); ctx.lineTo(cx - 20, cy + 18); ctx.lineTo(cx + 20, cy + 18)
    ctx.stroke()
    // Three rising bars
    ;[[cx - 15, cy + 8, 9, 10], [cx - 4, cy + 3, 9, 15], [cx + 9, cy - 3, 9, 21]].forEach(
      ([bx, by, bw, bh]) => ctx.fillRect(bx, by, bw, bh),
    )
  } else if (kind === 'book') {
    // Open-book outline
    ctx.beginPath()
    ctx.moveTo(cx - 22, cy - 17); ctx.lineTo(cx - 22, cy + 17)
    ctx.lineTo(cx + 22, cy + 17); ctx.lineTo(cx + 22, cy - 17)
    ctx.stroke()
    // Spine
    ctx.beginPath(); ctx.moveTo(cx, cy - 17); ctx.lineTo(cx, cy + 17); ctx.stroke()
    // Page lines
    ctx.lineWidth = 1.5
    ;[cy - 4, cy + 5].forEach(y => {
      ctx.beginPath(); ctx.moveTo(cx - 16, y); ctx.lineTo(cx - 4, y); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 4,  y); ctx.lineTo(cx + 16, y); ctx.stroke()
    })
  } else {
    // Award circle + pedestal
    ctx.beginPath(); ctx.arc(cx, cy - 4, 17, 0, Math.PI * 2); ctx.stroke()
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx - 7,  cy + 13); ctx.lineTo(cx + 7,  cy + 13)
    ctx.moveTo(cx - 11, cy + 19); ctx.lineTo(cx + 11, cy + 19)
    ctx.moveTo(cx,      cy + 13); ctx.lineTo(cx,       cy + 19)
    ctx.stroke()
  }

  ctx.restore()
}

// ─── Footer — 3 columns ───────────────────────────────────────────────────────
// Left: instructor signature  |  Centre: date  |  Right: certificate ID
// Positions derived from Figma Frame 13 (normalized origin 134, 797.5)

function drawFooter(ctx: CanvasRenderingContext2D, data: CertificateData): void {
  const instructorName  = data.instructorName  || 'Sarah'
  const instructorTitle = data.instructorTitle || 'Head of Learning'

  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'

  // ── Signature ────────────────────────────────────────────────────────
  const sigX = 239

  ctx.fillStyle = PURPLE_LITE
  ctx.font      = "400 32px 'Great Vibes', cursive"
  ctx.fillText(instructorName, sigX, 819)

  ctx.strokeStyle = PURPLE_LITE
  ctx.lineWidth   = 2
  ctx.beginPath(); ctx.moveTo(sigX - 105, 864); ctx.lineTo(sigX + 105, 864); ctx.stroke()

  ctx.fillStyle = '#2f2f2f'
  ctx.font      = "700 14px 'DM Sans', sans-serif"
  ctx.fillText(instructorName, sigX, 870)

  ctx.fillStyle = GREY
  ctx.font      = "600 14px 'DM Sans', sans-serif"
  ctx.fillText(instructorTitle, sigX, 892)

  // ── Date ─────────────────────────────────────────────────────────────
  const dateX = 656

  drawCalendarIcon(ctx, dateX, 798)

  ctx.fillStyle = PURPLE_LITE
  ctx.font      = "700 16px 'DM Sans', sans-serif"
  ctx.fillText(data.date, dateX, 858)

  ctx.strokeStyle = PURPLE_ACC
  ctx.lineWidth   = 1
  ctx.beginPath(); ctx.moveTo(dateX - 78, 880); ctx.lineTo(dateX + 78, 880); ctx.stroke()

  ctx.fillStyle = GREY
  ctx.font      = "600 14px 'DM Sans', sans-serif"
  ctx.fillText('DATE OF COMPLETION', dateX, 887)

  // ── Certificate ID ────────────────────────────────────────────────────
  const idX = 1022

  drawRibbonIcon(ctx, idX, 798)

  ctx.fillStyle = PURPLE_LITE
  ctx.font      = "700 16px 'DM Sans', sans-serif"
  ctx.fillText(data.certificateId, idX, 858)

  ctx.strokeStyle = PURPLE_ACC
  ctx.lineWidth   = 1
  ctx.beginPath(); ctx.moveTo(idX - 54, 880); ctx.lineTo(idX + 54, 880); ctx.stroke()

  ctx.fillStyle = GREY
  ctx.font      = "600 14px 'DM Sans', sans-serif"
  ctx.fillText('CERTIFICATE ID', idX, 887)

  ctx.textBaseline = 'alphabetic'
}

function drawCalendarIcon(ctx: CanvasRenderingContext2D, cx: number, topY: number): void {
  ctx.save()
  ctx.strokeStyle = PURPLE_ACC
  ctx.fillStyle   = PURPLE_ACC
  ctx.lineWidth   = 1.5

  const x = cx - 19, y = topY + 5, w = 38, h = 37

  // Calendar box
  roundRect(ctx, x, y, w, h, 2)
  ctx.stroke()

  // Header divider
  ctx.beginPath(); ctx.moveTo(x, y + 11); ctx.lineTo(x + w, y + 11); ctx.stroke()

  // Hanger pins
  ctx.beginPath()
  ctx.moveTo(x + 9,  topY); ctx.lineTo(x + 9,  y + 7)
  ctx.moveTo(x + 29, topY); ctx.lineTo(x + 29, y + 7)
  ctx.stroke()

  // Day dots (2 rows × 4 cols)
  ;[y + 20, y + 29].forEach(ry =>
    [x + 7, x + 15, x + 23, x + 31].forEach(rx => {
      ctx.beginPath(); ctx.arc(rx, ry, 1.5, 0, Math.PI * 2); ctx.fill()
    }),
  )

  ctx.restore()
}

function drawRibbonIcon(ctx: CanvasRenderingContext2D, cx: number, topY: number): void {
  ctx.save()
  ctx.fillStyle = PURPLE_ACC

  // Bookmark / ribbon shape
  const bx = cx - 19, bTop = topY, bW = 38, bVee = topY + 33, bBot = topY + 45

  ctx.beginPath()
  ctx.moveTo(bx,          bTop)
  ctx.lineTo(bx + bW,     bTop)
  ctx.lineTo(bx + bW,     bBot)
  ctx.lineTo(bx + bW / 2, bVee)
  ctx.lineTo(bx,          bBot)
  ctx.closePath()
  ctx.fill()

  // "ID" label in white
  ctx.fillStyle    = BG
  ctx.font         = "700 11px 'DM Sans', sans-serif"
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('ID', cx, topY + 9)

  ctx.restore()
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function drawCertificate(canvas: HTMLCanvasElement, data: CertificateData): void {
  canvas.width  = CERT_W * CERT_SCALE
  canvas.height = CERT_H * CERT_SCALE

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(CERT_SCALE, 0, 0, CERT_SCALE, 0, 0)
  ctx.textBaseline = 'alphabetic'

  drawBackground(ctx)
  drawLeftDecoration(ctx)
  drawSeal(ctx)
  drawBrand(ctx)
  drawTitle(ctx)
  drawBody(ctx, data)
  drawFeatures(ctx)
  drawFooter(ctx, data)
}

export async function ensureCertificateFonts(): Promise<void> {
  if (!document.fonts) return
  try {
    await Promise.all([
      document.fonts.load("800 94px 'DM Sans'"),
      document.fonts.load("700 23px 'DM Sans'"),
      document.fonts.load("600 22px 'DM Sans'"),
      document.fonts.load("400 32px 'Great Vibes'"),
    ])
    await document.fonts.ready
  } catch { /* fall back to system fonts on error */ }
}
