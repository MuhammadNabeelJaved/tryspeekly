import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { usersService } from '../../services/users.service'
import { User, Lock, Bell, PlugsConnected, Globe, DeviceMobile, ShieldCheck, VideoCamera, Calendar, MagnifyingGlass, X, Camera } from '@phosphor-icons/react'
import { MOCK_INSTRUCTOR as FALLBACK_INSTRUCTOR } from './instructorData'
import { extractApiError } from '../../utils/apiError'
import { motion } from 'framer-motion'

export default function InstructorSettings() {
  const { user, setUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [settingsSearch, setSettingsSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const result = await usersService.updateProfileImage(file)
      if (setUser && user) {
        setUser({ ...user, profileImage: result.profileImage })
      }
      toast.success('Profile image updated!')
    } catch (err: unknown) {
      toast.error(extractApiError(err, 'Failed to upload image'))
    } finally {
      setUploadingImage(false)
    }
  }

  // Notification Toggle States
  const [notifyEnrollments, setNotifyEnrollments] = useState(true)
  const [notifyAssignments, setNotifyAssignments] = useState(true)
  const [notifyMessages, setNotifyMessages] = useState(false)

  const tabs = [
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'security', label: 'Security & Login', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: PlugsConnected },
  ]

  const filteredTabs = tabs.filter(tab =>
    tab.label.toLowerCase().includes(settingsSearch.toLowerCase())
  )

  const defaultName = user?.name || FALLBACK_INSTRUCTOR.name
  const defaultEmail = user?.email || FALLBACK_INSTRUCTOR.email

  const { register, handleSubmit, reset: resetForm } = useForm({
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
      phone: user?.phone || '+1 (555) 123-4567',
      timezone: 'America/New_York',
      bio: user?.bio || 'I am a certified IELTS examiner with over 10 years of experience teaching English to professionals and students worldwide.',
    }
  })

  const onSubmit = async (data: any) => {
    setSaving(true)
    try {
      await usersService.updateProfile({
        name: data.name,
        phone: data.phone,
        bio: data.bio,
      })
      toast.success('Settings saved successfully!')
    } catch (err: unknown) {
      toast.error(extractApiError(err, 'Failed to save settings. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-sm text-slate-500 dark:text-neutral-400">Manage your profile, security, integrations, and notification preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-4">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
              <MagnifyingGlass size={16} weight="bold" />
            </div>
            <input 
              type="text" 
              value={settingsSearch}
              onChange={(e) => setSettingsSearch(e.target.value)}
              placeholder="Search settings..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:border-violet-500 outline-none transition-all"
            />
            {settingsSearch && (
              <button 
                onClick={() => setSettingsSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X size={10} weight="bold" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {filteredTabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}
              >
                <tab.icon size={18} weight={activeTab === tab.id ? 'fill' : 'regular'} /> {tab.label}
              </button>
            ))}
            {filteredTabs.length === 0 && (
              <p className="text-xs text-center py-4 text-slate-400">No settings found.</p>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm">
              <div className="border-b border-slate-200 dark:border-neutral-800 p-6 flex items-center gap-4 bg-slate-50/50 dark:bg-neutral-900/50">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <User size={24} weight="fill" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Personal Information</h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Update your basic profile details and contact info.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Profile Image Upload */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {user?.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-violet-500 shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-violet-500 shadow-lg">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera size={16} weight="bold" />
                      )}
                    </motion.button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Profile Photo</h3>
                    <p className="text-sm text-slate-500 dark:text-neutral-400">Upload a photo to personalize your profile</p>
                    <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">JPG, PNG up to 5MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">Full Name</label>
                    <input 
                      {...register('name')}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">Email Address</label>
                    <input 
                      {...register('email')}
                      type="email"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5"><DeviceMobile size={14} /> Phone Number</label>
                    <input 
                      {...register('phone')}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5"><Globe size={14} /> Timezone</label>
                    <select 
                      {...register('timezone')}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                    >
                      <option value="America/New_York">Eastern Time (US & Canada)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Asia/Karachi">Pakistan Standard Time (PKT)</option>
                      <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">Professional Bio</label>
                  <textarea 
                    {...register('bio')}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 mt-2">Brief description for your profile. URLs are hyperlinked.</p>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-neutral-800">
                  <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition-colors shadow-md shadow-violet-600/20">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                <div className="border-b border-slate-200 dark:border-neutral-800 p-6 flex items-center gap-4 bg-slate-50/50 dark:bg-neutral-900/50">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Lock size={24} weight="fill" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Change Password</h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">Update your password associated with your account.</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">Current Password</label>
                    <input
                      id="currentPassword"
                      type="password" placeholder="••••••••"
                      className="w-full max-w-md px-4 py-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">New Password</label>
                    <input
                      id="newPassword"
                      type="password" placeholder="••••••••"
                      className="w-full max-w-md px-4 py-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const current = (document.getElementById('currentPassword') as HTMLInputElement)?.value
                        const next = (document.getElementById('newPassword') as HTMLInputElement)?.value
                        if (!current || !next) { toast.error('Please fill in both password fields.'); return }
                        try {
                          await usersService.changePassword({ currentPassword: current, newPassword: next })
                          toast.success('Password updated successfully!')
                          ;(document.getElementById('currentPassword') as HTMLInputElement).value = ''
                          ;(document.getElementById('newPassword') as HTMLInputElement).value = ''
                        } catch (err) { toast.error(extractApiError(err, 'Failed to update password. Please check your current password.')) }
                      }}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors w-full sm:w-auto text-center"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                <div className="border-b border-slate-200 dark:border-neutral-800 p-6 flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <ShieldCheck size={24} weight="fill" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">Two-Factor Authentication</h2>
                      <p className="text-xs text-slate-500 dark:text-neutral-400">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <span className="bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 px-3 py-1 text-xs font-bold rounded-lg">Disabled</span>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 dark:text-neutral-400 mb-4 max-w-2xl leading-relaxed">
                    Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
                  </p>
                  <div className="pt-2">
                    <button className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors w-full sm:w-auto text-center">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm">
              <div className="border-b border-slate-200 dark:border-neutral-800 p-6 flex items-center gap-4 bg-slate-50/50 dark:bg-neutral-900/50">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Bell size={24} weight="fill" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Email Notifications</h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Choose what updates you want to receive.</p>
                </div>
              </div>
              <div className="p-0">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-neutral-800">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Student Enrollments</h4>
                    <p className="text-xs text-slate-500 mt-1">Get notified when a new student enrolls in your course.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyEnrollments(!notifyEnrollments)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${notifyEnrollments ? 'bg-violet-500' : 'bg-slate-300 dark:bg-neutral-600'}`}
                    role="switch"
                    aria-checked={notifyEnrollments}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifyEnrollments ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-neutral-800">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Assignment Submissions</h4>
                    <p className="text-xs text-slate-500 mt-1">Receive an email when a student submits an assignment.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyAssignments(!notifyAssignments)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${notifyAssignments ? 'bg-violet-500' : 'bg-slate-300 dark:bg-neutral-600'}`}
                    role="switch"
                    aria-checked={notifyAssignments}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifyAssignments ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Direct Messages</h4>
                    <p className="text-xs text-slate-500 mt-1">Get emails for unread direct messages from students.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyMessages(!notifyMessages)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${notifyMessages ? 'bg-violet-500' : 'bg-slate-300 dark:bg-neutral-600'}`}
                    role="switch"
                    aria-checked={notifyMessages}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifyMessages ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-violet-300 dark:hover:border-violet-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                    <VideoCamera size={28} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center flex-wrap gap-2">
                      Zoom <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">Connected</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Automatically create and share Zoom meeting links for live classes.</p>
                  </div>
                </div>
                <button className="w-full sm:w-auto bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-neutral-800 dark:hover:bg-red-900/20 dark:text-neutral-300 dark:hover:text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/50 text-center shrink-0">
                  Disconnect
                </button>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-violet-300 dark:hover:border-violet-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Calendar size={28} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Google Calendar</h3>
                    <p className="text-xs text-slate-500 mt-1">Sync your class schedule and assignments with your calendar.</p>
                  </div>
                </div>
                <button className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm text-center shrink-0">
                  Connect Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}