# Backend Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the full Express + TypeScript backend foundation — package setup, all Mongoose models, middleware stack, Socket.io, and auth routes (register, login, refresh, logout, password reset) — ready for feature development.

**Architecture:** Feature-based modular structure under `server/src/features/`. Shared models in `server/src/models/`. Config, middleware, and utils are top-level concerns. Auth is the only feature implemented in this plan; all other feature folders remain as stubs.

**Tech Stack:** Node.js, Express, TypeScript, Mongoose, Zod (env + validation), JWT (access + refresh), bcryptjs, Socket.io, Multer, Nodemailer, ts-node-dev, Jest + Supertest

---

## File Map

| File | Responsibility |
|------|---------------|
| `server/package.json` | Scripts, dependencies |
| `server/tsconfig.json` | TS config with `@/` alias |
| `server/server.ts` | HTTP + Socket.io entry point |
| `server/src/app.ts` | Express app: middleware + routes |
| `server/src/config/env.ts` | Zod env schema — crash on startup if invalid |
| `server/src/config/db.ts` | Mongoose connect helper |
| `server/src/config/mailer.ts` | Nodemailer transporter singleton |
| `server/src/config/socket.ts` | Socket.io init + JWT auth middleware |
| `server/src/utils/ApiError.ts` | Error class with statusCode + code |
| `server/src/utils/generateTokens.ts` | JWT sign/verify helpers |
| `server/src/utils/sendEmail.ts` | Thin nodemailer wrapper |
| `server/src/types/express.d.ts` | Augment `req.user` type |
| `server/src/middleware/errorHandler.ts` | Central error → envelope response |
| `server/src/middleware/authenticate.ts` | JWT verify, attach `req.user` |
| `server/src/middleware/authorize.ts` | Role gate factory |
| `server/src/middleware/validate.ts` | Zod request schema validator |
| `server/src/middleware/upload.ts` | Multer disk storage for screenshots |
| `server/src/models/User.model.ts` | Mongoose User schema |
| `server/src/models/Course.model.ts` | Mongoose Course schema |
| `server/src/models/Enrollment.model.ts` | Mongoose Enrollment schema |
| `server/src/models/Payment.model.ts` | Mongoose Payment schema |
| `server/src/models/Message.model.ts` | Mongoose Message schema |
| `server/src/models/Ticket.model.ts` | Mongoose Ticket schema |
| `server/src/models/Settings.model.ts` | Mongoose Settings singleton schema |
| `server/src/features/auth/auth.types.ts` | Zod schemas + inferred types |
| `server/src/features/auth/auth.service.ts` | Business logic (no HTTP concerns) |
| `server/src/features/auth/auth.controller.ts` | Thin handlers, call service, set cookie |
| `server/src/features/auth/auth.routes.ts` | Route definitions |
| `server/src/features/auth/__tests__/auth.test.ts` | Supertest integration tests |
| `server/src/utils/__tests__/ApiError.test.ts` | ApiError unit tests |
| `server/src/utils/__tests__/generateTokens.test.ts` | Token util unit tests |
| `server/src/middleware/__tests__/errorHandler.test.ts` | errorHandler unit tests |
| `server/src/middleware/__tests__/authenticate.test.ts` | authenticate unit tests |
| `server/src/middleware/__tests__/authorize.test.ts` | authorize unit tests |
| `server/src/tests/env-setup.ts` | Sets test env vars before any module loads |
| `server/src/tests/db-setup.ts` | Connect/clear/disconnect test DB |
| `server/src/scripts/seed-admin.ts` | One-time admin seed script |
| `server/.env.example` | Template for required vars |
| `server/.env` | Local env (gitignored) |
| `server/.env.test` | Test DB + JWT secrets (gitignored) |

---

## Task 1: Project Scaffold

**Files:** Create `server/package.json`, `server/tsconfig.json`, `server/.env.example`, `server/.env`, `server/.env.test`, folder skeleton

- [ ] **Step 1: Create `server/package.json`**

```json
{
  "name": "server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only -r tsconfig-paths/register server.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/server.js",
    "test": "jest --runInBand --forceExit",
    "seed:admin": "ts-node -r tsconfig-paths/register src/scripts/seed-admin.ts"
  }
}
```

- [ ] **Step 2: Install production dependencies**

Run from `server/`:
```bash
npm install express mongoose zod jsonwebtoken bcryptjs cookie-parser cors helmet morgan multer nodemailer socket.io
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D typescript ts-node-dev tsconfig-paths tsc-alias @types/express @types/node @types/jsonwebtoken @types/bcryptjs @types/cookie-parser @types/cors @types/morgan @types/multer @types/nodemailer ts-jest @types/jest jest supertest @types/supertest
```

- [ ] **Step 4: Create `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "server.ts"],
  "exclude": ["node_modules", "dist", "**/__tests__"]
}
```

- [ ] **Step 5: Add Jest config to `server/package.json`**

Merge this into the existing `package.json`:
```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src"],
    "setupFiles": ["<rootDir>/src/tests/env-setup.ts"],
    "setupFilesAfterFramework": ["<rootDir>/src/tests/db-setup.ts"],
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/src/$1"
    },
    "testMatch": ["**/__tests__/**/*.test.ts"]
  }
}
```

Note: `setupFilesAfterFramework` should be `setupFilesAfterEnv` — use that exact key.

- [ ] **Step 6: Create `server/.env.example`**

```
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/english-lms

# JWT (min 32 chars each)
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@englishlms.com

# Admin seed
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@englishlms.com
ADMIN_PASSWORD=

# File storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
```

- [ ] **Step 7: Create `server/.env`** (local dev — never commit)

Copy `.env.example`, then fill in:
```
MONGODB_URI=mongodb://localhost:27017/english-lms
JWT_ACCESS_SECRET=dev-access-secret-replace-this-in-production-now
JWT_REFRESH_SECRET=dev-refresh-secret-replace-this-in-production-now
ADMIN_PASSWORD=Admin@123456
```

- [ ] **Step 8: Create `server/.env.test`** (test DB — never commit)

```
MONGODB_URI=mongodb://localhost:27017/english-lms-test
JWT_ACCESS_SECRET=test-access-secret-at-least-32-chars-long
JWT_REFRESH_SECRET=test-refresh-secret-at-least-32-chars-long
CLIENT_URL=http://localhost:5173
```

- [ ] **Step 9: Create folder skeleton**

```bash
mkdir -p src/features/auth/__tests__
mkdir -p src/features/users src/features/courses src/features/enrollments
mkdir -p src/features/payments src/features/chat src/features/tickets src/features/settings
mkdir -p src/models src/middleware/__tests__ src/config
mkdir -p src/utils/__tests__ src/types src/scripts src/tests uploads
```

- [ ] **Step 10: Add `server/` entries to root `.gitignore`**

Append to `E:/Nabeel Javed/Web Portfolios/English Website/.gitignore`:
```
# Server uploads
server/uploads/
server/.env
server/.env.test
```

- [ ] **Step 11: Commit**

```bash
git add server/
git commit -m "feat(server): project scaffold — package.json, tsconfig, jest config, folder structure"
```

---

## Task 2: ApiError Utility

**Files:** Create `src/utils/ApiError.ts`, `src/utils/__tests__/ApiError.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/utils/__tests__/ApiError.test.ts`:
```typescript
import { ApiError } from '../ApiError';

describe('ApiError', () => {
  it('sets statusCode, message, and code', () => {
    const err = new ApiError(404, 'Not found', 'NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.code).toBe('NOT_FOUND');
  });

  it('is an instance of Error', () => {
    const err = new ApiError(400, 'Bad request', 'BAD_REQUEST');
    expect(err).toBeInstanceOf(Error);
  });

  it('defaults code to INTERNAL_ERROR when omitted', () => {
    const err = new ApiError(500, 'Crash');
    expect(err.code).toBe('INTERNAL_ERROR');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd server && npm test -- --testPathPattern=ApiError
```
Expected: FAIL — `Cannot find module '../ApiError'`

- [ ] **Step 3: Create `server/src/utils/ApiError.ts`**

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=ApiError
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add server/src/utils/ApiError.ts server/src/utils/__tests__/ApiError.test.ts
git commit -m "feat(server): add ApiError utility"
```

---

## Task 3: Environment Config

**Files:** Create `server/src/tests/env-setup.ts`, `server/src/config/env.ts`

- [ ] **Step 1: Create `server/src/tests/env-setup.ts`**

This file runs before any module is imported, so it sets env vars before `env.ts` parses them.

```typescript
process.env['NODE_ENV'] = 'test';
process.env['MONGODB_URI'] = 'mongodb://localhost:27017/english-lms-test';
process.env['JWT_ACCESS_SECRET'] = 'test-access-secret-at-least-32-chars-long';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-at-least-32-chars-long';
process.env['CLIENT_URL'] = 'http://localhost:5173';
process.env['PORT'] = '5001';
```

- [ ] **Step 2: Create `server/src/config/env.ts`**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@englishlms.com'),
  ADMIN_NAME: z.string().default('Admin'),
  ADMIN_EMAIL: z.string().email().default('admin@englishlms.com'),
  ADMIN_PASSWORD: z.string().min(8).default('Admin@123456'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
```

- [ ] **Step 3: Commit**

```bash
git add server/src/config/env.ts server/src/tests/env-setup.ts
git commit -m "feat(server): env validation with zod, test env setup"
```

---

## Task 4: Express Type Augmentation + Token Utils

**Files:** Create `src/types/express.d.ts`, `src/utils/generateTokens.ts`, `src/utils/__tests__/generateTokens.test.ts`

- [ ] **Step 1: Create `server/src/types/express.d.ts`**

```typescript
import { UserRole } from '@/models/User.model';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}
```

Note: `UserRole` will be defined in Task 5. TypeScript resolves this at compile time, not at import time, so this is safe to create now.

- [ ] **Step 2: Write failing tests for generateTokens**

Create `server/src/utils/__tests__/generateTokens.test.ts`:
```typescript
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  TokenPayload,
} from '../generateTokens';

const payload: TokenPayload = { userId: 'abc123', role: 'student' };

describe('generateAccessToken', () => {
  it('returns a three-part JWT string', () => {
    const token = generateAccessToken(payload);
    expect(token.split('.')).toHaveLength(3);
  });

  it('encodes userId and role in payload', () => {
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe('abc123');
    expect(decoded.role).toBe('student');
  });
});

describe('generateRefreshToken', () => {
  it('returns a three-part JWT string', () => {
    const token = generateRefreshToken(payload);
    expect(token.split('.')).toHaveLength(3);
  });

  it('can be verified to recover payload', () => {
    const token = generateRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe('abc123');
  });
});

describe('verifyAccessToken', () => {
  it('throws on invalid token', () => {
    expect(() => verifyAccessToken('not.a.valid.token')).toThrow();
  });
});
```

- [ ] **Step 3: Run to verify failure**

```bash
npm test -- --testPathPattern=generateTokens
```
Expected: FAIL — `Cannot find module '../generateTokens'`

- [ ] **Step 4: Create `server/src/utils/generateTokens.ts`**

```typescript
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { UserRole } from '@/models/User.model';

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

export const generateAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions);

export const generateRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
```

Note: `UserRole` is imported from User.model which is created in Task 5. Create a temporary type alias here first, then update the import after Task 5:

Temporary version (replace in Task 5):
```typescript
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

export const generateAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions);

export const generateRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=generateTokens
```
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add server/src/types/express.d.ts server/src/utils/generateTokens.ts server/src/utils/__tests__/generateTokens.test.ts
git commit -m "feat(server): express type augmentation, JWT token utilities"
```

---

## Task 5: Mongoose Models

**Files:** Create all 7 model files in `server/src/models/`. Models are tested implicitly via auth integration tests in Task 13+.

- [ ] **Step 1: Create `server/src/models/User.model.ts`**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  country?: string;
  bio?: string;
  photo?: string;
  isActive: boolean;
  refreshToken?: string;
  resetOtp?: string;
  resetOtpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
    phone: { type: String },
    country: { type: String },
    bio: { type: String },
    photo: { type: String },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    resetOtp: { type: String, select: false },
    resetOtpExpiry: { type: Date, select: false },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>('User', userSchema);
```

- [ ] **Step 2: Update `server/src/utils/generateTokens.ts` to import UserRole from model**

Replace the temporary `UserRole` type alias:
```typescript
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { UserRole } from '@/models/User.model';

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

export const generateAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions);

export const generateRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
```

- [ ] **Step 3: Create `server/src/models/Course.model.ts`**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export type CourseType = 'group' | 'one-to-one' | 'hybrid';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseFocus = 'speaking' | 'grammar' | 'IELTS' | 'business' | 'general';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type Currency = 'PKR' | 'USD';

export interface IAvailableSlot {
  date: Date;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  bookedBy?: mongoose.Types.ObjectId;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  price: number;
  currency: Currency;
  type: CourseType;
  level: CourseLevel;
  focus: CourseFocus;
  thumbnail?: string;
  totalSessions: number;
  sessionDuration: number;
  status: CourseStatus;
  teacher: mongoose.Types.ObjectId;
  enrolledStudents: mongoose.Types.ObjectId[];
  recurringSchedule: { day: string; time: string }[];
  availableSlots: IAvailableSlot[];
  meetLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['PKR', 'USD'], required: true },
    type: { type: String, enum: ['group', 'one-to-one', 'hybrid'], required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    focus: { type: String, enum: ['speaking', 'grammar', 'IELTS', 'business', 'general'], required: true },
    thumbnail: { type: String },
    totalSessions: { type: Number, required: true },
    sessionDuration: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    recurringSchedule: [{ day: String, time: String }],
    availableSlots: [
      {
        date: Date,
        startTime: String,
        endTime: String,
        isBooked: { type: Boolean, default: false },
        bookedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    meetLink: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model<ICourse>('Course', courseSchema);
```

- [ ] **Step 4: Create `server/src/models/Enrollment.model.ts`**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export type EnrollmentStatus = 'active' | 'suspended' | 'completed';

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId;
  status: EnrollmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    status: { type: String, enum: ['active', 'suspended', 'completed'], default: 'active' },
  },
  { timestamps: true },
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
```

- [ ] **Step 5: Create `server/src/models/Payment.model.ts`**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export type PaymentMethod =
  | 'jazzcash'
  | 'easypaisa'
  | 'nayapay'
  | 'sadapay'
  | 'zindigi'
  | 'bank_local'
  | 'bank_international';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface IPayment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  method: PaymentMethod;
  transactionId: string;
  screenshotUrl: string;
  amount: number;
  currency: 'PKR' | 'USD';
  status: PaymentStatus;
  adminNote?: string;
  rejectionReason?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    method: {
      type: String,
      enum: ['jazzcash', 'easypaisa', 'nayapay', 'sadapay', 'zindigi', 'bank_local', 'bank_international'],
      required: true,
    },
    transactionId: { type: String, required: true },
    screenshotUrl: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['PKR', 'USD'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote: { type: String },
    rejectionReason: { type: String },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model<IPayment>('Payment', paymentSchema);
```

- [ ] **Step 6: Create `server/src/models/Message.model.ts`**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export type MessageType = 'group' | 'private' | 'support';

export interface IMessage extends Document {
  room: string;
  sender: mongoose.Types.ObjectId;
  content: string;
  type: MessageType;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    room: { type: String, required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['group', 'private', 'support'], required: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true, updatedAt: false },
);

export default mongoose.model<IMessage>('Message', messageSchema);
```

- [ ] **Step 7: Create `server/src/models/Ticket.model.ts`**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export type TicketCategory = 'Payment' | 'Technical' | 'Course' | 'Other';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface IThreadEntry {
  sender: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
}

export interface ITicket extends Document {
  ticketNumber: string;
  student: mongoose.Types.ObjectId;
  category: TicketCategory;
  subject: string;
  description: string;
  attachmentUrl?: string;
  status: TicketStatus;
  priority: TicketPriority;
  thread: IThreadEntry[];
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    ticketNumber: { type: String, unique: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: ['Payment', 'Technical', 'Course', 'Other'], required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    attachmentUrl: { type: String },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    thread: [
      {
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model<ITicket>('Ticket', ticketSchema);
```

- [ ] **Step 8: Create `server/src/models/Settings.model.ts`**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentInstruction {
  accountName: string;
  accountNumber: string;
  details: string;
}

export interface ISettings extends Document {
  paymentInstructions: Map<string, IPaymentInstruction>;
  platformName: string;
  logo?: string;
  contactEmail: string;
  emailNotificationsEnabled: boolean;
}

const settingsSchema = new Schema<ISettings>({
  paymentInstructions: {
    type: Map,
    of: new Schema<IPaymentInstruction>({
      accountName: String,
      accountNumber: String,
      details: String,
    }),
    default: {},
  },
  platformName: { type: String, default: 'English Learning LMS' },
  logo: { type: String },
  contactEmail: { type: String, default: 'contact@englishlms.com' },
  emailNotificationsEnabled: { type: Boolean, default: true },
});

export default mongoose.model<ISettings>('Settings', settingsSchema);
```

- [ ] **Step 9: Commit**

```bash
git add server/src/models/ server/src/utils/generateTokens.ts
git commit -m "feat(server): all Mongoose models (User, Course, Enrollment, Payment, Message, Ticket, Settings)"
```

---

## Task 6: DB + Mailer Config + sendEmail Utility

**Files:** Create `src/config/db.ts`, `src/config/mailer.ts`, `src/utils/sendEmail.ts`

- [ ] **Step 1: Create `server/src/config/db.ts`**

```typescript
import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`MongoDB connected [${env.NODE_ENV}]`);
};
```

- [ ] **Step 2: Create `server/src/config/mailer.ts`**

```typescript
import nodemailer from 'nodemailer';
import { env } from './env';

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});
```

- [ ] **Step 3: Create `server/src/utils/sendEmail.ts`**

```typescript
import { transporter } from '@/config/mailer';
import { env } from '@/config/env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    ...options,
  });
};
```

- [ ] **Step 4: Commit**

```bash
git add server/src/config/db.ts server/src/config/mailer.ts server/src/utils/sendEmail.ts
git commit -m "feat(server): database connect, nodemailer config, sendEmail utility"
```

---

## Task 7: Middleware — errorHandler + validate

**Files:** Create `src/middleware/errorHandler.ts`, `src/middleware/validate.ts`, `src/middleware/__tests__/errorHandler.test.ts`

- [ ] **Step 1: Write failing test for errorHandler**

Create `server/src/middleware/__tests__/errorHandler.test.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../errorHandler';
import { ApiError } from '@/utils/ApiError';

describe('errorHandler', () => {
  const mockNext = jest.fn() as unknown as NextFunction;
  let mockReq: Request;
  let mockRes: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    mockReq = {} as Request;
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('formats ApiError into the response envelope', () => {
    const err = new ApiError(404, 'Not found', 'NOT_FOUND');
    errorHandler(err, mockReq, mockRes as unknown as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Not found',
      code: 'NOT_FOUND',
    });
  });

  it('returns 500 for unexpected Error instances', () => {
    const err = new Error('Unexpected crash');
    errorHandler(err, mockReq, mockRes as unknown as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern=errorHandler
```
Expected: FAIL — `Cannot find module '../errorHandler'`

- [ ] **Step 3: Create `server/src/middleware/errorHandler.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  if (process.env['NODE_ENV'] !== 'production') {
    console.error(err);
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=errorHandler
```
Expected: PASS (2 tests)

- [ ] **Step 5: Create `server/src/middleware/validate.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      const fields = result.error.errors.map((e) => ({
        field: e.path.slice(1).join('.'),
        message: e.message,
      }));
      res.status(400).json({ success: false, error: 'Validation failed', fields });
      return;
    }
    next();
  };
```

- [ ] **Step 6: Commit**

```bash
git add server/src/middleware/errorHandler.ts server/src/middleware/validate.ts server/src/middleware/__tests__/errorHandler.test.ts
git commit -m "feat(server): errorHandler middleware, zod validate middleware"
```

---

## Task 8: Middleware — authenticate + authorize

**Files:** Create `src/middleware/authenticate.ts`, `src/middleware/authorize.ts`, `src/middleware/__tests__/authenticate.test.ts`, `src/middleware/__tests__/authorize.test.ts`

- [ ] **Step 1: Write failing tests**

Create `server/src/middleware/__tests__/authenticate.test.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../authenticate';
import { generateAccessToken } from '@/utils/generateTokens';
import { ApiError } from '@/utils/ApiError';

const mockNext = jest.fn() as unknown as NextFunction;
const mockRes = {} as Response;

beforeEach(() => jest.clearAllMocks());

describe('authenticate', () => {
  it('attaches user to req when a valid Bearer token is provided', () => {
    const token = generateAccessToken({ userId: 'u1', role: 'student' });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;

    authenticate(req, mockRes, mockNext);

    expect(req.user).toMatchObject({ userId: 'u1', role: 'student' });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('throws ApiError 401 when no authorization header', () => {
    const req = { headers: {} } as Request;
    expect(() => authenticate(req, mockRes, mockNext)).toThrow(ApiError);
  });

  it('throws ApiError 401 when token is malformed', () => {
    const req = { headers: { authorization: 'Bearer bad.token' } } as Request;
    expect(() => authenticate(req, mockRes, mockNext)).toThrow(ApiError);
  });
});
```

Create `server/src/middleware/__tests__/authorize.test.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { authorize } from '../authorize';
import { ApiError } from '@/utils/ApiError';

const mockNext = jest.fn() as unknown as NextFunction;
const mockRes = {} as Response;

beforeEach(() => jest.clearAllMocks());

describe('authorize', () => {
  it('calls next when user has the required role', () => {
    const req = { user: { userId: 'u1', role: 'admin' } } as unknown as Request;
    authorize('admin')(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('throws 403 when user role is not in the allowed list', () => {
    const req = { user: { userId: 'u1', role: 'student' } } as unknown as Request;
    expect(() => authorize('admin')(req, mockRes, mockNext)).toThrow(ApiError);
  });

  it('throws 401 when req.user is not set', () => {
    const req = {} as Request;
    expect(() => authorize('admin')(req, mockRes, mockNext)).toThrow(ApiError);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern="authenticate|authorize"
```
Expected: FAIL — modules not found

- [ ] **Step 3: Create `server/src/middleware/authenticate.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { verifyAccessToken } from '@/utils/generateTokens';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'No token provided', 'NO_TOKEN');
  }

  const token = authHeader.split(' ')[1]!;
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token', 'INVALID_TOKEN');
  }
};
```

- [ ] **Step 4: Create `server/src/middleware/authorize.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { UserRole } from '@/models/User.model';

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Forbidden', 'FORBIDDEN');
    }
    next();
  };
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="authenticate|authorize"
```
Expected: PASS (6 tests total)

- [ ] **Step 6: Commit**

```bash
git add server/src/middleware/authenticate.ts server/src/middleware/authorize.ts server/src/middleware/__tests__/
git commit -m "feat(server): authenticate and authorize middleware with unit tests"
```

---

## Task 9: Upload Middleware + Socket.io Config

**Files:** Create `src/middleware/upload.ts`, `src/config/socket.ts`

- [ ] **Step 1: Create `server/src/middleware/upload.ts`**

```typescript
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { env } from '@/config/env';
import { ApiError } from '@/utils/ApiError';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPEG and PNG files are allowed', 'INVALID_FILE_TYPE'));
  }
};

export const uploadScreenshot = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
}).single('screenshot');
```

- [ ] **Step 2: Create `server/src/config/socket.ts`**

```typescript
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '@/utils/generateTokens';
import { env } from './env';

export const initSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.data['user'] = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, role } = socket.data['user'] as { userId: string; role: string };
    console.log(`Socket connected: ${userId} (${role})`);

    socket.on('join_room', (room: string) => socket.join(room));
    socket.on('leave_room', (room: string) => socket.leave(room));
    socket.on('disconnect', () => console.log(`Socket disconnected: ${userId}`));
  });

  return io;
};
```

- [ ] **Step 3: Commit**

```bash
git add server/src/middleware/upload.ts server/src/config/socket.ts
git commit -m "feat(server): multer upload middleware, Socket.io config with JWT auth"
```

---

## Task 10: App + Server Entry Point + Test DB Setup

**Files:** Create `server/src/app.ts`, `server/server.ts`, `server/src/tests/db-setup.ts`

- [ ] **Step 1: Create `server/src/tests/db-setup.ts`**

```typescript
import mongoose from 'mongoose';

const TEST_URI = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/english-lms-test';

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]!.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
```

- [ ] **Step 2: Update `package.json` jest config to reference db-setup**

In `server/package.json`, update jest config:
```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src"],
    "setupFiles": ["<rootDir>/src/tests/env-setup.ts"],
    "setupFilesAfterEnv": ["<rootDir>/src/tests/db-setup.ts"],
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/src/$1"
    },
    "testMatch": ["**/__tests__/**/*.test.ts"]
  }
}
```

- [ ] **Step 3: Create `server/src/app.ts`**

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from '@/config/env';
import { errorHandler } from '@/middleware/errorHandler';
import authRoutes from '@/features/auth/auth.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

app.use(errorHandler);

export default app;
```

- [ ] **Step 4: Create `server/server.ts`**

```typescript
import http from 'http';
import app from './src/app';
import { connectDB } from './src/config/db';
import { initSocket } from './src/config/socket';
import { env } from './src/config/env';

const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
});
```

Note: `app.ts` imports `authRoutes` which is created in Task 11. Create `server/src/features/auth/auth.routes.ts` as a temporary stub now:

```typescript
import { Router } from 'express';
const router = Router();
export default router;
```

- [ ] **Step 5: Run all existing tests to verify nothing is broken**

```bash
npm test
```
Expected: All previously passing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add server/src/app.ts server/server.ts server/src/tests/db-setup.ts server/src/features/auth/auth.routes.ts
git commit -m "feat(server): Express app wiring, HTTP server entry, test DB setup"
```

---

## Task 11: Auth Feature — Types + Register + Login

**Files:** `src/features/auth/auth.types.ts`, `src/features/auth/auth.service.ts`, `src/features/auth/auth.controller.ts`, `src/features/auth/auth.routes.ts`, `src/features/auth/__tests__/auth.test.ts`

- [ ] **Step 1: Create `server/src/features/auth/auth.types.ts`**

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().min(7),
    country: z.string().min(2),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    newPassword: z.string().min(8),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
```

- [ ] **Step 2: Write failing integration tests for register + login**

Create `server/src/features/auth/__tests__/auth.test.ts`:
```typescript
import request from 'supertest';
import app from '@/app';

const validStudent = {
  name: 'Ali Hassan',
  email: 'ali@example.com',
  password: 'Password@123',
  phone: '+923001234567',
  country: 'Pakistan',
};

describe('POST /api/auth/register', () => {
  it('registers a new student, returns 201 with accessToken, sets refreshToken cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(validStudent);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('ali@example.com');
    expect(res.body.data.user.role).toBe('student');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 409 when email is already registered', async () => {
    await request(app).post('/api/auth/register').send(validStudent);
    const res = await request(app).post('/api/auth/register').send(validStudent);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_EXISTS');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validStudent);
  });

  it('returns 200 with accessToken and sets refreshToken cookie on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validStudent.email, password: validStudent.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validStudent.email, password: 'WrongPass@999' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 on unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password@123' });

    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 3: Run to verify failure**

```bash
npm test -- --testPathPattern=auth
```
Expected: FAIL — routes return 404 (stub router has no handlers)

- [ ] **Step 4: Create `server/src/features/auth/auth.service.ts`** (register + login only)

```typescript
import bcrypt from 'bcryptjs';
import User from '@/models/User.model';
import { ApiError } from '@/utils/ApiError';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '@/utils/generateTokens';
import { RegisterInput, LoginInput } from './auth.types';

const buildUserResponse = (user: InstanceType<typeof User>) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const registerStudent = async (data: RegisterInput) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new ApiError(409, 'Email already registered', 'EMAIL_EXISTS');

  const password = await bcrypt.hash(data.password, 12);
  const user = await User.create({ ...data, password, role: 'student' });

  const payload: TokenPayload = { userId: String(user._id), role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await User.findByIdAndUpdate(user._id, { refreshToken });

  return { accessToken, refreshToken, user: buildUserResponse(user) };
};

export const loginUser = async (data: LoginInput) => {
  const user = await User.findOne({ email: data.email }).select('+password');
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');

  const payload: TokenPayload = { userId: String(user._id), role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await User.findByIdAndUpdate(user._id, { refreshToken });

  return { accessToken, refreshToken, user: buildUserResponse(user) };
};
```

- [ ] **Step 5: Create `server/src/features/auth/auth.controller.ts`** (register + login only)

```typescript
import { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env';
import * as authService from './auth.service';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.registerStudent(req.body as Parameters<typeof authService.registerStudent>[0]);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({ success: true, data: { accessToken: result.accessToken, user: result.user } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.loginUser(req.body as Parameters<typeof authService.loginUser>[0]);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken: result.accessToken, user: result.user } });
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 6: Replace stub with full `server/src/features/auth/auth.routes.ts`**

```typescript
import { Router } from 'express';
import { validate } from '@/middleware/validate';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.types';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

export default router;
```

- [ ] **Step 7: Run tests to verify register + login pass**

```bash
npm test -- --testPathPattern=auth
```
Expected: register tests PASS, login tests PASS (7 tests)

- [ ] **Step 8: Commit**

```bash
git add server/src/features/auth/
git commit -m "feat(server): auth register and login with integration tests"
```

---

## Task 12: Auth — Refresh + Logout

**Files:** Extend `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts`, `auth.test.ts`

- [ ] **Step 1: Add failing tests for refresh + logout to `auth.test.ts`**

Append to `server/src/features/auth/__tests__/auth.test.ts`:
```typescript
describe('POST /api/auth/refresh', () => {
  it('returns a new accessToken when a valid refreshToken cookie is provided', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validStudent.email, password: validStudent.password });

    const cookies = loginRes.headers['set-cookie'] as string[];

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('returns 401 when no refreshToken cookie is present', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the refreshToken cookie and returns 204', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validStudent.email, password: validStudent.password });
    const cookies = loginRes.headers['set-cookie'] as string[];

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies);

    expect(res.status).toBe(204);
  });
});
```

Note: add `beforeEach` to register the student before refresh + logout tests. Add this block before the two new describe blocks:
```typescript
describe('POST /api/auth/refresh', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validStudent);
  });
  // ... tests
});

describe('POST /api/auth/logout', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validStudent);
  });
  // ... tests
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern=auth
```
Expected: refresh + logout tests FAIL (routes not registered)

- [ ] **Step 3: Add `refreshToken` + `logoutUser` to `auth.service.ts`**

Append to the existing `auth.service.ts`:
```typescript
export const refreshAccessToken = async (token: string | undefined) => {
  if (!token) throw new ApiError(401, 'No refresh token', 'NO_REFRESH_TOKEN');

  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findById(payload.userId).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    throw new ApiError(401, 'Refresh token revoked', 'REFRESH_TOKEN_REVOKED');
  }

  const newPayload: TokenPayload = { userId: String(user._id), role: user.role };
  const accessToken = generateAccessToken(newPayload);
  const refreshToken = generateRefreshToken(newPayload);

  await User.findByIdAndUpdate(user._id, { refreshToken });

  return { accessToken, refreshToken };
};

export const logoutUser = async (token: string | undefined) => {
  if (!token) return;
  await User.findOneAndUpdate({ refreshToken: token }, { $unset: { refreshToken: 1 } });
};
```

Add the missing import at the top of `auth.service.ts`:
```typescript
import { verifyRefreshToken } from '@/utils/generateTokens';
```

- [ ] **Step 4: Add `refresh` + `logout` to `auth.controller.ts`**

Append to the existing `auth.controller.ts`:
```typescript
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies['refreshToken'] as string | undefined;
    const result = await authService.refreshAccessToken(token);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken: result.accessToken } });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies['refreshToken'] as string | undefined;
    await authService.logoutUser(token);
    res.clearCookie('refreshToken');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 5: Register routes in `auth.routes.ts`**

Add to the existing router (before `export default router`):
```typescript
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
```

- [ ] **Step 6: Run all auth tests to verify they pass**

```bash
npm test -- --testPathPattern=auth
```
Expected: PASS (all auth tests, ~11 total)

- [ ] **Step 7: Commit**

```bash
git add server/src/features/auth/
git commit -m "feat(server): auth refresh token rotation and logout"
```

---

## Task 13: Auth — Forgot Password + Reset Password

**Files:** Extend `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts`, `auth.test.ts`

- [ ] **Step 1: Add failing tests for forgot + reset password**

Append to `server/src/features/auth/__tests__/auth.test.ts`:
```typescript
describe('POST /api/auth/forgot-password', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validStudent);
  });

  it('returns 200 regardless of whether the email exists (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 200 for a registered email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: validStudent.email });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('returns 400 when OTP is invalid', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      email: validStudent.email,
      otp: '000000',
      newPassword: 'NewPass@456',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_OTP');
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern=auth
```
Expected: forgot-password + reset-password tests FAIL (routes not registered)

- [ ] **Step 3: Add `forgotPassword` + `resetPassword` to `auth.service.ts`**

Add this import to the top of `auth.service.ts`:
```typescript
import { sendEmail } from '@/utils/sendEmail';
```

Append to `auth.service.ts`:
```typescript
export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email });
  if (!user) return; // Silent — do not reveal whether email exists

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);

  await User.findByIdAndUpdate(user._id, {
    resetOtp: hashedOtp,
    resetOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendEmail({
    to: email,
    subject: 'Password Reset OTP',
    html: `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  }).catch(() => {
    // Log error but don't expose mail failures to the client
    console.error('Failed to send OTP email to', email);
  });
};

export const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string,
): Promise<void> => {
  const user = await User.findOne({
    email,
    resetOtpExpiry: { $gt: new Date() },
  }).select('+resetOtp +resetOtpExpiry');

  if (!user?.resetOtp) throw new ApiError(400, 'Invalid or expired OTP', 'INVALID_OTP');

  const isMatch = await bcrypt.compare(otp, user.resetOtp);
  if (!isMatch) throw new ApiError(400, 'Invalid or expired OTP', 'INVALID_OTP');

  await User.findByIdAndUpdate(user._id, {
    password: await bcrypt.hash(newPassword, 12),
    $unset: { resetOtp: 1, resetOtpExpiry: 1, refreshToken: 1 },
  });
};
```

- [ ] **Step 4: Add `forgotPassword` + `resetPassword` to `auth.controller.ts`**

Append to `auth.controller.ts`:
```typescript
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.forgotPassword(req.body.email as string);
    res.json({ success: true, data: { message: 'If that email exists, an OTP has been sent' } });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body as { email: string; otp: string; newPassword: string };
    await authService.resetPassword(email, otp, newPassword);
    res.json({ success: true, data: { message: 'Password reset successful' } });
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 5: Register routes in `auth.routes.ts`**

Add to the existing router:
```typescript
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
```

- [ ] **Step 6: Run all tests**

```bash
npm test
```
Expected: PASS (all tests — ~18-20 total)

- [ ] **Step 7: Commit**

```bash
git add server/src/features/auth/
git commit -m "feat(server): auth forgot-password and reset-password with OTP"
```

---

## Task 14: Seed Admin Script

**Files:** Create `server/src/scripts/seed-admin.ts`

- [ ] **Step 1: Create `server/src/scripts/seed-admin.ts`**

```typescript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import { env } from '@/config/env';
import User from '@/models/User.model';

async function seedAdmin(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    await mongoose.disconnect();
    return;
  }

  const password = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  await User.create({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password,
    role: 'admin',
    isActive: true,
  });

  console.log('✅ Admin seeded:', env.ADMIN_EMAIL);
  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

Note: `dotenv` must be installed if not already present. Check with `npm ls dotenv`. If missing: `npm install dotenv`.

- [ ] **Step 2: Commit**

```bash
git add server/src/scripts/seed-admin.ts
git commit -m "feat(server): admin seed script"
```

---

## Task 15: Final Verification + Push

- [ ] **Step 1: Run full test suite**

```bash
cd server && npm test
```
Expected: All tests pass. Note the count (should be ~18-20).

- [ ] **Step 2: Run TypeScript build**

```bash
npm run build
```
Expected: Zero errors. `dist/` created.

- [ ] **Step 3: Start the dev server and verify it starts**

Ensure MongoDB is running locally, then:
```bash
npm run dev
```
Expected output:
```
MongoDB connected [development]
Server running on port 5000 [development]
```

Press Ctrl+C to stop.

- [ ] **Step 4: Push to GitHub**

```bash
cd .. && git push origin main
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Feature-based folder structure
- ✅ All 7 Mongoose models
- ✅ JWT access + refresh token strategy (15min / 7day)
- ✅ httpOnly cookie for refresh token
- ✅ `authenticate` + `authorize` middleware
- ✅ Zod env validation with process.exit on failure
- ✅ Central errorHandler → envelope format
- ✅ Socket.io with JWT auth in `io.use()`
- ✅ Multer upload middleware
- ✅ Nodemailer + sendEmail
- ✅ Auth routes: register, login, refresh, logout, forgot-password, reset-password
- ✅ Password reset: 6-digit OTP, hashed, 10min TTL
- ✅ Admin seed script
- ✅ Integration tests for all auth endpoints

**Type consistency check:**
- `TokenPayload` defined in `generateTokens.ts`, used by `authenticate.ts`, `auth.service.ts` ✅
- `UserRole` exported from `User.model.ts`, imported by `authorize.ts`, `generateTokens.ts`, `express.d.ts` ✅
- `RegisterInput` / `LoginInput` from `auth.types.ts`, used as param types in `auth.service.ts` ✅
- `REFRESH_COOKIE_OPTIONS` defined once in `auth.controller.ts`, reused by all cookie-setting handlers ✅
