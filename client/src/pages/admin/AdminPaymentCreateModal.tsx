import { useState, useEffect, useRef } from 'react'
import { X, MagnifyingGlass, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { paymentsService } from '@/services/payments.service'
import { usersService } from '@/services/users.service'
import { coursesService } from '@/services/courses.service'
import type { AdminCreatePaymentDto, PaymentMethod, User, Course } from '@/types/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'EasyPaisa' },
  { value: 'nayapay', label: 'NayaPay' },
  { value: 'sadapay', label: 'SadaPay' },
  { value: 'zindigi', label: 'Zindigi' },
  { value: 'bank_local', label: 'Bank Transfer (Local)' },
  { value: 'bank_international', label: 'Bank Transfer (International)' },
]

export default function AdminPaymentCreateModal({ isOpen, onClose, onSuccess }: Props) {
  const [studentSearch, setStudentSearch] = useState('')
  const [studentResults, setStudentResults] = useState<User[]>([])
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null)

  const [courseSearch, setCourseSearch] = useState('')
  const [courseResults, setCourseResults] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const [method, setMethod] = useState<PaymentMethod>('jazzcash')
  const [transactionId, setTransactionId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR')
  const [adminNote, setAdminNote] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const studentTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const courseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!studentSearch.trim()) { setStudentResults([]); return }
    clearTimeout(studentTimer.current)
    studentTimer.current = setTimeout(() => {
      usersService.getAllUsers({ role: 'student', search: studentSearch, limit: 5 })
        .then(res => setStudentResults(res.data))
        .catch(() => {})
    }, 350)
  }, [studentSearch])

  useEffect(() => {
    if (!courseSearch.trim()) { setCourseResults([]); return }
    clearTimeout(courseTimer.current)
    courseTimer.current = setTimeout(() => {
      coursesService.getAllCourses({ search: courseSearch, limit: 5 })
        .then(res => setCourseResults(res.data))
        .catch(() => {})
    }, 350)
  }, [courseSearch])

  if (!isOpen) return null

  const reset = () => {
    setStudentSearch(''); setStudentResults([]); setSelectedStudent(null)
    setCourseSearch(''); setCourseResults([]); setSelectedCourse(null)
    setMethod('jazzcash'); setTransactionId(''); setAmount(''); setCurrency('PKR'); setAdminNote('')
    setError(''); setSuccess(false)
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) { setError('Please select a student.'); return }
    if (!selectedCourse) { setError('Please select a course.'); return }
    if (!amount || Number(amount) <= 0) { setError('Please enter a valid amount.'); return }

    const teacherId = selectedCourse.teacher._id

    const dto: AdminCreatePaymentDto = {
      studentId: selectedStudent._id,
      courseId: selectedCourse._id,
      teacherId,
      method,
      transactionId: transactionId || undefined,
      amount: Number(amount),
      currency,
      adminNote: adminNote || undefined,
    }

    setLoading(true)
    setError('')
    try {
      await paymentsService.adminCreatePayment(dto)
      setSuccess(true)
      setTimeout(() => { reset(); onSuccess() }, 1500)
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to create payment record.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-700 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Add Payment Record</h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} weight="fill" className="text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-slate-900 dark:text-white">Payment record created!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
                <WarningCircle size={16} weight="fill" />
                {error}
              </div>
            )}

            {/* Student search */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Student *</label>
              {selectedStudent ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedStudent.name} <span className="font-normal text-slate-500">({selectedStudent.email})</span></span>
                  <button type="button" onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-red-500 ml-2"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search student by name or email…"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600" />
                  </div>
                  {studentResults.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden">
                      {studentResults.map(u => (
                        <li key={u._id}>
                          <button type="button" onClick={() => { setSelectedStudent(u); setStudentSearch(''); setStudentResults([]) }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors">
                            <span className="font-semibold text-slate-900 dark:text-white">{u.name}</span>
                            <span className="text-slate-400 dark:text-neutral-500 ml-2 text-xs">{u.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* Course search */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Course *</label>
              {selectedCourse ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedCourse.title}</span>
                  <button type="button" onClick={() => setSelectedCourse(null)} className="text-slate-400 hover:text-red-500 ml-2"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={courseSearch} onChange={e => setCourseSearch(e.target.value)} placeholder="Search course by title…"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600" />
                  </div>
                  {courseResults.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden">
                      {courseResults.map(c => (
                        <li key={c._id}>
                          <button type="button" onClick={() => { setSelectedCourse(c); setCourseSearch(''); setCourseResults([]) }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors">
                            <span className="font-semibold text-slate-900 dark:text-white">{c.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Payment Method *</label>
              <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Transaction ID <span className="normal-case font-normal">(optional)</span></label>
              <input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. TXN123456"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Amount *</label>
                <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value as 'PKR' | 'USD')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Admin Note <span className="normal-case font-normal">(optional)</span></label>
              <input value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Internal note…"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm transition-colors">
              {loading ? 'Creating…' : 'Create Payment Record'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
