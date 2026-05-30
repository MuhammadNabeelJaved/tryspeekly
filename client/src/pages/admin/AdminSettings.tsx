import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  FloppyDisk, CheckCircle, Globe, Phone, Share, MagnifyingGlass,
  ShieldCheck, Trash, Eye, EyeSlash, ArrowCounterClockwise, Camera,
} from '@phosphor-icons/react'
import type { AdminStore } from '../AdminPage'
import { INITIAL_SETTINGS } from './adminData'
import type { AdminSettings } from './adminData'
import { useAuth } from '@/context/AuthContext'
import { usersService } from '@/services/users.service'
import { siteSettingsService } from '@/services/site-settings.service'
import { extractApiError } from '@/utils/apiError'
import UserAvatar from '@/components/UserAvatar'
import ConfirmModal from '@/components/ConfirmModal'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">{label}</label>
      {hint && <p className="text-[10px] text-slate-400 dark:text-neutral-600 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function Input({ register, name, type = 'text', placeholder }: { register: any; name: string; type?: string; placeholder?: string }) {
  return (
    <input type={type} {...register(name)} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
    />
  )
}

function Textarea({ register, name, placeholder, rows = 2 }: { register: any; name: string; placeholder?: string; rows?: number }) {
  return (
    <textarea {...register(name)} placeholder={placeholder} rows={rows}
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
  const defaultSettings = (() => {
    try { return JSON.parse(localStorage.getItem('admin_settings') || 'null') ?? INITIAL_SETTINGS }
    catch { return INITIAL_SETTINGS }
  })();

  const { register, handleSubmit, watch, reset } = useForm<AdminSettings>({
    defaultValues: defaultSettings
  })

  const [saved, setSaved] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)


  const { user, setUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('File must be smaller than 5 MB.')
      return
    }
    setAvatarLoading(true)
    setAvatarError('')
    try {
      const { profileImage } = await usersService.updateProfileImage(file)
      setUser({ ...user!, profileImage, photo: profileImage })
      localStorage.setItem('user', JSON.stringify({ ...user!, profileImage, photo: profileImage }))
      toast.success('Profile photo updated.')
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update profile image')
      setAvatarError(message)
      toast.error(message)
    } finally {
      setAvatarLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const metaTitle = watch('seo.metaTitle') || ''
  const metaDescription = watch('seo.metaDescription') || ''

  async function onSaveAll(data: AdminSettings) {
    localStorage.setItem('admin_settings', JSON.stringify(data))
    try {
      const { admin: _, ...siteData } = data
      await siteSettingsService.update(siteData as any)
    } catch {
      // localStorage still saved — server sync is best-effort
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleChangePassword() {
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return }
    const currentData = watch()
    const updatedData = { ...currentData, admin: { ...currentData.admin, password: newPassword } }
    localStorage.setItem('admin_settings', JSON.stringify(updatedData))
    reset(updatedData)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleResetAll() {
    localStorage.setItem('admin_settings', JSON.stringify(INITIAL_SETTINGS))
    reset(INITIAL_SETTINGS)
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
    <form onSubmit={handleSubmit(onSaveAll)} className="p-4 sm:p-6 max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Settings</h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Manage site configuration, contact info, social links, and admin account</p>
        </div>
        <button type="submit"
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
          <Field label="Site Name"><Input register={register} name="site.name" placeholder="EnglishPro Academy" /></Field>
        </div>
        <Field label="Logo Text" hint="Text shown in the navbar logo"><Input register={register} name="site.logoText" placeholder="EnglishPro" /></Field>
        <div className="col-span-full">
          <Field label="Site Tagline"><Input register={register} name="site.tagline" placeholder="Master English. Change Your Life." /></Field>
        </div>
        <div className="col-span-full">
          <Field label="Footer Copyright Text"><Input register={register} name="site.footerCopyright" placeholder="© 2026 EnglishPro Academy." /></Field>
        </div>
        <div className="col-span-full">
          <Field label="Footer Description" hint="Short text shown under the logo in the footer (max 400 chars)">
            <Textarea register={register} name="site.footerDescription" placeholder="Empowering learners worldwide to achieve English fluency through interactive courses..." rows={3} />
          </Field>
        </div>
      </SectionCard>

      {/* ── CONTACT INFO ── */}
      <SectionCard title="Contact Information" icon={<Phone size={16} />}>
        <Field label="Phone Number"><Input register={register} name="contact.phone" placeholder="+92 300 0000000" /></Field>
        <Field label="Email Address"><Input register={register} name="contact.email" type="email" placeholder="hello@englishpro.com" /></Field>
        <Field label="WhatsApp Number"><Input register={register} name="contact.whatsapp" placeholder="+92 300 0000000" /></Field>
        <Field label="Working Hours"><Input register={register} name="contact.workingHours" placeholder="Mon–Sat · 9 AM – 6 PM PKT" /></Field>
        <div className="col-span-full">
          <Field label="Office Address">
            <Textarea register={register} name="contact.address" placeholder="Karachi, Pakistan" />
          </Field>
        </div>
      </SectionCard>

      {/* ── SOCIAL MEDIA ── */}
      <SectionCard title="Social Media Links" icon={<Share size={16} />}>
        <Field label="Facebook URL"><Input register={register} name="social.facebook" type="url" placeholder="https://facebook.com/..." /></Field>
        <Field label="Instagram URL"><Input register={register} name="social.instagram" type="url" placeholder="https://instagram.com/..." /></Field>
        <Field label="Twitter / X URL"><Input register={register} name="social.twitter" type="url" placeholder="https://twitter.com/..." /></Field>
        <Field label="LinkedIn URL"><Input register={register} name="social.linkedin" type="url" placeholder="https://linkedin.com/..." /></Field>
        <div className="col-span-full">
          <Field label="YouTube URL"><Input register={register} name="social.youtube" type="url" placeholder="https://youtube.com/..." /></Field>
        </div>
      </SectionCard>

      {/* ── SEO ── */}
      <SectionCard title="SEO & Meta Tags" icon={<MagnifyingGlass size={16} />}>
        <div className="col-span-full">
          <Field label="Meta Title" hint="Appears in browser tab and search results (50–60 chars recommended)">
            <Input register={register} name="seo.metaTitle" placeholder="EnglishPro Academy — Professional English Courses Online" />
          </Field>
          <p className={`text-[10px] mt-1 ${metaTitle.length > 60 ? 'text-red-400' : 'text-slate-400 dark:text-neutral-600'}`}>{metaTitle.length}/60 characters</p>
        </div>
        <div className="col-span-full">
          <Field label="Meta Description" hint="Search engine snippet (150–160 chars recommended)">
            <Textarea register={register} name="seo.metaDescription" placeholder="Join 2,000+ learners..." rows={3} />
          </Field>
          <p className={`text-[10px] mt-1 ${metaDescription.length > 160 ? 'text-red-400' : 'text-slate-400 dark:text-neutral-600'}`}>{metaDescription.length}/160 characters</p>
        </div>
        <div className="col-span-full">
          <Field label="Keywords" hint="Comma-separated keywords for SEO">
            <Input register={register} name="seo.keywords" placeholder="english courses, ielts, spoken english, pakistan" />
          </Field>
        </div>
      </SectionCard>

      {/* ── PROFILE PHOTO ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Camera size={16} />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Profile Photo</h3>
        </div>
        <div className="p-5 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <UserAvatar src={user?.profileImage} name={user?.name || 'Admin'} size="lg" />
            {avatarLoading && (
              <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 px-3 py-1.5 rounded-lg transition-colors mb-1 disabled:opacity-60"
            >
              <Camera size={14} weight="bold" />
              {avatarLoading ? 'Uploading...' : 'Change Photo'}
            </button>
            <p className="text-xs text-slate-500 dark:text-neutral-400">JPG, PNG or WEBP. Max 5MB.</p>
            {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
          </div>
        </div>
      </div>

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
            <Field label="Admin Name"><Input register={register} name="admin.name" placeholder="Admin" /></Field>
            <Field label="Admin Email"><Input register={register} name="admin.email" type="email" placeholder="admin@englishpro.com" /></Field>
          </div>

          <div className="border-t border-slate-100 dark:border-neutral-800 pt-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-neutral-300 mb-3">Change Password</h4>
            <div className="space-y-3">
              <Field label="Current Password">
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} {...register('admin.password')} readOnly
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
              <button type="button" onClick={handleChangePassword}
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
        <button type="submit"
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
            <button type="button" onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors flex-shrink-0 shadow-[0_4px_12px_rgba(239,68,68,0.3)]"
            >
              <ArrowCounterClockwise size={13} />Reset Everything
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showResetConfirm}
        title="Reset All Data?"
        message="This will permanently delete all students, courses, instructors, and CMS edits. This action cannot be undone."
        confirmLabel="Yes, Reset All"
        variant="danger"
        onConfirm={() => { setShowResetConfirm(false); handleResetAll() }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </form>
  )
}
