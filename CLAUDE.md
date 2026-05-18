# English Learning Platform — Claude Memory

## Project Overview
Full-stack English learning LMS (Learning Management System) with a `client/` (frontend) and `server/` (backend) monorepo structure. Supports three user roles: **admin**, **student**, and **teacher** (instructor).

## Stack
- **Client:** React + TypeScript + Tailwind CSS + Vite
- **Server:** Node.js + Express (v5) + **JavaScript (ES Modules)** + MongoDB/Mongoose
- **Auth:** JWT-based authentication (access tokens via HTTP headers + cookies)
- **Real-time:** Socket.io for notifications/messaging
- **File Storage:** Cloudinary (images, documents via Multer)
- **Email:** Nodemailer
- **Validation:** Joi
- **Security:** Helmet, express-rate-limit (100 req / 15 min global)

## Project Structure
```
Project/
├── client/                   # React frontend (port 5173)
│   └── src/
│       ├── App.tsx            # Router, lazy-loaded routes, error boundary
│       ├── context/           # AuthContext, SocketContext
│       ├── components/        # Shared UI components + auth/ sub-folder
│       └── pages/
│           ├── admin/         # AdminPage, AdminCourses, AdminStudents, ...
│           ├── student/       # StudentDashboard, StudentCourses, ...
│           └── instructor/    # InstructorDashboard, InstructorCourses, ...
└── server/                   # Express backend API (port 5000)
    ├── index.js               # Entry point: HTTP server + Socket.io setup
    ├── app.js                 # Express app, middleware, route registration
    └── src/
        ├── database/          # db.js — MongoDB connection
        ├── middlewares/       # auth.js (JWT verify), multer.js (file upload)
        ├── models/            # Mongoose models (user, course, enrollment, payment,
        │                      #   message, blog, certificate, financial-aid,
        │                      #   support, notification, assignment, contact,
        │                      #   faq, announcement, site-settings)
        ├── controllers/       # One controller per model
        ├── routes/            # One route file per model (mounted at /api/v1/<resource>)
        └── utils/             # apiResponse.js, apiErrors.js, asyncHandler.js,
                               #   cloudinary.js, email.js
```

## API Conventions
- **Base prefix:** `/api/v1/<resource>` (all routes are versioned)
- **Health check:** `GET /api/health`
- All routes and conventions: `.claude/rules/api-conventions.md`
- **Validation:** Use `Joi` (not express-validator) for request body validation
- **Response format:**
  ```json
  { "success": true, "message": "...", "data": { ... } }
  { "success": false, "message": "Human-readable error" }
  ```

## User Roles
| Role | Route Prefix | Description |
|------|-------------|-------------|
| `admin` | `/admin/*` | Full platform management |
| `student` | `/dashboard/*` | Course access, assignments, certificates |
| `teacher` | `/instructor/*` | Course creation, student management |

## Key Conventions
- **Server is JavaScript** (ES Modules, `"type": "module"`) — NOT TypeScript
- Client is TypeScript strict — no `any` types unless absolutely necessary
- Prefer functional components and React hooks on the client
- RESTful API design on the server; follow conventions in `.claude/rules/api-conventions.md`
- All code style rules live in `.claude/rules/code-style.md`
- Testing patterns live in `.claude/rules/testing.md`
- Route handlers are thin — business logic lives in controller/service files
- Never expose stack traces in API responses

## Git Workflow
- Branch from `main` for features: `feat/<name>`
- Branch from `main` for fixes: `fix/<name>`
- Squash-merge PRs to keep history clean

## Environment
- Client runs on port `5173` (Vite)
- Server runs on port `5000`
- `.env` files are gitignored — never commit secrets
- Required env vars: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `CLIENT_URL`,
  `CLOUDINARY_*`, `NODEMAILER_*`

## Custom Commands
- `/project:review` — review code quality and security
- `/project:fix-issue` — triage and fix a reported bug
- `/project:deploy` — run deployment checklist
