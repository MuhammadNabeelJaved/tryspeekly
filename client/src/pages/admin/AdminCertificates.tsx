import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Certificate, MagnifyingGlass, Check, X, Eye, Trash, FunnelSimple, Medal, Clock, SpinnerGap } from '@phosphor-icons/react'
import { certificatesService } from '@/services/certificates.service'
import ConfirmModal from '@/components/ConfirmModal'
import CertificateDesign from '@/components/CertificateDesign'
import toast from 'react-hot-toast'
import type { Certificate as CertificateType } from '@/types/api'

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState<CertificateType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [modalType, setModalType] = useState<'view' | 'revoke' | null>(null)
  const [selected, setSelected] = useState<CertificateType | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const fetchCertificates = useCallback(() => {
    setLoading(true)
    certificatesService.getAllCertificates({ limit: 200 })
      .then(res => setCertificates(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchCertificates() }, [fetchCertificates])

  const filtered = certificates.filter(cert => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || (cert.student?.name ?? '').toLowerCase().includes(q)
      || (cert.course?.title ?? '').toLowerCase().includes(q)
      || cert.certificateId.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'All' || cert.status === filterStatus.toLowerCase()
    return matchSearch && matchStatus
  })

  const allFilteredIds = filtered.map(c => c._id)
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id))

  const issuedCount = certificates.filter(c => c.status === 'issued').length
  const revokedCount = certificates.filter(c => c.status === 'revoked').length

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleDeleteOne = async () => {
    if (!deleteTarget) return
    try {
      await certificatesService.deleteCertificate(deleteTarget)
      setCertificates(prev => prev.filter(c => c._id !== deleteTarget))
      setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget); return n })
      toast.success('Certificate deleted')
    } catch { toast.error('Failed to delete') } finally { setDeleteTarget(null) }
  }

  const handleBulkDelete = async () => {
    try {
      const res = await certificatesService.bulkDelete(Array.from(selectedIds))
      setCertificates(prev => prev.filter(c => !selectedIds.has(c._id)))
      setSelectedIds(new Set())
      toast.success(res.message)
    } catch { toast.error('Failed to delete') } finally { setBulkConfirm(false) }
  }

  const handleRevoke = async () => {
    if (!selected) return
    setRevoking(true)
    try {
      await certificatesService.revokeCertificate(selected._id)
      setCertificates(prev => prev.map(c => c._id === selected._id ? { ...c, status: 'revoked' as const } : c))
      setModalType(null)
      setSelected(null)
    } catch {
      // silent fail
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Certificate Management</h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">View and manage student certificates</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center flex-shrink-0 text-violet-600 dark:text-violet-400">
            <Medal size={20} weight="fill" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{certificates.length}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase mt-1">Total</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/40 flex items-center justify-center flex-shrink-0 text-green-600 dark:text-green-400">
            <Certificate size={20} weight="fill" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{issuedCount}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase mt-1">Issued</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0 text-red-500">
            <Clock size={20} weight="fill" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{revokedCount}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase mt-1">Revoked</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <MagnifyingGlass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by student, course, or Cert ID…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors" />
        </div>
        <div className="flex items-center gap-2 px-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl">
          <FunnelSimple size={15} className="text-slate-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="py-2.5 bg-transparent text-sm text-slate-700 dark:text-neutral-300 outline-none w-28">
            <option value="All">All Status</option>
            <option value="Issued">Issued</option>
            <option value="Revoked">Revoked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                <th className="px-5 py-3 w-10">
                  <input type="checkbox" checked={allSelected}
                    onChange={e => setSelectedIds(e.target.checked ? new Set(allFilteredIds) : new Set())}
                    className="w-4 h-4 rounded accent-violet-500" />
                </th>
                {['Student', 'Course', 'Certificate ID', 'Issue Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-4 bg-slate-100 dark:bg-neutral-800 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">No certificates found</td></tr>
              ) : (
                filtered.map(cert => (
                  <tr key={cert._id} className={`transition-colors group ${selectedIds.has(cert._id) ? 'bg-red-50/30 dark:bg-red-950/10' : 'hover:bg-slate-50 dark:hover:bg-neutral-800/40'}`}>
                    <td className="px-5 py-4">
                      <input type="checkbox" checked={selectedIds.has(cert._id)} onChange={() => toggleSelect(cert._id)} className="w-4 h-4 rounded accent-violet-500" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-300 font-bold text-xs">
                          {cert.student?.name ? cert.student.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{cert.student?.name ?? 'Deleted User'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-neutral-300">{cert.course?.title ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">{cert.certificateId}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400 dark:text-neutral-500 whitespace-nowrap">
                      {new Date(cert.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {cert.status === 'issued' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                          <Check size={12} weight="bold" /> Issued
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                          <X size={12} weight="bold" /> Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelected(cert); setModalType('view') }}
                          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-colors">
                          <Eye size={15} />
                        </button>
                        {cert.status === 'issued' && (
                          <button onClick={() => { setSelected(cert); setModalType('revoke') }}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center transition-colors" title="Revoke">
                            <Trash size={15} />
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(cert._id)}
                          className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 flex items-center justify-center transition-colors" title="Delete record">
                          <X size={15} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating bulk bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 min-w-max"
          >
            <span className="text-sm font-bold text-slate-700 dark:text-white">{selectedIds.size} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white font-medium">Clear</button>
            <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />
            <button onClick={() => setBulkConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors">
              <Trash size={14} weight="bold" /> Delete {selectedIds.size}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal open={!!deleteTarget} title="Delete Certificate?" message="This will permanently remove this certificate record from the database." confirmLabel="Delete" variant="danger" onConfirm={handleDeleteOne} onCancel={() => setDeleteTarget(null)} />
      <ConfirmModal open={bulkConfirm} title={`Delete ${selectedIds.size} Certificate${selectedIds.size !== 1 ? 's' : ''}?`} message="This will permanently remove the selected certificate records. This cannot be undone." confirmLabel={`Delete ${selectedIds.size}`} variant="danger" onConfirm={handleBulkDelete} onCancel={() => setBulkConfirm(false)} />

      {/* VIEW MODAL */}
      <AnimatePresence>
        {modalType === 'view' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-xl border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Certificate Preview</h3>
                <button onClick={() => setModalType(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-neutral-950 flex justify-center overflow-x-auto">
                <div style={{ width: 520, height: 368, flexShrink: 0 }}>
                  <div style={{ transform: 'scale(0.52)', transformOrigin: 'top left' }}>
                    <CertificateDesign data={{
                      studentName: selected.student?.name ?? 'Deleted User',
                      courseName: selected.course?.title ?? '—',
                      date: new Date(selected.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                      certificateId: selected.certificateId,
                      instructorTitle: 'Course Instructor',
                    }} />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
                <a href={`/certificate/${selected.certificateId}`} target="_blank" rel="noreferrer"
                  className="text-sm font-bold text-violet-600 hover:text-violet-700">
                  View Public Page
                </a>
                <button onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVOKE CONFIRM */}
      <AnimatePresence>
        {modalType === 'revoke' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
                <Trash size={22} className="text-red-500" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-1">Revoke Certificate?</h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400 mb-5">
                This will revoke <span className="font-mono text-slate-900 dark:text-white">{selected.certificateId}</span>. The student will no longer be able to view it.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setModalType(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
                  Cancel
                </button>
                <button onClick={handleRevoke} disabled={revoking}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  {revoking ? <SpinnerGap size={14} className="animate-spin" /> : null}
                  Revoke
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
