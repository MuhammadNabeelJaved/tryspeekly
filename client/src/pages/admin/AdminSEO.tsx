import React, { useState, useEffect, useCallback } from 'react'
import {
  MagnifyingGlass, Globe, Robot, ShareNetwork, TwitterLogo, Code,
  MapTrifold, GearSix, Plus, Trash, CheckCircle, Warning, XCircle,
  FloppyDisk, ArrowCounterClockwise, PencilSimple, Link, Tag,
  ChartBar, Funnel,
} from '@phosphor-icons/react'
import { seoService, type SeoPage } from '../../services/seo.service'
import ConfirmModal from '@/components/ConfirmModal'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'basic' | 'social' | 'schema' | 'sitemap' | 'global'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function seoScore(p: SeoPage): number {
  let score = 0
  if (p.metaTitle && p.metaTitle.length >= 10) score += 20
  if (p.metaDescription && p.metaDescription.length >= 50) score += 20
  if (p.metaKeywords && p.metaKeywords.length > 0) score += 10
  if (p.og?.title) score += 10
  if (p.og?.description) score += 10
  if (p.og?.image) score += 10
  if (p.twitter?.title) score += 10
  if (p.canonicalUrl) score += 5
  if (p.schemaMarkup) score += 5
  return score
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
    : score >= 50 ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400'
    : 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
  const Icon = score >= 80 ? CheckCircle : score >= 50 ? Warning : XCircle
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>
      <Icon size={10} weight="fill" />{score}%
    </span>
  )
}

function CharCount({ value, min, max }: { value: string; min: number; max: number }) {
  const len = value.length
  const color = len === 0 ? 'text-slate-400' : len < min ? 'text-amber-500' : len <= max ? 'text-emerald-500' : 'text-red-500'
  return <span className={`text-[10px] font-mono ${color}`}>{len}/{max}</span>
}

// ─── Google Preview ───────────────────────────────────────────────────────────
function GooglePreview({ title, description, url }: { title: string; description: string; url: string }) {
  const displayTitle = title || 'Page Title'
  const displayDesc = description || 'Meta description will appear here. Keep it between 150-160 characters for best results.'
  const displayUrl = url || 'https://yourwebsite.com/page'
  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-4 font-sans">
      <p className="text-xs text-slate-500 dark:text-neutral-400 mb-2 font-semibold uppercase tracking-wider">Google Search Preview</p>
      <div className="max-w-lg">
        <p className="text-[13px] text-slate-500 dark:text-neutral-500 truncate">{displayUrl}</p>
        <p className="text-[18px] text-blue-700 dark:text-blue-400 hover:underline cursor-pointer leading-tight mt-0.5 truncate">{displayTitle}</p>
        <p className="text-[13px] text-slate-600 dark:text-neutral-400 leading-snug mt-1 line-clamp-2">{displayDesc}</p>
      </div>
    </div>
  )
}

// ─── Social Preview ───────────────────────────────────────────────────────────
function SocialPreview({ title, description, image, siteName, type }: { title: string; description: string; image: string; siteName: string; type: 'og' | 'twitter' }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl overflow-hidden max-w-sm">
      <p className="text-xs text-slate-500 dark:text-neutral-400 p-3 pb-0 font-semibold uppercase tracking-wider">{type === 'og' ? 'Facebook / LinkedIn Preview' : 'Twitter / X Preview'}</p>
      {image ? (
        <img src={image} alt={title} className="w-full h-36 object-cover mt-2" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      ) : (
        <div className="w-full h-36 bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mt-2">
          <Globe size={32} className="text-slate-300 dark:text-neutral-600" />
        </div>
      )}
      <div className="p-3 border-t border-slate-100 dark:border-neutral-800">
        {siteName && <p className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-wider">{siteName}</p>}
        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{title || 'Page Title'}</p>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{description || 'Description'}</p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminSEO() {
  const [pages, setPages] = useState<SeoPage[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>('home')
  const [form, setForm] = useState<SeoPage | null>(null)
  const [original, setOriginal] = useState<SeoPage | null>(null)
  const [tab, setTab] = useState<Tab>('basic')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [showAddPage, setShowAddPage] = useState(false)
  const [newPage, setNewPage] = useState({ pageSlug: '', pageName: '', pageUrl: '' })
  const [schemaError, setSchemaError] = useState('')
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null)

  // Load all pages list
  const loadPages = useCallback(async () => {
    try {
      const data = await seoService.getAll()
      setPages(data)
    } catch {}
  }, [])

  useEffect(() => { loadPages() }, [loadPages])

  // Load selected page
  useEffect(() => {
    setLoading(true)
    seoService.getPage(selectedSlug)
      .then(data => {
        setForm(data)
        setOriginal(data)
        setKeywordInput('')
        setTab(selectedSlug === '__global__' ? 'global' : 'basic')
        setSchemaError('')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedSlug])

  const isDirty = form && original && JSON.stringify(form) !== JSON.stringify(original)

  const set = (path: string, value: unknown) => {
    setForm(prev => {
      if (!prev) return prev
      const updated = { ...prev }
      const keys = path.split('.')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cur: any = updated
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] }
        cur = cur[keys[i]]
      }
      cur[keys[keys.length - 1]] = value
      return updated
    })
  }

  const save = async () => {
    if (!form) return
    if (form.schemaMarkup?.trim()) {
      try { JSON.parse(form.schemaMarkup) }
      catch { setSchemaError('Invalid JSON — please fix before saving'); return }
    }
    setSaving(true)
    try {
      const updated = await seoService.upsert(selectedSlug, form)
      setForm(updated)
      setOriginal(updated)
      setPages(prev => prev.map(p => p.pageSlug === selectedSlug ? { ...p, ...updated } : p))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
    setSaving(false)
  }

  const reset = () => { setForm(original); setSchemaError('') }

  const addKeyword = () => {
    const kw = keywordInput.trim()
    if (!kw || !form) return
    if (!(form.metaKeywords || []).includes(kw)) {
      set('metaKeywords', [...(form.metaKeywords || []), kw])
    }
    setKeywordInput('')
  }

  const removeKeyword = (kw: string) => {
    set('metaKeywords', (form?.metaKeywords || []).filter(k => k !== kw))
  }

  const handleAddPage = async () => {
    if (!newPage.pageSlug || !newPage.pageName) return
    try {
      const created = await seoService.createPage(newPage)
      setPages(prev => [...prev, created])
      setSelectedSlug(created.pageSlug)
      setShowAddPage(false)
      setNewPage({ pageSlug: '', pageName: '', pageUrl: '' })
    } catch {}
  }

  const handleDeletePage = (slug: string) => {
    setConfirmSlug(slug)
  }

  const handleDeletePageConfirmed = async () => {
    if (!confirmSlug) return
    const slug = confirmSlug
    setConfirmSlug(null)
    try {
      await seoService.deletePage(slug)
      setPages(prev => prev.filter(p => p.pageSlug !== slug))
      if (selectedSlug === slug) setSelectedSlug('home')
    } catch {}
  }

  const filteredPages = pages.filter(p =>
    p.pageSlug !== '__global__' &&
    (p.pageName.toLowerCase().includes(search.toLowerCase()) ||
     p.pageSlug.toLowerCase().includes(search.toLowerCase()))
  )

  const score = form && form.pageSlug !== '__global__' ? seoScore(form) : null

  // ─── Tabs config ──────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
    { id: 'basic',   label: 'Basic SEO',  icon: <Globe size={14} /> },
    { id: 'social',  label: 'Social',     icon: <ShareNetwork size={14} />, hidden: selectedSlug === '__global__' },
    { id: 'schema',  label: 'Schema',     icon: <Code size={14} />, hidden: selectedSlug === '__global__' },
    { id: 'sitemap', label: 'Sitemap',    icon: <MapTrifold size={14} />, hidden: selectedSlug === '__global__' },
    { id: 'global',  label: 'Global',     icon: <GearSix size={14} />, hidden: selectedSlug !== '__global__' },
  ]

  return (
    <div className="flex h-full gap-4">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3">

        {/* Search + Add */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search pages…"
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500"
            />
          </div>
          <button onClick={() => setShowAddPage(true)} className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center flex-shrink-0 transition-colors">
            <Plus size={14} weight="bold" />
          </button>
        </div>

        {/* Global settings entry */}
        <button
          onClick={() => setSelectedSlug('__global__')}
          className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${selectedSlug === '__global__' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 hover:border-violet-300 dark:hover:border-violet-700'}`}
        >
          <div className="flex items-center gap-2">
            <GearSix size={14} weight="bold" />
            <span className="text-xs font-bold">Global Settings</span>
          </div>
          <p className={`text-[10px] mt-0.5 ${selectedSlug === '__global__' ? 'text-violet-200' : 'text-slate-400 dark:text-neutral-500'}`}>Analytics, robots.txt, defaults</p>
        </button>

        <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider px-1">Pages</p>

        {/* Page list */}
        <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-320px)]">
          {filteredPages.map(p => {
            const s = seoScore(p)
            const isSelected = selectedSlug === p.pageSlug
            return (
              <div key={p.pageSlug} className={`group flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700' : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 hover:border-violet-300 dark:hover:border-violet-700'}`}
                onClick={() => setSelectedSlug(p.pageSlug)}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-800 dark:text-white'}`}>{p.pageName}</p>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 truncate">{p.pageUrl}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <ScoreBadge score={s} />
                  <button
                    onClick={e => { e.stopPropagation(); handleDeletePage(p.pageSlug) }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash size={10} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Main Editor ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 gap-4">

        {loading || !form ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{form.pageName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400 dark:text-neutral-500 font-mono">{form.pageUrl}</span>
                  {score !== null && (
                    <>
                      <span className="text-slate-300 dark:text-neutral-600">·</span>
                      <span className="text-xs text-slate-500 dark:text-neutral-400">SEO Score</span>
                      <ScoreBadge score={score} />
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {isDirty && (
                  <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors">
                    <ArrowCounterClockwise size={13} />Reset
                  </button>
                )}
                <button
                  onClick={save}
                  disabled={saving || !isDirty}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm shadow-violet-600/20"
                >
                  {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : saved ? <CheckCircle size={13} weight="fill" />
                    : <FloppyDisk size={13} />}
                  {saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
              {tabs.filter(t => !t.hidden).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === t.id ? 'bg-white dark:bg-neutral-900 text-violet-700 dark:text-violet-300 shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'}`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto space-y-5 pb-6">

              {/* ── BASIC SEO ─────────────────────────────────────────────── */}
              {tab === 'basic' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="space-y-4">

                    {/* Meta Title */}
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><PencilSimple size={14} />Meta Title</label>
                        <CharCount value={form.metaTitle || ''} min={50} max={60} />
                      </div>
                      <input
                        value={form.metaTitle || ''}
                        onChange={e => set('metaTitle', e.target.value)}
                        placeholder="Page title for search engines (50-60 chars)"
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                      />
                      {form.global?.titleSuffix && (
                        <p className="text-[10px] text-slate-400 mt-1.5">Preview: <span className="font-mono text-violet-600">{form.metaTitle}{form.global.titleSuffix}</span></p>
                      )}
                    </div>

                    {/* Meta Description */}
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-slate-800 dark:text-white">Meta Description</label>
                        <CharCount value={form.metaDescription || ''} min={150} max={160} />
                      </div>
                      <textarea
                        rows={3}
                        value={form.metaDescription || ''}
                        onChange={e => set('metaDescription', e.target.value)}
                        placeholder="Describe the page content (150-160 chars)"
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white resize-none"
                      />
                    </div>

                    {/* Keywords */}
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                      <label className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-3"><Tag size={14} />Meta Keywords</label>
                      <div className="flex gap-2 mb-3">
                        <input
                          value={keywordInput}
                          onChange={e => setKeywordInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                          placeholder="Add keyword and press Enter"
                          className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                        />
                        <button onClick={addKeyword} className="px-3 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(form.metaKeywords || []).map(kw => (
                          <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-medium rounded-full border border-violet-200 dark:border-violet-800">
                            {kw}
                            <button onClick={() => removeKeyword(kw)} className="hover:text-red-500 transition-colors"><XCircle size={11} weight="fill" /></button>
                          </span>
                        ))}
                        {(form.metaKeywords || []).length === 0 && <p className="text-xs text-slate-400">No keywords added yet</p>}
                      </div>
                    </div>

                    {/* Canonical URL */}
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                      <label className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-3"><Link size={14} />Canonical URL</label>
                      <input
                        value={form.canonicalUrl || ''}
                        onChange={e => set('canonicalUrl', e.target.value)}
                        placeholder="https://yourwebsite.com/page (leave blank for default)"
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Robots */}
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                      <label className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-4"><Robot size={14} />Robots Directives</label>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          ['robots.index',     'Index',      'Allow search engines to index this page'],
                          ['robots.follow',    'Follow',     'Allow crawling of links on this page'],
                          ['robots.noArchive', 'No Archive', 'Prevent cached version in search results'],
                          ['robots.noSnippet', 'No Snippet', 'Prevent text snippet in search results'],
                        ] as [string, string, string][]).map(([path, label, hint]) => {
                          const keys = path.split('.')
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const val = (form as any)[keys[0]]?.[keys[1]] ?? false
                          const checked = path === 'robots.noArchive' || path === 'robots.noSnippet' ? val : val
                          return (
                            <label key={path} className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
                              <input type="checkbox" checked={checked} onChange={e => set(path, e.target.checked)}
                                className="w-3.5 h-3.5 mt-0.5 accent-violet-600 cursor-pointer" />
                              <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-neutral-200">{label}</p>
                                <p className="text-[10px] text-slate-400 dark:text-neutral-500">{hint}</p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                      <div className="mt-3 px-3 py-2 bg-slate-50 dark:bg-neutral-800 rounded-lg">
                        <p className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">
                          {'<meta name="robots" content="'}
                          {[
                            form.robots?.index !== false ? 'index' : 'noindex',
                            form.robots?.follow !== false ? 'follow' : 'nofollow',
                            form.robots?.noArchive ? 'noarchive' : '',
                            form.robots?.noSnippet ? 'nosnippet' : '',
                          ].filter(Boolean).join(', ')}
                          {'" />'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Google Preview */}
                  <div className="space-y-4">
                    <GooglePreview
                      title={form.metaTitle || ''}
                      description={form.metaDescription || ''}
                      url={form.canonicalUrl || form.pageUrl || ''}
                    />
                    {/* SEO Score Card */}
                    {score !== null && (
                      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                        <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-4"><ChartBar size={14} />SEO Score Breakdown</p>
                        <div className="space-y-2.5">
                          {[
                            ['Meta Title (10+ chars)',       !!(form.metaTitle && form.metaTitle.length >= 10),      20],
                            ['Meta Description (50+ chars)', !!(form.metaDescription && form.metaDescription.length >= 50), 20],
                            ['Keywords added',               !!(form.metaKeywords && form.metaKeywords.length > 0),  10],
                            ['OG Title',                     !!(form.og?.title),                                      10],
                            ['OG Description',               !!(form.og?.description),                                10],
                            ['OG Image',                     !!(form.og?.image),                                      10],
                            ['Twitter Title',                !!(form.twitter?.title),                                 10],
                            ['Canonical URL',                !!(form.canonicalUrl),                                    5],
                            ['Schema Markup',                !!(form.schemaMarkup),                                    5],
                          ].map(([label, done, pts]) => (
                            <div key={label as string} className="flex items-center gap-2">
                              {done ? <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" weight="fill" />
                                    : <XCircle size={13} className="text-slate-300 dark:text-neutral-600 flex-shrink-0" weight="fill" />}
                              <span className={`text-xs flex-1 ${done ? 'text-slate-700 dark:text-neutral-200' : 'text-slate-400 dark:text-neutral-500'}`}>{label as string}</span>
                              <span className="text-[10px] font-bold text-slate-400">+{pts as number}%</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-500">Total Score</span>
                            <span className="text-sm font-black text-violet-600">{score}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── SOCIAL ────────────────────────────────────────────────── */}
              {tab === 'social' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {/* Open Graph */}
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                      <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-4"><ShareNetwork size={14} />Open Graph (Facebook / LinkedIn)</p>
                      <div className="space-y-3">
                        {([
                          ['og.title',       'OG Title',       'text', 'Engaging title for social shares'],
                          ['og.description', 'OG Description', 'textarea', 'Compelling description (max 200 chars)'],
                          ['og.image',       'OG Image URL',   'text', 'Recommended: 1200×630px'],
                          ['og.imageAlt',    'Image Alt Text', 'text', 'Alt text for accessibility'],
                          ['og.url',         'OG URL',         'text', 'Canonical URL for this page'],
                          ['og.siteName',    'Site Name',      'text', 'Your website name'],
                        ] as [string, string, string, string][]).map(([path, label, type, hint]) => (
                          <div key={path}>
                            <label className="text-xs font-semibold text-slate-600 dark:text-neutral-300 block mb-1">{label}</label>
                            {type === 'textarea' ? (
                              <textarea rows={2} value={(form.og as unknown as Record<string, string>)?.[path.split('.')[1]] || ''} onChange={e => set(path, e.target.value)} placeholder={hint}
                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white resize-none" />
                            ) : (
                              <input value={(form.og as unknown as Record<string, string>)?.[path.split('.')[1]] || ''} onChange={e => set(path, e.target.value)} placeholder={hint}
                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white" />
                            )}
                          </div>
                        ))}
                        <div>
                          <label className="text-xs font-semibold text-slate-600 dark:text-neutral-300 block mb-1">OG Type</label>
                          <select value={form.og?.type || 'website'} onChange={e => set('og.type', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white">
                            {['website', 'article', 'product', 'profile'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Twitter */}
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                      <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-4"><TwitterLogo size={14} />Twitter / X Card</p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 dark:text-neutral-300 block mb-1">Card Type</label>
                          <select value={form.twitter?.card || 'summary_large_image'} onChange={e => set('twitter.card', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white">
                            <option value="summary_large_image">Summary Large Image</option>
                            <option value="summary">Summary</option>
                          </select>
                        </div>
                        {([
                          ['twitter.title',       'Twitter Title',       'Engaging title (max 70 chars)'],
                          ['twitter.description', 'Twitter Description', 'Brief description (max 200 chars)'],
                          ['twitter.image',       'Twitter Image URL',   'Min 144×144px; max 4096×4096px'],
                          ['twitter.site',        '@Site Handle',        '@yourhandle'],
                          ['twitter.creator',     '@Creator Handle',     '@authorhandle'],
                        ] as [string, string, string][]).map(([path, label, hint]) => (
                          <div key={path}>
                            <label className="text-xs font-semibold text-slate-600 dark:text-neutral-300 block mb-1">{label}</label>
                            <input value={(form.twitter as unknown as Record<string, string>)?.[path.split('.')[1]] || ''} onChange={e => set(path, e.target.value)} placeholder={hint}
                              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Previews */}
                  <div className="space-y-4">
                    <SocialPreview type="og" title={form.og?.title || form.metaTitle || ''} description={form.og?.description || form.metaDescription || ''} image={form.og?.image || ''} siteName={form.og?.siteName || ''} />
                    <SocialPreview type="twitter" title={form.twitter?.title || form.metaTitle || ''} description={form.twitter?.description || form.metaDescription || ''} image={form.twitter?.image || form.og?.image || ''} siteName={form.og?.siteName || ''} />
                  </div>
                </div>
              )}

              {/* ── SCHEMA ────────────────────────────────────────────────── */}
              {tab === 'schema' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                      <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><Code size={14} />JSON-LD Structured Data</p>
                      <p className="text-xs text-slate-400 dark:text-neutral-500 mb-4">Helps search engines understand your content. Must be valid JSON.</p>
                      <textarea
                        rows={18}
                        value={form.schemaMarkup || ''}
                        onChange={e => { set('schemaMarkup', e.target.value); setSchemaError('') }}
                        placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Page Name",\n  "description": "Page description"\n}'}
                        className={`w-full px-3 py-2.5 text-xs font-mono bg-slate-50 dark:bg-neutral-800 border rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white resize-none ${schemaError ? 'border-red-400' : 'border-slate-200 dark:border-neutral-700'}`}
                        spellCheck={false}
                      />
                      {schemaError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><XCircle size={12} weight="fill" />{schemaError}</p>}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => {
                          try { const pretty = JSON.stringify(JSON.parse(form.schemaMarkup || '{}'), null, 2); set('schemaMarkup', pretty); setSchemaError('') }
                          catch { setSchemaError('Invalid JSON — cannot format') }
                        }} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">
                          Format JSON
                        </button>
                        <button onClick={() => { set('schemaMarkup', ''); setSchemaError('') }} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                      <p className="text-sm font-bold text-slate-800 dark:text-white mb-4">Quick Templates</p>
                      <div className="space-y-2">
                        {[
                          {
                            label: 'Organization', schema: JSON.stringify({
                              '@context': 'https://schema.org', '@type': 'Organization',
                              name: 'EnglishPro', url: 'https://yourwebsite.com',
                              logo: 'https://yourwebsite.com/logo.png',
                              contactPoint: { '@type': 'ContactPoint', telephone: '+1-000-000-0000', contactType: 'customer service' }
                            }, null, 2)
                          },
                          {
                            label: 'Course', schema: JSON.stringify({
                              '@context': 'https://schema.org', '@type': 'Course',
                              name: 'English Course Name', description: 'Course description',
                              provider: { '@type': 'Organization', name: 'EnglishPro' }
                            }, null, 2)
                          },
                          {
                            label: 'FAQ Page', schema: JSON.stringify({
                              '@context': 'https://schema.org', '@type': 'FAQPage',
                              mainEntity: [
                                { '@type': 'Question', name: 'Question 1?', acceptedAnswer: { '@type': 'Answer', text: 'Answer 1.' } },
                                { '@type': 'Question', name: 'Question 2?', acceptedAnswer: { '@type': 'Answer', text: 'Answer 2.' } },
                              ]
                            }, null, 2)
                          },
                          {
                            label: 'Website', schema: JSON.stringify({
                              '@context': 'https://schema.org', '@type': 'WebSite',
                              name: 'EnglishPro', url: 'https://yourwebsite.com',
                              potentialAction: { '@type': 'SearchAction', target: 'https://yourwebsite.com/search?q={search_term_string}', 'query-input': 'required name=search_term_string' }
                            }, null, 2)
                          },
                        ].map(t => (
                          <button key={t.label} onClick={() => { set('schemaMarkup', t.schema); setSchemaError('') }}
                            className="w-full text-left px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 hover:bg-violet-50 dark:hover:bg-violet-900/10 border border-slate-200 dark:border-neutral-700 hover:border-violet-300 dark:hover:border-violet-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-neutral-200 transition-all">
                            {t.label} Schema
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SITEMAP ───────────────────────────────────────────────── */}
              {tab === 'sitemap' && (
                <div className="max-w-xl space-y-4">
                  <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-5"><MapTrifold size={14} />Sitemap Settings</p>
                    <div className="space-y-5">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={form.sitemap?.include !== false} onChange={e => set('sitemap.include', e.target.checked)} className="w-4 h-4 accent-violet-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-neutral-200">Include in Sitemap</p>
                          <p className="text-xs text-slate-400">List this page in your XML sitemap</p>
                        </div>
                      </label>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-neutral-300 block mb-2">Priority <span className="text-slate-400 font-normal">(0.0 – 1.0)</span></label>
                        <div className="flex items-center gap-3">
                          <input type="range" min={0} max={1} step={0.1} value={form.sitemap?.priority ?? 0.5} onChange={e => set('sitemap.priority', parseFloat(e.target.value))} className="flex-1 accent-violet-600" />
                          <span className="text-sm font-bold text-violet-600 w-8 text-right">{form.sitemap?.priority ?? 0.5}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">1.0 = Homepage, 0.8 = Important pages, 0.5 = Normal pages, 0.3 = Low priority</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-neutral-300 block mb-2">Change Frequency</label>
                        <select value={form.sitemap?.changeFreq || 'weekly'} onChange={e => set('sitemap.changeFreq', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white">
                          {['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  {/* Sitemap overview */}
                  <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-4"><Funnel size={14} />All Pages Sitemap Overview</p>
                    <div className="space-y-1.5">
                      {pages.filter(p => p.pageSlug !== '__global__').map(p => (
                        <div key={p.pageSlug} className="flex items-center gap-2 py-1.5 border-b border-slate-50 dark:border-neutral-800 last:border-0">
                          {p.sitemap?.include !== false ? <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" weight="fill" /> : <XCircle size={12} className="text-slate-300 dark:text-neutral-600 flex-shrink-0" weight="fill" />}
                          <span className="text-xs text-slate-600 dark:text-neutral-300 flex-1 truncate">{p.pageUrl}</span>
                          <span className="text-[10px] text-slate-400">{p.sitemap?.priority ?? 0.5}</span>
                          <span className="text-[10px] text-slate-400">{p.sitemap?.changeFreq || 'weekly'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── GLOBAL ────────────────────────────────────────────────── */}
              {tab === 'global' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {/* Global SEO */}
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                      <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-4"><Globe size={14} />Global SEO Defaults</p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 dark:text-neutral-300 block mb-1">Title Suffix</label>
                          <input value={form.global?.titleSuffix || ''} onChange={e => set('global.titleSuffix', e.target.value)}
                            placeholder=" | EnglishPro (added to every page title)"
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 dark:text-neutral-300 block mb-1">Default OG Image URL</label>
                          <input value={form.global?.defaultOgImage || ''} onChange={e => set('global.defaultOgImage', e.target.value)}
                            placeholder="https://yourwebsite.com/og-default.jpg (1200×630)"
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Analytics */}
                    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                      <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-4"><ChartBar size={14} />Analytics & Verification</p>
                      <div className="space-y-3">
                        {([
                          ['global.googleAnalyticsId',      'Google Analytics ID',          'G-XXXXXXXXXX or UA-XXXXXXXXX'],
                          ['global.googleSiteVerification', 'Google Search Console Code',   'Meta verification content value'],
                          ['global.bingVerification',       'Bing Webmaster Verification',  'Meta verification content value'],
                          ['global.facebookPixelId',        'Facebook Pixel ID',            '15-digit numeric ID'],
                        ] as [string, string, string][]).map(([path, label, hint]) => (
                          <div key={path}>
                            <label className="text-xs font-semibold text-slate-600 dark:text-neutral-300 block mb-1">{label}</label>
                            <input value={(form.global as unknown as Record<string, string>)?.[path.split('.')[1]] || ''} onChange={e => set(path, e.target.value)} placeholder={hint}
                              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Robots.txt */}
                  <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5">
                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><Robot size={14} />Robots.txt</p>
                    <p className="text-xs text-slate-400 mb-4">Controls which pages search engine crawlers can access.</p>
                    <textarea
                      rows={18}
                      value={form.global?.robotsTxt || ''}
                      onChange={e => set('global.robotsTxt', e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-mono bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white resize-none"
                      spellCheck={false}
                    />
                    <button onClick={() => set('global.robotsTxt', 'User-agent: *\nAllow: /\n\nDisallow: /dashboard/\nDisallow: /admin/\nDisallow: /instructor/\n\nSitemap: https://yourwebsite.com/sitemap.xml')}
                      className="mt-2 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">
                      Reset to Default
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Add Page Modal ───────────────────────────────────────────────── */}
      {showAddPage && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-700 shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">Add Custom Page</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-neutral-300 block mb-1">Page Slug <span className="text-red-400">*</span></label>
                <input value={newPage.pageSlug} onChange={e => setNewPage(p => ({ ...p, pageSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                  placeholder="e.g. pricing, testimonials"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-neutral-300 block mb-1">Page Name <span className="text-red-400">*</span></label>
                <input value={newPage.pageName} onChange={e => setNewPage(p => ({ ...p, pageName: e.target.value }))}
                  placeholder="e.g. Pricing, Testimonials"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-neutral-300 block mb-1">Page URL</label>
                <input value={newPage.pageUrl} onChange={e => setNewPage(p => ({ ...p, pageUrl: e.target.value }))}
                  placeholder="/pricing"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddPage(false)} className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-800 rounded-xl hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">Cancel</button>
              <button onClick={handleAddPage} disabled={!newPage.pageSlug || !newPage.pageName} className="flex-1 px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl transition-colors">Create Page</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unsaved indicator ────────────────────────────────────────────── */}
      {isDirty && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-pulse pointer-events-none">
          <Warning size={14} weight="fill" />Unsaved changes
        </div>
      )}

      <ConfirmModal
        open={!!confirmSlug}
        title="Delete SEO Entry?"
        message={`The SEO configuration for "${confirmSlug}" will be permanently deleted.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeletePageConfirmed}
        onCancel={() => setConfirmSlug(null)}
      />
    </div>
  )
}
