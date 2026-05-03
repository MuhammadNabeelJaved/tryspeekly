import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Certificate, MagnifyingGlass, Check, X, Eye, FilePdf, Image as ImageIcon, Trash, FunnelSimple, Medal, Clock } from '@phosphor-icons/react'
import type { AdminStore } from '../AdminPage'
import type { Student } from './adminData'

export default function AdminCertificates({ store }: { store: AdminStore }) {
  const { students, setStudents } = store
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All') // 'All', 'Issued', 'Pending'
  
  const [modalType, setModalType] = useState<'issue' | 'view' | 'revoke' | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  
  // Custom inputs for issuing a certificate
  const [certId, setCertId] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])

  // Filter out students who are eligible for certificates or already have one
  // Only completed students are shown here to keep it focused
  const eligibleStudents = students.filter(s => s.status === 'completed' || s.certificateId)

  const filtered = eligibleStudents.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.courseName.toLowerCase().includes(q) || s.certificateId?.toLowerCase().includes(q)
    
    let matchStatus = true
    if (filterStatus === 'Issued') matchStatus = !!s.certificateId
    if (filterStatus === 'Pending') matchStatus = !s.certificateId
    
    return matchSearch && matchStatus
  })

  const openIssueModal = (s: Student) => {
    setSelectedStudent(s)
    setCertId(`EP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}X`)
    setIssueDate(new Date().toISOString().split('T')[0])
    setModalType('issue')
  }

  const openViewModal = (s: Student) => {
    setSelectedStudent(s)
    setModalType('view')
  }

  const openRevokeModal = (s: Student) => {
    setSelectedStudent(s)
    setModalType('revoke')
  }

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return

    const updated = {
      ...selectedStudent,
      status: 'completed' as const,
      certificateId: certId,
      certificateIssueDate: issueDate
    }

    setStudents(students.map(st => st.id === selectedStudent.id ? updated : st))
    setModalType(null)
    setSelectedStudent(null)
  }

  const handleRevoke = () => {
    if (!selectedStudent) return
    const updated = { ...selectedStudent }
    delete updated.certificateId
    delete updated.certificateIssueDate

    setStudents(students.map(st => st.id === selectedStudent.id ? updated : st))
    setModalType(null)
    setSelectedStudent(null)
  }

  const issuedCount = eligibleStudents.filter(s => s.certificateId).length
  const pendingCount = eligibleStudents.length - issuedCount

  return (
    <div className="p-4 sm:p-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Certificate Management</h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Issue, verify, and manage student certificates</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center flex-shrink-0 text-violet-600 dark:text-violet-400">
            <Medal size={20} weight="fill" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{eligibleStudents.length}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase mt-1">Eligible Students</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/40 flex items-center justify-center flex-shrink-0 text-green-600 dark:text-green-400">
            <Certificate size={20} weight="fill" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{issuedCount}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase mt-1">Certificates Issued</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
            <Clock size={20} weight="fill" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{pendingCount}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase mt-1">Pending Issuance</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <MagnifyingGlass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student, course, or Cert ID…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl">
            <FunnelSimple size={15} className="text-slate-400" />
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)} 
              className="py-2.5 bg-transparent text-sm text-slate-700 dark:text-neutral-300 outline-none w-32"
            >
              <option value="All">All Status</option>
              <option value="Issued">Issued</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Course</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Attendance</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Certificate Details</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">No records found</td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-300 font-bold text-xs">{s.avatar}</div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-500">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">{s.courseName}</p>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500">{s.courseLevel}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold ${s.attendance && s.attendance >= 80 ? 'text-green-500' : 'text-amber-500'}`}>
                      {s.attendance || 0}%
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {s.certificateId ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                        <Check size={12} weight="bold" /> Issued
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        <Clock size={12} weight="bold" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {s.certificateId ? (
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded w-fit mb-1">{s.certificateId}</p>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-500">Issued: {new Date(s.certificateIssueDate!).toLocaleDateString()}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-neutral-600 italic">Not generated</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!s.certificateId ? (
                        <button 
                          onClick={() => openIssueModal(s)} 
                          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Certificate size={14} weight="fill" /> Issue
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => openViewModal(s)} 
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-colors"
                            title="Preview Certificate"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => openRevokeModal(s)} 
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-red-100 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-colors"
                            title="Revoke Certificate"
                          >
                            <Trash size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ISSUE MODAL */}
      <AnimatePresence>
        {modalType === 'issue' && selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-md border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
              <form onSubmit={handleIssue}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Certificate size={20} className="text-violet-600" weight="fill" /> Issue Certificate
                  </h3>
                  <button type="button" onClick={() => setModalType(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
                </div>
                
                <div className="p-6">
                  <div className="bg-slate-50 dark:bg-neutral-800/50 p-4 rounded-xl mb-5">
                    <p className="text-xs text-slate-500 dark:text-neutral-400 uppercase font-bold mb-1">Recipient</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{selectedStudent.name}</p>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 mt-1">{selectedStudent.courseName}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Certificate ID</label>
                      <input 
                        required
                        value={certId}
                        onChange={e => setCertId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Auto-generated unique ID. You can modify it if needed.</p>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Issue Date</label>
                      <input 
                        required
                        type="date"
                        value={issueDate}
                        onChange={e => setIssueDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-slate-100 dark:border-neutral-800">
                  <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors">Generate Certificate</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW MODAL (Mini Preview) */}
      <AnimatePresence>
        {modalType === 'view' && selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-xl border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Certificate Preview</h3>
                <button onClick={() => setModalType(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-neutral-950 flex justify-center">
                {/* Miniature Certificate Representation */}
                <div className="w-full aspect-[4/3] bg-white p-6 border-[6px] border-[#1e1b4b] relative shadow-lg flex flex-col items-center justify-center text-center">
                  <div className="absolute inset-[10px] border border-[#c4b5fd] pointer-events-none"></div>
                  <Certificate size={32} className="text-violet-600 mb-2" weight="fill" />
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Certificate of Completion</h4>
                  <p className="text-[#1e1b4b] font-serif italic text-2xl font-bold mb-3 border-b border-slate-200 px-4">{selectedStudent.name}</p>
                  <p className="text-[10px] text-slate-500 mb-2">has successfully completed</p>
                  <p className="text-xs font-bold text-[#1e1b4b] mb-4">{selectedStudent.courseName}</p>
                  
                  <div className="flex justify-between w-full px-8 text-[8px] text-slate-400 font-bold mt-auto">
                    <p>Date: {new Date(selectedStudent.certificateIssueDate!).toLocaleDateString()}</p>
                    <p>ID: {selectedStudent.certificateId}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
                <a 
                  href={`/certificate/${selectedStudent.certificateId}`} 
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  View Public Page
                </a>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <FilePdf size={14} weight="fill" /> PDF
                  </button>
                  <button className="px-4 py-2 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <ImageIcon size={14} weight="fill" /> JPG
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVOKE CONFIRM */}
      <AnimatePresence>
        {modalType === 'revoke' && selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
                <Trash size={22} className="text-red-500" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-1">Revoke Certificate?</h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400 mb-5">This will delete the certificate <span className="font-mono text-slate-900 dark:text-white">{selectedStudent.certificateId}</span>. The student will no longer be able to view or download it.</p>
              <div className="flex gap-3">
                <button onClick={() => setModalType(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                <button onClick={handleRevoke} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">Revoke</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}