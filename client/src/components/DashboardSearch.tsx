import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlass, X, ArrowBendDownLeft } from '@phosphor-icons/react'

export interface SearchItem {
  label: string
  description: string
  path: string
  Icon: React.FC<{ size?: number; weight?: string; className?: string }>
}

interface Props {
  items: SearchItem[]
}

export default function DashboardSearch({ items }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = query.trim()
    ? items.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      )
    : items

  const openModal = useCallback(() => {
    setOpen(true)
    setQuery('')
    setActiveIdx(0)
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const go = useCallback((path: string) => {
    navigate(path)
    closeModal()
  }, [navigate, closeModal])

  // Ctrl/Cmd + K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        open ? closeModal() : openModal()
      }
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, openModal, closeModal])

  // Focus input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Reset active index when query changes
  useEffect(() => { setActiveIdx(0) }, [query])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (filtered[activeIdx]) go(filtered[activeIdx].path)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openModal}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs text-slate-400 dark:text-neutral-500 hover:border-violet-300 dark:hover:border-violet-700 transition-colors w-48"
      >
        <MagnifyingGlass size={13} />
        <span className="flex-1 text-left">Quick search…</span>
        <span className="text-[10px] bg-slate-200 dark:bg-neutral-700 text-slate-500 dark:text-neutral-400 px-1.5 py-0.5 rounded font-mono">⌘K</span>
      </button>

      {/* Mobile trigger */}
      <button
        onClick={openModal}
        className="flex md:hidden w-8 h-8 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
      >
        <MagnifyingGlass size={15} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[12%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[9999] px-4"
            >
              <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 overflow-hidden">

                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-neutral-800">
                  <MagnifyingGlass size={18} className="text-slate-400 dark:text-neutral-500 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search pages…"
                    className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 outline-none"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors">
                      <X size={15} />
                    </button>
                  )}
                  <button onClick={closeModal} className="text-[10px] bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 px-1.5 py-0.5 rounded font-mono">
                    ESC
                  </button>
                </div>

                {/* Results */}
                <ul ref={listRef} className="max-h-72 overflow-y-auto py-2">
                  {filtered.length === 0 ? (
                    <li className="px-4 py-8 text-center text-sm text-slate-400 dark:text-neutral-500">
                      No pages found for "<span className="font-medium">{query}</span>"
                    </li>
                  ) : (
                    filtered.map((item, i) => (
                      <li key={item.path}>
                        <button
                          onClick={() => go(item.path)}
                          onMouseEnter={() => setActiveIdx(i)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            i === activeIdx
                              ? 'bg-violet-50 dark:bg-violet-900/20'
                              : 'hover:bg-slate-50 dark:hover:bg-neutral-800/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            i === activeIdx
                              ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400'
                              : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400'
                          }`}>
                            <item.Icon size={16} weight="fill" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${
                              i === activeIdx ? 'text-violet-700 dark:text-violet-300' : 'text-slate-800 dark:text-neutral-200'
                            }`}>{item.label}</p>
                            <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">{item.description}</p>
                          </div>
                          {i === activeIdx && (
                            <ArrowBendDownLeft size={14} className="text-violet-400 flex-shrink-0" />
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>

                {/* Footer hint */}
                <div className="px-4 py-2 border-t border-slate-100 dark:border-neutral-800 flex items-center gap-3 text-[10px] text-slate-400 dark:text-neutral-600">
                  <span>↑↓ navigate</span>
                  <span>↵ open</span>
                  <span>ESC close</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
