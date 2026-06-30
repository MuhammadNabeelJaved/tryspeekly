# TrySpeekly — English Learning Platform

A modern, full-stack **Learning Management System (LMS)** for English-language education. It connects students, instructors, and administrators with course management, payments, real-time messaging, certificates, an AI assistant, and rich growth tooling (referrals, coupons, offers, newsletters).

> **Monorepo:** a `client/` (React + TypeScript) and a `server/` (Node.js + Express, **JavaScript ES Modules**). The two run as independent apps.

---

## ✨ Features

### For Students (`/dashboard/*`)
- 📚 Browse and enrol in courses; submit payment proof for approval
- 📊 Track session attendance and progress
- 🎓 Earn certificates on course completion (with shareable credential URL)
- 💬 Real-time messaging with instructors (Socket.io)
- 🔔 Live notifications
- 🎯 Apply for financial aid; redeem coupons, offers & referral rewards

### For Instructors / Teachers (`/instructor/*`)
- 📖 Create and manage courses, syllabus, and materials
- 👥 Manage enrolled students and track attendance
- 📝 Create and grade assignments
- 📹 Schedule and run live classes
- 💬 Message students; view earnings/salary

### For Administrators (`/admin/*`)
- 👤 User management (students, instructors, team members)
- 📚 Course approval workflow and oversight
- 💰 Payments, financial aid, salaries & payouts — dual-currency **PKR / USD**
- 🎁 Referrals, coupons & promotional offers
- 📣 Newsletter campaigns and contact/support inboxes
- 📄 CMS, SEO, FAQs, announcements & site settings
- 📊 Platform-wide analytics and activity logs
- 🌍 Geo-access controls (country blocking)
- 🔍 Per-page SEO editor with activity log (last-edited-by tracking)

### Team Members (`/team/*`)
- 🔐 Permission-scoped staff access to specific admin sections

### 🤖 AI Assistant (all users)
- A floating chatbot that answers from **live database knowledge** (courses, instructors, FAQs, blog, site settings) and refreshes automatically as data changes
- **Role-aware**: signed-in users get answers about their own dashboard data; guests get public info and are invited to sign in
- Politely declines off-topic questions; renders Markdown with clickable in-app navigation
- **Cost-efficient**: greetings/FAQ answered without an API call, prompt caching, and per-IP rate limiting on the paid endpoint
- Powered by **Anthropic Claude (Haiku)**

---

## 🧰 Tech Stack

### Frontend (`client/`)
- **React 19** + **TypeScript** (strict)
- **Vite 8** (rolldown) — build & dev server, with vendor code-splitting
- **Tailwind CSS 4** — styling
- **React Router 7** — routing (lazy-loaded routes)
- **Framer Motion** — animations
- **React Hook Form** — forms
- **Phosphor Icons** — icons
- **Socket.io-client** — real-time
- **Vitest** + React Testing Library — tests

### Backend (`server/`)
- **Node.js** + **Express 5** — **JavaScript (ES Modules)**, not TypeScript
- **MongoDB** + **Mongoose** — database & ODM
- **Socket.io** — real-time notifications & messaging
- **JWT** (access + refresh) + **bcryptjs** — auth & password hashing
- **Joi** — request validation
- **Cloudinary** (via Multer) — image/document uploads
- **Resend** — transactional & campaign email
- **Anthropic SDK** — AI assistant

### Security & Middleware
- **Helmet** — security headers
- **CORS** with credentials
- **express-rate-limit** — global limiter + tighter per-IP limit on the AI endpoint
- **compression** + **morgan** — gzip & request logging
- JWT secret strength is validated at boot (refuses weak/default secrets in production)

---

## ✅ Prerequisites
- **Node.js >= 18**
- **MongoDB** (local or Atlas)
- **npm**
- A **Cloudinary**, **Resend**, and **Anthropic** account for full functionality

---

## 🚀 Getting Started

### 1. Clone
```bash
git clone https://github.com/MuhammadNabeelJaved/english-learning-platform.git
cd english-learning-platform
```

### 2. Install dependencies
```bash
cd client && npm install
cd ../server && npm install
```

### 3. Environment configuration

**`client/.env`** (see `client/.env.example`)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# Site / brand + public contact details (single source of truth)
VITE_SITE_URL=https://tryspeekly.com
VITE_SITE_NAME=TrySpeekly
VITE_CONTACT_EMAIL=hello@tryspeekly.com
VITE_SUPPORT_EMAIL=support@tryspeekly.com
VITE_PRIVACY_EMAIL=privacy@tryspeekly.com
VITE_PAYMENTS_EMAIL=payments@tryspeekly.com
VITE_CONTACT_PHONE=+92 325 432 0179
VITE_CONTACT_WHATSAPP=923254320179
VITE_CONTACT_ADDRESS=
```

**`server/.env`**
```env
NODE_ENV=development
PORT=5000
# Production: set to the deployed frontend origin, e.g. https://tryspeekly.com
CLIENT_URL=http://localhost:5173

# Site / brand + public contact details (single source of truth)
SITE_URL=https://tryspeekly.com
SITE_NAME=TrySpeekly
CONTACT_EMAIL=hello@tryspeekly.com
SUPPORT_EMAIL=support@tryspeekly.com
PRIVACY_EMAIL=privacy@tryspeekly.com
PAYMENTS_EMAIL=payments@tryspeekly.com
CONTACT_PHONE=+92 325 432 0179
CONTACT_WHATSAPP=923254320179

# Database (MongoDB local or Atlas)
MONGO_URI=mongodb://localhost:27017
DB_NAME=english

# Auth — use strong, unique 32+ char random secrets (required in production)
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-secret
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# Cloudinary (file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Resend) — add & verify tryspeekly.com in Resend first
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=TrySpeekly <hello@tryspeekly.com>

# AI Assistant (Anthropic) — optional; bot falls back gracefully if unset
ANTHROPIC_API_KEY=your-anthropic-api-key
```

> Generate a strong secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### 4. Run (development)
```bash
# Terminal 1 — backend  → http://localhost:5000
cd server && npm run dev

# Terminal 2 — frontend → http://localhost:5173
cd client && npm run dev
```

### 5. Production build (frontend)
```bash
cd client
npm run build      # tsc -b && vite build
npm run preview
```
The backend runs the same in production: `cd server && npm start` (`NODE_ENV=production`).

---

## 📜 Scripts

### Client
| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck (`tsc -b`) + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm test` | Run Vitest |

### Server
| Script | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start the server (`node index.js`) |
| `npm run check` | Import-graph sanity check (catches syntax/import errors) |

---

## 🗂️ Project Structure

```
english-learning-platform/
├── client/                       # React + TypeScript frontend (port 5173)
│   └── src/
│       ├── App.tsx               # Router, lazy routes, error boundary
│       ├── components/           # Shared UI (incl. AIChatWidget)
│       ├── context/              # AuthContext, SocketContext, GeoContext
│       ├── lib/ · config/ · services/   # axios client, env, API services
│       └── pages/
│           ├── admin/            # Admin dashboard
│           ├── instructor/       # Instructor dashboard
│           ├── student/          # Student dashboard
│           └── team/             # Team-member dashboard
│
├── server/                       # Express backend (port 5000) — ESM JavaScript
│   ├── index.js                  # HTTP server + Socket.io entry point
│   ├── app.js                    # Express app, middleware, route mounting
│   └── src/
│       ├── database/             # MongoDB connection
│       ├── middlewares/          # auth (JWT), multer (uploads), geo
│       ├── models/               # Mongoose models
│       ├── controllers/          # One controller per resource
│       ├── routes/               # Routes mounted at /api/v1/<resource>
│       ├── services/             # Business logic (AI knowledge, personal context, …)
│       └── utils/                # apiResponse, apiErrors, asyncHandler, cloudinary, email
│
├── docs/                         # Specs & implementation plans
├── CLAUDE.md                     # Project conventions
└── README.md
```

---

## 🔌 API Overview

All routes are versioned under **`/api/v1/`** and return a consistent envelope:
```json
{ "success": true, "message": "...", "data": { } }
{ "success": false, "message": "Human-readable error" }
```

| Area | Example |
|---|---|
| Health | `GET /api/health` |
| Auth | `POST /api/v1/users/register`, `POST /api/v1/users/login`, `POST /api/v1/users/refresh-token` |
| Courses | `GET /api/v1/courses`, `POST /api/v1/courses` |
| Enrolments | `POST /api/v1/enrollments`, `GET /api/v1/enrollments/my` |
| Payments | `POST /api/v1/payments`, `GET /api/v1/payments/my` |
| AI chat | `POST /api/v1/ai-chat`, `GET`/`DELETE /api/v1/ai-chat/session` |

Resources also include: `blogs`, `certificates`, `financial-aid`, `assignments`, `live-classes`, `messages`, `reviews`, `referrals`, `coupons`, `offers`, `newsletter`, `team`, `support`, `notifications`, `faqs`, `announcements`, `site-settings`, `stats`, `seo`, `salaries`, `activity-logs`.

Conventions are documented in `.claude/rules/api-conventions.md`.

---

## 🔐 Authentication & Roles

- JWT access + refresh tokens (sent via `Authorization: Bearer` header and httpOnly cookies)
- Protected routes use `authenticate`; role gating via `authorize(role)` / `authorizeTeamPage(...)`

| Role | Prefix | Scope |
|---|---|---|
| `admin` | `/admin/*` | Full platform management |
| `teacher` | `/instructor/*` | Course creation & student management |
| `student` | `/dashboard/*` | Courses, assignments, certificates |
| `team_member` | `/team/*` | Permission-scoped staff access |

---

## 🧪 Testing
- **Client:** Vitest + React Testing Library — `cd client && npm test`
- **Server:** no automated test harness yet. Verify changes with `npm run check` (import-graph compile check). If tests are added, the convention is Jest + Supertest.

---

## 🔍 SEO Infrastructure

| Feature | Detail |
|---|---|
| **Canonical tags** | Auto-generated on every page — eliminates duplicate-canonical issues |
| **Open Graph** | Static homepage OG (`og-image.png` 1200×630); per-course OG meta; per-blog dynamic OG via Vercel serverless function so social crawlers (FB/WhatsApp/Twitter) get correct previews without JS |
| **JSON-LD schemas** | Structured data injected on course + blog pages |
| **Dynamic sitemap** | Vercel proxy forwards `/sitemap.xml` → Render backend so the sitemap stays server-rendered and always fresh |
| **IndexNow** | Blog publish/update auto-pings Bing & Yandex for instant indexing (`server/src/utils/indexnow.js`) |
| **Meta titles & descriptions** | Per-page fallback meta rewritten; admin SEO editor (slug-keyed) stored in DB, injectable by team members |
| **Google Translate** | Script deferred off the critical path to avoid render-blocking |

---

## ⚡ Performance Notes
- **GeoWall removed from first paint** — geo-check runs in the background; users see content immediately (significant FCP improvement)
- **LCP optimised** — render-blocking scripts deferred; `preconnect` hints updated
- **CLS prevention** — below-fold elements use `whileInView` opacity animation (no layout shift on load)
- Routes are lazy-loaded (`React.lazy` + `Suspense`)
- Vite `manualChunks` split React, Framer Motion, and the Markdown renderer into separate, long-cacheable chunks
- Heavy libraries (PDF/canvas export, rich-text editor) load on demand only
- The AI chatbot's Markdown renderer is lazy-loaded so it stays off first paint

---

## 🚢 Deployment

| Layer | Platform | Notes |
|---|---|---|
| Frontend | **Vercel** | Auto-deploys from `main`; hosts OG-blog serverless fn + sitemap proxy |
| Backend | **Render** | Auto-deploys from `main`; set `NODE_ENV=production` |
| Database | **MongoDB Atlas** | Set `MONGO_URI` to Atlas connection string |
| Media | **Cloudinary** | Images & documents |
| Email | **Resend** | Verify `tryspeekly.com` domain before sending |

> After deploying, set `CLIENT_URL` (backend) and `VITE_API_URL` (frontend) to the live URLs.

---

## 🤝 Contributing

1. Branch from `main`: `feat/<name>` or `fix/<name>`
2. Commit using **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `perf:`, `test:`)
3. Open a Pull Request (squash-merge to keep history clean)

---

## 📄 License

Proprietary — all rights reserved. Not licensed for redistribution.

## 📬 Support

- Open an issue on GitHub
- Email: muhammadnabeeljavede@gmail.com

---

**Happy Learning! 📚✨**
