# Profile Picture — Admin & Instructor Dashboards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cloudinary-backed profile picture upload to AdminSettings and display real profile photos in AdminPage + InstructorDashboardPage sidebars/topbar — exactly matching the existing student dashboard pattern.

**Architecture:** Create a shared `UserAvatar` component (image or gradient-initial fallback), wire it into the two dashboard layout files for display, and add the upload UI to `AdminSettings` using the same `usersService.updateProfileImage` call already used by `StudentSettings` and `InstructorSettings`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, `@phosphor-icons/react`, `react-hot-toast`, Vitest + React Testing Library, Cloudinary (via existing `usersService.updateProfileImage`)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `client/src/components/UserAvatar.tsx` | Reusable avatar — shows `<img>` or gradient initial |
| Create | `client/src/components/__tests__/UserAvatar.test.tsx` | Unit tests for UserAvatar |
| Modify | `client/src/pages/AdminPage.tsx` | Sidebar profile card + topbar avatar → use `UserAvatar` |
| Modify | `client/src/pages/admin/AdminSettings.tsx` | Add profile photo upload section |
| Modify | `client/src/pages/InstructorDashboardPage.tsx` | Sidebar profile card → use `UserAvatar` |

---

## Task 1: `UserAvatar` Component

**Files:**
- Create: `client/src/components/UserAvatar.tsx`
- Create: `client/src/components/__tests__/UserAvatar.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/__tests__/UserAvatar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import UserAvatar from '../UserAvatar'

describe('UserAvatar', () => {
  it('renders an img when src is provided', () => {
    render(<UserAvatar src="https://res.cloudinary.com/test/image.jpg" name="Ali Khan" size="md" />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://res.cloudinary.com/test/image.jpg')
    expect(img).toHaveAttribute('alt', 'Ali Khan')
  })

  it('renders the first letter of name when src is absent', () => {
    render(<UserAvatar name="Sara Malik" size="md" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
  })

  it('renders ? fallback when neither src nor name is provided', () => {
    render(<UserAvatar size="sm" />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd client && npx vitest run src/components/__tests__/UserAvatar.test.tsx
```

Expected: FAIL — "Cannot find module '../UserAvatar'"

- [ ] **Step 3: Create `UserAvatar.tsx`**

Create `client/src/components/UserAvatar.tsx`:

```tsx
const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-16 h-16 text-2xl',
}

interface UserAvatarProps {
  src?: string
  name?: string
  size: 'sm' | 'md' | 'lg'
  className?: string
}

export default function UserAvatar({ src, name, size, className = '' }: UserAvatarProps) {
  const dim = SIZES[size]
  const initial = name?.charAt(0)?.toUpperCase() || '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${dim} rounded-xl object-cover flex-shrink-0 shadow-[0_4px_12px_rgba(124,58,237,0.4)] ${className}`}
      />
    )
  }

  return (
    <div
      className={`${dim} rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-black flex-shrink-0 shadow-[0_4px_12px_rgba(124,58,237,0.4)] ${className}`}
    >
      {initial}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd client && npx vitest run src/components/__tests__/UserAvatar.test.tsx
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/components/UserAvatar.tsx client/src/components/__tests__/UserAvatar.test.tsx
git commit -m "feat: add UserAvatar component with image/initial fallback"
```

---

## Task 2: AdminPage — Sidebar & Topbar Avatars

**Files:**
- Modify: `client/src/pages/AdminPage.tsx`

- [ ] **Step 1: Add `UserAvatar` import to AdminPage**

At the top of `client/src/pages/AdminPage.tsx`, add the import after the existing `Loader` import:

```tsx
import UserAvatar from '@/components/UserAvatar'
```

- [ ] **Step 2: Replace sidebar profile card avatar**

Find this block in `AdminPage.tsx` (inside the sidebar bottom profile card, around line 368–375):

```tsx
<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-[0_4px_12px_rgba(124,58,237,0.4)]">
  A
</div>
```

Replace with:

```tsx
<UserAvatar src={user?.profileImage} name={user?.name || 'Admin'} size="md" />
```

- [ ] **Step 3: Replace topbar avatar**

Find this block in `AdminPage.tsx` (inside the topbar `<header>`, around line 479):

```tsx
<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-[0_2px_8px_rgba(124,58,237,0.4)]">
  A
</div>
```

Replace with:

```tsx
<UserAvatar src={user?.profileImage} name={user?.name || 'Admin'} size="sm" />
```

- [ ] **Step 4: Verify in browser**

Start the dev server (`cd client && npm run dev`), log in as admin, open the dashboard. Confirm:
- Sidebar profile card shows gradient "A" (no photo uploaded yet — correct fallback)
- Topbar shows same gradient "A"
- No TypeScript errors in terminal

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/AdminPage.tsx
git commit -m "feat: show real profile image in admin sidebar and topbar"
```

---

## Task 3: AdminSettings — Profile Photo Upload

**Files:**
- Modify: `client/src/pages/admin/AdminSettings.tsx`

- [ ] **Step 1: Add missing imports to AdminSettings**

At the top of `client/src/pages/admin/AdminSettings.tsx`, the current imports are:

```tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  FloppyDisk, CheckCircle, Globe, Phone, Share, MagnifyingGlass,
  ShieldCheck, Trash, Eye, EyeSlash, ArrowCounterClockwise,
} from '@phosphor-icons/react'
import type { AdminStore } from '../AdminPage'
import { INITIAL_SETTINGS } from './adminData'
import type { AdminSettings } from './adminData'
```

Replace with:

```tsx
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FloppyDisk, CheckCircle, Globe, Phone, Share, MagnifyingGlass,
  ShieldCheck, Trash, Eye, EyeSlash, ArrowCounterClockwise, Camera,
} from '@phosphor-icons/react'
import type { AdminStore } from '../AdminPage'
import { INITIAL_SETTINGS } from './adminData'
import type { AdminSettings } from './adminData'
import { useAuth } from '../../context/AuthContext'
import { usersService } from '../../services/users.service'
import { extractApiError } from '../../utils/apiError'
import UserAvatar from '../../components/UserAvatar'
```

- [ ] **Step 2: Add avatar state and handler inside `AdminSettings` component**

Inside `export default function AdminSettings(...)`, add these after the existing `useState` declarations:

```tsx
const { user, setUser } = useAuth()
const fileInputRef = useRef<HTMLInputElement>(null)
const [avatarLoading, setAvatarLoading] = useState(false)
const [avatarError, setAvatarError] = useState('')

async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  setAvatarLoading(true)
  setAvatarError('')
  try {
    const { profileImage } = await usersService.updateProfileImage(file)
    setUser({ ...user!, profileImage })
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
```

- [ ] **Step 3: Add profile photo upload UI above the Admin Account section**

In the JSX return, find the Admin Account `<div>` block that starts with:

```tsx
{/* ── ADMIN ACCOUNT ── */}
<div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
```

Insert this block **immediately before** that comment:

```tsx
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
```

- [ ] **Step 4: Verify in browser**

Open Admin Settings page. Confirm:
- "Profile Photo" card appears above "Admin Account"
- Current avatar shows (gradient "A" if no photo)
- Clicking "Change Photo" opens file picker
- After selecting an image, spinner appears, then photo updates in the card AND in the sidebar/topbar (because `setUser` updates AuthContext)
- `toast.success('Profile photo updated.')` fires on success

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminSettings.tsx
git commit -m "feat: add profile photo upload to admin settings"
```

---

## Task 4: InstructorDashboardPage — Sidebar Avatar

**Files:**
- Modify: `client/src/pages/InstructorDashboardPage.tsx`

- [ ] **Step 1: Add `UserAvatar` import**

At the top of `client/src/pages/InstructorDashboardPage.tsx`, add after the existing `Loader` import:

```tsx
import UserAvatar from '@/components/UserAvatar'
```

- [ ] **Step 2: Replace sidebar profile card avatar**

Find this block in `InstructorDashboardPage.tsx` (inside the sidebar bottom profile card, around line 169–175):

```tsx
<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-[0_4px_12px_rgba(124,58,237,0.4)]">
  {user?.name?.charAt(0)?.toUpperCase() || 'T'}
</div>
```

Replace with:

```tsx
<UserAvatar src={user?.profileImage} name={user?.name} size="md" />
```

- [ ] **Step 3: Verify in browser**

Open Instructor dashboard. Confirm:
- Sidebar profile card shows gradient initial when no photo uploaded
- After uploading a photo via Instructor Settings → the sidebar immediately reflects the new photo (same AuthContext `user` state)
- No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/InstructorDashboardPage.tsx
git commit -m "feat: show real profile image in instructor sidebar"
```

---

## Task 5: Final Smoke Test

- [ ] **Step 1: Run full test suite**

```bash
cd client && npx vitest run
```

Expected: all tests PASS (including the new UserAvatar tests)

- [ ] **Step 2: End-to-end flow check**

Test each role manually:

**Admin:**
1. Log in as admin → sidebar shows "A" gradient fallback
2. Go to Settings → see "Profile Photo" section
3. Upload a photo → spinner → success toast → photo appears in Settings card, sidebar, and topbar
4. Refresh page → photo still there (fetched from Cloudinary via `/users/profile` on mount)

**Instructor:**
1. Log in as instructor → sidebar shows initial letter gradient
2. Go to Settings → Profile Details tab → upload photo via existing camera button
3. Photo appears in sidebar immediately after upload
4. Refresh → photo persists

- [ ] **Step 3: TypeScript check**

```bash
cd client && npx tsc --noEmit
```

Expected: 0 errors
