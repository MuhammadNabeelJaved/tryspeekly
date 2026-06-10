# Team Member Access — Automatic Rule

## The Rule

**Whenever a new admin dashboard page or feature is added, ALWAYS update team member access in the same PR — without being asked.**

This is a standing instruction. Do not wait for the user to mention it.

---

## How the System Works

`team_member` is a role that admin can create with granular per-page permissions.

### Permission flow
1. Admin assigns permission keys to a team member via **Admin → Team** page
2. JWT contains `permissions: string[]` (set at login from `user.permissions`)
3. Server middleware `authorizeTeamPage(...keys)` checks that the user is `admin` OR is a `team_member` with at least one matching key
4. Client sidebar/nav hides pages the team member does not have access to

### Key files
| File | What to update |
|------|---------------|
| `server/src/models/user.model.js` | Add new key to `permissions` enum array |
| `server/src/middlewares/auth.js` | Use `authorizeTeamPage('new-key')` on new routes |
| `client/src/pages/admin/AdminTeam.tsx` | Add `{ key: 'new-key', label: 'Human Label' }` to `PERMISSION_GROUPS` |
| `client/src/pages/admin/AdminPage.tsx` | Guard new nav item with permission check (see pattern below) |

---

## Checklist for Every New Admin Page/Feature

- [ ] Pick a `kebab-case` key for the page (e.g. `monthly-fees`)
- [ ] Add it to the `permissions` enum in `user.model.js`
- [ ] Add it to the correct group in `PERMISSION_GROUPS` in `AdminTeam.tsx`
- [ ] Wrap the relevant API routes with `authorizeTeamPage('new-key')` in the route file
- [ ] Guard the sidebar nav link in `AdminPage.tsx` so it only shows if the team member has the key
- [ ] If the page is admin-only (no team member should ever see it), document that explicitly — no update needed

---

## Code Patterns

### Server route (auth.js middleware)
```js
// admin only:
router.route('/').get(authenticate, authorize('admin'), handler)

// admin OR team_member with 'monthly-fees' permission:
router.route('/').get(authenticate, authorizeTeamPage('monthly-fees'), handler)
```

### Client nav guard (AdminPage.tsx pattern)
```tsx
// Only show nav item if admin or team_member has permission
{(user?.role === 'admin' || user?.permissions?.includes('monthly-fees')) && (
  <NavLink to="/admin/monthly-fees">Monthly Fees</NavLink>
)}
```

### PERMISSION_GROUPS entry (AdminTeam.tsx)
```ts
// Add to the most relevant group (Core / Finance / Communication / Content)
{ key: 'monthly-fees', label: 'Monthly Fees' },
```

---

## Current Permission Keys (keep this updated)

### Core
`overview` · `students` · `courses` · `instructors`

### Finance
`payments` · `financial-aid` · `salaries` · `certificates` · `referrals` · `monthly-fees`

### Communication
`messages` · `support` · `contacts` · `email` · `newsletter` · `reviews` · `notifications`

### Content
`blog` · `seo` · `cms` · `geo-access`

---

> **Why:** Admin needs to delegate work to team members without giving full admin access.
> Every new page that's not admin-only should be grantable. Keeping this updated on every
> feature means the admin never has to manually ask for access wiring after the fact.
