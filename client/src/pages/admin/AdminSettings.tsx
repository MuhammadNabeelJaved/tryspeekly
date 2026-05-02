import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FloppyDisk, CheckCircle, Globe, Phone, Share, MagnifyingGlass,
  ShieldCheck, Trash, Eye, EyeSlash, ArrowCounterClockwise,
} from '@phosphor-icons/react'
import type { AdminStore } from '../AdminPage'
import { INITIAL_SETTINGS } from './adminData'
import type { AdminSettings } from './adminData'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">{label}</label>
      {hint && <p className="text-[10px] text-slate-400 dark:text-neutral-600 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 2 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors resize-none"
    />
  )
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
        <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
          {icon}
        </div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  )
}

export default function AdminSettings({ store }: { store: AdminStore }) {
  const [settings, setSettings] = useState<AdminSettings>(() => {
    try { return JSON.parse(localStorage.getItem('admin_settings') || 'null') ?? INITIAL_SETTINGS }
    catch { return INITIAL_SETTINGS }
  })

  const [saved, setSaved] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  function update<K extends keyof AdminSettings>(section: K, key: keyof AdminSettings[K], value: string) {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }))
  }

  function handleSave() {
    localStorage.setItem('admin_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleChangePassword() {
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return }
    setSettings(prev => ({ ...prev, admin: { ...prev.admin, password: newPassword } }))
    localStorage.setItem('admin_settings', JSON.stringify({ ...settings, admin: { ...settings.admin, password: newPassword } }))
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleResetAll() {
    setSettings(INITIAL_SETTINGS)
    localStorage.setItem('admin_settings', JSON.stringify(INITIAL_SETTINGS))
    store.setStudents([])
    store.setCourses([])
    store.setInstructors([])
    localStorage.removeItem('admin_students')
    localStorage.removeItem('admin_instructors')
    localStorage.removeItem('admin_courses')
    localStorage.removeItem('admin_cms')
    setShowResetConfirm(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors'

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Settings</h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Manage site configuration, contact info, social links, and admin account</p>
        </div>
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all self-start ${
            saved ? 'bg-emerald-500 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)]'
          }`}
        >
          {saved ? <><CheckCircle size={15} weight="fill" />Saved!</> : <><FloppyDisk size={15} weight="fill" />Save All Settings</>}
        </button>
      </div>

      {/* ── SITE IDENTITY ── */}
      <SectionCard title="Site Identity" icon={<Globe size={16} />}>
        <div className="col-span-full">
          <Field label="Site Name"><Input value={settings.site.name} onChange={v => update('site', 'name', v)} placeholder="EnglishPro Academy" /></Field>
        </div>
        <Field label="Logo Text" hint="Text shown in the navbar logo"><Input value={settings.site.logoText} onChange={v => update('site', 'logoText', v)} placeholder="EnglishPro" /></Field>
        <div className="col-span-full">
          <Field label="Site Tagline"><Input value={settings.site.tagline} onChange={v => update('site', 'tagline', v)} placeholder="Master English. Change Your Life." /></Field>
        </div>
        <div className="col-span-full">
          <Field label="Footer Copyright Text"><Input value={settings.site.footerCopyright} onChange={v => update('site', 'footerCopyright', v)} placeholder="© 2026 EnglishPro Academy." /></Field>
        </div>
      </SectionCard>

      {/* ── CONTACT INFO ── */}
      <SectionCard title="Contact Information" icon={<Phone size={16} />}>
        <Field label="Phone Number"><Input value={settings.contact.phone} onChange={v => update('contact', 'phone', v)} placeholder="+92 300 0000000" /></Field>
        <Field label="Email Address"><Input value={settings.contact.email} onChange={v => update('contact', 'email', v)} type="email" placeholder="hello@englishpro.com" /></Field>
        <Field label="WhatsApp Number"><Input value={settings.contact.whatsapp} onChange={v => update('contact', 'whatsapp', v)} placeholder="+92 300 0000000" /></Field>
        <Field label="Working Hours"><Input value={settings.contact.workingHours} onChange={v => update('contact', 'workingHours', v)} placeholder="Mon–Sat · 9 AM – 6 PM PKT" /></Field>
        <div className="col-span-full">
          <Field label="Office Address">
            <Textarea value={settings.contact.address} onChange={v => update('contact', 'address', v)} placeholder="Karachi, Pakistan" />
          </Field>
        </div>
      </SectionCard>

      {/* ── SOCIAL MEDIA ── */}
      <SectionCard title="Social Media Links" icon={<Share size={16} />}>
        <Field label="Facebook URL"><Input value={settings.social.facebook} onChange={v => update('social', 'facebook', v)} type="url" placeholder="https://facebook.com/..." /></Field>
        <Field label="Instagram URL"><Input value={settings.social.instagram} onChange={v => update('social', 'instagram', v)} type="url" placeholder="https://instagram.com/..." /></Field>
        <Field label="Twitter / X URL"><Input value={settings.social.twitter} onChange={v => update('social', 'twitter', v)} type="url" placeholder="https://twitter.com/..." /></Field>
        <Field label="LinkedIn URL"><Input value={settings.social.linkedin} onChange={v => update('social', 'linkedin', v)} type="url" placeholder="https://linkedin.com/..." /></Field>
        <div className="col-span-full">
          <Field label="YouTube URL"><Input value={settings.social.youtube} onChange={v => update('social', 'youtube', v)} type="url" placeholder="https://youtube.com/..." /></Field>
        </div>
      </SectionCard>

      {/* ── SEO ── */}
      <SectionCard title="SEO & Meta Tags" icon={<MagnifyingGlass size={16} />}>
        <div className="col-span-full">
          <Field label="Meta Title" hint="Appears in browser tab and search results (50–60 chars recommended)">
            <Input value={settings.seo.metaTitle} onChange={v => update('seo', 'metaTitle', v)} placeholder="EnglishPro Academy — Professional English Courses Online" />
          </Field>
          <p className={`text-[10px] mt-1 ${settings.seo.metaTitle.length > 60 ? 'text-red-400' : 'text-slate-400 dark:text-neutral-600'}`}>{settings.seo.metaTitle.length}/60 characters</p>
        </div>
        <div className="col-span-full">
          <Field label="Meta Description" hint="Search engine snippet (150–160 chars recommended)">
            <Textarea value={settings.seo.metaDescription} onChange={v => update('seo', 'metaDescription', v)} placeholder="Join 2,000+ learners..." rows={3} />
          </Field>
          <p className={`text-[10px] mt-1 ${settings.seo.metaDescription.length > 160 ? 'text-red-400' : 'text-slate-400 dark:text-neutral-600'}`}>{settings.seo.metaDescription.length}/160 characters</p>
        </div>
        <div className="col-span-full">
          <Field label="Keywords" hint="Comma-separated keywords for SEO">
            <Input value={settings.seo.keywords} onChange={v => update('seo', 'keywords', v)} placeholder="english courses, ielts, spoken english, pakistan" />
          </Field>
        </div>
      </SectionCard>

      {/* ── ADMIN ACCOUNT ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <ShieldCheck size={16} />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Admin Account</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Admin Name"><Input value={settings.admin.name} onChange={v => update('admin', 'name', v)} placeholder="Admin" /></Field>
            <Field label="Admin Email"><Input value={settings.admin.email} onChange={v => update('admin', 'email', v)} type="email" placeholder="admin@englishpro.com" /></Field>
          </div>

          <div className="border-t border-slate-100 dark:border-neutral-800 pt-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-neutral-300 mb-3">Change Password</h4>
            <div className="space-y-3">
              <Field label="Current Password">
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={settings.admin.password} readOnly
                    className={`${inputClass} pr-10 opacity-60 cursor-default`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition-colors">
                    {showPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="New Password">
                  <div className="relative">
                    <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordError('') }}
                      placeholder="Min. 6 characters" className={`${inputClass} pr-10`}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showNewPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm New Password">
                  <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordError('') }}
                    placeholder="Repeat new password" className={inputClass}
                  />
                </Field>
              </div>
              {passwordError && <p className="text-red-500 text-xs font-medium">{passwordError}</p>}
              <button onClick={handleChangePassword}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
              >
                <ShieldCheck size={13} />Update Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SAVE ALL ── */}
      <div className="flex justify-center pb-2">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.45)]'
          }`}
        >
          {saved ? <><CheckCircle size={16} weight="fill" />Settings Saved!</> : <><FloppyDisk size={16} weight="fill" />Save All Settings</>}
        </button>
      </div>

      {/* ── DANGER ZONE ── */}
      <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-red-200 dark:border-red-900">
          <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-500">
            <Trash size={16} />
          </div>
          <h3 className="text-sm font-black text-red-700 dark:text-red-400">Danger Zone</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">Reset All Data to Defaults</p>
              <p className="text-xs text-red-500 dark:text-red-600 mt-0.5">This will delete all students, courses, instructors, and CMS edits and restore factory defaults. This cannot be undone.</p>
            </div>
            <button onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors flex-shrink-0 shadow-[0_4px_12px_rgba(239,68,68,0.3)]"
            >
              <ArrowCounterClockwise size={13} />Reset Everything
            </button>
          </div>
        </div>
      </div>

      {/* ── RESET CONFIRM MODAL ── */}
      {showResetConfirm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
              <Trash size={26} className="text-red-500" />
            </div>
            <h3 className="font-black text-slate-900 dark:text-white mb-1 text-lg">Reset All Data?</h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6 leading-relaxed">This will permanently delete all students, courses, instructors, and CMS edits. This action <strong>cannot be undone</strong>.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
              <button onClick={handleResetAll} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">Yes, Reset All</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
