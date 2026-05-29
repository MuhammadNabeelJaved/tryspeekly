import { useState, useRef } from 'react'
import { Camera, FloppyDisk, Lock, Eye, EyeSlash, ArrowsClockwise, UserCircle } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { usersService } from '@/services/users.service'
import UserAvatar from '@/components/UserAvatar'

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6">
      <h3 className="text-sm font-black text-slate-900 dark:text-white mb-5">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors'

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeamProfile() {
  const { user, setUser, updateProfile } = useAuth()

  // ── Profile fields ──────────────────────────────────────────────────────────
  const [name, setName]       = useState(user?.name ?? '')
  const [phone, setPhone]     = useState(user?.phone ?? '')
  const [bio, setBio]         = useState(user?.bio ?? '')
  const [country, setCountry] = useState(user?.country ?? '')
  const [city, setCity]       = useState(user?.city ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // ── Password ────────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Name is required'); return }
    setSavingProfile(true)
    try {
      await updateProfile({ name, phone, bio, country, city })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const { profileImage } = await usersService.updateProfileImage(file)
      if (user) {
        const updated = { ...user, profileImage }
        setUser(updated)
        localStorage.setItem('user', JSON.stringify(updated))
      }
      toast.success('Profile photo updated')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploadingAvatar(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    try {
      await usersService.changePassword({ currentPassword, newPassword })
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Failed to change password'
      toast.error(msg)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Avatar section */}
      <Section title="Profile Photo">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <UserAvatar src={user?.profileImage} name={user?.name ?? ''} size="lg" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-60"
            >
              {uploadingAvatar
                ? <ArrowsClockwise size={13} className="animate-spin" />
                : <Camera size={13} weight="fill" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{user?.email}</p>
            <p className="text-[11px] font-bold text-violet-600 dark:text-violet-400 mt-1 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-lg inline-block">
              {user?.jobTitle || 'Team Member'}
            </p>
          </div>
        </div>
      </Section>

      {/* Profile info */}
      <Section title="Personal Information">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputCls}
                placeholder="Your full name"
                required
              />
            </Field>
            <Field label="Phone">
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={inputCls}
                placeholder="+1 234 567 8900"
              />
            </Field>
            <Field label="Country">
              <input
                value={country}
                onChange={e => setCountry(e.target.value)}
                className={inputCls}
                placeholder="Pakistan"
              />
            </Field>
            <Field label="City">
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                className={inputCls}
                placeholder="Karachi"
              />
            </Field>
          </div>
          <Field label="Bio">
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="A short bio about yourself…"
              maxLength={500}
            />
          </Field>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
            >
              {savingProfile
                ? <ArrowsClockwise size={14} className="animate-spin" />
                : <FloppyDisk size={14} weight="fill" />}
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Section>

      {/* Change password */}
      <Section title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Field label="Current Password">
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className={`${inputCls} pr-10`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
              >
                {showCurrent ? <EyeSlash size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="New Password">
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className={`${inputCls} pr-10`}
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
                >
                  {showNew ? <EyeSlash size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
            <Field label="Confirm New Password">
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={inputCls}
                placeholder="Repeat new password"
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white text-sm font-bold transition-colors disabled:opacity-60"
            >
              {savingPassword
                ? <ArrowsClockwise size={14} className="animate-spin" />
                : <Lock size={14} weight="fill" />}
              {savingPassword ? 'Saving…' : 'Change Password'}
            </button>
          </div>
        </form>
      </Section>

    </div>
  )
}
