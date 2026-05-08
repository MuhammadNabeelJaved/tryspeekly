# English Learning LMS - Backend API

Production-ready Node.js + Express + TypeScript backend for English Learning LMS Phase 1 MVP.

## Tech Stack

- **Framework:** Express.js with TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (access + refresh tokens)
- **File Upload:** Cloudinary
- **Email:** Resend
- **Real-time:** Socket.io
- **Logging:** Winston
- **Testing:** Jest + Supertest
- **Security:** Helmet, CORS, Rate limiting, Input sanitization

## Features

- Multi-role authentication (Student, Instructor, Admin)
- JWT-based auth with refresh tokens
- Password reset via OTP
- Comprehensive security middleware
- File upload to Cloudinary
- Email notifications via Resend
- Real-time messaging with Socket.io
- Structured logging
- 75%+ test coverage

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account
- Resend account

### Installation

```bash
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run twice and add to `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`

3. Fill in remaining environment variables:
   - MongoDB connection strings
   - Cloudinary credentials
   - Resend API key
   - Admin credentials for seeding

### Database Setup

For local development, ensure MongoDB is running:
```bash
mongod
```

On Windows, MongoDB typically runs as a service. Use `net start MongoDB` or start from Services.

For production, create MongoDB Atlas cluster and use connection string.

### Seed Admin User

```bash
npm run seed:admin
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Testing

```bash
# Run all tests with coverage
npm test

# Watch mode
npm run test:watch
```

### Building for Production

```bash
npm run build
npm start
```

## Architecture

This server follows the **MVC (Model-View-Controller)** pattern with a modular structure for scalability and maintainability.

### Directory Structure

```
server/
├── src/
│   ├── config/          # App configuration (database, env, constants)
│   ├── services/        # Shared services (email, upload, logger, socket)
│   ├── utils/           # Utilities (ApiError, asyncHandler, JWT)
│   ├── models/          # Mongoose models (schema definitions)
│   ├── middleware/      # Express middleware (auth, error handling)
│   ├── modules/         # Feature modules (organized by domain)
│   │   ├── auth/
│   │   │   ├── controllers/   # Request/response handling
│   │   │   ├── services/      # Business logic
│   │   │   ├── routes/        # Route definitions
│   │   │   └── validations/   # Request validation schemas
│   │   ├── users/
│   │   ├── courses/
│   │   ├── enrollments/
│   │   ├── messages/
│   │   └── payments/
│   ├── scripts/         # Utility scripts (seed admin)
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── tests/
│   ├── unit/            # Unit tests (services, middleware)
│   ├── integration/     # Integration tests (API endpoints)
│   ├── fixtures/        # Test data factories
│   └── helpers/         # Test utilities
└── logs/                # Winston logs
```

### Layers

- **Controllers:** Handle HTTP requests/responses, call services
- **Services:** Contain business logic, interact with models
- **Routes:** Define API endpoints, apply middleware/validation
- **Models:** Mongoose schemas and data models
- **Middleware:** Cross-cutting concerns (auth, logging, error handling)
- **Validations:** Request schema validation with express-validator

## Modules

### Auth
Authentication and authorization including registration, login, password reset, and token refresh.

### Users
User profile management including profile updates, password changes, and account deletion.

### Courses
Course CRUD operations, course management, and instructor-only course creation/updates.

### Enrollments
Student course enrollment, progress tracking, and completion management.

### Messages
Direct messaging between users with real-time Socket.io integration.

### Payments
Payment processing for course purchases, transaction tracking, and refund handling.

## API Endpoints

All endpoints follow RESTful conventions. Protected routes require JWT authentication via `Authorization: Bearer <token>` header.

### Auth (`/api/auth`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/register` | POST | None | Student registration |
| `/login` | POST | None | Login (all roles) |
| `/logout` | POST | Required | Logout and invalidate refresh token |
| `/refresh` | POST | None | Refresh access token (requires refresh token cookie) |
| `/forgot-password` | POST | None | Request password reset OTP |
| `/reset-password` | POST | None | Reset password with OTP |

### Users (`/api/users`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/profile` | GET | Required | Get authenticated user profile |
| `/profile` | PATCH | Required | Update user profile (name, bio, avatar) |
| `/change-password` | POST | Required | Change password (requires current password) |
| `/account` | DELETE | Required | Delete user account (soft delete) |
| `/:id` | GET | Required | Get public user profile by ID |

### Courses (`/api/courses`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | None | List all published courses (paginated) |
| `/` | POST | Teacher only | Create new course |
| `/:id` | GET | None | Get course details |
| `/:id` | PUT | Teacher only | Update course (must be course creator) |
| `/:id` | DELETE | Teacher only | Delete course (must be course creator) |
| `/:id/publish` | PATCH | Teacher only | Publish/unpublish course |
| `/instructor/:instructorId` | GET | None | List courses by instructor |

### Enrollments (`/api/enrollments`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | POST | Student only | Enroll in a course |
| `/my-courses` | GET | Student only | List student's enrolled courses |
| `/:id` | GET | Required | Get enrollment details (student or course instructor) |
| `/:id/progress` | PATCH | Student only | Update course progress |
| `/:id/complete` | PATCH | Student only | Mark enrollment as completed |
| `/course/:courseId` | GET | Teacher only | List enrollments for a course (instructor access) |

### Messages (`/api/messages`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/conversations` | GET | Required | List user's conversations |
| `/` | POST | Required | Send a new message |
| `/conversation/:userId` | GET | Required | Get conversation with specific user |
| `/:id` | DELETE | Required | Delete message (sender only) |
| `/:id/read` | PATCH | Required | Mark message as read (recipient only) |

**Note:** Messages also support real-time delivery via Socket.io.

### Payments (`/api/payments`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | POST | Student only | Create payment for course purchase |
| `/my-payments` | GET | Required | List user's payments |
| `/:id` | GET | Required | Get payment details (buyer or course instructor) |
| `/:id/confirm` | POST | Admin only | Confirm pending payment |
| `/:id/refund` | POST | Admin only | Process payment refund |
| `/course/:courseId` | GET | Teacher only | List payments for a course (instructor access) |

### Health Check

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | None | Server health status |

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration (database, env, constants)
│   ├── services/        # Shared services (email, upload, logger, socket)
│   ├── utils/           # Utilities (ApiError, asyncHandler, JWT)
│   ├── models/          # Mongoose models
│   ├── middleware/      # Express middleware
│   ├── modules/         # Feature modules (auth, users, courses, enrollments, messages, payments)
│   ├── scripts/         # Utility scripts (seed admin)
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   ├── fixtures/        # Test data factories
│   └── helpers/         # Test utilities
└── logs/                # Winston logs
```

## Security

- Helmet for security headers
- CORS with credentials
- Rate limiting (100 req/15min general, 5 req/15min auth)
- Request sanitization (NoSQL injection, XSS)
- IP whitelisting for admin (configurable)
- Password hashing with bcrypt
- JWT tokens with separate secrets
- httpOnly cookies for refresh tokens

## Code Quality

- TypeScript strict mode
- ESLint + Prettier
- Jest + Supertest for testing
- 75%+ code coverage
- Comprehensive test suite

## License

Proprietary - English Learning LMS

## Support

For issues, contact: graphicsanimation786@gmail.com
