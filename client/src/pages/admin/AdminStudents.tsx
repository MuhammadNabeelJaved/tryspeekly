import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MagnifyingGlass, PencilSimple, Trash, X, Check, Eye, FunnelSimple, Handshake, Certificate } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import type { AdminStore } from '../AdminPage'
import type { Student } from './adminData'
import { axiosClient } from '../../lib/axiosClient'
import { enrollmentsService } from '../../services/enrollments.service'
import UserAvatar from '../../components/UserAvatar'

const EMPTY: Student = {
  id: '', name: '', email: '', phone: '', country: '', city: '',
  courseId: '', courseName: '', courseLevel: '', paymentMethod: '',
  paymentAmount: 0, paymentCurrency: 'PKR', paymentStatus: 'pending',
  enrolledAt: new Date().toISOString().split('T')[0], status: 'active', notes: '', avatar: '',
  attendance: 0, certificateId: '', certificateIssueDate: ''
}

function Badge({ value }: { value: string }) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    pending: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    failed: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
    active: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400',
    completed: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
    inactive: 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400',
  }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[value] ?? 'bg-slate-100 text-slate-500'}`}>{value}</span>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Input({ register, name, type = 'text', placeholder, valueAsNumber }: { register: any; name: string; type?: string; placeholder?: string; valueAsNumber?: boolean }) {
  return (
    <input
      type={type}
      {...register(name, { valueAsNumber })}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
    />
  )
}

function Select({ register, name, options }: { register: any; name: string; options: string[] }) {
  return (
    <select
      {...register(name)}
      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export default function AdminStudents({ store }: { store: AdminStore }) {
  const { students, setStudents } = store

  const [apiStudents, setApiStudents] = useState<Student[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileImageMap, setProfileImageMap] = useState<Record<string, string>>({})
  const [enrollmentCountMap, setEnrollmentCountMap] = useState<Record<string, number>>({})
  const [enrollmentCoursesMap, setEnrollmentCoursesMap] = useState<Record<string, string[]>>({})

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, enrollRes] = await Promise.allSettled([
          axiosClient.get('/users', { params: { role: 'student', limit: 200 } }),
          enrollmentsService.getAllEnrollments({ limit: 1000 }),
        ])

        if (usersRes.status === 'fulfilled') {
          const users: any[] = usersRes.value.data?.data ?? []
          const imgMap: Record<string, string> = {}
          const mapped: Student[] = users.map((u: any, idx: number) => {
            const id = u._id ?? u.id ?? `api-s${idx}`
            if (u.profileImage) imgMap[id] = u.profileImage
            return {
              id,
              name: u.name ?? '',
              email: u.email ?? '',
              phone: u.phone ?? '',
              country: u.country ?? '',
              city: '',
              courseId: '',
              courseName: '',
              courseLevel: '',
              paymentMethod: '',
              paymentAmount: 0,
              paymentCurrency: 'PKR',
              paymentStatus: 'paid' as const,
              enrolledAt: u.createdAt?.split('T')[0] ?? '',
              status: 'active' as const,
              notes: '',
              avatar: (u.name ?? '').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
            }
          })
          setApiStudents(mapped)
          setProfileImageMap(imgMap)
        }

        if (enrollRes.status === 'fulfilled') {
          const enrollments = enrollRes.value.data ?? []
          const countMap: Record<string, number> = {}
          const coursesMap: Record<string, string[]> = {}
          enrollments.forEach((e: any) => {
            const sid = e.student?._id
            const title = e.course?.title
            if (!sid) return
            countMap[sid] = (countMap[sid] ?? 0) + 1
            if (title) {
              if (!coursesMap[sid]) coursesMap[sid] = []
              if (!coursesMap[sid].includes(title)) coursesMap[sid].push(title)
            }
            // also capture profile image from enrollment if not already in map
            if (e.student?.profileImage) {
              setProfileImageMap(prev => prev[sid] ? prev : { ...prev, [sid]: e.student.profileImage })
            }
          })
          setEnrollmentCountMap(countMap)
          setEnrollmentCoursesMap(coursesMap)
        }
      } catch {
        // Fallback to store data
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const [search, setSearch] = useState('')
  const [filterCountry, setFilterCountry] = useState('All')
  const [filterPayStatus, setFilterPayStatus] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | null>(null)
  const [viewStudent, setViewStudent] = useState<Student | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const { register, handleSubmit, reset } = useForm<Student>({
    defaultValues: EMPTY
  })

  const displayStudents = apiStudents ?? students
  const countries = ['All', ...Array.from(new Set(displayStudents.map(s => s.country))).sort()]
  const filtered = displayStudents.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.country.toLowerCase().includes(q) || s.courseName.toLowerCase().includes(q)
    const matchCountry = filterCountry === 'All' || s.country === filterCountry
    const matchPay = filterPayStatus === 'All' || s.paymentStatus === filterPayStatus
    const matchStatus = filterStatus === 'All' || s.status === filterStatus
    return matchSearch && matchCountry && matchPay && matchStatus
  })

  function openAdd() {
    reset({ ...EMPTY, id: `s${Date.now()}`, avatar: '' })
    setModalType('add')
  }

  function openEdit(s: Student) {
    reset(s)
    setModalType('edit')
  }

  function openView(s: Student) {
    setViewStudent(s)
    setModalType('view')
  }

  function handleIssueCertificate(s: Student) {
    const updated = {
      ...s,
      status: 'completed' as const,
      certificateId: s.certificateId || `EP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}X`,
      certificateIssueDate: s.certificateIssueDate || new Date().toISOString().split('T')[0]
    }
    setStudents(students.map(st => st.id === s.id ? updated : st))
    if (modalType === 'view' && viewStudent?.id === s.id) {
      setViewStudent(updated)
    }
  }

  function onSave(data: Student) {
    const initials = data.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const student = { ...data, avatar: data.avatar || initials }
    if (modalType === 'add') {
      setStudents([...students, student])
    } else {
      setStudents(students.map(s => s.id === student.id ? student : s))
    }
    setModalType(null)
  }

  async function handleDelete(id: string) {
    try {
      await axiosClient.delete(`/users/${id}`)
    } catch { /* ignore errors for local-only records */ }
    setApiStudents(prev => prev ? prev.filter(s => s.id !== id) : null)
    setStudents(students.filter(s => s.id !== id))
    setDeleteId(null)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (filtered.length > 0 && selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(s => s.id)))
    }
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Permanently delete ${selectedIds.size} student${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return
    setIsBulkDeleting(true)
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(ids.map(id => axiosClient.delete(`/users/${id}`)))
    const failed = results.filter(r => r.status === 'rejected').length
    const deletedIds = new Set(ids.filter((_, i) => results[i].status === 'fulfilled'))
    if (failed > 0) {
      toast.error(`${failed} deletion${failed > 1 ? 's' : ''} failed`)
    } else {
      toast.success(`${ids.length} student${ids.length > 1 ? 's' : ''} deleted`)
    }
    setApiStudents(prev => prev ? prev.filter(s => !deletedIds.has(s.id)) : null)
    setStudents(students.filter(s => !deletedIds.has(s.id)))
    setSelectedIds(new Set())
    setIsBulkDeleting(false)
  }

  return (
    <div className="p-4 sm:p-6 max-w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Students <span className="text-slate-400 dark:text-neutral-500 font-medium text-base">({filtered.length}/{students.length})</span></h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Manage all enrolled students</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${showFilters ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:border-violet-300'}`}
          >
            <FunnelSimple size={15} />
            Filters
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors"
          >
            <Plus size={15} weight="bold" />
            Add Student
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <MagnifyingGlass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, country, or course…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Country</label>
                <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500 transition-colors">
                  {countries.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Payment</label>
                <select value={filterPayStatus} onChange={e => setFilterPayStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500 transition-colors">
                  {['All', 'paid', 'pending', 'failed'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500 transition-colors">
                  {['All', 'active', 'inactive', 'completed'].map(v => <option key={v}>{v}</option>)}
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
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filtered.length }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                  />
                </th>
                {['Student', 'Country / City', 'Course', 'Payment Method', 'Amount', 'Pay Status', 'Status', 'Enrolled', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {loading ? (
                [...Array(7)].map((_, i) => (
                  <tr key={i}>
                    {[10, 160, 80, 120, 80, 60, 60, 60, 70, 70].map((w, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className={`h-3 rounded animate-pulse bg-slate-200 dark:bg-neutral-800`} style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">No students found</td></tr>
              ) : null}
              {!loading && filtered.map(s => (
                <tr key={s.id} className={`transition-colors group ${selectedIds.has(s.id) ? 'bg-violet-50 dark:bg-violet-950/20' : 'hover:bg-slate-50 dark:hover:bg-neutral-800/40'}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar src={profileImageMap[s.id]} name={s.name} size="xs" className="rounded-lg" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">{s.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-600 truncate max-w-[140px]">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap">{s.country}<br /><span className="text-[10px] text-slate-400 dark:text-neutral-600">{s.city}</span></td>
                  <td className="px-4 py-3">
                    {(() => {
                      const count = enrollmentCountMap[s.id] ?? 0
                      const titles = enrollmentCoursesMap[s.id] ?? []
                      if (count === 0) return <span className="text-[11px] text-slate-400 dark:text-neutral-600">—</span>
                      return (
                        <div>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 text-[10px] font-black rounded-full mb-1">
                            {count} {count === 1 ? 'course' : 'courses'}
                          </span>
                          <p className="text-[11px] text-slate-600 dark:text-neutral-300 truncate max-w-[130px]">{titles[0]}</p>
                          {titles.length > 1 && (
                            <p className="text-[10px] text-slate-400 dark:text-neutral-600">+{titles.length - 1} more</p>
                          )}
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap">
                    {s.paymentMethod}
                    {s.financialAid && (
                      <div className="mt-1 flex items-center gap-1 w-max px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold rounded uppercase tracking-wide">
                        <Handshake size={10} weight="fill" /> Financial Aid
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">{s.paymentCurrency === 'PKR' ? `₨${s.paymentAmount.toLocaleString()}` : `$${s.paymentAmount}`}</td>
                  <td className="px-4 py-3"><Badge value={s.paymentStatus} /></td>
                  <td className="px-4 py-3"><Badge value={s.status} /></td>
                  <td className="px-4 py-3 text-[10px] text-slate-400 dark:text-neutral-600 whitespace-nowrap">{s.enrolledAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openView(s)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-violet-100 dark:hover:bg-violet-950/40 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center transition-colors" title="View"><Eye size={13} /></button>
                      <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center transition-colors" title="Edit"><PencilSimple size={13} /></button>
                      <button onClick={() => handleIssueCertificate(s)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-green-100 dark:hover:bg-green-950/40 text-slate-500 hover:text-green-600 dark:hover:text-green-400 flex items-center justify-center transition-colors" title="Issue Certificate"><Certificate size={13} /></button>
                      <button onClick={() => setDeleteId(s.id)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-red-100 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-colors" title="Delete"><Trash size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {modalType && modalType !== 'view' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.form onSubmit={handleSubmit(onSave)} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-neutral-800 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
                <h3 className="text-base font-black text-slate-900 dark:text-white">{modalType === 'add' ? 'Add New Student' : 'Edit Student'}</h3>
                <button type="button" onClick={() => setModalType(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <Field label="Full Name"><Input register={register} name="name" placeholder="Ahmed Ali" /></Field>
                <Field label="Email"><Input register={register} name="email" type="email" placeholder="student@email.com" /></Field>
                <Field label="Phone"><Input register={register} name="phone" placeholder="+92 300 0000000" /></Field>
                <Field label="Country"><Input register={register} name="country" placeholder="Pakistan" /></Field>
                <Field label="City"><Input register={register} name="city" placeholder="Karachi" /></Field>
                <Field label="Course Name"><Input register={register} name="courseName" placeholder="Business English" /></Field>
                <Field label="Course Level"><Input register={register} name="courseLevel" placeholder="Intermediate" /></Field>
                <Field label="Payment Method"><Input register={register} name="paymentMethod" placeholder="Easypaisa" /></Field>
                <Field label="Amount">
                  <div className="flex gap-2">
                    <select {...register('paymentCurrency')} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                      {['PKR', 'USD', 'GBP', 'AED', 'CAD', 'AUD'].map(c => <option key={c}>{c}</option>)}
                    </select>
                    <Input register={register} name="paymentAmount" type="number" placeholder="0" valueAsNumber />
                  </div>
                </Field>
                <Field label="Enrolled Date"><Input register={register} name="enrolledAt" type="date" /></Field>
                <Field label="Payment Status"><Select register={register} name="paymentStatus" options={['paid', 'pending', 'failed']} /></Field>
                <Field label="Student Status"><Select register={register} name="status" options={['active', 'inactive', 'completed']} /></Field>
                <div className="col-span-2 border-t border-slate-100 dark:border-neutral-800 pt-4 mt-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Academic Progress & Certification</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Attended Classes"><Input register={register} name="attendedClasses" type="number" placeholder="10" valueAsNumber /></Field>
                    <Field label="Total Classes"><Input register={register} name="totalClasses" type="number" placeholder="12" valueAsNumber /></Field>
                    <Field label="Attendance (%)"><Input register={register} name="attendance" type="number" placeholder="85" valueAsNumber /></Field>
                    <Field label="Certificate ID (Leave empty to auto-generate)"><Input register={register} name="certificateId" placeholder="EP-2026-1234X" /></Field>
                    <Field label="Certificate Issue Date"><Input register={register} name="certificateIssueDate" type="date" /></Field>
                  </div>
                </div>
                <div className="col-span-2 border-t border-slate-100 dark:border-neutral-800 pt-4 mt-2">
                  <Field label="Notes">
                    <textarea {...register('notes')} rows={2} placeholder="Any notes about the student…" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors resize-none" />
                  </Field>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors">
                  <Check size={15} weight="bold" />{modalType === 'add' ? 'Add Student' : 'Save Changes'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {modalType === 'view' && viewStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-lg border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Student Details</h3>
                <button onClick={() => setModalType(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-neutral-800">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-lg">{viewStudent.avatar}</div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">{viewStudent.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-neutral-400">{viewStudent.email}</p>
                    <div className="flex gap-2 mt-1.5">
                      <Badge value={viewStudent.status} />
                      <Badge value={viewStudent.paymentStatus} />
                      {viewStudent.financialAid && <Badge value="Financial Aid" />}
                      {viewStudent.certificateId && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1"><Certificate size={10} weight="fill"/> Certified</span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Phone', value: viewStudent.phone },
                    { label: 'Country', value: `${viewStudent.city}, ${viewStudent.country}` },
                    { label: 'Course', value: viewStudent.courseName },
                    { label: 'Level', value: viewStudent.courseLevel },
                    { label: 'Attendance', value: `${viewStudent.attendance || 0}% (${viewStudent.attendedClasses || 0} / ${viewStudent.totalClasses || 0})` },
                    { label: 'Cert ID', value: viewStudent.certificateId || 'Not issued' },
                    { label: 'Payment Method', value: viewStudent.paymentMethod },
                    { label: 'Amount', value: viewStudent.paymentCurrency === 'PKR' ? `₨${viewStudent.paymentAmount.toLocaleString()}` : `$${viewStudent.paymentAmount}` },
                    { label: 'Enrolled', value: viewStudent.enrolledAt },
                    { label: 'Notes', value: viewStudent.notes || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 dark:bg-neutral-800/60 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => { setModalType(null); setTimeout(() => openEdit(viewStudent), 50) }} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  <PencilSimple size={14} />Edit
                </button>
                <button onClick={() => { setModalType(null); setDeleteId(viewStudent.id) }} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  <Trash size={14} />Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
                <Trash size={22} className="text-red-500" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-1">Delete Student?</h3>
              <p className="text-sm text-slate-400 dark:text-neutral-500 mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BULK ACTION BAR */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 min-w-max"
          >
            <span className="text-sm font-bold text-slate-700 dark:text-white">{selectedIds.size} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-white transition-colors font-medium">Clear</button>
            <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <Trash size={14} weight="bold" />
              {isBulkDeleting ? 'Deleting…' : `Delete ${selectedIds.size}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
