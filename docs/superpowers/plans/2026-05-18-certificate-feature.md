# Certificate Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow students to claim a verifiable certificate when they complete a course, share it via a public link and LinkedIn, with all data persisted in MongoDB.

**Architecture:** Student-triggered claim flow. Instructor marks attendance → when all sessions attended the student sees a "Claim Certificate" button on the course detail page → clicking calls `POST /certificates/claim` → MongoDB cert created with auto-generated `EP-YYYY-XXXXXXX` ID → student is navigated to the public `/certificate/EP-...` verification page. The `StudentCertificates` page and public `CertificateViewPage` are wired to real DB data (both currently use mock data).

**Tech Stack:** Node.js + Express v5 (ESM JS), MongoDB/Mongoose, React 18 + TypeScript + Tailwind CSS, React Router v6, Phosphor Icons, Axios

---

## Files

| File | Change |
|------|--------|
| `server/src/routes/certificate.route.js` | Fix route ordering bug; register `/claim` and `/verify/:certificateId` |
| `server/src/controllers/certificate.controller.js` | Add `claimCertificate`, `verifyCertificate`; update `getMyCertificates` populate |
| `client/src/types/api.ts` | Extend `Certificate` interface (add `level` to course, populate enrollment with teacher) |
| `client/src/services/certificates.service.ts` | Add `claimCertificate` and `verifyCertificate` methods |
| `client/src/pages/student/StudentCertificates.tsx` | Replace mock data with real API; update types throughout |
| `client/src/pages/CertificateViewPage.tsx` | Replace enrollment-based fetch with `verifyCertificate`; use real cert fields |
| `client/src/pages/student/StudentCourseDetails.tsx` | Add Claim Certificate CTA in right sidebar when course is complete |

---

## Task 1: Fix certificate routes

**Files:**
- Modify: `server/src/routes/certificate.route.js`

**Context:** The current file registers `/:id` (GET) on line 14, before `/my` (GET) on line 17. Express matches routes top-to-bottom, so `/certificates/my` is caught by `/:id` with `id = "my"` — `getMyCertificates` is never reachable. Fix by putting all specific paths before the `/:id` catch-all. Also add the two new routes: `POST /claim` and `GET /verify/:certificateId`.

- [ ] **Step 1: Replace the route file**

Replace the entire contents of `server/src/routes/certificate.route.js` with:

```js
import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  issueCertificate,
  getMyCertificates,
  getCertificate,
  revokeCertificate,
  getAllCertificates,
  claimCertificate,
  verifyCertificate,
} from '../controllers/certificate.controller.js'

const router = express.Router()

// ─── Specific paths first (must come before /:id catch-all) ────────────────
router.route('/my').get(authenticate, authorize('student'), getMyCertificates)
router.route('/claim').post(authenticate, authorize('student'), claimCertificate)
router.route('/verify/:certificateId').get(verifyCertificate)
router.route('/').get(authenticate, authorize('admin'), getAllCertificates)
router.route('/').post(authenticate, authorize('teacher', 'admin'), issueCertificate)

// ─── Parameterised routes (must come AFTER all specific paths) ──────────────
router.route('/:id').get(getCertificate)
router.route('/:id/revoke').patch(authenticate, authorize('admin'), revokeCertificate)

export default router
```

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/certificate.route.js
git commit -m "fix: correct certificate route ordering; add claim and verify routes"
```

---

## Task 2: Add `claimCertificate` and `verifyCertificate` controllers; update `getMyCertificates`

**Files:**
- Modify: `server/src/controllers/certificate.controller.js`

**Context:** Three changes to this file:
1. `getMyCertificates` — add nested populate so teacher name is returned
2. New `claimCertificate` — validates ownership + completion, creates cert, returns populated doc; returns existing cert on 409 so client can redirect
3. New `verifyCertificate` — public lookup by the human-readable `certificateId` string

- [ ] **Step 1: Update `getMyCertificates` to populate teacher**

Find the existing `getMyCertificates` function (lines 31–40) and replace it:

```js
// GET /api/v1/certificates/my — student: own certificates
export const getMyCertificates = asyncHandler(async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user.id, status: 'issued' })
      .populate('course', 'title thumbnail level')
      .populate({ path: 'enrollment', populate: { path: 'teacher', select: 'name' } })
      .sort({ issueDate: -1 })
    res.json({ success: true, data: certificates })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
})
```

- [ ] **Step 2: Add `claimCertificate` at the bottom of the controller file**

```js
// POST /api/v1/certificates/claim — student: self-claim when course is complete
export const claimCertificate = asyncHandler(async (req, res) => {
  try {
    const { enrollmentId } = req.body
    if (!enrollmentId) {
      return res.status(400).json({ success: false, message: 'Enrollment ID is required' })
    }

    const enrollment = await Enrollment.findById(enrollmentId)
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' })
    }

    if (enrollment.student.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only claim certificates for your own enrollments' })
    }

    const { sessionsAttended, totalSessions } = enrollment.progress
    if (totalSessions === 0 || sessionsAttended < totalSessions) {
      return res.status(400).json({
        success: false,
        message: `Course not yet complete: ${sessionsAttended}/${totalSessions} sessions attended`,
      })
    }

    const existing = await Certificate.findOne({ enrollment: enrollmentId })
      .populate('student', 'name')
      .populate('course', 'title level thumbnail')
      .populate({ path: 'enrollment', populate: { path: 'teacher', select: 'name' } })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Certificate already issued for this enrollment',
        data: existing,
      })
    }

    const cert = await Certificate.create({
      enrollment: enrollmentId,
      student: enrollment.student,
      course: enrollment.course,
    })

    const populated = await Certificate.findById(cert._id)
      .populate('student', 'name')
      .populate('course', 'title level thumbnail')
      .populate({ path: 'enrollment', populate: { path: 'teacher', select: 'name' } })

    res.status(201).json({ success: true, message: 'Certificate claimed successfully', data: populated })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
})
```

- [ ] **Step 3: Add `verifyCertificate` at the bottom of the controller file**

```js
// GET /api/v1/certificates/verify/:certificateId — public: verify by human-readable ID
export const verifyCertificate = asyncHandler(async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId,
      status: 'issued',
    })
      .populate('student', 'name')
      .populate('course', 'title level thumbnail')
      .populate({ path: 'enrollment', populate: { path: 'teacher', select: 'name' } })

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found or has been revoked' })
    }

    res.json({ success: true, data: certificate })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
})
```

- [ ] **Step 4: Verify the server still starts**

```bash
cd server && node --check src/controllers/certificate.controller.js
```

Expected: no output (syntax valid)

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/certificate.controller.js
git commit -m "feat: add claimCertificate and verifyCertificate controllers; populate teacher in getMyCertificates"
```

---

## Task 3: Update Certificate type and add service methods (client)

**Files:**
- Modify: `client/src/types/api.ts` (lines 302–313)
- Modify: `client/src/services/certificates.service.ts`

- [ ] **Step 1: Update the `Certificate` interface in `client/src/types/api.ts`**

Find the existing `Certificate` interface (around line 302) and replace it:

```ts
export interface Certificate {
  _id: string;
  certificateId: string;
  enrollment: string | { _id: string; teacher?: { _id: string; name: string } };
  student: { _id: string; name: string };
  course: { _id: string; title: string; thumbnail?: string; level?: string };
  issueDate: string;
  credentialUrl?: string;
  status: 'issued' | 'revoked';
  revokedAt?: string;
  createdAt: string;
}
```

- [ ] **Step 2: Add `claimCertificate` and `verifyCertificate` to `client/src/services/certificates.service.ts`**

Add these two methods inside the `certificatesService` object, after the existing `getMyCertificates` method:

```ts
  async claimCertificate(enrollmentId: string): Promise<ApiResponse<Certificate>> {
    const response = await axiosClient.post<ApiResponse<Certificate>>('/certificates/claim', { enrollmentId });
    return response.data;
  },

  async verifyCertificate(certificateId: string): Promise<ApiResponse<Certificate>> {
    const response = await axiosClient.get<ApiResponse<Certificate>>(`/certificates/verify/${certificateId}`);
    return response.data;
  },
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd client && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add client/src/types/api.ts client/src/services/certificates.service.ts
git commit -m "feat: extend Certificate type with level/teacher; add claim and verify service methods"
```

---

## Task 4: Wire `StudentCertificates.tsx` to real DB

**Files:**
- Modify: `client/src/pages/student/StudentCertificates.tsx`

**Context:** The current page uses `MOCK_ENROLLED_COURSES` and `MOCK_STUDENT`. Replace with `certificatesService.getMyCertificates()` and `useAuth`. The UI cards, download modal, and LinkedIn share all stay the same — only the data source and types change.

- [ ] **Step 1: Replace the entire file with the following**

```tsx
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
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd client && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/student/StudentCertificates.tsx
git commit -m "feat: wire StudentCertificates to real DB; replace mock data with certificatesService"
```

---

## Task 5: Wire `CertificateViewPage.tsx` to real DB

**Files:**
- Modify: `client/src/pages/CertificateViewPage.tsx`

**Context:** The current page fetches via `enrollmentsService.getEnrollmentById(id)` treating the URL param as an enrollment ID. After this change the URL param is the human-readable `certificateId` (e.g. `EP-2026-ABC1234`), and the page calls `verifyCertificate`. Student name now comes from `cert.student.name` (public page — viewer may not be logged in). LinkedIn share button is added to the "Share this achievement" section.

- [ ] **Step 1: Replace the entire file**

```tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, Certificate, LinkedinLogo } from '@phosphor-icons/react'
import { certificatesService } from '@/services/certificates.service'
import type { Certificate as CertificateType } from '@/types/api'

export default function CertificateViewPage() {
  const { id } = useParams<{ id: string }>()
  const [cert, setCert] = useState<CertificateType | null>(null)
  const [loading, setLoading] = useState(true)

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

  const studentName = cert.student.name
  const teacherName = typeof cert.enrollment !== 'string' ? (cert.enrollment.teacher?.name ?? '—') : '—'
  const verifyUrl = `${window.location.origin}/certificate/${cert.certificateId}`
  const formattedDate = new Date(cert.issueDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const handleLinkedInShare = () => {
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
        {/* Certificate visual */}
        <div className="lg:col-span-2">
          <div className="w-full bg-white p-6 sm:p-10 relative shadow-xl overflow-hidden border border-slate-200 aspect-[4/3] flex flex-col justify-center">
            <div className="absolute inset-4 border-[8px] border-[#1e1b4b] pointer-events-none" />
            <div className="absolute inset-[20px] border-[2px] border-[#c4b5fd] pointer-events-none" />
            <div className="relative z-10 text-center flex flex-col items-center h-full justify-center">
              <h2 className="text-[#7c3aed] text-lg sm:text-xl font-black tracking-[0.2em] mb-4">ENGLISHPRO ACADEMY</h2>
              <h1 className="text-[#1e1b4b] text-3xl sm:text-4xl font-serif font-bold italic mb-4 leading-tight">Certificate of Completion</h1>
              <p className="text-slate-500 text-sm sm:text-base mb-4 font-medium">This is proudly presented to</p>
              <p className="text-[#7c3aed] text-3xl sm:text-4xl font-serif font-bold italic mb-6 border-b-2 border-slate-200 pb-2 px-8 inline-block">{studentName}</p>
              <p className="text-slate-500 text-sm sm:text-base mb-4 font-medium">for successfully completing the course</p>
              <p className="text-[#1e1b4b] text-xl sm:text-2xl font-bold mb-10 max-w-[80%] leading-snug mx-auto">{cert.course.title}</p>
              <div className="flex justify-between w-full px-12 mt-auto">
                <div className="text-center">
                  <div className="border-b-2 border-slate-300 w-32 sm:w-40 mx-auto mb-2" />
                  <p className="text-slate-500 font-bold text-xs">Date: {formattedDate}</p>
                </div>
                <div className="text-center">
                  <div className="border-b-2 border-slate-300 w-32 sm:w-40 mx-auto mb-2" />
                  <p className="text-slate-500 font-bold text-xs">ID: {cert.certificateId}</p>
                </div>
              </div>
            </div>
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
                <p className="font-bold text-slate-900 leading-tight">{cert.course.title}</p>
              </div>
              {cert.course.level && (
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Course Level</p>
                  <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-md capitalize">{cert.course.level}</span>
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
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd client && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/CertificateViewPage.tsx
git commit -m "feat: wire CertificateViewPage to real DB via verifyCertificate; add LinkedIn share"
```

---

## Task 6: Add Claim Certificate CTA to `StudentCourseDetails.tsx`

**Files:**
- Modify: `client/src/pages/student/StudentCourseDetails.tsx`

**Context:** When `sessionsAttended >= totalSessions` (and `totalSessions > 0`) a "Claim Certificate" card appears in the right sidebar. On click it calls `claimCertificate(enrollment._id)` and navigates to `/certificate/EP-...`. If the cert already exists (409), the server returns the existing cert in `error.response.data.data` — use that to navigate.

- [ ] **Step 1: Add `useNavigate` to the react-router-dom import**

Find line 2:
```tsx
import { useParams, Link } from 'react-router-dom'
```
Replace with:
```tsx
import { useParams, Link, useNavigate } from 'react-router-dom'
```

- [ ] **Step 2: Add `Medal` icon to the phosphor import block**

Find the phosphor import block (lines 3–18). Add `Medal` to it:
```tsx
import {
  ArrowLeft,
  VideoCamera,
  CalendarBlank,
  ShieldCheck,
  Clock,
  CheckCircle,
  ChatCircleDots,
  Spinner,
  ClipboardText,
  Star,
  FilePdf,
  PresentationChart,
  ShareNetwork,
  Check,
  Medal,
} from '@phosphor-icons/react'
```

- [ ] **Step 3: Add `certificatesService` import**

After the existing service imports (around line 21–23), add:
```tsx
import { certificatesService } from '@/services/certificates.service'
```

- [ ] **Step 4: Add state and hook inside the component function**

After the existing `const { id: courseId } = useParams()` line, add:
```tsx
const navigate = useNavigate()
```

After the existing state declarations (around line 44), add:
```tsx
const [isClaiming, setIsClaiming] = useState(false)
```

- [ ] **Step 5: Add `handleClaimCertificate` function**

After the `refreshAssignments` function (around line 125), add:

```tsx
// ─── Claim certificate ─────────────────────────────────────────────────────
async function handleClaimCertificate() {
  if (!enrollment) return
  setIsClaiming(true)
  try {
    const res = await certificatesService.claimCertificate(enrollment._id)
    if (res.success) {
      navigate(`/certificate/${res.data.certificateId}`)
    }
  } catch (err: unknown) {
    const axErr = err as { response?: { status?: number; data?: { data?: { certificateId?: string } } } }
    if (axErr?.response?.status === 409 && axErr.response.data?.data?.certificateId) {
      navigate(`/certificate/${axErr.response.data.data.certificateId}`)
    } else {
      toast.error('Failed to claim certificate. Please try again.')
    }
  } finally {
    setIsClaiming(false)
  }
}
```

- [ ] **Step 6: Add the Claim Certificate card to the right sidebar**

Find the right sidebar section (line 510):
```tsx
        {/* Right Column: Schedule */}
        <div className="space-y-6">
```

Add the certificate card immediately inside, before the existing `{schedule && ...}` block:

```tsx
        {/* Right Column: Schedule */}
        <div className="space-y-6">
          {/* Certificate CTA — only when course is complete */}
          {totalSessions > 0 && sessionsAttended >= totalSessions && (
            <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-6 shadow-lg shadow-violet-600/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Medal size={22} weight="fill" className="text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-sm">Course Complete!</p>
                  <p className="text-violet-200 text-xs">You've earned your certificate</p>
                </div>
              </div>
              <button
                onClick={handleClaimCertificate}
                disabled={isClaiming}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-violet-50 text-violet-700 font-black py-2.5 rounded-xl transition-colors text-sm disabled:opacity-70 shadow-sm"
              >
                {isClaiming ? (
                  <><Spinner size={16} className="animate-spin" /> Claiming…</>
                ) : (
                  <><Medal size={16} weight="fill" /> Claim Certificate</>
                )}
              </button>
            </div>
          )}
```

> **Important:** Make sure to close the right-sidebar `<div className="space-y-6">` properly — the rest of the sidebar content (schedule cards) stays after this new block.

- [ ] **Step 7: Run TypeScript check**

```bash
cd client && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/student/StudentCourseDetails.tsx
git commit -m "feat: add Claim Certificate CTA to course details when course is complete"
```

---

## Task 7: End-to-end browser test

**Context:** Test the full flow. Since the instructor attendance-marking UI isn't built yet, update the enrollment progress directly via the API to simulate completion.

- [ ] **Step 1: Start both servers**

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

- [ ] **Step 2: Get the student's enrollment ID and set sessions to complete**

Open Chrome DevTools on `http://localhost:5173` while logged in as the student. Run in the console:

```js
// Get enrollment for the Public Speaking course
fetch('http://localhost:5000/api/v1/enrollments/my', {
  headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` }
})
.then(r => r.json())
.then(d => { window.__enrollments = d.data; console.log(d.data.map(e => ({ id: e._id, course: e.course.title, progress: e.progress }))) })
```

Note the `_id` of the Public Speaking enrollment and its `totalSessions` value.

- [ ] **Step 3: Mark the enrollment as complete via direct DB update**

In the server terminal (or via Mongo shell / `server/scripts/` if available), run:

```js
// Run this in the MongoDB shell or create a one-off script
// Replace <ENROLLMENT_ID> with the actual ID from step 2
db.enrollments.updateOne(
  { _id: ObjectId('<ENROLLMENT_ID>') },
  { $set: { 'progress.sessionsAttended': <TOTAL_SESSIONS> } }
)
```

Or use the API if an admin attendance endpoint exists.

- [ ] **Step 4: Refresh the student course details page and verify the Claim button**

Navigate to `http://localhost:5173/dashboard/courses/<COURSE_ID>`. The "Course Complete!" card with "Claim Certificate" button should appear in the right sidebar.

- [ ] **Step 5: Click "Claim Certificate"**

Expected: page navigates to `/certificate/EP-YYYY-XXXXXXX`. Verify all fields on the certificate view:
- Student name (real name from DB)
- Course title
- Issue date (today's date)
- Credential ID (format `EP-YYYY-XXXXXXX`)
- Instructor name
- Course level badge

- [ ] **Step 6: Test the shareable link in a private/incognito window**

Copy the URL from the address bar (or the "Copy Link" input). Open it in an incognito window where no user is logged in. The certificate must load and display correctly — it is a public unauthenticated page.

- [ ] **Step 7: Test the LinkedIn "Add to LinkedIn" button**

Click "Add to LinkedIn". A new tab should open with the LinkedIn "Add to Profile" URL. Verify the URL contains:
- `name=<course title>`
- `certId=EP-YYYY-XXXXXXX`
- `certUrl=http://localhost:5173/certificate/EP-...`
- `issueYear` and `issueMonth`

- [ ] **Step 8: Test the Certificates page**

Navigate to `http://localhost:5173/dashboard/certificates`. The claimed certificate card should appear with the correct title, date, and credential ID. Test the "Download" (JPG format), "Share" (LinkedIn), and "Open Link" buttons.

- [ ] **Step 9: Test claiming again (duplicate check)**

Go back to the course details page and click "Claim Certificate" again. Expected: the page navigates to the existing certificate (no duplicate created, no error toast).

- [ ] **Step 10: Final commit**

```bash
git add -A
git commit -m "test: verify certificate claim, public view, LinkedIn share, and certificates page end-to-end"
```
