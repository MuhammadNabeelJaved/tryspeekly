import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { drawCertificate, ensureCertificateFonts, CERT_W, CERT_H, type CertificateData } from './certificateRenderer'

export type { CertificateData }

/**
 * Renders the certificate onto a <canvas>. The intrinsic canvas is high-res
 * (CERT_W*scale) for crisp export; CSS sizes it to fill its container. The very
 * same canvas element is exported to JPG/PDF, so the download matches the
 * preview exactly. Forwards a ref to the underlying <canvas>.
 */
const CertificateCanvas = forwardRef<HTMLCanvasElement, { data: CertificateData }>(({ data }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement, [])

  useEffect(() => {
    let cancelled = false
    const render = async () => {
      await ensureCertificateFonts()
      if (cancelled || !canvasRef.current) return
      drawCertificate(canvasRef.current, data)
    }
    void render()
    return () => { cancelled = true }
  }, [data])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${CERT_W} / ${CERT_H}` }}
      aria-label={`Certificate of completion for ${data.studentName}`}
    />
  )
})

CertificateCanvas.displayName = 'CertificateCanvas'
export default CertificateCanvas
