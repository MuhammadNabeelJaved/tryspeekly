# Backend Setup — Design Spec
**Date:** 2026-04-28
**Status:** Approved

---

## 1. Overview

This spec covers the professional setup of the Express + TypeScript backend for the English Learning LMS. It establishes the folder structure, middleware stack, config strategy, and technical decisions that all features will be built on top of. The overall platform spec lives in `2026-04-27-english-lms-design.md`.

---

## 2. Folder Structure

Feature-based (modular) architecture. Each domain is self-contained with its own routes → controller → service → types chain. Mongoose models live in a shared `models/` layer because they are referenced across features (e.g., User is used by courses, payments, and chat).

```
server/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.types.ts
│   │   ├── users/
│   │   ├── courses/
│   │   ├── enrollments/
│   │   ├── payments/
│   │   ├── chat/
│   │   ├── tickets/
│   │   └── settings/
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── Course.model.ts
│   │   ├── Enrollment.model.ts
│   │   ├── Payment.model.ts
│   │   ├── Message.model.ts
│   │   ├── Ticket.model.ts
│   │   └── Settings.model.ts
│   ├── middleware/
│   │   ├── authenticate.ts       ← JWT verify, attaches req.user
│   │   ├── authorize.ts          ← role gate: authorize('admin')
│   │   ├── upload.ts             ← multer config
│   │   └── errorHandler.ts       ← central error → envelope response
│   ├── config/
│   │   ├── env.ts                ← zod env schema, parsed + exported
│   │   ├── db.ts                 ← mongoose connect
│   │   ├── mailer.ts             ← nodemailer transporter
│   │   ├── multer.ts             ← multer storage config
│   │   └── socket.ts             ← Socket.io init + auth middleware
│   ├── utils/
│   │   ├── ApiError.ts           ← extends Error with statusCode + code
│   │   ├── sendEmail.ts          ← thin wrapper around nodemailer
│   │   └── generateTokens.ts     ← access + refresh token helpers
│   ├── types/
│   │   └── express.d.ts          ← augment req.user type globally
│   ├── scripts/
│   │   └── seed-admin.ts         ← one-time admin seeder, reads from env
│   └── app.ts                    ← Express app: middleware + routes mounted
├── server.ts                     ← HTTP server + Socket.io attach + listen
├── .env.example
├── tsconfig.json
└── package.json
```

---

## 3. Dependencies

### Production
| Package | Purpose |
|---------|---------|
| `express` | HTTP framework |
| `mongoose` | MongoDB ODM |
| `zod` | Env validation + request body schemas |
| `jsonwebtoken` | JWT sign/verify |
| `bcryptjs` | Password hashing |
| `cookie-parser` | Read httpOnly refresh token cookie |
| `cors` | CORS policy |
| `helmet` | Secure HTTP headers |
| `morgan` | HTTP request logging |
| `multer` | File upload (payment screenshots) |
| `nodemailer` | Transactional email |
| `socket.io` | Real-time chat + notifications |

### Development
| Package | Purpose |
|---------|---------|
| `typescript` | Language |
| `ts-node-dev` | Dev server with hot reload |
| `@types/*` | Type definitions |

---

## 4. Environment Variables

Validated at startup via `zod` — the server crashes immediately with a clear message if any required var is missing. No guessing in production.

```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=

# JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# Admin seed
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=

# File storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
```

---

## 5. Middleware Stack

Applied in this order in `app.ts`:

```
helmet()
cors({ origin: env.CLIENT_URL, credentials: true })
morgan('dev')
express.json()
cookie-parser()
→ feature routes (/api/*)
→ 404 handler
→ errorHandler (central)
```

---

## 6. Auth Strategy

- **Access token:** JWT, 15 min expiry, sent in `Authorization: Bearer <token>` header
- **Refresh token:** JWT, 7 days expiry, stored in httpOnly `refreshToken` cookie
- **`authenticate` middleware:** Verifies access token, attaches decoded payload to `req.user`
- **`authorize(role)` middleware:** Checks `req.user.role` against the required role; throws 403 if mismatch
- **Socket.io auth:** `io.use()` middleware extracts and verifies the access token from `socket.handshake.auth.token` before any event is handled
- **Password reset:** 6-digit OTP stored hashed in DB, 10 min TTL

---

## 7. Error Handling

`ApiError` class extends `Error` with `statusCode` and `code` fields. Feature code throws `ApiError`; `errorHandler` middleware catches it and formats the standard envelope:

```json
{ "success": false, "error": "Human message", "code": "MACHINE_CODE" }
```

Unhandled errors (unexpected `Error` instances) return 500 with a generic message — stack traces never reach the client in production.

---

## 8. Response Envelope

All routes return one of:
```json
{ "success": true, "data": { ... } }
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
{ "success": false, "error": "Human message", "code": "MACHINE_CODE" }
```

---

## 9. Mongoose Models (schemas defined at setup)

| Model | Key Fields |
|-------|-----------|
| `User` | name, email, password (hashed), role, phone, country, bio, photo, isActive, refreshToken, resetOtp, resetOtpExpiry |
| `Course` | title, description, price, currency, type, level, focus, thumbnail, status, teacher (ref), enrolledStudents ([ref]), recurringSchedule, availableSlots, meetLink |
| `Enrollment` | student (ref), course (ref), payment (ref), status |
| `Payment` | student, course, teacher, method, transactionId, screenshotUrl, amount, currency, status, adminNote, verifiedBy, verifiedAt |
| `Message` | room, sender (ref), content, type, readBy ([ref]) |
| `Ticket` | ticketNumber (auto), student, category, subject, description, attachmentUrl, status, priority, thread, assignedTo |
| `Settings` | singleton doc — paymentInstructions (map), platformName, logo, contactEmail |

---

## 10. Socket.io Architecture

Initialized in `config/socket.ts`, attached to the HTTP server in `server.ts`. Auth middleware runs on connect. Namespaces:

- `/chat` — private teacher-student messages, group course rooms (Phase 2), support rooms (Phase 2)
- `/notifications` — payment approved/rejected, class reminders, ticket updates

Events follow the spec in `2026-04-27-english-lms-design.md` §6.

---

## 11. Scripts

| Script | Command |
|--------|---------|
| Dev server | `npm run dev` (ts-node-dev) |
| Build | `npm run build` (tsc) |
| Start (prod) | `npm start` (node dist/server.js) |
| Seed admin | `npm run seed:admin` |

---

## 12. Phase Scope (this setup)

This scaffold covers the **foundation only** — the skeleton that all Phase 1 features plug into:
- Package setup, tsconfig, folder structure
- All Mongoose models defined
- Middleware stack wired
- Env validation
- Socket.io initialized
- Auth routes (register, login, refresh, logout, forgot-password, reset-password)
- Seed script

Feature routes (courses, payments, chat, tickets) are built on top in subsequent implementation steps.
