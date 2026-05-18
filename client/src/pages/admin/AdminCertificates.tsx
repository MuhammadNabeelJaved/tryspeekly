import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Certificate, MagnifyingGlass, Check, X, Eye, Trash, FunnelSimple, Medal, Clock, SpinnerGap } from '@phosphor-icons/react'
import { certificatesService } from '@/services/certificates.service'
import type { Certificate as CertificateType } from '@/types/api'

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState<CertificateType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [modalType, setModalType] = useState<'view' | 'revoke' | null>(null)
  const [selected, setSelected] = useState<CertificateType | null>(null)
  const [revoking, setRevoking] = useState(false)

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
      || cert.student.name.toLowerCase().includes(q)
      || cert.course.title.toLowerCase().includes(q)
      || cert.certificateId.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'All' || cert.status === filterStatus.toLowerCase()
    return matchSearch && matchStatus
  })

  const issuedCount = certificates.filter(c => c.status === 'issued').length
  const revokedCount = certificates.filter(c => c.status === 'revoked').length

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
                {['Student', 'Course', 'Certificate ID', 'Issue Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-4 bg-slate-100 dark:bg-neutral-800 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">No certificates found</td></tr>
              ) : (
                filtered.map(cert => (
                  <tr key={cert._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-300 font-bold text-xs">
                          {cert.student.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{cert.student.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-neutral-300">{cert.course.title}</td>
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
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-red-100 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-colors">
                            <Trash size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {modalType === 'view' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-xl border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Certificate Preview</h3>
                <button onClick={() => setModalType(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-neutral-950 flex justify-center">
                <div className="w-full aspect-[4/3] bg-white p-6 border-[6px] border-[#1e1b4b] relative shadow-lg flex flex-col items-center justify-center text-center">
                  <div className="absolute inset-[10px] border border-[#c4b5fd] pointer-events-none" />
                  <Certificate size={32} className="text-violet-600 mb-2" weight="fill" />
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Certificate of Completion</h4>
                  <p className="text-[#1e1b4b] font-serif italic text-2xl font-bold mb-3 border-b border-slate-200 px-4">{selected.student.name}</p>
                  <p className="text-[10px] text-slate-500 mb-2">has successfully completed</p>
                  <p className="text-xs font-bold text-[#1e1b4b] mb-4">{selected.course.title}</p>
                  <div className="flex justify-between w-full px-8 text-[8px] text-slate-400 font-bold mt-auto">
                    <p>Date: {new Date(selected.issueDate).toLocaleDateString()}</p>
                    <p>ID: {selected.certificateId}</p>
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
