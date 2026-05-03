# Admin Support Page — Design Spec

**Date:** 2026-05-03  
**Status:** Approved  
**Scope:** `client/src/pages/admin/AdminSupport.tsx` (full rewrite) + `adminData.ts` (FAQEntry type + seed data)

---

## Overview

A full support center page inside the admin dashboard. Replaces the existing buggy `AdminSupport.tsx` with a clean redesign. Provides three capabilities in one page: at-a-glance stats, ticket conversation management, and FAQ/knowledge base CRUD.

---

## Architecture

Single file: `AdminSupport.tsx`. All state lives at the root component. No new files except a `FAQEntry` type and seed data added to `adminData.ts`.

```
AdminSupport (root)
├── SupportStats         — 4 derived stat cards
├── TabBar               — "Tickets" | "Knowledge Base" toggle
├── TicketsTab
│   ├── TicketList       — searchable, filterable ticket sidebar
│   └── ConversationPane — message thread + reply input + controls
└── KnowledgeBaseTab
    ├── FAQList          — rendered FAQ cards with edit/delete
    └── FAQForm          — inline add/edit form
```

---

## Section 1: Stats Bar

Always visible at top, regardless of active tab. Four stat cards:

| Card | Value | Accent |
|------|-------|--------|
| Open Tickets | `tickets.filter(t => t.status === 'open').length` | Emerald |
| Pending | `tickets.filter(t => t.status === 'pending').length` | Amber |
| Closed | `tickets.filter(t => t.status === 'closed').length` | Slate |
| Avg Response | Mean time (first student msg → first admin reply) across tickets with ≥1 admin reply. Displayed as `"Xh Ym"` or `"< 1h"`. Falls back to `"N/A"` if no replies yet. | Violet |

- Style: matches `AdminOverview` stat cards — icon, large number, label, subtle colored background
- Read-only, no click action

---

## Section 2: Tickets Tab

### Left Panel (w-80 lg:w-96, fixed on mobile / static on desktop)

- Search input — filters by student name, subject, course name
- Two `<select>` dropdowns — Status filter (All / Open / Pending / Closed), Priority filter (All / Low / Medium / High)
- Ticket cards sorted by `lastMessageAt` descending
- Each card: avatar initials, student name, course, subject preview, last message preview, status badge, priority badge, timestamp
- Active ticket highlighted with violet background tint

### Right Panel (flex-1)

**Empty state:** centered `ChatCircleDots` icon + "Select a ticket to view the conversation"

**When a ticket is selected:**
- Header: back button (mobile only), avatar, student name + subject, status `<select>`, priority `<select>`
- Message thread: scrollable div, auto-scrolls to bottom on new message
  - Admin messages: right-aligned, violet bubble (`rounded-tr-sm`)
  - Student messages: left-aligned, white/dark bubble (`rounded-tl-sm`)
  - Timestamp + checkmark shown per message
- Reply input: text field + send button
  - On send: appends `{ sender: 'admin', content, timestamp }` to thread, updates `lastMessageAt`
  - Does NOT change ticket status on send (fixes existing `newStatus` bug)

### Mobile Behavior

Left panel: `fixed`, full-height, slides off-screen (`-translate-x-full`) when a ticket is active. Right panel fills the screen. Back button on header returns to list (`setActiveTicket(null)`).

---

## Section 3: Knowledge Base Tab

Full-width FAQ management. State: `faqs: FAQEntry[]` in `AdminSupport`, persisted to `localStorage('admin_faqs')`.

### Layout

- Header row: "Knowledge Base" title (left) + "Add FAQ" button (right, violet)
- FAQ cards: question bold, answer muted. Edit icon (pencil) + Delete icon (trash, red hover)
- Empty state: centered icon + "No FAQs yet. Add your first entry."

### Add/Edit Form

- Inline — appears above the FAQ list, not a modal
- Fields: Question (textarea), Answer (textarea)
- Buttons: Save (violet), Cancel (slate)
- On save: adds new entry or updates existing entry in place
- On cancel: dismisses form, clears draft

---

## Data

### Existing (reused from `adminData.ts`)
```ts
SupportTicket { id, studentName, studentAvatar, courseName, subject, status, priority, lastMessageAt, messages }
SupportMessage { id, sender, content, timestamp }
INITIAL_SUPPORT_TICKETS — 3 seed tickets
```

### New (added to `adminData.ts`)
```ts
export interface FAQEntry {
  id: string
  question: string
  answer: string
}

export const INITIAL_FAQS: FAQEntry[] = [
  // 3-4 seed entries relevant to an English learning platform
]
```

### Persistence
- `localStorage('admin_support_tickets')` — tickets (existing pattern)
- `localStorage('admin_faqs')` — FAQ entries (new)

---

## TypeScript Fix

`AdminView` type in `AdminPage.tsx` currently missing `'support'`. Must be added:
```ts
export type AdminView = '...' | 'support'
```

---

## Responsiveness

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<lg) | Ticket list and conversation are full-screen, toggled by selecting/back |
| Desktop (lg+) | Side-by-side split: ticket list fixed width left, conversation flex-1 right |
| KB tab | Always full-width, single column on mobile, max-width container on desktop |

---

## Out of Scope

- Real-time messaging (WebSocket/Socket.io) — not wired to backend
- File attachments (Paperclip button removed — was non-functional)
- Ticket creation by admin (admin only replies; tickets come from students)
