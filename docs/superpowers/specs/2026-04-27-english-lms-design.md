# English Learning LMS — Design Spec
**Date:** 2026-04-27
**Status:** Approved

---

## 1. Overview

A full-stack English learning platform where students can create accounts, browse courses, enroll, and attend live classes via Zoom or Google Meet links. Teachers manage their own courses and schedules. Admins control the full platform. Built in phases — MVP first, then scaled.

**Stack (fixed):**
- Client: React + TypeScript + Tailwind CSS + Vite
- Server: Node.js + Express + TypeScript + MongoDB/Mongoose
- Auth: JWT (access + refresh tokens)
- Real-time: Socket.io
- File uploads: Multer (screenshots)
- Email: Nodemailer

---

## 2. Architecture

### Monorepo Structure
```
Project/
├── client/     # React frontend
└── server/     # Express backend API
```

### Key Layers
- **Auth:** JWT access tokens (15min) + refresh tokens (7 days, httpOnly cookie). Role in JWT payload: `student | teacher | admin`.
- **REST API:** All CRUD over HTTP. Envelope format: `{ success, data }` / `{ success, error, code }`. Routes follow `/api/<resource>` convention.
- **Real-time:** Socket.io for chat (group rooms, private DMs, support chat), payment approval notifications, class reminders.
- **File Storage:** Multer for payment screenshots. MVP: disk or Cloudinary free tier. Phase 3: migrate to S3.
- **Email:** Nodemailer for enrollment confirmation, payment status updates, class reminders, ticket updates.
- **No external payment gateway in MVP** — all payments are manual (screenshot + transaction ID, admin-verified).

---

## 3. User Roles & Auth

### Roles
| Role | Created By | Description |
|------|------------|-------------|
| Student | Self-registration | Browses, enrolls, attends classes |
| Teacher | Admin only | Creates/manages courses and schedules |
| Admin | Seeded via env script on first deploy | Full platform control |

### Student Registration Fields
`name, email, password, phone, country`

### Teacher Account (created by Admin)
`name, email, password (auto-generated), bio, photo, specializations`
Auto-email sent to teacher with login credentials on creation.

### Auth Flow
- Login → JWT access token + refresh token (httpOnly cookie)
- Role-based redirect: Student → `/dashboard`, Teacher → `/teacher/dashboard`, Admin → `/admin`
- Password reset: email OTP (6-digit, 10min expiry)
- Middleware: `authenticate` (JWT verify) + `authorize(role)` (role gate) — follows existing conventions

---

## 4. Course Management & Scheduling

### Course Types
| Type | Students | Scheduling Model |
|------|----------|-----------------|
| `group` | Multiple | Fixed recurring schedule set by teacher |
| `one-to-one` | 1 per session | Student picks from teacher's available slots |
| `hybrid` | Small group | Teacher sets time blocks, students choose; max capacity per slot |

### Course Model (key fields)
```
title, description, price, currency (PKR | USD),
type (group | one-to-one | hybrid),
level (beginner | intermediate | advanced),
focus (speaking | grammar | IELTS | business | general),
thumbnail, totalSessions, sessionDuration (minutes),
status (draft | published | archived),
teacher (ref User),
enrolledStudents ([ref User]),
recurringSchedule: [{ day, time }],        // group
availableSlots: [{ date, startTime, endTime, isBooked, bookedBy }],  // one-to-one
meetLink (string)                           // Zoom or Google Meet URL
```

### Enrollment Flow
1. Student browses `/courses`, opens course detail
2. Clicks "Enroll" → payment submission form
3. Student submits: payment method + transaction ID + screenshot + amount
4. `Payment` document created with status `pending`
5. Admin notified (Socket.io + email)
6. Admin approves → `Enrollment` created, student notified (Socket.io + email)
7. Admin rejects → rejection reason sent to student

### Slot Booking Flow (1-to-1 / hybrid) — Phase 2
1. Enrolled student views teacher's available slots
2. Student requests a slot
3. Teacher approves → slot locked to that student
4. Both notified via Socket.io

---

## 5. Payment System

### Supported Methods
| Category | Methods |
|----------|---------|
| Local (Pakistan) | JazzCash, EasyPaisa, NayaPay, SadaPay, Zindigi, Bank Transfer |
| International | Direct Bank Transfer (SWIFT / IBAN) |

### Payment account details (account numbers, IBANs, JazzCash numbers) are configurable by Admin from `/admin/settings` — not hardcoded.

### Submission Flow
1. Student selects payment method → platform shows configured payment instructions for that method
2. Student makes payment externally
3. Student submits on platform: method + transaction ID + screenshot (JPG/PNG ≤5MB) + amount paid + optional note
4. `Payment` document created (`status: pending`)
5. Admin sees it in pending queue

### Payment Model
```
student (ref), course (ref), teacher (ref),
method (jazzcash | easypaisa | nayapay | sadapay | zindigi | bank_local | bank_international),
transactionId, screenshotUrl, amount, currency (PKR | USD),
status (pending | approved | rejected),
adminNote, rejectionReason,
verifiedBy (ref User admin), verifiedAt
```

### Admin Verification
- Pending queue sorted oldest-first
- Admin views: student, course, method, transaction ID, zoomable screenshot
- Approve → enrollment activated | Reject → reason required → student notified
- Both actions trigger Socket.io notification + email to student

---

## 6. Messaging & Chat

### Three Chat Channels

**1. Group Course Chat — Phase 2**
- One room per published course (room ID = course ID)
- Participants: all approved-enrolled students + course teacher
- Access granted on enrollment approval
- Text only in MVP

**2. Private Teacher-Student Chat — Phase 1**
- Room ID: `${studentId}_${teacherId}_${courseId}`
- Available to enrolled students only, per course
- Teacher can chat with any of their enrolled students

**3. Support Chat — Phase 2**
- Room ID: `support_${studentId}`
- Admin responds in real-time when online
- Messages persist when admin offline — student sees "We'll respond shortly"
- Floating button (bottom-right) on all pages

### Socket.io Events
```
join_room, leave_room
send_message → message_received
user_typing → typing_indicator
message_read → read_receipt
admin_online_status
payment_approved, payment_rejected
class_starting (15min reminder)
ticket_updated
```

### Message Model
```
room (string), sender (ref User), content (string),
type (group | private | support),
readBy ([ref User]), createdAt
```

### UI Details
- Chat accessible from course page (group + private tabs)
- Support chat: floating button, bottom-right, all pages
- Unread count badges on nav icons

---

## 7. Customer Support System — Phase 2

### Two Layers

**Live Chat** (Socket.io `support_${studentId}` rooms)
- Real-time when Admin is online
- Offline fallback: messages stored, admin responds later
- Admin manages all support chats from `/admin/support/chats`

**Ticket System**
- Use for: payment disputes, account issues, course complaints, anything needing a paper trail
- Student opens ticket from `/support` or support widget

### Ticket Flow
1. Student fills: Category (Payment | Technical | Course | Other) + Subject + Description + optional attachment
2. Ticket created: status `open`, auto-incremented ticket number (e.g., `TKT-0042`)
3. Admin notified (Socket.io + email)
4. Admin responds from `/admin/support/tickets` — each response adds to thread
5. Status: `open` → `in_progress` → `resolved` | `closed`
6. Student gets email on each status change; can reply from `/student/support/tickets`

### Ticket Model
```
ticketNumber (auto), student (ref), category, subject,
description, attachmentUrl,
status (open | in_progress | resolved | closed),
priority (low | medium | high — set by Admin),
thread: [{ sender (ref User), message, createdAt }],
assignedTo (ref User admin), createdAt, updatedAt
```

---

## 8. Admin Dashboard

### Navigation
```
/admin                       Overview
/admin/users/students        Student management
/admin/users/teachers        Teacher management (create, edit, suspend)
/admin/courses               All courses (publish/archive/edit)
/admin/payments              Pending queue + history
/admin/support/chats         Live support chats
/admin/support/tickets       Ticket management
/admin/settings              Payment instructions, platform config
```

### Overview Stats
- Total students / teachers / courses
- Pending payments count (highlighted, action required)
- Revenue this month (PKR + USD separate)
- Active enrollments
- Open support tickets
- Recent activity feed

### Settings Page
- Payment instructions per method (editable — account number, IBAN, JazzCash number, etc.)
- Platform name, logo, contact email
- Email notification toggles

---

## 9. Pages & Routes

### Public (no auth)
```
/                    Landing page
/courses             Browse courses (filter: type, level, focus, price)
/courses/:id         Course detail + enroll CTA
/about               About platform
/contact             Contact form
/login               Login (all roles, role-detected redirect)
/register            Student registration
/forgot-password     Password reset
```

### Student (authenticated)
```
/dashboard                   My courses, upcoming sessions, notifications
/my-courses                  All enrolled courses
/my-courses/:id              Course: sessions, chat, live link
/payments                    Payment history + statuses
/profile                     Edit profile, change password
/support                     Live chat + ticket management
/support/tickets/:id         Single ticket thread
```

### Teacher (authenticated)
```
/teacher/dashboard           Stats, upcoming sessions, student count
/teacher/courses             Course list
/teacher/courses/new         Create course
/teacher/courses/:id         Manage: students, schedule, chat, meet link
/teacher/students            All students across courses
/teacher/schedule            Calendar view of sessions
```

### Admin (authenticated)
```
/admin                       Overview
/admin/users/students
/admin/users/teachers
/admin/courses
/admin/payments
/admin/support/chats
/admin/support/tickets
/admin/support/tickets/:id
/admin/settings
```

---

## 10. UI/UX Direction

**Design language:** Clean, minimal, modern. Not generic EdTech blue. Unique, editorial character.

**Palette:**
- Background: `#FAFAFA` (off-white)
- Foreground: `#0A0A0A` (near-black)
- Accent: `#4F46E5` (deep indigo) — configurable
- Muted: `#6B7280`
- Border: `#E5E7EB`

**Typography:**
- UI: `Inter`
- Headings: `DM Serif Display`

**Style principles:**
- Generous whitespace
- Subtle borders, no heavy shadows
- Micro-animations on hover + page transitions (Framer Motion)
- Responsive — mobile-first

---

## 11. Phase Breakdown

### Phase 1 — MVP (build now)
- Auth (all 3 roles), JWT, password reset
- Student registration + Teacher creation by Admin
- Course CRUD (all 3 types), scheduling (all 3 models)
- Course browse + detail pages (public)
- Enrollment flow: payment submission (screenshot + transaction ID)
- Admin payment verification queue
- Teacher-Student private chat (Socket.io)
- Admin dashboard: users, courses, payments, settings
- Email notifications: enrollment, payment status
- Landing page + all public pages

### Phase 2
- Group course chat rooms
- Support live chat (Socket.io)
- Ticket system
- Student/Teacher notification center
- Slot booking flow for 1-to-1 / hybrid (request → teacher approve)
- Class reminder notifications (15min before)

### Phase 3
- Analytics dashboard (revenue charts, enrollment trends)
- File sharing in chat
- S3 migration for file storage
- Advanced scheduling UX (calendar picker)
- Performance optimizations (caching, pagination)
- Mobile PWA enhancements
