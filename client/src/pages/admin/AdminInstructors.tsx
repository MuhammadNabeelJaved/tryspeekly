import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, PencilSimple, Trash, X, Check, Star, Eye } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import type { AdminStore } from '../AdminPage'
import type { Instructor } from './adminData'
import { axiosClient } from '../../lib/axiosClient'
import { coursesService } from '../../services/courses.service'
import UserAvatar from '../../components/UserAvatar'

const EMPTY: Instructor = {
  id: '', name: '', email: '', phone: '', country: '', specialization: '',
  experience: '', courses: [], totalStudents: 0, rating: 5.0, status: 'active',
  bio: '', joinedAt: new Date().toISOString().split('T')[0], avatar: '', salary: 0,
}

function Badge({ value }: { value: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
      value === 'active' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
      : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400'
    }`}>{value}</span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Input({ register, name, type = 'text', placeholder, valueAsNumber, step }: { register: any; name: string; type?: string; placeholder?: string; valueAsNumber?: boolean; step?: string }) {
  return (
    <input type={type} {...register(name, { valueAsNumber })} placeholder={placeholder} step={step}
      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors"
    />
  )
}

export default function AdminInstructors({ store }: { store: AdminStore }) {
  const { instructors, setInstructors } = store

  const [apiInstructors, setApiInstructors] = useState<Instructor[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [courseCountMap, setCourseCountMap] = useState<Record<string, number>>({})
  const [profileImageMap, setProfileImageMap] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchData() {
      try {
        const [instRes, coursesRes] = await Promise.allSettled([
          axiosClient.get('/users', { params: { role: 'teacher', limit: 200 } }),
          coursesService.getAdminCourses({ limit: 500 }),
        ])

        if (instRes.status === 'fulfilled') {
          const users: any[] = instRes.value.data?.data ?? []
          const imgMap: Record<string, string> = {}
          const mapped: Instructor[] = users.map((u: any, idx: number) => {
            const id = u._id ?? u.id ?? `api-i${idx}`
            if (u.profileImage) imgMap[id] = u.profileImage
            return {
              id,
              name: u.name ?? '',
              email: u.email ?? '',
              phone: u.phone ?? '',
              country: u.country ?? '',
              specialization: '',
              experience: '',
              courses: [],
              totalStudents: 0,
              rating: 5.0,
              status: 'active' as const,
              bio: u.bio ?? '',
              joinedAt: u.createdAt?.split('T')[0] ?? '',
              avatar: (u.name ?? '').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
              salary: 0,
            }
          })
          setApiInstructors(mapped)
          setProfileImageMap(imgMap)
        }

        if (coursesRes.status === 'fulfilled') {
          const courses: any[] = (coursesRes.value as any).data ?? []
          const countMap: Record<string, number> = {}
          courses.forEach((c: any) => {
            const tid = c.teacher?._id
            if (tid) countMap[tid] = (countMap[tid] ?? 0) + 1
          })
          setCourseCountMap(countMap)
        }
      } catch {
        // Fallback to store data
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const displayInstructors = apiInstructors ?? instructors

  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | null>(null)
  const [viewInst, setViewInst] = useState<Instructor | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const { register, handleSubmit, reset } = useForm<Instructor & { coursesInput: string }>({
    defaultValues: { ...EMPTY, coursesInput: '' }
  })

  const filtered = displayInstructors.filter(i => {
    const q = search.toLowerCase()
    return !q || i.name.toLowerCase().includes(q) || i.specialization.toLowerCase().includes(q) || i.email.toLowerCase().includes(q)
  })

  function openAdd() {
    reset({ ...EMPTY, id: `i${Date.now()}`, coursesInput: '' })
    setModalType('add')
  }

  function openEdit(inst: Instructor) {
    reset({ ...inst, coursesInput: inst.courses.join(', ') })
    setModalType('edit')
  }

  function openView(inst: Instructor) {
    setViewInst(inst)
    setModalType('view')
  }

  function onSave(data: Instructor & { coursesInput: string }) {
    const initials = data.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const inst: Instructor = {
      ...data,
      avatar: data.avatar || initials,
      courses: data.coursesInput.split(',').map(c => c.trim()).filter(Boolean),
    }
    if (modalType === 'add') {
      setInstructors([...instructors, inst])
    } else {
      setInstructors(instructors.map(i => i.id === inst.id ? inst : i))
    }
    setModalType(null)
  }

  async function handleDelete(id: string) {
    try {
      await axiosClient.delete(`/users/${id}`)
    } catch { /* ignore errors for local-only records */ }
    setApiInstructors(prev => prev ? prev.filter(i => i.id !== id) : null)
    setInstructors(instructors.filter(i => i.id !== id))
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
      setSelectedIds(new Set(filtered.map(i => i.id)))
    }
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Permanently delete ${selectedIds.size} instructor${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return
    setIsBulkDeleting(true)
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(ids.map(id => axiosClient.delete(`/users/${id}`)))
    const failed = results.filter(r => r.status === 'rejected').length
    const deletedIds = new Set(ids.filter((_, i) => results[i].status === 'fulfilled'))
    if (failed > 0) {
      toast.error(`${failed} deletion${failed > 1 ? 's' : ''} failed`)
    } else {
      toast.success(`${ids.length} instructor${ids.length > 1 ? 's' : ''} deleted`)
    }
    setApiInstructors(prev => prev ? prev.filter(i => !deletedIds.has(i.id)) : null)
    setInstructors(instructors.filter(i => !deletedIds.has(i.id)))
    setSelectedIds(new Set())
    setIsBulkDeleting(false)
  }

  const AVATAR_GRADIENTS = ['from-violet-500 to-purple-600', 'from-blue-500 to-blue-700', 'from-emerald-500 to-emerald-700', 'from-pink-500 to-rose-600']

  return (
    <div className="p-4 sm:p-6 max-w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Instructors <span className="text-slate-400 dark:text-neutral-500 font-medium text-base">({displayInstructors.length})</span></h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Manage teaching staff and their courses</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors">
          <Plus size={15} weight="bold" />Add Instructor
        </button>
      </div>

      {/* Search + select-all row */}
      <div className="flex items-center gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search instructors…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors"
        />
        {filtered.length > 0 && (
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={selectedIds.size === filtered.length}
              ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filtered.length }}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded accent-violet-600"
            />
            Select all
          </label>
        )}
      </div>

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-[20px] border border-slate-100 dark:border-neutral-800 overflow-hidden">
              <div className="p-5 pb-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl animate-pulse bg-slate-200 dark:bg-neutral-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 rounded animate-pulse bg-slate-200 dark:bg-neutral-800 w-3/4" />
                    <div className="h-3 rounded animate-pulse bg-slate-200 dark:bg-neutral-800 w-1/2" />
                    <div className="h-3 rounded animate-pulse bg-slate-200 dark:bg-neutral-800 w-1/3" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="bg-slate-50 dark:bg-neutral-800/60 rounded-xl p-2 text-center space-y-1">
                      <div className="h-3 rounded animate-pulse bg-slate-200 dark:bg-neutral-700 mx-auto w-3/4" />
                      <div className="h-2.5 rounded animate-pulse bg-slate-200 dark:bg-neutral-700 mx-auto w-1/2" />
                    </div>
                  ))}
                </div>
                <div className="h-9 rounded-xl animate-pulse bg-slate-200 dark:bg-neutral-800 mb-3" />
                <div className="h-3 rounded animate-pulse bg-slate-200 dark:bg-neutral-800 w-2/3" />
              </div>
              <div className="flex border-t border-slate-100 dark:border-neutral-800">
                {[1, 2, 3].map(j => (
                  <div key={j} className="flex-1 py-2.5 flex items-center justify-center">
                    <div className="h-3 w-10 rounded animate-pulse bg-slate-200 dark:bg-neutral-800" />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : filtered.map((inst, idx) => (
          <motion.div key={inst.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
            className={`bg-white dark:bg-neutral-900 rounded-[20px] border overflow-hidden hover:shadow-lg hover:shadow-violet-100/30 dark:hover:shadow-violet-950/20 transition-all duration-200 group ${
              selectedIds.has(inst.id)
                ? 'border-violet-400 dark:border-violet-600 ring-2 ring-violet-200 dark:ring-violet-900/50'
                : 'border-slate-100 dark:border-neutral-800 hover:border-violet-200 dark:hover:border-violet-800'
            }`}
          >
            {/* Top */}
            <div className="p-5 pb-4">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(inst.id)}
                  onChange={() => toggleSelect(inst.id)}
                  onClick={e => e.stopPropagation()}
                  className="mt-1 w-4 h-4 rounded accent-violet-600 flex-shrink-0 cursor-pointer"
                />
                <UserAvatar
                  src={profileImageMap[inst.id]}
                  name={inst.name}
                  size="lg"
                  className="rounded-2xl shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{inst.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">{inst.specialization}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={11} weight="fill" className="text-amber-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">{inst.rating}</span>
                    <Badge value={inst.status} />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Students', value: inst.totalStudents },
                  { label: 'Country', value: inst.country.split(' ')[0] || '—' },
                  { label: 'Joined', value: inst.joinedAt || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 dark:bg-neutral-800/60 rounded-xl p-2 text-center">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{value}</p>
                    <p className="text-[9px] text-slate-400 dark:text-neutral-600 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Course count */}
              {(() => {
                const count = courseCountMap[inst.id] ?? 0
                return (
                  <div className="flex items-center justify-between bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 rounded-xl px-3 py-2 mb-3">
                    <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">Courses on website</span>
                    <span className={`text-sm font-black ${count > 0 ? 'text-violet-700 dark:text-violet-300' : 'text-slate-400 dark:text-neutral-600'}`}>
                      {count} {count === 1 ? 'course' : 'courses'}
                    </span>
                  </div>
                )
              })()}

              <p className="text-xs text-slate-400 dark:text-neutral-600 truncate">{inst.email}</p>
            </div>

            {/* Actions */}
            <div className="flex border-t border-slate-100 dark:border-neutral-800">
              <button onClick={() => openView(inst)} className="flex-1 py-2.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 flex items-center justify-center gap-1.5 transition-colors">
                <Eye size={13} />View
              </button>
              <div className="w-px bg-slate-100 dark:bg-neutral-800" />
              <button onClick={() => openEdit(inst)} className="flex-1 py-2.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 flex items-center justify-center gap-1.5 transition-colors">
                <PencilSimple size={13} />Edit
              </button>
              <div className="w-px bg-slate-100 dark:bg-neutral-800" />
              <button onClick={() => setDeleteId(inst.id)} className="flex-1 py-2.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 flex items-center justify-center gap-1.5 transition-colors">
                <Trash size={13} />Remove
              </button>
            </div>
          </motion.div>
        ))}

        {/* Add card */}
        {!loading && <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={openAdd}
          className="border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-[20px] p-8 flex flex-col items-center justify-center gap-3 text-slate-300 dark:text-neutral-700 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-400 dark:hover:text-violet-500 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={20} />
          </div>
          <p className="text-sm font-semibold">Add Instructor</p>
        </motion.button>}
      </div>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {modalType && modalType !== 'view' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.form onSubmit={handleSubmit(onSave)} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-neutral-800 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
                <h3 className="text-base font-black text-slate-900 dark:text-white">{modalType === 'add' ? 'Add Instructor' : 'Edit Instructor'}</h3>
                <button type="button" onClick={() => setModalType(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <Field label="Full Name"><Input register={register} name="name" placeholder="Dr. Sarah Johnson" /></Field>
                <Field label="Email"><Input register={register} name="email" type="email" placeholder="sarah@englishpro.com" /></Field>
                <Field label="Phone"><Input register={register} name="phone" placeholder="+92 300 0000000" /></Field>
                <Field label="Country"><Input register={register} name="country" placeholder="Pakistan" /></Field>
                <Field label="Specialization"><Input register={register} name="specialization" placeholder="Business English & IELTS" /></Field>
                <Field label="Experience"><Input register={register} name="experience" placeholder="8 years" /></Field>
                <Field label="Rating (1–5)"><Input register={register} name="rating" type="number" step="0.1" placeholder="4.8" valueAsNumber /></Field>
                <Field label="Monthly Salary (PKR)"><Input register={register} name="salary" type="number" placeholder="75000" valueAsNumber /></Field>
                <Field label="Joined Date"><Input register={register} name="joinedAt" type="date" /></Field>
                <Field label="Status">
                  <select {...register('status')} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
                <div className="col-span-2">
                  <Field label="Courses (comma-separated)">
                    <input {...register('coursesInput')} placeholder="Business English, IELTS Prep" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors" />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Bio">
                    <textarea {...register('bio')} rows={3} placeholder="Short bio about the instructor…" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors resize-none" />
                  </Field>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors">
                  <Check size={15} weight="bold" />{modalType === 'add' ? 'Add Instructor' : 'Save Changes'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {modalType === 'view' && viewInst && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-md border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Instructor Profile</h3>
                <button onClick={() => setModalType(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <UserAvatar src={profileImageMap[viewInst.id]} name={viewInst.name} size="lg" className="rounded-2xl shadow-lg" />
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">{viewInst.name}</h4>
                    <p className="text-xs text-slate-500">{viewInst.specialization}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={11} weight="fill" className="text-amber-400" />
                      <span className="text-xs font-bold">{viewInst.rating}</span>
                      <Badge value={viewInst.status} />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4 leading-relaxed">{viewInst.bio}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Email', value: viewInst.email },
                    { label: 'Phone', value: viewInst.phone },
                    { label: 'Country', value: viewInst.country },
                    { label: 'Experience', value: viewInst.experience },
                    { label: 'Total Students', value: viewInst.totalStudents },
                    { label: 'Joined', value: viewInst.joinedAt },
                    { label: 'Salary', value: `₨${viewInst.salary.toLocaleString()}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 dark:bg-neutral-800/60 rounded-xl p-2.5">
                      <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-semibold uppercase tracking-wide mb-2">Courses</p>
                  <div className="flex flex-wrap gap-1">
                    {viewInst.courses.map(c => <span key={c} className="px-2 py-0.5 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 text-[10px] font-semibold rounded-lg border border-violet-100 dark:border-violet-900">{c}</span>)}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => { setModalType(null); setTimeout(() => openEdit(viewInst), 50) }} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"><PencilSimple size={14} />Edit</button>
                <button onClick={() => { setModalType(null); setDeleteId(viewInst.id) }} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"><Trash size={14} />Delete</button>
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
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl shadow-2xl px-5 py-3"
          >
            <span className="text-sm font-bold text-slate-700 dark:text-white whitespace-nowrap">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-semibold text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <Trash size={14} weight="bold" />
              {isBulkDeleting ? 'Deleting…' : 'Delete Selected'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4"><Trash size={22} className="text-red-500" /></div>
              <h3 className="font-black text-slate-900 dark:text-white mb-1">Remove Instructor?</h3>
              <p className="text-sm text-slate-400 dark:text-neutral-500 mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">Remove</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
