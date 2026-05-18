import { useState, useEffect } from 'react'
import { Certificate, DownloadSimple, LinkedinLogo, X, CircleNotch, FilePdf, Image as ImageIcon, Link as LinkIcon } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { certificatesService } from '@/services/certificates.service'
import type { Certificate as CertificateType } from '@/types/api'

export default function StudentCertificates() {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<CertificateType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCert, setSelectedCert] = useState<CertificateType | null>(null)
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'jpg'>('pdf')
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    certificatesService.getMyCertificates()
      .then((res) => { if (res.success) setCertificates(res.data) })
      .catch(() => toast.error('Failed to load certificates.'))
      .finally(() => setLoading(false))
  }, [])

  const generateCertificateJPG = (cert: CertificateType) => {
    return new Promise<string>((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 1200
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve('')

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = '#1e1b4b'
      ctx.lineWidth = 15
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80)

      ctx.strokeStyle = '#c4b5fd'
      ctx.lineWidth = 4
      ctx.strokeRect(65, 65, canvas.width - 130, canvas.height - 130)

      ctx.fillStyle = '#7c3aed'
      ctx.textAlign = 'center'
      ctx.font = 'bold 36px Arial'
      ctx.fillText('ENGLISHPRO ACADEMY', 800, 160)

      ctx.fillStyle = '#1e1b4b'
      ctx.font = 'bold 80px "Times New Roman", Times, serif'
      ctx.fillText('Certificate of Completion', 800, 320)

      ctx.fillStyle = '#64748b'
      ctx.font = '32px Arial'
      ctx.fillText('This is proudly presented to', 800, 440)

      ctx.fillStyle = '#7c3aed'
      ctx.font = 'italic bold 90px "Times New Roman", Times, serif'
      ctx.fillText(user?.name ?? '', 800, 580)

      ctx.fillStyle = '#64748b'
      ctx.font = '32px Arial'
      ctx.fillText('for successfully completing the course', 800, 700)

      ctx.fillStyle = '#1e1b4b'
      ctx.font = 'bold 50px Arial'
      ctx.fillText(cert.course.title, 800, 800)

      ctx.fillStyle = '#475569'
      ctx.font = '24px Arial'
      const issueDate = new Date(cert.issueDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
      ctx.fillText(`Date: ${issueDate}`, 300, 1000)
      ctx.fillText(`Credential ID: ${cert.certificateId}`, 1300, 1000)

      ctx.lineWidth = 2
      ctx.strokeStyle = '#cbd5e1'
      ctx.beginPath(); ctx.moveTo(200, 960); ctx.lineTo(400, 960); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(1150, 960); ctx.lineTo(1450, 960); ctx.stroke()

      resolve(canvas.toDataURL('image/jpeg', 1.0))
    })
  }

  const DUMMY_PDF_BASE64 = 'data:application/pdf;base64,JVBERi0xLjAKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL0NhdGFsb2cvS2lkc1szIDAgUl0vQ291bnQgMT4+CmVuZG9iagozIDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1IDg0Ml0vUGFyZW50IDIgMCBSPj4KZW5kb2JqCnRyYWlsZXIKPDwvUm9vdCAxIDAgUj4+CiUlRU9G'

  const handleDownload = async () => {
    if (!selectedCert) return
    setIsDownloading(true)
    try {
      if (downloadFormat === 'jpg') {
        const dataUrl = await generateCertificateJPG(selectedCert)
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `${selectedCert.course.title.replace(/\s+/g, '_')}_Certificate.jpg`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
      } else {
        const a = document.createElement('a')
        a.href = DUMMY_PDF_BASE64
        a.download = `${selectedCert.course.title.replace(/\s+/g, '_')}_Certificate.pdf`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
      }
    } finally {
      setTimeout(() => { setIsDownloading(false); setSelectedCert(null) }, 1000)
    }
  }

  const handleLinkedInShare = (cert: CertificateType) => {
    const verifyUrl = `${window.location.origin}/certificate/${cert.certificateId}`
    const url = new URL('https://www.linkedin.com/profile/add')
    url.searchParams.append('startTask', 'CERTIFICATION_NAME')
    url.searchParams.append('name', cert.course.title)
    url.searchParams.append('organizationName', 'EnglishPro Academy')
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
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">My Certificates</h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400">View, download, and share your official EnglishPro Academy certificates.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-64 bg-slate-100 dark:bg-neutral-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">My Certificates</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">View, download, and share your official EnglishPro Academy certificates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {certificates.map((cert) => (
          <div key={cert._id} className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-violet-600/5 transition-all duration-300">
            <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-neutral-800 dark:to-neutral-900 p-4 relative overflow-hidden">
              <div className="absolute inset-4 border border-slate-300 dark:border-neutral-600 flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 text-center shadow-sm">
                <Certificate size={32} weight="fill" className="text-violet-600 dark:text-violet-500 mb-3" />
                <p className="text-[9px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Certificate of Completion</p>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight line-clamp-2">{cert.course.title}</h3>
                <div className="mt-auto w-full pt-4 border-t border-slate-100 dark:border-neutral-800 flex justify-between items-end">
                  <div className="text-left">
                    <p className="text-[8px] text-slate-400">Date</p>
                    <p className="text-[10px] font-semibold text-slate-700 dark:text-neutral-300">{new Date(cert.issueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-slate-400">ID</p>
                    <p className="text-[10px] font-semibold text-slate-700 dark:text-neutral-300">{cert.certificateId}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 flex flex-col sm:flex-row gap-2 mt-auto">
              <button
                onClick={() => setSelectedCert(cert)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-2 rounded-xl transition-colors text-xs shadow-sm whitespace-nowrap"
              >
                <DownloadSimple size={16} weight="bold" /> Download
              </button>
              <button
                onClick={() => handleLinkedInShare(cert)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold py-2.5 px-2 rounded-xl transition-colors text-xs shadow-sm whitespace-nowrap"
              >
                <LinkedinLogo size={16} weight="fill" /> Share
              </button>
              <a
                href={`/certificate/${cert.certificateId}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-white font-bold py-2.5 px-2 rounded-xl transition-colors text-xs shadow-sm whitespace-nowrap"
              >
                <LinkIcon size={16} weight="bold" /> Open Link
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
          <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-md relative z-10 shadow-2xl shadow-black/20 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-neutral-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Download Certificate</h3>
              <button onClick={() => !isDownloading && setSelectedCert(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-neutral-400 mb-5">Choose your preferred format. JPG is best for sharing on social media, PDF for printing.</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setDownloadFormat('pdf')}
                  className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${downloadFormat === 'pdf' ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'border-slate-200 dark:border-neutral-700 hover:border-violet-300 text-slate-600 dark:text-neutral-400'}`}
                >
                  <FilePdf size={32} weight={downloadFormat === 'pdf' ? 'fill' : 'regular'} />
                  <span className="font-bold text-sm">PDF Document</span>
                </button>
                <button
                  onClick={() => setDownloadFormat('jpg')}
                  className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${downloadFormat === 'jpg' ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'border-slate-200 dark:border-neutral-700 hover:border-violet-300 text-slate-600 dark:text-neutral-400'}`}
                >
                  <ImageIcon size={32} weight={downloadFormat === 'jpg' ? 'fill' : 'regular'} />
                  <span className="font-bold text-sm">JPG Image</span>
                </button>
              </div>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-70 text-white font-bold py-3.5 rounded-xl transition-colors shadow-[0_4px_14px_rgba(124,58,237,0.3)]"
              >
                {isDownloading ? (<><CircleNotch size={20} weight="bold" className="animate-spin" /> Generating…</>) : (<><DownloadSimple size={20} weight="bold" /> Download Now</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
