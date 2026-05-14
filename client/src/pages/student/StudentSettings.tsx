import { useState, useRef, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Camera, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import PhoneInput from '@/components/auth/PhoneInput'
import { useAuth } from '@/context/AuthContext'
import { usersService } from '@/services/users.service'
import { extractApiError } from '@/utils/apiError'

interface ProfileFormData {
  name: string
  phone: string
  city: string
  country: string
}

export default function StudentSettings() {
  const { user, setUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')

  const { register, handleSubmit, control, reset } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      city: user?.city || '',
      country: user?.country || '',
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
        country: user.country || '',
      })
    }
  }, [user, reset])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarLoading(true)
    setAvatarError('')

    try {
      const { profileImage } = await usersService.updateProfileImage(file)
      setUser({ ...user!, profileImage, photo: profileImage })
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

  async function onSubmit(data: ProfileFormData) {
    setSaveStatus('saving')
    setSaveError('')

    try {
      const updated = await usersService.updateProfile({
        name: data.name,
        phone: data.phone,
        city: data.city,
        country: data.country,
      })
      setUser(updated)
      setSaveStatus('saved')
      toast.success('Profile saved successfully.')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to save changes')
      setSaveError(message)
      setSaveStatus('error')
      toast.error(message)
    }
  }

  const profileSrc = user?.profileImage || user?.photo

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Account Settings</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">Manage your profile information and preferences.</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Profile Information</h3>

        {/* Avatar section */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-neutral-800">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(124,58,237,0.4)]">
              {profileSrc ? (
                <img src={profileSrc} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black">
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
              )}
            </div>
            {avatarLoading && (
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
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
              {avatarLoading ? 'Uploading...' : 'Change Avatar'}
            </button>
            <p className="text-xs text-slate-500 dark:text-neutral-400">JPG, PNG or WEBP. Max 5MB.</p>
            {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Full Name</label>
              <input
                {...register('name')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800/60 text-slate-400 dark:text-neutral-500 text-sm outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    {...field}
                    label="Phone Number"
                    placeholder="Enter phone number"
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">City</label>
              <input
                {...register('city')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Country</label>
              <input
                {...register('country')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <WarningCircle size={16} weight="bold" />
              {saveError}
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
                <CheckCircle size={16} weight="bold" />
                Saved!
              </span>
            )}
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-colors disabled:opacity-60"
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm p-6">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-500 mb-2">Danger Zone</h3>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <button
          type="button"
          className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-500 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  )
}
