# Professional Backend Setup — Design Spec
**Date:** 2026-05-07  
**Status:** Approved  
**Scope:** Phase 1 MVP Backend Infrastructure

---

## 1. Overview

Set up a professional, production-ready Node.js + Express + TypeScript backend for the English Learning LMS platform. The backend will support the Phase 1 MVP features defined in the existing design spec (2026-04-27), with architecture that scales to Phases 2-3.

**Key Requirements:**
- Domain-driven modular architecture with shared infrastructure
- Comprehensive security (CORS, helmet, rate limiting, brute-force protection, sanitization, IP whitelisting)
- JWT authentication with role-based authorization
- MongoDB with Mongoose ODM (local dev + Atlas production)
- Cloudinary for file storage
- Resend for transactional emails
- Socket.io for real-time features
- Winston structured logging
- Standard test coverage (~75%) with Jest + Supertest

---

## 2. Architecture: Domain-Driven with Shared Infrastructure

### Folder Structure

```
server/
├── src/
│   ├── modules/              # Feature modules (domain logic)
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.validation.ts
│   │   │   └── __tests__/
│   │   ├── courses/
│   │   ├── payments/
│   │   ├── enrollments/
│   │   ├── users/
│   │   └── messages/
│   ├── models/               # All Mongoose models (shared)
│   │   ├── User.model.ts
│   │   ├── Course.model.ts
│   │   ├── Payment.model.ts
│   │   ├── Enrollment.model.ts
│   │   ├── Message.model.ts
│   │   └── Settings.model.ts
│   ├── middleware/           # Cross-cutting middleware
│   │   ├── authenticate.ts
│   │   ├── authorize.ts
│   │   ├── validate.ts
│   │   ├── rateLimiter.ts
│   │   ├── sanitize.ts
│   │   ├── ipWhitelist.ts
│   │   └── errorHandler.ts
│   ├── services/             # Shared services
│   │   ├── email.service.ts
│   │   ├── upload.service.ts
│   │   ├── logger.service.ts
│   │   └── socket.service.ts
│   ├── config/               # Configuration
│   │   ├── database.ts
│   │   ├── env.ts
│   │   ├── constants.ts
│   │   ├── cloudinary.ts
│   │   └── email.ts
│   ├── utils/                # Utilities
│   │   ├── asyncHandler.ts
│   │   ├── ApiError.ts
│   │   ├── jwt.ts
│   │   └── validators.ts
│   ├── types/                # TypeScript types
│   │   ├── express.d.ts
│   │   └── index.ts
│   ├── scripts/
│   │   └── seedAdmin.ts
│   ├── app.ts                # Express app setup
│   └── server.ts             # Server entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   └── helpers/
├── logs/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

**Why this approach:**
- Clear domain boundaries (auth, courses, payments) map to business features
- Shared infrastructure (middleware, services) stays DRY and reusable
- Models centralized since they're often shared across features
- Easy to add new features without touching existing code
- Testable in isolation (module tests + integration tests)

---

## 3. Technology Stack

### Core Dependencies

**Framework & Language:**
- `express` - Web framework
- `typescript` - Type safety
- `@types/node`, `@types/express` - TypeScript definitions

**Database:**
- `mongoose` - MongoDB ODM
- MongoDB local (dev) + MongoDB Atlas (production)

**Authentication & Security:**
- `jsonwebtoken` / `@types/jsonwebtoken` - JWT tokens
- `bcryptjs` / `@types/bcryptjs` - Password hashing
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `express-mongo-sanitize` - NoSQL injection prevention
- `validator` - Input validation helpers

**File Upload:**
- `multer` / `@types/multer` - File handling
- `cloudinary` - Cloud storage

**Email:**
- `resend` - Transactional email service

**Real-time:**
- `socket.io` / `@types/socket.io` - WebSocket connections

**Logging & Validation:**
- `winston` - Structured logging
- `express-validator` - Request validation
- `joi` - Schema validation (env vars)
- `dotenv` - Environment variables

**Utilities:**
- `compression` - Response compression
- `cookie-parser` - Cookie parsing

**Development:**
- `tsx` - TypeScript execution
- `nodemon` - Hot reload
- `jest` / `@types/jest` - Testing framework
- `supertest` / `@types/supertest` - API testing
- `mongodb-memory-server` - In-memory MongoDB for tests
- `eslint` / `@typescript-eslint/*` - Linting
- `prettier` - Code formatting

### Scripts (package.json)

```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "seed:admin": "tsx src/scripts/seedAdmin.ts"
  }
}
```

---

## 4. Core Infrastructure

### Database Connection (`src/config/database.ts`)

```typescript
import mongoose from 'mongoose';
import logger from '../services/logger.service';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.NODE_ENV === 'production'
      ? process.env.MONGODB_URI_PROD!
      : process.env.MONGODB_URI_DEV!;

    await mongoose.connect(mongoUri);
    
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
});
```

### Environment Validation (`src/config/env.ts`)

Uses Joi to validate all required environment variables on startup. Fails fast if configuration is invalid.

**Why:** Catch configuration errors at startup, not in production after deployment.

### Winston Logger (`src/services/logger.service.ts`)

**Configuration:**
- Development: colorized console output + debug level
- Production: JSON logs to files (error.log, combined.log) + info level
- Includes timestamps, request metadata, error stacks

**Why:** Structured logs are searchable and parseable. Console.log doesn't scale.

### Constants (`src/config/constants.ts`)

Type-safe enums for:
- User roles (student, teacher, admin)
- Course types (group, one-to-one, hybrid)
- Payment statuses (pending, approved, rejected)
- Payment methods (jazzcash, easypaisa, etc.)
- Currencies (PKR, USD)
- Course levels (beginner, intermediate, advanced)
- Course focus areas (speaking, grammar, IELTS, business, general)

**Why:** Single source of truth. Prevents typos and ensures consistency.

---

## 5. Authentication & Authorization

### User Model (`src/models/User.model.ts`)

**Fields:**
- `name`, `email`, `password` (hashed), `phone`, `country`
- `role`: student | teacher | admin
- `bio`, `photo`, `specializations` (for teachers)
- `isActive` (soft delete/suspend)
- `refreshToken` (stored for validation)
- `passwordResetOtp`, `passwordResetExpiry` (for password reset flow)

**Methods:**
- `comparePassword(candidatePassword)` - bcrypt comparison
- Pre-save hook to hash password automatically

**Indexes:**
- Unique on `email`

### JWT Strategy

**Access Token:**
- Payload: `{ userId, email, role }`
- Expiry: 15 minutes
- Secret: `JWT_ACCESS_SECRET`
- Transmitted: Authorization header (`Bearer <token>`)

**Refresh Token:**
- Payload: `{ userId, email, role }`
- Expiry: 7 days
- Secret: `JWT_REFRESH_SECRET`
- Transmitted: httpOnly cookie (XSS protection)
- Stored: in User model for validation

**Why separate secrets:** If access token is compromised, refresh token remains secure. Can invalidate refresh tokens server-side.

### Authentication Middleware (`src/middleware/authenticate.ts`)

1. Extract token from `Authorization: Bearer <token>`
2. Verify token with `JWT_ACCESS_SECRET`
3. Check user still exists and is active
4. Attach `req.user = { userId, email, role, _id }` for downstream use
5. Throw 401 if any step fails

**Extends Express Request globally:**
```typescript
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { _id: string };
    }
  }
}
```

### Authorization Middleware (`src/middleware/authorize.ts`)

```typescript
authorize(...allowedRoles: string[])
```

- Checks `req.user.role` against allowed roles
- Throws 403 Forbidden if role not allowed
- Used after `authenticate` middleware

**Example:**
```typescript
router.post('/courses', authenticate, authorize('teacher', 'admin'), createCourse);
```

### Password Reset Flow

1. User requests reset → generates 6-digit OTP
2. OTP hashed and stored in `User.passwordResetOtp` with 10-minute expiry
3. Email sent with plain OTP
4. User submits email + OTP + new password
5. Verify OTP hash and expiry
6. Update password, clear OTP fields

**Why OTP over magic links:** Simpler for users, works across devices, no URL parsing issues.

### Auth Service (`src/modules/auth/auth.service.ts`)

**Methods:**
- `register(data)` - Create student account, return tokens
- `login(email, password)` - Verify credentials, return tokens
- `refreshTokens(refreshToken)` - Validate and issue new token pair
- `requestPasswordReset(email)` - Send OTP email
- `resetPassword(email, otp, newPassword)` - Verify OTP and reset

**Business logic lives here, not in controllers.**

---

## 6. Security Middleware Stack

### Rate Limiting (`src/middleware/rateLimiter.ts`)

**General API limiter:**
- 100 requests per 15 minutes per IP
- Applied to all `/api` routes

**Auth endpoints limiter:**
- 5 attempts per 15 minutes per IP
- Applied to login, register, password reset
- Skips successful requests (only counts failures)

**Payment submission limiter:**
- 10 submissions per hour per IP
- Prevents spam

**Why:** Protects against brute-force attacks, DoS, and abuse.

### Request Sanitization (`src/middleware/sanitize.ts`)

**MongoDB injection protection:**
- Uses `express-mongo-sanitize` to strip `$` and `.` from user input
- Replaces with `_`

**XSS protection:**
- Custom middleware to strip `<script>` tags from all string inputs
- Recursively sanitizes `req.body`, `req.query`, `req.params`

**Why:** Prevents NoSQL injection and script injection attacks.

### IP Whitelisting for Admin (`src/middleware/ipWhitelist.ts`)

- Only applies to requests where `req.user.role === 'admin'`
- Checks `req.ip` against `ADMIN_IP_WHITELIST` env var (comma-separated)
- Disabled if whitelist empty or `NODE_ENV=development`
- Throws 403 if IP not whitelisted

**Why:** Extra security layer for admin operations (payment verification, user management).

### Validation Middleware (`src/middleware/validate.ts`)

Wraps `express-validator` chains:
1. Runs all validation rules
2. Collects errors
3. Returns 400 with structured error array if validation fails
4. Calls `next()` if valid

**Error format:**
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "fields": [
    { "field": "email", "message": "Invalid email" }
  ]
}
```

### Error Handler (`src/middleware/errorHandler.ts`)

Centralized error handling for:
- `ApiError` instances (custom errors)
- Mongoose validation errors
- JWT errors (JsonWebTokenError, TokenExpiredError)
- Mongoose duplicate key errors (E11000)
- Generic 500 errors

**Logs all errors** with Winston including:
- Error message and stack
- Request URL, method, IP
- User ID (if authenticated)

**Production behavior:** Hides error details, shows generic "Internal server error"

### ApiError Class (`src/utils/ApiError.ts`)

```typescript
new ApiError(statusCode, message, code, details?)
```

**Example:**
```typescript
throw new ApiError(404, 'Course not found', 'NOT_FOUND');
throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', fieldErrors);
```

**Why:** Consistent error format across API. Easy to identify error types.

### Async Handler (`src/utils/asyncHandler.ts`)

Wraps async route handlers to catch errors and pass to error middleware:

```typescript
router.get('/', asyncHandler(async (req, res) => {
  // Any thrown error caught and passed to errorHandler
}));
```

**Why:** Eliminates try-catch boilerplate in every route handler.

---

## 7. Shared Services

### Email Service (`src/services/email.service.ts`)

**Provider:** Resend

**Function:** `sendEmail({ to, subject, html, text })`

**Email templates:**
- `enrollmentConfirmation` - Sent when payment approved
- `paymentApproved` - Payment verification success
- `paymentRejected` - Payment verification failed with reason
- `teacherCredentials` - Auto-generated password for new teacher accounts
- `passwordResetOtp` - OTP for password reset

**Why Resend:** Modern API, great deliverability, generous free tier, good developer experience.

### File Upload Service (`src/services/upload.service.ts`)

**Provider:** Cloudinary

**Multer configuration:**
- Memory storage (buffer uploaded to Cloudinary)
- File filter: only JPG, JPEG, PNG
- Size limit: 5MB

**Function:** `uploadToCloudinary(file, folder)`

**Transformations:**
- Max dimensions: 1920x1080 (limit)
- Auto quality optimization

**Cleanup:** `deleteFromCloudinary(publicId)` for old files

**Why Cloudinary:** Automatic optimization, CDN, URLs ready for production, free tier sufficient for MVP.

### Logger Service (`src/services/logger.service.ts`)

**Winston transports:**
- File: `logs/error.log` (errors only)
- File: `logs/combined.log` (all levels)
- Console: development only, colorized

**Log levels:**
- Development: debug and above
- Production: info and above

**Metadata:** Service name, timestamps, error stacks

**Usage:**
```typescript
logger.info('User logged in', { userId });
logger.error('Payment verification failed', error);
```

### Socket.io Service (`src/services/socket.service.ts`)

**Initialization:** `initializeSocket(httpServer)` - called in `server.ts`

**Authentication:** JWT token in `socket.handshake.auth.token`

**Auto-join:** Each user joins `user:<userId>` room for personal notifications

**Events:**
- `join_room`, `leave_room` - Course chat, private chat, support rooms
- `send_message` → `message_received` - Chat messages (business logic in messages module)
- `user_typing` → `typing_indicator` - Typing status

**Helper functions:**
- `emitToUser(userId, event, data)` - Send to specific user
- `emitToRoom(roomId, event, data)` - Broadcast to room

**Why:** Centralized Socket.io setup. Modules can import helpers without managing connections.

---

## 8. Mongoose Models (Phase 1)

### User Model (already covered in Auth section)

### Course Model (`src/models/Course.model.ts`)

**Fields:**
- Basic: `title`, `description`, `price`, `currency`, `thumbnail`
- Classification: `type` (group/one-to-one/hybrid), `level`, `focus`
- Sessions: `totalSessions`, `sessionDuration` (minutes)
- Status: `draft` | `published` | `archived`
- Relationships: `teacher` (ref User), `enrolledStudents` ([ref User])
- Scheduling:
  - `recurringSchedule`: `[{ day, time }]` for group courses
  - `availableSlots`: `[{ date, startTime, endTime, isBooked, bookedBy }]` for 1-to-1
- `meetLink`: Zoom/Google Meet URL
- `maxStudents`: capacity for group/hybrid

**Indexes:**
- Composite: `{ status, type, level, focus }` for browse/filter queries
- Single: `{ teacher }` for teacher's course list

### Payment Model (`src/models/Payment.model.ts`)

**Fields:**
- Relationships: `student`, `course`, `teacher` (all refs)
- Payment: `method`, `transactionId`, `screenshotUrl`, `amount`, `currency`
- Verification: `status` (pending/approved/rejected), `adminNote`, `rejectionReason`
- Audit: `verifiedBy` (ref admin), `verifiedAt`

**Indexes:**
- `{ status, createdAt }` for admin pending queue (sort oldest first)
- `{ student }`, `{ course }` for queries

### Enrollment Model (`src/models/Enrollment.model.ts`)

**Fields:**
- Relationships: `student`, `course`, `teacher`, `payment` (all refs)
- Timing: `enrolledAt`, `expiresAt` (optional)
- Status: `isActive` (for soft delete/suspension)
- Progress: `{ sessionsAttended, totalSessions, lastAttendedAt }`

**Indexes:**
- Unique: `{ student, course }` - one enrollment per student per course
- Composite: `{ student, isActive }` for student dashboard

**Created:** Automatically when admin approves payment

### Message Model (`src/models/Message.model.ts`)

**Fields:**
- `room`: string ID (`course:<id>`, `private:<student>_<teacher>_<course>`, `support:<studentId>`)
- `sender`: ref User
- `content`: message text
- `type`: group | private | support
- `readBy`: [ref User] for read receipts

**Indexes:**
- `{ room, createdAt }` for fetching chat history sorted by time

### Settings Model (`src/models/Settings.model.ts`)

**Fields:**
- `platformName`, `logo`, `contactEmail`
- `paymentInstructions`: Array of `{ method, accountName, accountNumber, iban, swiftCode, instructions }`
- `emailNotifications`: Toggles for enrollment, payment approval/rejection emails

**Singleton:** Only one Settings document exists, edited by admin

**Why:** Admin-configurable payment instructions (not hardcoded). Supports all payment methods dynamically.

---

## 9. API Module Structure

All modules follow: **routes → controller → service → model**

### Auth Module (`src/modules/auth/`)

**Routes:**
- `POST /api/auth/register` - Student self-registration
- `POST /api/auth/login` - All roles login
- `POST /api/auth/refresh` - Get new access token
- `POST /api/auth/forgot-password` - Request OTP
- `POST /api/auth/reset-password` - Submit OTP + new password
- `POST /api/auth/logout` - Clear refresh token

**Validations:**
- Email format, password min 8 chars, phone number format
- Rate limiting on all auth endpoints (5 attempts / 15 min)

**Controllers:**
- Thin wrappers around service methods
- Set refresh token as httpOnly cookie
- Return standardized `{ success, data }` responses

**Service:** Business logic in `auth.service.ts` (covered in section 5)

### Courses Module (`src/modules/courses/`)

**Routes:**
- `GET /api/courses` - Browse/filter (public)
- `GET /api/courses/:id` - Course detail (public)
- `POST /api/courses` - Create (teacher/admin only)
- `PUT /api/courses/:id` - Update (teacher/admin only)
- `DELETE /api/courses/:id` - Delete (teacher/admin only)
- `GET /api/courses/teacher/my-courses` - Teacher's courses (authenticated teacher)

**Query params for browse:**
- `type`, `level`, `focus`, `minPrice`, `maxPrice`
- `page`, `limit` (pagination)

**Response includes:**
- `data`: array of courses
- `pagination`: `{ page, limit, total, totalPages }`

**Authorization:**
- Public can browse and view details
- Only teachers/admins can CRUD their own courses

### Payments Module (`src/modules/payments/`)

**Routes:**
- `POST /api/payments` - Submit payment (student only)
- `GET /api/payments/my-payments` - Student's payment history
- `GET /api/payments/pending` - Admin pending queue
- `PATCH /api/payments/:id/verify` - Admin approves payment
- `PATCH /api/payments/:id/reject` - Admin rejects payment

**Submit payment:**
- Uses `multer.single('screenshot')` middleware
- Validates: method, transactionId, amount, currency
- Uploads screenshot to Cloudinary
- Creates Payment with status=pending
- Notifies admin via Socket.io

**Verify payment (admin only):**
- Updates Payment status to approved
- Creates Enrollment
- Adds student to Course.enrolledStudents
- Sends email to student
- Notifies student via Socket.io

**Reject payment (admin only):**
- Updates Payment status to rejected
- Requires rejection reason
- Sends email to student with reason
- Notifies student via Socket.io

**Rate limiting:** 10 payment submissions per hour

### Users Module (`src/modules/users/`)

**Routes:**
- `GET /api/users/profile` - Get own profile (authenticated)
- `PUT /api/users/profile` - Update own profile
- `POST /api/users/teachers` - Admin creates teacher account
- `GET /api/users/students` - Admin lists students
- `GET /api/users/teachers` - Admin lists teachers
- `PATCH /api/users/:id/suspend` - Admin suspends user (sets isActive=false)

**Teacher creation (admin only):**
- Admin provides: name, email, bio, specializations
- Password auto-generated (strong random string)
- Email sent to teacher with credentials
- Teacher must change password on first login

### Enrollments Module (`src/modules/enrollments/`)

**Routes:**
- `GET /api/enrollments/my-enrollments` - Student's enrollments
- `GET /api/enrollments/:id` - Single enrollment detail

**Automatic creation:** When admin approves payment (in payments service)

**Response includes:**
- Populated course and teacher details
- Progress tracking

### Messages Module (`src/modules/messages/`)

**Routes:**
- `GET /api/messages/:roomId` - Fetch chat history (paginated)
- `POST /api/messages` - Send message (also handled by Socket.io)
- `PATCH /api/messages/:id/read` - Mark message as read

**Room access control:**
- Group chat: only enrolled students + course teacher
- Private chat: only the two participants
- Support chat: student + admins

**Socket.io integration:**
- Real-time messages via Socket.io events
- HTTP endpoints for history and fallback

---

## 10. Main App Setup

### Express App (`src/app.ts`)

**Middleware stack (order matters):**
1. `helmet()` - Security headers
2. `cors({ origin: CLIENT_URL, credentials: true })` - CORS
3. `express.json()`, `express.urlencoded()` - Body parsing
4. `cookieParser()` - Cookie parsing
5. `compression()` - Response compression
6. `sanitizeMongoose`, `sanitizeXSS` - Input sanitization
7. `apiLimiter` - Rate limiting on `/api/*`
8. Route handlers
9. 404 handler
10. `errorHandler` - Error handling (must be last)

**Route mounting:**
```typescript
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/messages', messagesRoutes);
```

**Health check:** `GET /health` returns `{ status: 'ok', timestamp }`

### Server Entry (`src/server.ts`)

**Startup sequence:**
1. Connect to MongoDB
2. Create HTTP server
3. Initialize Socket.io
4. Start listening on PORT

**Graceful shutdown:** SIGINT handler closes MongoDB connection

---

## 11. Testing Strategy

### Structure

```
tests/
├── unit/               # Isolated unit tests (services, utils, middleware)
├── integration/        # API endpoint tests (full request/response cycle)
├── fixtures/           # Test data factories
└── helpers/            # Test utilities (testDb, testServer)
```

### Jest Configuration

- Preset: `ts-jest`
- Test environment: `node`
- Coverage threshold: 75% lines, 70% branches/functions
- Exclude: `src/server.ts`, type definitions

### Test Database

Uses `mongodb-memory-server` for fast, isolated tests:
- Spins up in-memory MongoDB
- No persistence between test runs
- Parallel test execution safe

### Test Fixtures

Factory functions for creating test data:
- `createTestStudent()`, `createTestTeacher()`, `createTestAdmin()`
- `createTestCourse(overrides)`, `createTestPayment(overrides)`
- Ensures unique emails, valid data

### Integration Tests

Use `supertest` to hit API endpoints:
- Test happy path + error cases (400, 401, 403, 404, 409, 500)
- Validate response format matches API conventions
- Check database state after mutations
- Test auth flows, payment flows, enrollment flows

**Example:** Auth tests cover:
- Registration success
- Registration with duplicate email (409)
- Login success
- Login with invalid credentials (401)
- Token refresh
- Password reset flow

### Unit Tests

Test individual functions in isolation:
- JWT generation/verification
- Password hashing/comparison
- Authentication middleware
- Authorization middleware
- Email service (mocked Resend)
- Upload service (mocked Cloudinary)

### Coverage Priorities

**Must test (100% coverage):**
- Auth endpoints
- Payment verification flow
- JWT utilities
- Authentication middleware
- Authorization middleware

**Should test (75%+ coverage):**
- All API endpoints
- Services
- Validation logic
- Error handling

**Can skip for MVP:**
- Socket.io events (manual testing)
- Logger (basic coverage only)
- Edge case business logic

**Target: 75% overall, 100% on auth and payments**

---

## 12. Development Workflow

### Initial Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Generate JWT secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. Setup MongoDB (local or Atlas)
5. Setup Cloudinary account
6. Setup Resend account
7. Start dev server: `npm run dev`
8. Seed admin: `npm run seed:admin`

### Environment Variables (.env.example)

```env
# App
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI_DEV=mongodb://localhost:27017/english-lms-dev
MONGODB_URI_PROD=

# JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend
RESEND_API_KEY=
EMAIL_FROM=English LMS <noreply@yourdomain.com>

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ADMIN_IP_WHITELIST=

# Admin Seed
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=
```

### Admin Seeding Script

```typescript
// src/scripts/seedAdmin.ts
// Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env
// Creates admin user if doesn't exist
// Exits with error if admin already exists
```

**Run once:** `npm run seed:admin`

### Development Best Practices

1. Run tests before commits: `npm test`
2. Type-check: `npm run build`
3. Never hardcode secrets
4. Follow API conventions (.claude/rules/)
5. Keep controllers thin
6. Validate all inputs
7. Handle errors with ApiError
8. Use Winston logger, not console.log
9. Write tests for new features (maintain 75%)
10. Document complex logic with comments

---

## 13. Pre-Deployment Checklist

**Environment:**
- [ ] All env vars configured in production
- [ ] MongoDB Atlas cluster created
- [ ] Cloudinary production account
- [ ] Resend domain verified
- [ ] Strong JWT secrets (32+ chars)
- [ ] Admin IP whitelist configured

**Security:**
- [ ] `NODE_ENV=production`
- [ ] CORS origin = actual client URL
- [ ] Rate limiting tuned for production load
- [ ] Secrets not in code
- [ ] HTTPS enabled

**Database:**
- [ ] Production MongoDB connection tested
- [ ] Admin user seeded
- [ ] Indexes created (automatic via Mongoose)

**Code:**
- [ ] All tests passing
- [ ] No console.logs
- [ ] Build succeeds: `npm run build`
- [ ] Production start works: `npm start`

**Monitoring:**
- [ ] Logs writing to files
- [ ] Error tracking configured (optional: Sentry in Phase 2)

---

## 14. TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## 15. Phase 1 MVP Feature Coverage

This backend setup supports all Phase 1 features from the original design spec:

✅ **Auth:** JWT access + refresh tokens, role-based auth, password reset  
✅ **Users:** Student self-registration, admin creates teachers, user management  
✅ **Courses:** CRUD for all 3 types (group, one-to-one, hybrid), scheduling models  
✅ **Payments:** Submit with screenshot, admin verification queue, approve/reject  
✅ **Enrollments:** Auto-created on payment approval, student dashboard  
✅ **Messages:** Private teacher-student chat (Socket.io + HTTP fallback)  
✅ **Email:** Enrollment confirmation, payment status, password reset  
✅ **Real-time:** Socket.io for chat and notifications  
✅ **Admin Dashboard:** User management, payment verification, settings  
✅ **Security:** Comprehensive (CORS, helmet, rate limiting, sanitization, IP whitelist)  
✅ **Testing:** Standard coverage (~75%) with Jest  

**Deferred to Phase 2:**
- Group course chat rooms
- Support ticket system
- Advanced scheduling UX
- Class reminder notifications

---

## 16. Scalability & Phase 2/3 Considerations

**Architecture supports future growth:**
- Modular structure makes adding features easy (add new module, mount routes)
- Shared services reusable (email, upload, logger)
- Models support Phase 2 fields (can add without breaking)
- Socket.io foundation ready for group chat and support
- API versioning can be added (`/api/v1`, `/api/v2`)

**Performance optimization opportunities (Phase 3):**
- Redis caching layer
- Database query optimization (explain plans)
- CDN for static assets
- Load balancing
- Database sharding

**Monitoring & observability (Phase 2/3):**
- Sentry for error tracking
- Application performance monitoring (APM)
- Database performance metrics
- API analytics

---

## 17. Success Criteria

Backend setup is complete when:

1. ✅ All folder structure created
2. ✅ All dependencies installed and configured
3. ✅ Database connection works (local + Atlas)
4. ✅ Auth flow works (register, login, refresh, password reset)
5. ✅ Course CRUD works with proper authorization
6. ✅ Payment submission and verification flow works
7. ✅ File upload to Cloudinary works
8. ✅ Email sending via Resend works
9. ✅ Socket.io connections authenticated
10. ✅ All middleware properly configured (security, validation, errors)
11. ✅ Admin seeding script works
12. ✅ All tests passing with 75%+ coverage
13. ✅ TypeScript builds without errors
14. ✅ API follows conventions in `.claude/rules/`
15. ✅ Production build starts successfully

---

**Design approved and ready for implementation planning.**
