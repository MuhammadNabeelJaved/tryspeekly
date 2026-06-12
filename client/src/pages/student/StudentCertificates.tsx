import { useState, useEffect, useRef } from 'react'
import { Certificate, DownloadSimple, LinkedinLogo, X, CircleNotch, FilePdf, Image as ImageIcon, Link as LinkIcon } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { certificatesService } from '@/services/certificates.service'
import CertificateCanvas, { type CertificateData } from '@/components/CertificateCanvas'
import { exportCertificateJPG, exportCertificatePDF } from '@/utils/certificateExport'
import type { Certificate as CertificateType } from '@/types/api'

function toCertData(cert: CertificateType, studentName: string): CertificateData {
  const enrollment = cert.enrollment
  const instructorName = typeof enrollment === 'object' && enrollment?.teacher?.name ? enrollment.teacher.name : undefined
  return {
    studentName: studentName || 'Student',
    courseName: cert.course?.title ?? 'Course',
    date: new Date(cert.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    certificateId: cert.certificateId,
    instructorName,
    instructorTitle: 'Course Instructor',
  }
}

export default function StudentCertificates() {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<CertificateType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCert, setSelectedCert] = useState<CertificateType | null>(null)
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'jpg'>('pdf')
  const [isDownloading, setIsDownloading] = useState(false)
  const certRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    certificatesService.getMyCertificates()
      .then((res) => { if (res.success) setCertificates(res.data) })
      .catch(() => toast.error('Failed to load certificates.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = async () => {
    if (!selectedCert || !certRef.current) return
    setIsDownloading(true)
    const filename = `${(selectedCert.course?.title ?? 'Certificate').replace(/\s+/g, '_')}_Certificate.${downloadFormat}`
    try {
      if (downloadFormat === 'jpg') {
        await exportCertificateJPG(certRef.current, filename)
      } else {
        await exportCertificatePDF(certRef.current, filename)
      }
      toast.success('Certificate downloaded!')
    } catch {
      toast.error('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleLinkedInShare = (cert: CertificateType) => {
    const verifyUrl = `${window.location.origin}/certificate/${cert.certificateId}`
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">My Certificates</h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">View, download, and share your official TrySpeekly certificates.</p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-80 bg-slate-100 dark:bg-neutral-800 rounded-[24px] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">My Certificates</h2>
        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">View, download, and share your official TrySpeekly certificates.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
        {certificates.map((cert) => (
          <div
            key={cert._id}
            className="bg-white dark:bg-neutral-900 rounded-[24px] border border-slate-100 dark:border-neutral-800 shadow-sm overflow-hidden"
          >
            {/* Card header — matches admin preview modal header style */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  {cert.course?.title ?? '—'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
                  Issued {new Date(cert.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <span className="text-[10px] font-bold font-mono bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 px-2 py-1 rounded-lg whitespace-nowrap ml-3">
                {cert.certificateId}
              </span>
            </div>

            {/* Certificate preview — same bg + padding as admin preview modal */}
            <div className="p-6 bg-slate-50 dark:bg-neutral-950">
              <div className="overflow-hidden rounded-lg shadow pointer-events-none select-none">
                <CertificateCanvas data={toCertData(cert, user?.name ?? '')} />
              </div>
            </div>

            {/* Footer actions — matches admin modal footer layout */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-neutral-800 flex items-center gap-2 flex-wrap bg-white dark:bg-neutral-900">
              <button
                onClick={() => { setSelectedCert(cert); setDownloadFormat('pdf') }}
                className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <FilePdf size={13} /> Download PDF
              </button>
              <button
                onClick={() => { setSelectedCert(cert); setDownloadFormat('jpg') }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <ImageIcon size={13} /> Download JPG
              </button>
              <button
                onClick={() => handleLinkedInShare(cert)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl text-xs font-bold transition-colors"
              >
                <LinkedinLogo size={13} weight="fill" /> LinkedIn
              </button>
              <a
                href={`/certificate/${cert.certificateId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-white rounded-xl text-xs font-bold transition-colors"
              >
                <LinkIcon size={13} weight="bold" /> View Public
              </a>
            </div>
          </div>
        ))}

        {certificates.length === 0 && (
          <div className="col-span-full bg-slate-50 dark:bg-neutral-800/50 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-neutral-700">
            <Certificate size={48} weight="light" className="mx-auto text-slate-400 dark:text-neutral-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Certificates Yet</h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
              You haven't completed any courses yet. Once you successfully finish a course, your official certificate will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Download Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => !isDownloading && setSelectedCert(null)} />
          <div className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-2xl relative z-10 shadow-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Download Certificate</h3>
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Choose your preferred format</p>
              </div>
              <button
                onClick={() => !isDownloading && setSelectedCert(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-neutral-950">
              <div className="overflow-hidden rounded-lg shadow">
                <CertificateCanvas ref={certRef} data={toCertData(selectedCert, user?.name ?? '')} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setDownloadFormat('pdf')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all text-sm font-bold ${downloadFormat === 'pdf' ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'border-slate-200 dark:border-neutral-700 hover:border-violet-300 text-slate-600 dark:text-neutral-400'}`}
                >
                  <FilePdf size={20} weight={downloadFormat === 'pdf' ? 'fill' : 'regular'} />
                  PDF Document
                </button>
                <button
                  onClick={() => setDownloadFormat('jpg')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all text-sm font-bold ${downloadFormat === 'jpg' ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'border-slate-200 dark:border-neutral-700 hover:border-violet-300 text-slate-600 dark:text-neutral-400'}`}
                >
                  <ImageIcon size={20} weight={downloadFormat === 'jpg' ? 'fill' : 'regular'} />
                  JPG Image
                </button>
              </div>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-70 text-white font-bold py-3.5 rounded-xl transition-colors shadow-[0_4px_14px_rgba(124,58,237,0.3)]"
              >
                {isDownloading
                  ? (<><CircleNotch size={20} weight="bold" className="animate-spin" /> Generating…</>)
                  : (<><DownloadSimple size={20} weight="bold" /> Download Now</>)
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
