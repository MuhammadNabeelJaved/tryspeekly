# Backend MVC Pattern Conversion - Design Specification

**Date:** 2026-05-08  
**Author:** Claude Code  
**Status:** Approved  
**Project:** LinkedIn English Learning Platform

---

## Executive Summary

This document outlines the design for converting the backend from a partial modular structure to a complete, professional MVC (Model-View-Controller) architecture. The conversion will:

1. **Restructure** existing auth module into proper MVC layers
2. **Implement** 6 new modules with full CRUD operations
3. **Establish** consistent patterns across the entire backend
4. **Maintain** existing middleware, utilities, and models
5. **Ensure** 80%+ test coverage for all modules

**Scope:** Complete backend restructuring covering:
- Auth (migrate existing)
- Users (profile management)
- Courses (core feature)
- Enrollments (core feature)
- Messages (communication)
- Payments (monetization)

**Expected Outcome:** Production-ready, scalable backend following industry-standard MVC architecture.

---

## 1. Architecture Overview

The MVC architecture follows a clean **3-layer separation pattern**:

### Layers

**1. Routes Layer** (`routes/`)
- Defines API endpoints
- Applies middleware (auth, validation, rate limiting)
- Routes requests to controllers
- **Responsibility:** "Which endpoint goes where?"

**2. Controllers Layer** (`controllers/`)
- Handles HTTP request/response
- Extracts data from `req` (body, params, query)
- Calls appropriate service methods
- Formats responses (success/error)
- **Responsibility:** "How do I handle this HTTP request?"

**3. Services Layer** (`services/`)
- Contains all business logic
- Interacts with database (Models)
- Implements core features
- Reusable across controllers
- **Responsibility:** "What is the actual business logic?"

**4. Models Layer** (`models/`)
- Database schemas (already exist)
- Mongoose models
- **Responsibility:** "How is data structured?"

### Request Flow

```
Client Request 
  → Route (middleware + routing)
  → Controller (HTTP handling)
  → Service (business logic)
  → Model (database)
  → Service (process data)
  → Controller (format response)
  → Client Response
```

### Key Principles

- **Separation of Concerns:** Each layer has one clear responsibility
- **HTTP-agnostic Services:** Services don't know about HTTP (no req/res)
- **Thin Controllers:** Controllers only handle HTTP, no business logic
- **Reusable Services:** Services can be called from multiple controllers
- **Centralized Error Handling:** All errors flow through error handler middleware

---

## 2. Directory Structure

### Complete File Organization

```
server/src/
├── controllers/
│   ├── index.ts                    # Export barrel: export * from './auth.controller'
│   ├── auth.controller.ts          # Login, register, logout, password reset
│   ├── courses.controller.ts       # CRUD courses, manage slots
│   ├── enrollments.controller.ts   # Enroll, cancel, list enrollments
│   ├── messages.controller.ts      # Send, receive, list messages
│   ├── payments.controller.ts      # Process payments, refunds
│   └── users.controller.ts         # Profile, update, delete account
│
├── services/
│   ├── index.ts                    # Export barrel
│   ├── auth.service.ts             # Auth business logic
│   ├── courses.service.ts          # Course business logic
│   ├── enrollments.service.ts      # Enrollment business logic
│   ├── messages.service.ts         # Messaging business logic
│   ├── payments.service.ts         # Payment business logic
│   ├── users.service.ts            # User management logic
│   ├── email.service.ts            # (already exists - shared utility)
│   ├── logger.service.ts           # (already exists - shared utility)
│   ├── socket.service.ts           # (already exists - shared utility)
│   └── upload.service.ts           # (already exists - shared utility)
│
├── routes/
│   ├── index.ts                    # Central route registry (registers all routes)
│   ├── auth.routes.ts              # /api/auth/*
│   ├── courses.routes.ts           # /api/courses/*
│   ├── enrollments.routes.ts       # /api/enrollments/*
│   ├── messages.routes.ts          # /api/messages/*
│   ├── payments.routes.ts          # /api/payments/*
│   └── users.routes.ts             # /api/users/*
│
├── models/                         # (already exist - no changes)
│   ├── User.model.ts
│   ├── Course.model.ts
│   ├── Enrollment.model.ts
│   ├── Message.model.ts
│   ├── Payment.model.ts
│   └── Settings.model.ts
│
├── middleware/                     # (already exist - no changes)
│   ├── authenticate.ts
│   ├── authorize.ts
│   ├── validate.ts
│   ├── errorHandler.ts
│   ├── rateLimiter.ts
│   ├── sanitize.ts
│   └── ipWhitelist.ts
│
├── validations/                    # NEW - Validation schemas
│   ├── auth.validation.ts
│   ├── courses.validation.ts
│   ├── enrollments.validation.ts
│   ├── messages.validation.ts
│   ├── payments.validation.ts
│   └── users.validation.ts
│
├── config/                         # (already exists)
│   ├── constants.ts
│   ├── database.ts
│   └── env.ts
│
├── utils/                          # (already exists)
│   ├── ApiError.ts
│   └── asyncHandler.ts
│
├── types/                          # (already exists)
│   └── express.d.ts
│
├── scripts/                        # (already exists)
│   └── seedAdmin.ts
│
├── app.ts                          # Express app setup
└── server.ts                       # Server entry point
```

### Key Changes

1. **New `controllers/` folder** - All HTTP handlers
2. **Reorganized `services/`** - Business logic + existing utilities
3. **New `routes/` folder** - All route definitions
4. **New `validations/` folder** - Validation schemas (moved from modules)
5. **Removed `modules/auth/`** - Will be split into controllers/services/routes

---

## 3. Component Responsibilities

### Routes (`routes/*.routes.ts`)

**Should:**
- Define endpoint paths (`/api/courses/:id`)
- Apply middleware (authenticate, validate, rate limit)
- Map HTTP methods to controller functions
- Group related endpoints

**Should NOT:**
- Contain any business logic
- Access database directly
- Format responses

**Example:**
```typescript
// routes/courses.routes.ts
import { Router } from 'express';
import { coursesController } from '../controllers';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { courseValidation } from '../validations/courses.validation';

const router = Router();

router.get('/courses', 
  coursesController.getAllCourses
);

router.post('/courses',
  authenticate,
  authorize('teacher'),
  validate(courseValidation.create),
  coursesController.createCourse
);

router.patch('/courses/:id',
  authenticate,
  validate(courseValidation.update),
  coursesController.updateCourse
);

export default router;
```

---

### Controllers (`controllers/*.controller.ts`)

**Should:**
- Extract data from request (`req.body`, `req.params`, `req.query`)
- Call service methods
- Handle HTTP-specific concerns (status codes, cookies, headers)
- Format API responses (success/error envelopes)
- Use `asyncHandler` wrapper for error handling

**Should NOT:**
- Contain business logic
- Access database/models directly
- Perform validation (handled by middleware)

**Example:**
```typescript
// controllers/courses.controller.ts
import { Request, Response } from 'express';
import { coursesService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';

export const coursesController = {
  createCourse: asyncHandler(async (req: Request, res: Response) => {
    const courseData = req.body;
    const teacherId = req.user.id;
    
    const course = await coursesService.createCourse(courseData, teacherId);
    
    res.status(201).json({
      success: true,
      data: course
    });
  }),
  
  getAllCourses: asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const courses = await coursesService.getAllCourses(filters);
    
    res.status(200).json({
      success: true,
      data: courses
    });
  }),
  
  updateCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const teacherId = req.user.id;
    
    const course = await coursesService.updateCourse(id, teacherId, updates);
    
    res.status(200).json({
      success: true,
      data: course
    });
  })
};
```

---

### Services (`services/*.service.ts`)

**Should:**
- Implement ALL business logic
- Interact with database (Models)
- Perform calculations, transformations
- Handle domain-specific rules
- Throw meaningful errors
- Be reusable (can be called from multiple controllers)

**Should NOT:**
- Access `req` or `res` objects (HTTP-agnostic)
- Format HTTP responses
- Handle HTTP status codes

**Example:**
```typescript
// services/courses.service.ts
import Course from '../models/Course.model';
import User from '../models/User.model';
import { ApiError } from '../utils/ApiError';

export const coursesService = {
  createCourse: async (courseData: any, teacherId: string) => {
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      throw new ApiError(403, 'Only teachers can create courses');
    }
    
    if (courseData.price < 0) {
      throw new ApiError(400, 'Price cannot be negative');
    }
    
    const course = await Course.create({
      ...courseData,
      teacher: teacherId,
      status: 'draft',
      enrolledStudents: []
    });
    
    return course;
  },
  
  getAllCourses: async (filters: any) => {
    const query: any = { status: 'published' };
    
    if (filters.level) {
      query.level = filters.level;
    }
    
    if (filters.type) {
      query.type = filters.type;
    }
    
    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });
    
    return courses;
  },
  
  updateCourse: async (courseId: string, teacherId: string, updates: any) => {
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new ApiError(404, 'Course not found');
    }
    
    if (course.teacher.toString() !== teacherId) {
      throw new ApiError(403, 'You can only update your own courses');
    }
    
    if (course.status === 'published' && updates.price) {
      throw new ApiError(409, 'Cannot change price of published course');
    }
    
    Object.assign(course, updates);
    await course.save();
    
    return course;
  }
};
```

---

### Validations (`validations/*.validation.ts`)

**Should:**
- Define request validation schemas (using Joi)
- Validate request body, params, query
- Return structured error messages

**Example:**
```typescript
// validations/courses.validation.ts
import Joi from 'joi';

export const courseValidation = {
  create: {
    body: Joi.object({
      title: Joi.string().min(3).max(200).required(),
      description: Joi.string().min(10).required(),
      price: Joi.number().min(0).required(),
      currency: Joi.string().valid('PKR', 'USD').required(),
      type: Joi.string().valid('one-on-one', 'group').required(),
      level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
      focus: Joi.string().valid('grammar', 'speaking', 'writing', 'listening').required(),
      totalSessions: Joi.number().min(1).required(),
      sessionDuration: Joi.number().min(30).required(),
      thumbnail: Joi.string().uri().optional()
    })
  },
  
  update: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: Joi.object({
      title: Joi.string().min(3).max(200),
      description: Joi.string().min(10),
      price: Joi.number().min(0),
      type: Joi.string().valid('one-on-one', 'group'),
      level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
      totalSessions: Joi.number().min(1),
      sessionDuration: Joi.number().min(30)
    })
  },
  
  getById: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
  }
};
```

---

## 4. Data Flow - Complete Request Lifecycle

### Example: Creating a Course

**1. Client sends request:**
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Advanced English Grammar",
  "description": "Master English grammar",
  "price": 5000,
  "currency": "PKR",
  "type": "one-on-one",
  "level": "advanced",
  "focus": "grammar",
  "totalSessions": 10,
  "sessionDuration": 60
}
```

**2. Routes Layer** (`routes/courses.routes.ts`)
```typescript
router.post('/courses',
  authenticate,                      // ✅ Verify JWT token
  authorize('teacher'),              // ✅ Check user role
  validate(courseValidation.create), // ✅ Validate request body
  coursesController.createCourse     // → Forward to controller
);
```

**3. Controller Layer** (`controllers/courses.controller.ts`)
```typescript
export const coursesController = {
  createCourse: asyncHandler(async (req: Request, res: Response) => {
    const courseData = req.body;
    const teacherId = req.user.id;
    
    const course = await coursesService.createCourse(courseData, teacherId);
    
    res.status(201).json({
      success: true,
      data: course
    });
  })
};
```

**4. Service Layer** (`services/courses.service.ts`)
```typescript
export const coursesService = {
  createCourse: async (courseData, teacherId) => {
    // Business validations
    if (courseData.totalSessions < 1) {
      throw new ApiError(400, 'Must have at least 1 session');
    }
    
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      throw new ApiError(403, 'Only teachers can create courses');
    }
    
    // Database interaction
    const course = await Course.create({
      ...courseData,
      teacher: teacherId,
      status: 'draft',
      enrolledStudents: []
    });
    
    // Optional: Send notification
    await emailService.sendCourseCreatedNotification(teacher.email, course);
    
    return course;
  }
};
```

**5. Model Layer** (`models/Course.model.ts`)
```typescript
const courseSchema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' }
});

export default mongoose.model('Course', courseSchema);
```

**6. Response flows back:**
```
Model → Service → Controller → Client
```

**Client receives:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Advanced English Grammar",
    "price": 5000,
    "teacher": "507f191e810c19729de860ea",
    "status": "draft",
    "createdAt": "2026-05-08T10:30:00Z"
  }
}
```

### Error Scenario

If validation fails or business logic throws error:

```typescript
// Service throws error
throw new ApiError(400, 'Price cannot be negative');

// ↓ asyncHandler catches it
// ↓ errorHandler middleware formats it

// Client receives:
{
  "success": false,
  "error": "Price cannot be negative",
  "code": "BAD_REQUEST"
}
```

---

## 5. Migration Strategy

### Phase 1: Setup New Structure

**Tasks:**
1. Create new folders: `controllers/`, `routes/`, `validations/`
2. Create barrel exports (`index.ts` files in each folder)
3. Set up central route registry (`routes/index.ts`)

### Phase 2: Migrate Auth Module

**Current structure:**
```
modules/auth/
├── auth.controller.ts
├── auth.service.ts
├── auth.routes.ts
└── auth.validation.ts
```

**Migration steps:**
1. Move `auth.controller.ts` → `controllers/auth.controller.ts` (update imports)
2. Move `auth.service.ts` → `services/auth.service.ts` (update imports)
3. Move `auth.routes.ts` → `routes/auth.routes.ts` (update imports)
4. Move `auth.validation.ts` → `validations/auth.validation.ts`
5. Update `app.ts` to use new route location
6. Update all import statements across codebase
7. Run tests to ensure auth still works
8. Delete `modules/auth/` folder

### Phase 3: Create New Modules

**Module implementation order:**
1. **Auth** (migrate existing) ← Already done
2. **Users** (profile management) ← Depends on auth
3. **Courses** (core feature) ← Teachers create courses
4. **Enrollments** (core feature) ← Students enroll in courses
5. **Messages** (communication) ← Students/teachers communicate
6. **Payments** (monetization) ← Handle course payments

**For each new module:**

1. **Create Controller** (`controllers/<module>.controller.ts`)
   - CRUD operations
   - Domain-specific operations

2. **Create Service** (`services/<module>.service.ts`)
   - Business logic implementation
   - Database interactions

3. **Create Routes** (`routes/<module>.routes.ts`)
   - Define all endpoints
   - Apply middleware
   - Map to controllers

4. **Create Validations** (`validations/<module>.validation.ts`)
   - Joi schemas for each endpoint

5. **Register routes** in `routes/index.ts`

6. **Write tests** (`tests/<module>/<module>.test.ts`)

### File-by-file Migration Checklist

**Auth Module:**
- [ ] Create `controllers/auth.controller.ts`
- [ ] Move `services/auth.service.ts`
- [ ] Create `routes/auth.routes.ts`
- [ ] Create `validations/auth.validation.ts`
- [ ] Update `app.ts` imports
- [ ] Update all imports
- [ ] Test all auth endpoints
- [ ] Delete `modules/auth/`

**New Modules (repeat for each):**
- [ ] Create controller file
- [ ] Create service file
- [ ] Create routes file
- [ ] Create validation file
- [ ] Register in `routes/index.ts`
- [ ] Write integration tests
- [ ] Verify tests pass

---

## 6. Module Implementation Details

### 1. Auth Module (Migration)

**Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout (clear tokens)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

**Status:** Already implemented, needs migration only

---

### 2. Users Module (New)

**Endpoints:**
- `GET /api/users/profile` - Get current user profile (protected)
- `PATCH /api/users/profile` - Update profile (protected)
- `DELETE /api/users/account` - Delete account (protected)
- `GET /api/users/:id` - Get public user profile
- `PATCH /api/users/change-password` - Change password (protected)
- `POST /api/users/avatar` - Upload avatar (protected)

**Features:**
- Profile management (name, bio, avatar)
- Password change
- Account deletion
- Public profile view

**Authorization:**
- Profile operations: authenticated users only
- Can only modify own profile

---

### 3. Courses Module (New)

**Endpoints:**
- `POST /api/courses` - Create course (teacher only)
- `GET /api/courses` - List all published courses (public, with filters)
- `GET /api/courses/:id` - Get single course details (public)
- `PATCH /api/courses/:id` - Update course (teacher only, own courses)
- `DELETE /api/courses/:id` - Delete course (teacher only, own courses)
- `PATCH /api/courses/:id/publish` - Publish course (teacher only)
- `PATCH /api/courses/:id/archive` - Archive course (teacher only)
- `GET /api/courses/my-courses` - Get teacher's courses (teacher only)
- `POST /api/courses/:id/slots` - Add available time slots (teacher only)
- `DELETE /api/courses/:id/slots/:slotId` - Remove slot (teacher only)

**Features:**
- CRUD operations
- Status management (draft, published, archived)
- Time slot management
- Filtering (level, type, price range)
- Pagination

**Authorization:**
- Create/update/delete: teacher only
- Can only modify own courses
- List/view: public access

**Business Rules:**
- Can't publish course without slots
- Can't change price of published course
- Can't delete course with active enrollments

---

### 4. Enrollments Module (New)

**Endpoints:**
- `POST /api/enrollments` - Enroll in course (student only)
- `GET /api/enrollments` - Get user's enrollments (protected)
- `GET /api/enrollments/:id` - Get enrollment details (protected)
- `PATCH /api/enrollments/:id/cancel` - Cancel enrollment (student only)
- `GET /api/courses/:courseId/students` - Get enrolled students (teacher only)
- `PATCH /api/enrollments/:id/complete-session` - Mark session complete (teacher only)

**Features:**
- Enroll/cancel enrollment
- Track progress (completed sessions)
- Session completion
- Enrollment status (active, completed, cancelled)

**Authorization:**
- Enroll: students only
- View enrollments: owner or course teacher
- Complete session: course teacher only

**Business Rules:**
- Can't enroll in same course twice
- Can't cancel after 50% sessions completed
- Enrollment requires payment
- Can't enroll in archived courses

---

### 5. Messages Module (New)

**Endpoints:**
- `POST /api/messages` - Send message (protected)
- `GET /api/messages/conversations` - List all conversations (protected)
- `GET /api/messages/conversation/:userId` - Get conversation with user (protected)
- `PATCH /api/messages/:id/read` - Mark message as read (protected)
- `DELETE /api/messages/:id` - Delete message (protected, own messages only)

**Features:**
- Direct messaging between users
- Conversation threads
- Unread message tracking
- Real-time notifications (Socket.io)
- Message deletion

**Authorization:**
- Send/view: authenticated users only
- Can only view own conversations
- Can only delete own messages

**Business Rules:**
- Can only message enrolled course participants
- Teachers can message all their students
- Students can message their course teachers

---

### 6. Payments Module (New)

**Endpoints:**
- `POST /api/payments/create` - Create payment intent (student only)
- `POST /api/payments/verify` - Verify payment (webhook/callback)
- `GET /api/payments` - Get payment history (protected)
- `GET /api/payments/:id` - Get payment details (protected)
- `POST /api/payments/:id/refund` - Request refund (student only)
- `GET /api/payments/earnings` - Get teacher earnings (teacher only)

**Features:**
- Payment processing (Stripe/PayPal/local gateway)
- Payment verification
- Refund handling
- Earnings tracking for teachers
- Payment history

**Authorization:**
- Create payment: students only
- View history: own payments only
- Earnings: teachers only (own earnings)

**Business Rules:**
- Payment required before enrollment
- Refund within 7 days only
- Teacher gets 80% of payment
- Platform fee: 20%

---

### Common Features Across All Modules

**Validation:**
- Request body validation (Joi)
- Proper error messages
- Field-level validation

**Authorization:**
- Role-based access (student/teacher/admin)
- Resource ownership checks
- Proper 401/403 responses

**Error Handling:**
- Consistent error format
- Meaningful error messages
- Error codes for client handling

**Testing:**
- Integration tests for all endpoints
- Auth scenarios (authenticated/unauthenticated)
- Permission scenarios (authorized/unauthorized)
- Validation scenarios
- Edge cases

---

## 7. Error Handling & Validation Strategy

### Error Handling Architecture

**1. ApiError Class** (`utils/ApiError.ts` - already exists)
```typescript
class ApiError extends Error {
  statusCode: number;
  code: string;
  
  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || this.getCodeFromStatus(statusCode);
  }
}
```

**2. asyncHandler Wrapper** (`utils/asyncHandler.ts` - already exists)
```typescript
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**3. Error Handler Middleware** (`middleware/errorHandler.ts` - already exists)
```typescript
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';
  
  // Log error
  logger.error(err);
  
  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    code: code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

### Error Flow

```
Controller/Service throws error
  ↓
asyncHandler catches it
  ↓
errorHandler middleware
  ↓
Formatted JSON response to client
```

### Standard Error Codes

**Authentication & Authorization:**
- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - Not authorized
- `INVALID_TOKEN` (401) - Token invalid/expired

**Validation:**
- `VALIDATION_ERROR` (400) - Request validation failed
- `INVALID_INPUT` (400) - Invalid data format

**Resources:**
- `NOT_FOUND` (404) - Resource not found
- `ALREADY_EXISTS` (409) - Duplicate resource
- `CONFLICT` (409) - Business logic conflict

**Server:**
- `INTERNAL_ERROR` (500) - Unexpected server error
- `DATABASE_ERROR` (500) - Database operation failed

### Validation Strategy

**Using existing `validate` middleware with Joi schemas:**

**1. Define validation schemas** (`validations/*.validation.ts`)

**2. Apply in routes:**
```typescript
router.post('/courses',
  authenticate,
  validate(courseValidation.create),
  coursesController.createCourse
);
```

**3. Validation error response:**
```json
{
  "success": false,
  "error": "Validation failed",
  "fields": [
    {
      "field": "title",
      "message": "Title must be at least 3 characters"
    },
    {
      "field": "price",
      "message": "Price must be greater than or equal to 0"
    }
  ]
}
```

### Service-level Error Examples

```typescript
// services/courses.service.ts
export const coursesService = {
  updateCourse: async (courseId, teacherId, updates) => {
    const course = await Course.findById(courseId);
    
    // Not found error
    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }
    
    // Authorization error
    if (course.teacher.toString() !== teacherId) {
      throw new ApiError(403, 'You can only update your own courses', 'FORBIDDEN');
    }
    
    // Business logic error
    if (course.status === 'published' && updates.price) {
      throw new ApiError(409, 'Cannot change price of published course', 'CONFLICT');
    }
    
    Object.assign(course, updates);
    await course.save();
    return course;
  }
};
```

---

## 8. Testing Strategy

### Testing Framework

**Already configured:**
- Jest + Supertest for integration tests
- Test database connection
- Coverage reporting (80% minimum)

### Testing Layers

**1. Integration Tests** (Primary focus)
- Test complete request → response flow
- Test all endpoints
- Test auth/authorization scenarios
- Test validation
- Use real database (test connection)

**2. Unit Tests** (For complex business logic)
- Test service methods in isolation
- Mock database calls
- Test edge cases

### Test Structure

**Location:** `tests/<module>/<module>.test.ts`

**Example structure:**
```typescript
describe('Courses API', () => {
  beforeAll(async () => {
    await connectTestDB();
  });
  
  afterAll(async () => {
    await disconnectTestDB();
  });
  
  beforeEach(async () => {
    await clearDatabase();
  });
  
  describe('POST /api/courses', () => {
    it('should create course for authenticated teacher', async () => {
      // Test implementation
    });
    
    it('should return 401 for unauthenticated requests', async () => {
      // Test implementation
    });
    
    it('should return 403 for non-teacher users', async () => {
      // Test implementation
    });
    
    it('should return 400 for invalid data', async () => {
      // Test implementation
    });
  });
  
  describe('GET /api/courses', () => {
    it('should list all published courses', async () => {
      // Test implementation
    });
    
    it('should filter courses by level', async () => {
      // Test implementation
    });
  });
});
```

### Test Coverage Goals

**For each endpoint:**
- ✅ Happy path (successful operation)
- ✅ Authentication required (401)
- ✅ Authorization (role/ownership checks) (403)
- ✅ Validation errors (400)
- ✅ Not found scenarios (404)
- ✅ Conflict scenarios (409)
- ✅ Edge cases

**Minimum coverage:** 80%

### Test Utilities

**Location:** `tests/utils/testHelpers.ts`

```typescript
export const createTestUser = async (overrides = {}) => {
  return User.create({
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
    role: 'student',
    ...overrides
  });
};

export const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
};

export const clearDatabase = async () => {
  await User.deleteMany({});
  await Course.deleteMany({});
  await Enrollment.deleteMany({});
  await Message.deleteMany({});
  await Payment.deleteMany({});
};
```

### Module Testing Checklist

**For each module:**
- [ ] All endpoints have integration tests
- [ ] Auth scenarios covered (401, 403)
- [ ] Validation scenarios covered (400)
- [ ] Not found scenarios covered (404)
- [ ] Business logic edge cases covered
- [ ] Tests pass locally
- [ ] Coverage ≥ 80%

---

## 9. Implementation Timeline

### Phase 1: Foundation (Day 1)
- [ ] Create directory structure
- [ ] Create barrel exports
- [ ] Set up central route registry
- [ ] Update app.ts

### Phase 2: Auth Migration (Day 1)
- [ ] Migrate auth controller
- [ ] Migrate auth service
- [ ] Migrate auth routes
- [ ] Migrate auth validation
- [ ] Update all imports
- [ ] Test auth endpoints
- [ ] Delete modules/auth

### Phase 3: Users Module (Day 2)
- [ ] Create users controller
- [ ] Create users service
- [ ] Create users routes
- [ ] Create users validation
- [ ] Write tests
- [ ] Verify all tests pass

### Phase 4: Courses Module (Day 2-3)
- [ ] Create courses controller
- [ ] Create courses service
- [ ] Create courses routes
- [ ] Create courses validation
- [ ] Write tests
- [ ] Verify all tests pass

### Phase 5: Enrollments Module (Day 3-4)
- [ ] Create enrollments controller
- [ ] Create enrollments service
- [ ] Create enrollments routes
- [ ] Create enrollments validation
- [ ] Write tests
- [ ] Verify all tests pass

### Phase 6: Messages Module (Day 4)
- [ ] Create messages controller
- [ ] Create messages service
- [ ] Create messages routes
- [ ] Create messages validation
- [ ] Integrate Socket.io
- [ ] Write tests
- [ ] Verify all tests pass

### Phase 7: Payments Module (Day 5)
- [ ] Create payments controller
- [ ] Create payments service
- [ ] Create payments routes
- [ ] Create payments validation
- [ ] Integrate payment gateway
- [ ] Write tests
- [ ] Verify all tests pass

### Phase 8: Final Testing & Documentation (Day 5)
- [ ] Run complete test suite
- [ ] Verify 80%+ coverage
- [ ] Update API documentation
- [ ] Update README
- [ ] Final code review

**Total Estimated Time:** 5-6 days

---

## 10. Success Criteria

**Architecture:**
- ✅ Clear MVC separation (controllers/services/routes)
- ✅ No business logic in controllers
- ✅ HTTP-agnostic services
- ✅ Centralized error handling

**Functionality:**
- ✅ All 6 modules implemented
- ✅ All endpoints working correctly
- ✅ Proper authentication/authorization
- ✅ Validation on all endpoints

**Code Quality:**
- ✅ TypeScript strict mode (no `any`)
- ✅ Consistent code style
- ✅ Proper error messages
- ✅ Clean, readable code

**Testing:**
- ✅ 80%+ test coverage
- ✅ All integration tests passing
- ✅ All edge cases covered

**Documentation:**
- ✅ API documentation updated
- ✅ README updated
- ✅ Code comments where needed

---

## 11. Next Steps

1. **Review this specification** - Ensure all requirements are clear
2. **Create implementation plan** - Break down into actionable tasks
3. **Begin Phase 1** - Set up directory structure
4. **Iterative development** - Complete one module at a time
5. **Continuous testing** - Test after each module
6. **Final review** - Complete testing and documentation

---

## Appendix

### Related Files
- `CLAUDE.md` - Project conventions
- `.claude/rules/api-conventions.md` - API standards
- `.claude/rules/code-style.md` - Code style guide
- `.claude/rules/testing.md` - Testing guidelines

### References
- Express.js Best Practices
- Node.js Design Patterns
- RESTful API Design
- MVC Architecture Patterns
