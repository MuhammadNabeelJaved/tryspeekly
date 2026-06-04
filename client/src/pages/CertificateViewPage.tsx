import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, Certificate, LinkedinLogo, FilePdf, Image as ImageIcon } from '@phosphor-icons/react'
import { certificatesService } from '@/services/certificates.service'
import CertificateCanvas from '@/components/CertificateCanvas'
import { exportCertificateJPG, exportCertificatePDF } from '@/utils/certificateExport'
import type { Certificate as CertificateType } from '@/types/api'

export default function CertificateViewPage() {
  const { id } = useParams<{ id: string }>()
  const [cert, setCert] = useState<CertificateType | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const certRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    certificatesService.verifyCertificate(id)
      .then((res) => { if (res.success) setCert(res.data) })
      .catch(() => setCert(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <Certificate size={64} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 mb-2">Certificate Not Found</h1>
        <p className="text-slate-500 mb-6">The certificate ID you entered is invalid or the certificate does not exist.</p>
        <Link to="/" className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md">Go to Homepage</Link>
      </div>
    )
  }

  const studentName = cert.student?.name ?? 'Student'
  const teacherName = typeof cert.enrollment !== 'string' ? (cert.enrollment.teacher?.name ?? '—') : '—'
  const verifyUrl = `${window.location.origin}/certificate/${cert.certificateId}`
  const formattedDate = new Date(cert.issueDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const certData = {
    studentName,
    courseName: cert.course?.title ?? 'Course',
    date: new Date(cert.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    certificateId: cert.certificateId,
    instructorName: teacherName !== '—' ? teacherName : undefined,
    instructorTitle: 'Course Instructor',
  }

  const handleDownload = async (format: 'jpg' | 'pdf') => {
    if (!certRef.current) return
    setDownloading(true)
    const filename = `${(cert.course?.title ?? 'Certificate').replace(/\s+/g, '_')}_Certificate.${format}`
    try {
      if (format === 'jpg') await exportCertificateJPG(certRef.current, filename)
      else await exportCertificatePDF(certRef.current, filename)
      toast.success('Certificate downloaded!')
    } catch {
      toast.error('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleLinkedInShare = () => {
    const url = new URL('https://www.linkedin.com/profile/add')
    url.searchParams.append('startTask', 'CERTIFICATION_NAME')
    url.searchParams.append('name', cert.course?.title ?? '')
    url.searchParams.append('organizationName', 'Speekly Academy')
    url.searchParams.append('issueYear', new Date(cert.issueDate).getFullYear().toString())
    url.searchParams.append('issueMonth', (new Date(cert.issueDate).getMonth() + 1).toString())
    url.searchParams.append('certId', cert.certificateId)
    url.searchParams.append('certUrl', verifyUrl)
    window.open(url.toString(), '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 sm:px-8 font-sans">
      <div className="w-full max-w-5xl mb-6 flex justify-between items-center">
        <Link to="/dashboard/certificates" className="flex items-center gap-2 text-slate-500 hover:text-violet-600 transition-colors font-semibold bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
          <ArrowLeft size={18} /> Back to Certificates
        </Link>
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg font-bold shadow-sm border border-green-200">
          <CheckCircle size={20} weight="fill" /> Officially Verified
        </div>
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Certificate visual (the real design — also the JPG/PDF capture source) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-5">
            <div className="mx-auto rounded-lg overflow-hidden shadow-sm" style={{ width: '100%' }}>
              <CertificateCanvas ref={certRef} data={certData} />
            </div>
          </div>
          {/* Download actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
            >
              <FilePdf size={18} weight="fill" /> Download PDF
            </button>
            <button
              onClick={() => handleDownload('jpg')}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
            >
              <ImageIcon size={18} weight="fill" /> Download JPG
            </button>
          </div>
        </div>

        {/* Details sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900">Certificate Details</h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Recipient</p>
                <p className="font-bold text-slate-900">{studentName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Issue Date</p>
                <p className="font-bold text-slate-900">{formattedDate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Credential ID</p>
                <p className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded w-fit">{cert.certificateId}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-violet-50">
              <h3 className="font-bold text-slate-900">Course Information</h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Course Name</p>
                <p className="font-bold text-slate-900 leading-tight">{cert.course?.title ?? '—'}</p>
              </div>
              {cert.course?.level && (
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Course Level</p>
                  <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-md capitalize">{cert.course?.level}</span>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Instructor</p>
                <p className="font-bold text-slate-900">{teacherName}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 mb-2">Share this achievement</h3>
            <p className="text-xs text-slate-500 mb-4">Anyone with this link can view this verified certificate.</p>
            <input
              type="text"
              readOnly
              value={verifyUrl}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none mb-3 font-mono text-slate-600"
            />
            <button
              onClick={() => { navigator.clipboard.writeText(verifyUrl); toast.success('Link copied!') }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl transition-colors text-sm mb-3"
            >
              Copy Link
            </button>
            <button
              onClick={handleLinkedInShare}
              className="w-full flex items-center justify-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold py-2 rounded-xl transition-colors text-sm"
            >
              <LinkedinLogo size={18} weight="fill" /> Add to LinkedIn
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
