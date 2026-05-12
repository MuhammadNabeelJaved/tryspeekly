import { useForm, Controller } from 'react-hook-form'
import { MOCK_STUDENT } from './studentData'
import PhoneInput from '@/components/auth/PhoneInput'

export default function StudentSettings() {
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      name: MOCK_STUDENT.name,
      email: MOCK_STUDENT.email,
      phone: MOCK_STUDENT.phone,
      city: MOCK_STUDENT.city,
      country: MOCK_STUDENT.country,
    }
  })

  function onSubmit(data: any) {
    alert('Profile updated successfully! (Mock)')
    console.log('Updated data:', data)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Account Settings</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">Manage your profile information and preferences.</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Profile Information</h3>
        
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-neutral-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-[0_4px_12px_rgba(124,58,237,0.4)]">
            {MOCK_STUDENT.avatar}
          </div>
          <div>
            <button className="text-sm font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 px-3 py-1.5 rounded-lg transition-colors mb-1">
              Change Avatar
            </button>
            <p className="text-xs text-slate-500 dark:text-neutral-400">JPG, GIF or PNG. Max size of 2MB.</p>
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
                {...register('email')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm outline-none focus:border-violet-500 transition-colors"
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

          <div className="pt-4 flex justify-end">
            <button 
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm p-6">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-500 mb-2">Danger Zone</h3>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <button className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-500 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  )
}