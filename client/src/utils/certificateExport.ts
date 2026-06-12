import { toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'

import { CERT_W, CERT_H } from '@/components/certificateRenderer'

const A4_W = 297
const A4_H = 210

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * Captures the certificate element as a JPEG data URL.
 * Uses html-to-image which correctly inlines SVGs and web fonts.
 * The `style` override strips the display-scale transform so we capture
 * the full 1211×963 layout at 2× pixel ratio.
 */
async function captureAsJpeg(element: HTMLElement): Promise<string> {
  return toJpeg(element, {
    quality: 0.95,
    width: CERT_W,
    height: CERT_H,
    pixelRatio: 2,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
    },
  })
}

/** Return the certificate as a base64 JPEG data URL (no download). Used for OG image upload. */
export async function captureAsBase64(element: HTMLElement): Promise<string> {
  return captureAsJpeg(element)
}

/** Download as JPG at 2× resolution — matches on-screen display exactly. */
export async function exportCertificateJPG(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await captureAsJpeg(element)
  triggerDownload(dataUrl, filename)
}

/**
 * Download as A4 landscape PDF (297×210mm).
 * Certificate is fitted to fill A4 maintaining aspect ratio, centered.
 */
export async function exportCertificatePDF(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await captureAsJpeg(element)

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const certRatio = CERT_W / CERT_H
  const a4Ratio = A4_W / A4_H
  let drawW: number, drawH: number, offsetX = 0, offsetY = 0
  if (certRatio > a4Ratio) {
    drawW = A4_W
    drawH = A4_W / certRatio
    offsetY = (A4_H - drawH) / 2
  } else {
    drawH = A4_H
    drawW = A4_H * certRatio
    offsetX = (A4_W - drawW) / 2
  }

  pdf.addImage(dataUrl, 'JPEG', offsetX, offsetY, drawW, drawH)
  pdf.save(filename)
}
