import { jsPDF } from 'jspdf'

import { CERT_W, CERT_H } from '@/components/certificateRenderer'

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/** Download the rendered certificate canvas as a JPG image. */
export async function exportCertificateJPG(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  triggerDownload(canvas.toDataURL('image/jpeg', 0.95), filename)
}

/** Download the rendered certificate canvas as a single-page landscape PDF. */
export async function exportCertificatePDF(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const img = canvas.toDataURL('image/jpeg', 0.95)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [CERT_W, CERT_H] })
  pdf.addImage(img, 'JPEG', 0, 0, CERT_W, CERT_H)
  pdf.save(filename)
}
