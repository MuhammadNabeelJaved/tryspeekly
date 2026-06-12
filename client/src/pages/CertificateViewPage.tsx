import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, Certificate, LinkedinLogo, FilePdf, Image as ImageIcon, Link as LinkIcon, User, CalendarBlank, IdentificationBadge, BookOpen, ChalkboardTeacher } from '@phosphor-icons/react'
import { certificatesService } from '@/services/certificates.service'
import CertificateCanvas from '@/components/CertificateCanvas'
import { exportCertificateJPG, exportCertificatePDF, captureAsBase64 } from '@/utils/certificateExport'
import type { Certificate as CertificateType } from '@/types/api'

export default function CertificateViewPage() {
  const { id } = useParams<{ id: string }>()
  const [cert, setCert] = useState<CertificateType | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const certRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    certificatesService.verifyCertificate(id)
      .then((res) => { if (res.success) setCert(res.data) })
      .catch(() => setCert(null))
      .finally(() => setLoading(false))
  }, [id])

  // Auto-generate and upload OG image for social sharing (runs once after cert loads, silently)
  useEffect(() => {
    if (!cert || cert.credentialUrl) return
    const timer = setTimeout(async () => {
      if (!certRef.current) return
      try {
        const base64 = await captureAsBase64(certRef.current)
        await certificatesService.saveOgImage(cert.certificateId, base64)
      } catch {
        // silent — OG upload failure is non-critical
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [cert])

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
  const formattedDate = new Date(cert.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const certData = {
    studentName,
    courseName: cert.course?.title ?? 'Course',
    date: formattedDate,
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
    url.searchParams.append('organizationName', 'TrySpeekly')
    url.searchParams.append('issueYear', new Date(cert.issueDate).getFullYear().toString())
    url.searchParams.append('issueMonth', (new Date(cert.issueDate).getMonth() + 1).toString())
    url.searchParams.append('certId', cert.certificateId)
    url.searchParams.append('certUrl', verifyUrl)
    window.open(url.toString(), '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top nav */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard/certificates"
            className="flex items-center gap-2 text-slate-500 hover:text-violet-600 transition-colors font-semibold bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-sm"
          >
            <ArrowLeft size={16} /> Back to Certificates
          </Link>
          <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-4 py-2 rounded-xl font-bold border border-green-200 text-sm shadow-sm">
            <CheckCircle size={18} weight="fill" /> Officially Verified
          </div>
        </div>

        {/* Main certificate card — same style as student dashboard card */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                {cert.course?.title ?? '—'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Issued {formattedDate}</p>
            </div>
            <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-lg whitespace-nowrap ml-3">
              {cert.certificateId}
            </span>
          </div>

          {/* Certificate — same bg-slate-50 section as student page */}
          <div className="p-6 bg-slate-50">
            <div className="overflow-hidden rounded-lg shadow">
              <CertificateCanvas ref={certRef} data={certData} />
            </div>
          </div>

          {/* Footer actions — same style as student dashboard card */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-2 flex-wrap bg-white">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <FilePdf size={13} /> Download PDF
            </button>
            <button
              onClick={() => handleDownload('jpg')}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <ImageIcon size={13} /> Download JPG
            </button>
            <button
              onClick={handleLinkedInShare}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl text-xs font-bold transition-colors"
            >
              <LinkedinLogo size={13} weight="fill" /> LinkedIn
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(verifyUrl); toast.success('Link copied!') }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              <LinkIcon size={13} weight="bold" /> Copy Link
            </button>
          </div>
        </div>

        {/* Verification details — secondary card below */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900">Certificate Details</h4>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <User size={15} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Recipient</p>
                  <p className="text-sm font-bold text-slate-900">{studentName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <CalendarBlank size={15} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Issue Date</p>
                  <p className="text-sm font-bold text-slate-900">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <IdentificationBadge size={15} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Credential ID</p>
                  <p className="text-sm font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded w-fit">{cert.certificateId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900">Course Information</h4>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={15} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Course Name</p>
                  <p className="text-sm font-bold text-slate-900 leading-tight">{cert.course?.title ?? '—'}</p>
                  {cert.course?.level && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded capitalize">{cert.course.level}</span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <ChalkboardTeacher size={15} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Instructor</p>
                  <p className="text-sm font-bold text-slate-900">{teacherName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
