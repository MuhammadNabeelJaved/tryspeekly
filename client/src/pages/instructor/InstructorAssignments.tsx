import { useState, useEffect } from 'react'
import { assignmentsService } from '@/services/assignments.service'
import { coursesService } from '@/services/courses.service'
import type { Assignment, Submission, Course } from '@/types/api'
import toast from 'react-hot-toast'
import { CaretDown, CaretUp, CheckCircle, CircleNotch, Plus, X, Trash } from '@phosphor-icons/react'

interface GradingState {
  grade: string
  feedback: string
}

interface CreateForm {
  courseId: string
  title: string
  description: string
  dueDate: string
}

export default function InstructorAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [grading, setGrading] = useState<Record<string, GradingState>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<CreateForm>({ courseId: '', title: '', description: '', dueDate: '' })

  useEffect(() => {
    async function load() {
      try {
        const [aRes, cRes] = await Promise.all([
          assignmentsService.getInstructorAssignments(),
          coursesService.getTeacherCourses(),
        ])
        if (aRes.success) setAssignments(aRes.data)
        if (cRes.success) setCourses(cRes.data)
      } catch {
        toast.error('Failed to load assignments')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.courseId || !form.title || !form.description || !form.dueDate) {
      toast.error('All fields are required')
      return
    }
    setCreating(true)
    try {
      const res = await assignmentsService.createAssignment(form)
      if (res.success) {
        toast.success('Assignment created')
        setAssignments(prev => [res.data, ...prev])
        setShowCreate(false)
        setForm({ courseId: '', title: '', description: '', dueDate: '' })
      }
    } catch {
      toast.error('Failed to create assignment')
    } finally {
      setCreating(false)
    }
  }

  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await assignmentsService.deleteAssignment(id)
      toast.success('Assignment deleted')
      setAssignments(prev => prev.filter(a => a._id !== id))
    } catch {
      toast.error('Failed to delete assignment')
    } finally {
      setDeleting(null)
    }
  }

  const handleGrade = async (assignment: Assignment, submission: Submission) => {
    const key = submission._id
    const data = grading[key]
    if (!data?.grade) { toast.error('Enter a grade between 0 and 100'); return }
    const gradeNum = Number(data.grade)
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      toast.error('Grade must be 0–100'); return
    }
    setSubmitting(key)
    try {
      await assignmentsService.gradeSubmission(assignment._id, submission._id, {
        grade: gradeNum,
        feedback: data.feedback,
      })
      toast.success('Graded successfully')
      setAssignments(prev => prev.map(a => {
        if (a._id !== assignment._id) return a
        return {
          ...a,
          submissions: a.submissions.map(s =>
            s._id === submission._id
              ? { ...s, status: 'graded' as const, grade: gradeNum, feedback: data.feedback }
              : s
          ),
        }
      }))
      setGrading(prev => { const next = { ...prev }; delete next[key]; return next })
    } catch {
      toast.error('Failed to grade submission')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Assignments</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Create assignments and grade student submissions.</p>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-colors"
        >
          {showCreate ? <X size={16} weight="bold" /> : <Plus size={16} weight="bold" />}
          {showCreate ? 'Cancel' : 'New Assignment'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Create Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Course</label>
              <select
                value={form.courseId}
                onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
              >
                <option value="">Select course…</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              placeholder="Assignment title"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Description / Instructions</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
              rows={3}
              placeholder="Describe the assignment…"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            {creating ? <><CircleNotch size={14} className="animate-spin" /> Creating…</> : 'Create Assignment'}
          </button>
        </form>
      )}

      {assignments.length === 0 ? (
        <div className="py-20 text-center bg-slate-50 dark:bg-neutral-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800">
          <p className="text-slate-500 dark:text-neutral-400">No assignments yet. Click "New Assignment" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(assignment => {
            const submitted = assignment.submissions.filter(s => s.status === 'submitted').length
            const graded = assignment.submissions.filter(s => s.status === 'graded').length
            const total = assignment.submissions.length
            const isExpanded = expanded === assignment._id

            return (
              <div key={assignment._id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="flex items-center">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : assignment._id)}
                    className="flex-1 flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full">
                          {assignment.course?.title ?? 'Course'}
                        </span>
                        <span className="text-[10px] text-slate-400">Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{assignment.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{submitted} pending</p>
                        <p className="text-[10px] text-slate-400">{graded}/{total} graded</p>
                      </div>
                      {isExpanded ? <CaretUp size={16} className="text-slate-400" /> : <CaretDown size={16} className="text-slate-400" />}
                    </div>
                  </button>
                  <button
                    onClick={() => handleDelete(assignment._id)}
                    disabled={deleting === assignment._id}
                    className="p-3 mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 rounded-xl transition-colors flex-shrink-0"
                    title="Delete assignment"
                  >
                    {deleting === assignment._id
                      ? <CircleNotch size={16} className="animate-spin" />
                      : <Trash size={16} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-neutral-800 divide-y divide-slate-50 dark:divide-neutral-800/50">
                    {total === 0 ? (
                      <p className="p-5 text-sm text-slate-400 text-center">No submissions yet.</p>
                    ) : (
                      assignment.submissions.map(submission => {
                        const key = submission._id
                        const g = grading[key] ?? { grade: '', feedback: '' }
                        return (
                          <div key={key} className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">
                                  {submission.student?.name ?? 'Student'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                                </p>
                                {submission.fileUrl && (
                                  <a
                                    href={submission.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline mt-1 inline-block"
                                  >
                                    View file ↗
                                  </a>
                                )}
                              </div>
                              {submission.status === 'graded' ? (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <CheckCircle size={18} weight="fill" />
                                  <span className="text-sm font-bold">{submission.grade}/100</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end gap-2 min-w-[180px]">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="Grade (0–100)"
                                    value={g.grade}
                                    onChange={e => setGrading(prev => ({ ...prev, [key]: { ...g, grade: e.target.value } }))}
                                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
                                  />
                                  <textarea
                                    placeholder="Feedback (optional)"
                                    rows={2}
                                    value={g.feedback}
                                    onChange={e => setGrading(prev => ({ ...prev, [key]: { ...g, feedback: e.target.value } }))}
                                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors resize-none"
                                  />
                                  <button
                                    onClick={() => handleGrade(assignment, submission)}
                                    disabled={submitting === key}
                                    className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors"
                                  >
                                    {submitting === key
                                      ? <><CircleNotch size={14} className="animate-spin" /> Saving...</>
                                      : 'Save Grade'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
