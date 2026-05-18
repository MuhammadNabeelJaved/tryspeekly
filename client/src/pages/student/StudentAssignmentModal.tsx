import { useState } from 'react'
import type { FormEvent } from 'react'
import { X, UploadSimple, FileText, CircleNotch, CheckCircle, Star } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { assignmentsService } from '@/services/assignments.service'
import type { Assignment } from '@/types/api'

interface StudentAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  assignment: Assignment | null
  enrollmentId: string
  onSubmitted: () => void
}

export default function StudentAssignmentModal({
  isOpen,
  onClose,
  assignment,
  enrollmentId,
  onSubmitted,
}: StudentAssignmentModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  if (!isOpen || !assignment) return null

  const mySubmission = assignment.submissions?.[0]
  const isGraded = mySubmission?.status === 'graded'

  const handleClose = () => {
    if (isUploading) return
    setFile(null)
    setIsSuccess(false)
    onClose()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB')
      return
    }

    setIsUploading(true)
    try {
      await assignmentsService.submitAssignment(assignment._id, { enrollmentId, file })
      setIsUploading(false)
      setIsSuccess(true)
      onSubmitted()
      setTimeout(() => {
        setIsSuccess(false)
        setFile(null)
        onClose()
      }, 2000)
    } catch {
      setIsUploading(false)
      toast.error('Failed to submit assignment. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-neutral-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Submit Assignment</h3>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle size={64} weight="fill" className="mx-auto text-green-500 mb-4" />
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Assignment Submitted!
              </h4>
              <p className="text-sm text-slate-500 dark:text-neutral-400">
                Your work has been successfully uploaded for review.
              </p>
            </div>
          ) : isGraded ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-1">
                  {assignment.course.title}
                </p>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {assignment.title}
                </h4>
              </div>

              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-3">
                  <Star size={20} weight="fill" />
                  <span className="font-bold text-sm uppercase tracking-wide">Graded</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {mySubmission?.grade ?? '—'}
                  </span>
                  <span className="text-lg font-bold text-slate-400 dark:text-neutral-500">/100</span>
                </div>
                {mySubmission?.feedback && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                      Instructor Feedback
                    </p>
                    <p className="text-sm text-slate-700 dark:text-neutral-300 leading-relaxed">
                      {mySubmission.feedback}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleClose}
                className="w-full bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-900 dark:text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-1">
                  {assignment.course.title}
                </p>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {assignment.title}
                </h4>
              </div>

              <div className="border-2 border-dashed border-slate-200 dark:border-neutral-700 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors relative group">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                />
                <UploadSimple
                  size={32}
                  className="mx-auto text-slate-400 dark:text-neutral-500 mb-3 group-hover:text-violet-600 transition-colors"
                />
                {file ? (
                  <p className="text-sm font-bold text-violet-600 dark:text-violet-400 flex items-center justify-center gap-2">
                    <FileText size={18} /> {file.name}
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-700 dark:text-neutral-300 mb-1">
                      Click to browse or drag file here
                    </p>
                    <p className="text-xs text-slate-500 dark:text-neutral-500">
                      Supports PDF, DOCX, ZIP, MP4 (Max 10MB)
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                  Add a comment (Optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm outline-none focus:border-violet-500 transition-colors resize-none"
                  placeholder="Any notes for your instructor?"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading || !file}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-[0_4px_14px_rgba(124,58,237,0.3)]"
              >
                {isUploading ? (
                  <>
                    <CircleNotch size={20} weight="bold" className="animate-spin" /> Uploading...
                  </>
                ) : mySubmission ? (
                  'Resubmit Assignment'
                ) : (
                  'Upload Assignment'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
