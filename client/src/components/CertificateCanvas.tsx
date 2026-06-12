import { forwardRef } from 'react'

import { type CertificateData } from './certificateRenderer'
import CertificateTemplate from './CertificateTemplate'

export type { CertificateData }

/**
 * Displays the certificate using the pixel-perfect Tailwind component.
 * Forwards a ref to the inner 1211×963 certificate div so callers can
 * pass it to exportCertificateJPG / exportCertificatePDF (html2canvas).
 */
const CertificateCanvas = forwardRef<HTMLDivElement, { data: CertificateData }>(
  ({ data }, ref) => <CertificateTemplate ref={ref} data={data} />,
)

CertificateCanvas.displayName = 'CertificateCanvas'
export default CertificateCanvas
