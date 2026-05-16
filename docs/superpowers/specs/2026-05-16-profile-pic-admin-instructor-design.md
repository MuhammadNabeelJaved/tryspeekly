# Profile Picture — Admin & Instructor Dashboards

**Date:** 2026-05-16  
**Status:** Approved

## Goal

Add profile picture upload and display to the admin and instructor dashboards, matching the existing student dashboard implementation exactly (Cloudinary via `usersService.updateProfileImage`).

## Reference

`StudentSettings.tsx` — avatar upload section  
`StudentDashboardPage.tsx` — sidebar profile card display

## Scope

| File | Change |
|------|--------|
| `client/src/components/UserAvatar.tsx` | New reusable avatar component (image or gradient initial fallback) |
| `client/src/pages/admin/AdminSettings.tsx` | Add profile photo upload section (same as StudentSettings) |
| `client/src/pages/AdminPage.tsx` | Sidebar profile card + topbar avatar → use UserAvatar |
| `client/src/pages/InstructorDashboardPage.tsx` | Sidebar profile card → use UserAvatar |

Note: `InstructorSettings.tsx` already has upload — no change needed there.

## `UserAvatar` Component

**File:** `client/src/components/UserAvatar.tsx`

Props:
- `src?: string` — Cloudinary URL (profileImage)
- `name?: string` — used for first-letter fallback
- `size: 'sm' | 'md' | 'lg'` — sm=w-8h-8 (topbar), md=w-9h-9 (sidebar), lg=w-16h-16 (settings)
- `className?: string`

Behavior:
- `src` present → `<img>` with `object-cover` + `rounded-xl`
- `src` absent → gradient circle (`from-violet-600 to-purple-600`) with first letter of `name`
- `name` absent → `?` fallback

## AdminSettings — Profile Upload

Add a profile photo section above the existing "Admin Account" card, using the same pattern as `StudentSettings.tsx`:

- `useAuth()` to get `user` and `setUser`
- `useRef<HTMLInputElement>` for hidden file input
- `avatarLoading` state with spinner overlay
- `handleAvatarChange` → `usersService.updateProfileImage(file)` → `setUser({ ...user!, profileImage })`
- `toast.success` / `toast.error` + `extractApiError`
- Imports: `Camera` from `@phosphor-icons/react`, `usersService`, `useAuth`, `extractApiError`, `toast`

## AdminPage — Sidebar & Topbar

Replace two hardcoded `"A"` gradient circles:

1. **Sidebar profile card** (~line 369): `<UserAvatar src={user?.profileImage} name={user?.name || 'Admin'} size="md" />`
2. **Topbar avatar** (~line 479): `<UserAvatar src={user?.profileImage} name={user?.name || 'Admin'} size="sm" />`

## InstructorDashboardPage — Sidebar

Replace gradient initial circle (~line 169):  
`<UserAvatar src={user?.profileImage} name={user?.name} size="md" />`

## Error Handling

- Upload failures → `toast.error` with `extractApiError` message
- File input cleared after every attempt (success or failure)
- Upload in progress → camera button disabled + spinner

## Out of Scope

- Student dashboard (already done)
- InstructorSettings upload UI (already done)
- Instructor topbar (no avatar exists there)
- Admin topbar on mobile (same element as desktop)
