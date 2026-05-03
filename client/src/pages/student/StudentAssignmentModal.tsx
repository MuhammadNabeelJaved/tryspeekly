import React, { useState } from 'react'
import { X, UploadSimple, FileText, CircleNotch, CheckCircle } from '@phosphor-icons/react'

interface StudentAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  assignmentTitle: string
  courseName: string
}

export default function StudentAssignmentModal({ isOpen, onClose, assignmentTitle, courseName }: StudentAssignmentModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [fileName, setFileName] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileName) return
    
    setIsUploading(true)
    // Simulate upload delay
    setTimeout(() => {
      setIsUploading(false)
      setIsSuccess(true)
      // Close automatically after success
      setTimeout(() => {
        setIsSuccess(false)
        setFileName('')
        onClose()
      }, 2500)
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" 
        onClick={() => !isUploading && onClose()} 
      />
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-neutral-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Submit Assignment</h3>
          <button 
            onClick={() => !isUploading && onClose()} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>
        
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle size={64} weight="fill" className="mx-auto text-green-500 mb-4" />
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Assignment Submitted!</h4>
              <p className="text-sm text-slate-500 dark:text-neutral-400">Your work has been successfully uploaded for review.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-1">{courseName}</p>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{assignmentTitle}</h4>
              </div>

              <div className="border-2 border-dashed border-slate-200 dark:border-neutral-700 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors relative group">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                  required
                />
                <UploadSimple size={32} className="mx-auto text-slate-400 dark:text-neutral-500 mb-3 group-hover:text-violet-600 transition-colors" />
                {fileName ? (
                  <p className="text-sm font-bold text-violet-600 dark:text-violet-400 flex items-center justify-center gap-2">
                    <FileText size={18} /> {fileName}
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-700 dark:text-neutral-300 mb-1">Click to browse or drag file here</p>
                    <p className="text-xs text-slate-500 dark:text-neutral-500">Supports PDF, DOCX, ZIP, MP4 (Max 50MB)</p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Add a comment (Optional)</label>
                <textarea 
                  rows={3} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm outline-none focus:border-violet-500 transition-colors resize-none"
                  placeholder="Any notes for your instructor?"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isUploading || !fileName}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-[0_4px_14px_rgba(124,58,237,0.3)]"
              >
                {isUploading ? (
                  <><CircleNotch size={20} weight="bold" className="animate-spin" /> Uploading...</>
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