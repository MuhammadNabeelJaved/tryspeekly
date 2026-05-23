# Blog Feature Completion — Design Spec
Date: 2026-05-22

## Problem Statement

Three gaps exist in the current blog feature:

1. **Home page `Blog.tsx`** uses a hardcoded static `POSTS` array — real published blogs never appear there.
2. **`readTime` field is missing** — "5 min read" is hardcoded in both `BlogPostPage.tsx` and `BlogPage.tsx`; admin cannot set it.
3. **No "home blog count" control** — admin has no way to configure how many blogs appear in the home page section.

`BlogPage.tsx` (public `/blog` route) already fetches from the API correctly and needs no structural changes.

---

## Scope

| File | Change |
|------|--------|
| `server/src/models/blog.model.js` | Add `readTime` field |
| `server/src/models/site-settings.model.js` | Add `homepage.blogCount` field |
| `client/src/types/api.ts` | Add `readTime` to `Blog` type; add `homeBlogCount` to settings types |
| `client/src/components/Blog.tsx` | Replace hardcoded POSTS with API-driven data |
| `client/src/pages/admin/AdminBlog.tsx` | Add `readTime` form field + home blog count control |
| `client/src/pages/BlogPage.tsx` | Replace hardcoded "5 min read" with `blog.readTime` |
| `client/src/pages/BlogPostPage.tsx` | Replace hardcoded "5 min read" with `blog.readTime` |

No new routes, controllers, or services are needed.

---

## Backend Changes

### blog.model.js
Add one field to `blogSchema`:
```js
readTime: { type: String, default: '5 min read', trim: true }
```
This is non-breaking — existing blog documents default to `'5 min read'`.

### site-settings.model.js
Add a `homepage` section:
```js
homepage: {
  blogCount: { type: Number, default: 3, min: 1, max: 12 }
}
```
The existing `PATCH /api/v1/site-settings` endpoint handles saving this with no controller changes.

---

## Frontend Changes

### 1. Blog.tsx (Home Page Section)

Replace the hardcoded `POSTS` array with a two-step fetch on mount:

1. `GET /api/v1/site-settings/public` → read `homepage.blogCount` (N, default 3)
2. `GET /api/v1/blogs?limit=N&status=published` → fetch N published blogs

Display real data: cover image, tags[0] as category, title, excerpt, readTime, publishedAt date.  
Each card links to `/blog/slug/:slug`.  
"View All Posts" links to `/blog`.  
Show skeleton cards while loading; gracefully fall back to 3 hardcoded posts if API fails (so home page never breaks).

### 2. AdminBlog.tsx

**Header area** — add inline home blog count control next to "New Article" button:
```
[Show [3 ↑↓] blogs on home page]    [+ New Article]
```
- Fetches current value from site settings on mount.
- On change: debounced (500 ms) PATCH to `/api/v1/site-settings` with `{ homepage: { blogCount: N } }`.
- Min 1, max 12.

**Form** — add `readTime` field between Tags and Article Body:
```
Tags: [Grammar, Tips]    Read Time: [5 min read        ]
```
- Registered as `readTime` in react-hook-form.
- Default value `'5 min read'`.
- Shown in the live preview (replaces hardcoded "5 min read" in the preview pane).

### 3. BlogPage.tsx

In the blog card render and featured post section, replace:
```tsx
5 min read
```
with:
```tsx
{blog.readTime ?? '5 min read'}
```

### 4. BlogPostPage.tsx

In the hero metadata section, replace:
```tsx
5 min read
```
with:
```tsx
{blog.readTime ?? '5 min read'}
```

---

## Type Updates (api.ts)

```ts
// Blog type — add:
readTime?: string

// SiteSettings type — add homepage section:
homepage?: {
  blogCount?: number
}
```

---

## Data Flow

```
Admin sets readTime in form → saved to DB
Admin sets homeBlogCount → saved to site-settings

Home page loads:
  → GET /site-settings/public (blogCount = N)
  → GET /blogs?limit=N&status=published
  → renders N real blog cards

Public /blog page:
  → GET /blogs?status=published (unchanged)
  → renders readTime from blog data

/blog/slug/:slug page:
  → GET /blogs/:slug (unchanged)
  → renders readTime from blog data
```

---

## Error Handling

- `Blog.tsx`: if site settings fetch fails, default to 3. If blogs fetch fails, show empty state gracefully (no broken home page).
- `AdminBlog.tsx` home count: if site settings fetch fails, default to 3, show toast only on save failure.

---

## Non-Goals

- Rich text / markdown editor (out of scope — current textarea is sufficient)
- Cover image file upload in the create form (a separate PATCH endpoint already exists for this; adding it to the creation form is a separate task)
- Author bio per-blog field (author bio comes from user profile)
