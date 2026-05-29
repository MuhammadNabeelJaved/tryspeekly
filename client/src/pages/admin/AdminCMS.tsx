import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PencilSimple, FloppyDisk, CaretRight, Plus, Trash, List, Wallet, ArrowCounterClockwise, CheckCircle, CaretDown
} from '@phosphor-icons/react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AdminStore } from '../AdminPage'
import { INITIAL_CMS_PAGES } from './adminData'
import type { CMSPage, CMSSection, CMSField, CMSRepeaterField, CMSListField, CMSTextField } from './adminData'
import AdminPaymentsSetup from './AdminPaymentsSetup'

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function isTextField(f: CMSField): f is CMSTextField {
  return ['text', 'textarea', 'url', 'number', 'color'].includes(f.type)
}
function isListField(f: CMSField): f is CMSListField {
  return f.type === 'list'
}
function isRepeaterField(f: CMSField): f is CMSRepeaterField {
  return f.type === 'repeater'
}

// ─── FIELD RENDERERS ─────────────────────────────────────────────────────────

function TextFieldEditor({ field, onChange }: { field: CMSTextField; onChange: (value: string) => void }) {
  const { register, reset } = useForm({ defaultValues: { value: field.value } })
  
  useEffect(() => {
    reset({ value: field.value })
  }, [field.value, reset])

  const base = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors'
  
  if (field.type === 'textarea') {
    return <textarea {...register('value', { onChange: e => onChange(e.target.value) })} rows={3} className={`${base} resize-none leading-relaxed`} />
  }
  if (field.type === 'color') {
    return (
      <div className="flex items-center gap-3">
        <input type="color" {...register('value', { onChange: e => onChange(e.target.value) })} className="w-10 h-10 rounded-lg border border-slate-200 dark:border-neutral-700 cursor-pointer bg-transparent" />
        <input type="text" {...register('value', { onChange: e => onChange(e.target.value) })} className={`${base} flex-1`} />
      </div>
    )
  }
  return <input type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'} {...register('value', { onChange: e => onChange(e.target.value) })} className={base} />
}

function ListFieldEditor({ field, onChange }: { field: CMSListField; onChange: (items: string[]) => void }) {
  const { register, reset } = useForm({ defaultValues: { items: field.items } })

  useEffect(() => {
    reset({ items: field.items })
  }, [field.items, reset])

  return (
    <div className="space-y-2">
      {field.items.map((_, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 dark:text-neutral-700 w-5 flex-shrink-0">{idx + 1}.</span>
          <input
            {...register(`items.${idx}`, { 
              onChange: e => { const n = [...field.items]; n[idx] = e.target.value; onChange(n) }
            })}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => onChange(field.items.filter((_, i) => i !== idx))}
            className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950/50 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Trash size={13} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...field.items, ''])}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 text-slate-400 dark:text-neutral-500 hover:border-violet-400 hover:text-violet-500 dark:hover:border-violet-600 dark:hover:text-violet-400 text-xs font-semibold transition-colors w-full"
      >
        <Plus size={13} />Add Item
      </button>
    </div>
  )
}

function RepeaterFieldEditor({ field, onChange }: { field: CMSRepeaterField; onChange: (rows: Record<string, string>[]) => void }) {
  const [expandedRow, setExpandedRow] = useState<number | null>(0)
  const { register, reset } = useForm({ defaultValues: { rows: field.rows } })

  useEffect(() => {
    reset({ rows: field.rows })
  }, [field.rows, reset])

  function updateRow(idx: number, key: string, value: string) {
    const updated = field.rows.map((row, i) => i === idx ? { ...row, [key]: value } : row)
    onChange(updated)
  }

  function addRow() {
    const emptyRow = Object.fromEntries(field.rowSchema.map(s => [s.key, '']))
    onChange([...field.rows, emptyRow])
    setExpandedRow(field.rows.length)
  }

  function removeRow(idx: number) {
    onChange(field.rows.filter((_, i) => i !== idx))
    setExpandedRow(null)
  }

  function moveRow(idx: number, dir: -1 | 1) {
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= field.rows.length) return
    const updated = [...field.rows]
    ;[updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]]
    onChange(updated)
    setExpandedRow(swapIdx)
  }

  const primaryKey = field.rowSchema[0]?.key ?? 'title'

  return (
    <div className="space-y-2">
      {field.rows.map((row, idx) => {
        const isOpen = expandedRow === idx
        const label = row[primaryKey] || `Item ${idx + 1}`
        return (
          <div key={idx} className="border border-slate-200 dark:border-neutral-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-neutral-800/40">
            {/* Row header */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button type="button" onClick={() => setExpandedRow(isOpen ? null : idx)}
                className="flex-1 flex items-center gap-2 text-left min-w-0"
              >
                {isOpen
                  ? <CaretDown size={13} className="text-violet-500 flex-shrink-0" />
                  : <CaretRight size={13} className="text-slate-400 flex-shrink-0" />
                }
                <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300 truncate">{label}</span>
              </button>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={() => moveRow(idx, -1)} disabled={idx === 0} className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors text-[10px] font-bold">↑</button>
                <button type="button" onClick={() => moveRow(idx, 1)} disabled={idx === field.rows.length - 1} className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors text-[10px] font-bold">↓</button>
                <button type="button" onClick={() => removeRow(idx)} className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors">
                  <Trash size={11} />
                </button>
              </div>
            </div>

            {/* Row fields */}
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="px-3 pb-3 space-y-3 border-t border-slate-200 dark:border-neutral-700 pt-3">
                    {field.rowSchema.map(schema => (
                      <div key={schema.key}>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">{schema.label}</label>
                        {schema.type === 'textarea'
                          ? <textarea {...register(`rows.${idx}.${schema.key}`, { onChange: e => updateRow(idx, schema.key, e.target.value) })} rows={2}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors resize-none"
                            />
                          : <input type={schema.type === 'number' ? 'number' : 'text'} {...register(`rows.${idx}.${schema.key}`, { onChange: e => updateRow(idx, schema.key, e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
                            />
                        }
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      <button type="button" onClick={addRow}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-neutral-700 text-slate-400 dark:text-neutral-500 hover:border-violet-400 hover:text-violet-500 dark:hover:border-violet-600 dark:hover:text-violet-400 text-xs font-bold transition-colors"
      >
        <Plus size={13} />Add Row
      </button>
    </div>
  )
}

// ─── SECTION EDITOR ───────────────────────────────────────────────────────────

function SectionEditor({
  section, onFieldChange,
}: {
  section: CMSSection
  onFieldChange: (fieldKey: string, update: Partial<CMSField>) => void
}) {
  return (
    <div className="space-y-6">
      {section.fields.map(field => (
        <div key={field.key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-800 dark:text-neutral-200">{field.label}</label>
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              field.type === 'repeater' ? 'bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
              : field.type === 'list' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
              : field.type === 'textarea' ? 'bg-slate-100 dark:bg-neutral-800 text-slate-500'
              : 'bg-slate-50 dark:bg-neutral-800/60 text-slate-400'
            }`}>{field.type}</span>
          </div>

          {isTextField(field) && (
            <TextFieldEditor field={field} onChange={v => onFieldChange(field.key, { value: v } as Partial<CMSTextField>)} />
          )}
          {isListField(field) && (
            <ListFieldEditor field={field} onChange={items => onFieldChange(field.key, { items } as Partial<CMSListField>)} />
          )}
          {isRepeaterField(field) && (
            <RepeaterFieldEditor field={field} onChange={rows => onFieldChange(field.key, { rows } as Partial<CMSRepeaterField>)} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── MAIN CMS COMPONENT ───────────────────────────────────────────────────────

interface AdminCMSProps {
  store: AdminStore
  basePath?: string  // defaults to '/admin/cms'
}

export default function AdminCMS({ store, basePath = '/admin/cms' }: AdminCMSProps) {
  const { cmsPages, setCmsPages } = store

  const location = useLocation()
  const navigate = useNavigate()

  // Determine sub-view based on URL
  const isPaymentsSetup = location.pathname.includes('/payments-setup')

  const [activePageId, setActivePageId] = useState(cmsPages[0]?.id ?? '')
  const [activeSectionId, setActiveSectionId] = useState(cmsPages[0]?.sections[0]?.id ?? '')
  const [saved, setSaved] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([cmsPages[0]?.sections[0]?.id ?? '']))

  const activePage = cmsPages.find(p => p.id === activePageId)
  const activeSection = activePage?.sections.find(s => s.id === activeSectionId)

  function updateField(pageId: string, sectionId: string, fieldKey: string, update: Partial<CMSField>) {
    setCmsPages((cmsPages as CMSPage[]).map(page => {
      if (page.id !== pageId) return page
      return {
        ...page,
        sections: page.sections.map(section => {
          if (section.id !== sectionId) return section
          return {
            ...section,
            fields: section.fields.map(field =>
              field.key === fieldKey ? { ...field, ...update } as CMSField : field
            ),
          }
        }),
      }
    }))
  }

  function resetPage() {
    const def = INITIAL_CMS_PAGES.find(p => p.id === activePageId)
    if (!def) return
    setCmsPages((cmsPages as CMSPage[]).map(p => p.id === activePageId ? { ...def } : p))
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function toggleSection(sectionId: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId)
      return next
    })
  }

  function pickPage(pageId: string) {
    navigate(basePath)
    const page = cmsPages.find(p => p.id === pageId)
    setActivePageId(pageId)
    setActiveSectionId(page?.sections[0]?.id ?? '')
    setExpandedSections(new Set([page?.sections[0]?.id ?? '']))
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-full">

      {/* ── MOBILE OVERLAY ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── LEFT SIDEBAR: pages + sections ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-neutral-900 border-r border-slate-100 dark:border-neutral-800
        flex flex-col overflow-hidden transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-neutral-800 flex-shrink-0">
          <span className="text-xs font-black text-slate-600 dark:text-neutral-400 uppercase tracking-widest">Global Settings</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors">✕</button>
        </div>
        
        <div className="border-b border-slate-100 dark:border-neutral-800 pb-2">
          <button
            onClick={() => { navigate(`${basePath}/payments-setup`); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors ${
              isPaymentsSetup
                ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400'
                : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800'
            }`}
          >
            <Wallet size={16} weight={isPaymentsSetup ? 'fill' : 'regular'} />
            Payments Page Setup
          </button>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-neutral-800 flex-shrink-0 mt-2">
          <span className="text-xs font-black text-slate-600 dark:text-neutral-400 uppercase tracking-widest">All Pages</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(cmsPages as CMSPage[]).map(page => {
            const isPageActive = !isPaymentsSetup && activePageId === page.id
            return (
              <div key={page.id}>
                {/* Page header */}
                <button
                  onClick={() => pickPage(page.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors border-b border-slate-50 dark:border-neutral-800 ${
                    isPageActive
                      ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400'
                      : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>{page.title}</span>
                  <span className="text-[10px] text-slate-300 dark:text-neutral-700 font-normal">{page.slug}</span>
                </button>

                {/* Sections list under active page */}
                {isPageActive && page.sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => { setActiveSectionId(section.id); setSidebarOpen(false) }}
                    className={`w-full text-left pl-8 pr-4 py-2 text-xs font-semibold transition-colors border-b border-slate-50 dark:border-neutral-800 ${
                      activeSectionId === section.id
                        ? 'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400'
                        : 'text-slate-500 dark:text-neutral-500 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 rounded-lg bg-slate-50 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors">
              <List size={16} />
            </button>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {isPaymentsSetup ? 'Payments Page Setup' : (activePage?.title ?? 'CMS Editor')}
                {!isPaymentsSetup && activeSection && <span className="text-slate-400 dark:text-neutral-600 font-medium"> / {activeSection.label}</span>}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-neutral-600">
                {isPaymentsSetup ? '/payments' : activePage?.slug}
              </p>
            </div>
          </div>

          {!isPaymentsSetup && (
            <div className="flex items-center gap-2">
              <button onClick={resetPage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <ArrowCounterClockwise size={12} />Reset Page
              </button>
              <button onClick={handleSave}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  saved
                    ? 'bg-emerald-500 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]'
                }`}
              >
                {saved ? <><CheckCircle size={13} weight="fill" />Saved!</> : <><FloppyDisk size={13} weight="fill" />Save Changes</>}
              </button>
            </div>
          )}
        </div>

        {/* CMS Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-neutral-950">
          {isPaymentsSetup ? (
            <AdminPaymentsSetup />
          ) : (
            <div className="p-4 sm:p-6 space-y-3">
              {activePage ? activePage.sections.map(section => {
                const isExpanded = expandedSections.has(section.id)
                const isActive = activeSectionId === section.id
                return (
                  <div key={section.id}
                    className={`rounded-2xl border-2 overflow-hidden bg-white dark:bg-neutral-900 transition-all ${
                      isActive
                        ? 'border-violet-400 dark:border-violet-600 shadow-[0_0_0_3px_rgba(124,58,237,0.1)]'
                        : 'border-slate-200 dark:border-neutral-800'
                    }`}
                  >
                {/* Section header */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveSectionId(section.id)
                    toggleSection(section.id)
                  }}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PencilSimple size={14} weight="fill" className={isActive ? 'text-violet-500' : 'text-slate-300 dark:text-neutral-700'} />
                    <span className={`text-sm font-bold ${isActive ? 'text-violet-700 dark:text-violet-400' : 'text-slate-700 dark:text-neutral-300'}`}>{section.label}</span>
                    <span className="text-[10px] text-slate-300 dark:text-neutral-700 font-medium">{section.fields.length} field{section.fields.length !== 1 ? 's' : ''}</span>
                  </div>
                  <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <CaretDown size={14} className="text-slate-400 dark:text-neutral-600" />
                  </motion.span>
                </button>

                {/* Section fields */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <div className="px-5 pb-5 pt-4 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800">
                        <SectionEditor
                          section={section}
                          onFieldChange={(fieldKey, update) => updateField(activePageId, section.id, fieldKey, update)}
                        />

                        {/* Per-section save */}
                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-neutral-800 flex justify-end">
                          <button onClick={handleSave}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                              saved
                                ? 'bg-emerald-500 text-white'
                                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]'
                            }`}
                          >
                            {saved ? <><CheckCircle size={13} weight="fill" />Saved!</> : <><FloppyDisk size={13} weight="fill" />Save Section</>}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
              }) : (
                <div className="text-center py-16 text-slate-400 dark:text-neutral-600">
                  <PencilSimple size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a page to edit its content</p>
                </div>
              )}

              {/* Global save button at bottom */}
              {activePage && (
                <div className="pt-2 flex justify-center">
                  <button onClick={handleSave}
                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
                      saved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.45)]'
                    }`}
                  >
                    {saved
                      ? <><CheckCircle size={16} weight="fill" />All Changes Saved!</>
                      : <><FloppyDisk size={16} weight="fill" />Save All Changes for {activePage.title}</>
                    }
                  </button>
                </div>
              )}

              <p className="text-center text-[11px] text-slate-300 dark:text-neutral-700 pb-2">
                CMS data is persisted to localStorage. Wire to your API/backend to update live pages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
