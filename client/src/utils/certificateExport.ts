import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'

/** Rasterize the certificate element to a high-res canvas (fonts loaded first). */
async function renderCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  // Ensure web fonts (Great Vibes / DM Sans) are ready so text renders correctly.
  if (document.fonts?.ready) {
    try { await document.fonts.ready } catch { /* ignore */ }
  }
  return html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    width: el.offsetWidth,
    height: el.offsetHeight,
  })
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/** Download the certificate element as a JPG image. */
export async function exportCertificateJPG(el: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderCanvas(el)
  triggerDownload(canvas.toDataURL('image/jpeg', 0.95), filename)
}

/** Download the certificate element as a single-page landscape PDF. */
export async function exportCertificatePDF(el: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderCanvas(el)
  const img = canvas.toDataURL('image/jpeg', 0.95)
  const w = el.offsetWidth
  const h = el.offsetHeight
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [w, h] })
  pdf.addImage(img, 'JPEG', 0, 0, w, h)
  pdf.save(filename)
}
