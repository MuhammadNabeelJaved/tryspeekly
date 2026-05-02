import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlass, Eye, Check, X, FunnelSimple, GraduationCap, Handshake } from '@phosphor-icons/react'
import type { AdminStore } from '../AdminPage'
import type { FinancialAidApp, Student } from './adminData'

function Badge({ value }: { value: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    under_review: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
    accepted: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[value] ?? 'bg-slate-100 text-slate-500'}`}>{value.replace('_', ' ')}</span>
}

export default function AdminFinancialAid({ store }: { store: AdminStore }) {
  const { financialAidApps, setFinancialAidApps, courses, setStudents, students } = store
  
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [modal, setModal] = useState<{ type: 'view' | 'enroll'; app: FinancialAidApp } | null>(null)
  
  const { register, handleSubmit, reset } = useForm<{ selectedCourseId: string }>({
    defaultValues: { selectedCourseId: courses[0]?.id || '' }
  })

  const filtered = financialAidApps.filter(app => {
    const q = search.toLowerCase()
    const matchSearch = !q || app.name.toLowerCase().includes(q) || app.email.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'All' || app.status === filterStatus
    return matchSearch && matchStatus
  }).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())

  function updateStatus(id: string, newStatus: FinancialAidApp['status']) {
    setFinancialAidApps(financialAidApps.map(a => a.id === id ? { ...a, status: newStatus } : a))
    if (modal?.app.id === id) {
      setModal({ ...modal, app: { ...modal.app, status: newStatus } })
    }
  }

  function handleEnroll(data: { selectedCourseId: string }) {
    if (!modal) return
    const app = modal.app
    const course = courses.find(c => c.id === data.selectedCourseId)
    if (!course) return
    
    // Create new student
    const initials = app.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const newStudent: Student = {
      id: `s${Date.now()}`,
      name: app.name,
      email: app.email,
      phone: app.phone,
      country: 'Unknown',
      city: 'Unknown',
      courseId: course.id,
      courseName: course.title,
      courseLevel: course.level,
      paymentMethod: 'Financial Aid',
      paymentAmount: 0,
      paymentCurrency: course.currency,
      paymentStatus: 'paid',
      enrolledAt: new Date().toISOString().split('T')[0],
      status: 'active',
      notes: `Enrolled via Financial Aid Application (${app.id})`,
      avatar: initials,
      financialAid: true
    }
    
    setStudents([...students, newStudent])
    alert(`Successfully enrolled ${app.name} into ${course.title}!`)
    setModal(null)
    reset()
  }

  return (
    <div className="p-4 sm:p-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Financial Aid <span className="text-slate-400 dark:text-neutral-500 font-medium text-base">({filtered.length})</span></h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Manage financial aid applications</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${showFilters ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:border-violet-300'}`}
          >
            <FunnelSimple size={15} />
            Filters
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <MagnifyingGlass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500 transition-colors">
                  {['All', 'pending', 'under_review', 'accepted', 'rejected'].map(v => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                {['Applicant', 'Phone', 'Date Applied', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">No applications found</td></tr>
              )}
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {app.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">{app.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-600 truncate max-w-[140px]">{app.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap">{app.phone}</td>
                  <td className="px-4 py-3 text-[10px] text-slate-400 dark:text-neutral-600 whitespace-nowrap">{app.appliedAt}</td>
                  <td className="px-4 py-3"><Badge value={app.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal({ type: 'view', app })} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-violet-100 dark:hover:bg-violet-950/40 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center transition-colors"><Eye size={13} /></button>
                      {app.status === 'accepted' && (
                        <button onClick={() => setModal({ type: 'enroll', app })} className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors" title="Enroll in Course">
                          <GraduationCap size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {modal?.type === 'view' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-lg border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><Handshake size={18} className="text-emerald-500"/> Financial Aid Details</h3>
                <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-neutral-800">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
                    {modal.app.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">{modal.app.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-neutral-400">{modal.app.email} • {modal.app.phone}</p>
                    <div className="flex gap-2 mt-1.5">
                      <Badge value={modal.app.status} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <h5 className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Reason for Financial Aid</h5>
                    <p className="text-sm text-slate-700 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800/60 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                      {modal.app.reason}
                    </p>
                  </div>
                  
                  {modal.app.notes && (
                    <div>
                      <h5 className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Admin Notes</h5>
                      <p className="text-sm text-slate-600 dark:text-neutral-400 italic">
                        {modal.app.notes}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 dark:border-neutral-800">
                    <h5 className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Update Status</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => updateStatus(modal.app.id, 'under_review')} className={`py-2 rounded-xl text-xs font-bold transition-colors ${modal.app.status === 'under_review' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Under Review</button>
                      <button onClick={() => updateStatus(modal.app.id, 'accepted')} className={`py-2 rounded-xl text-xs font-bold transition-colors ${modal.app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'}`}>Accept</button>
                      <button onClick={() => updateStatus(modal.app.id, 'rejected')} className={`py-2 rounded-xl text-xs font-bold transition-colors ${modal.app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'}`}>Reject</button>
                      <button onClick={() => updateStatus(modal.app.id, 'pending')} className={`py-2 rounded-xl text-xs font-bold transition-colors ${modal.app.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Pending</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-slate-100 dark:border-neutral-800">
                {modal.app.status === 'accepted' && (
                  <button onClick={() => setModal({ type: 'enroll', app: modal.app })} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                    <GraduationCap size={15} weight="bold" />Enroll Student
                  </button>
                )}
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-sm font-bold flex items-center justify-center transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ENROLL MODAL */}
      <AnimatePresence>
        {modal?.type === 'enroll' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><GraduationCap size={18} className="text-violet-500"/> Enroll Student</h3>
                <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>
              <form onSubmit={handleSubmit(handleEnroll)}>
                <div className="p-6">
                  <p className="text-sm text-slate-600 dark:text-neutral-400 mb-4">
                    Enroll <strong className="text-slate-900 dark:text-white">{modal.app.name}</strong> into a course with a 100% financial aid discount.
                  </p>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Select Course</label>
                    <select {...register('selectedCourseId', { required: true })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.level})</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-slate-100 dark:border-neutral-800">
                  <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 text-sm font-semibold transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                    <Check size={15} weight="bold" />Confirm
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
