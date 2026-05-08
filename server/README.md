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

## API Documentation

### Auth Endpoints

- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Login (all roles)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/logout` - Logout

### Health Check

- `GET /health` - Server health status

Note: Additional endpoints (courses, payments, enrollments) will be added in subsequent phases.

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration (database, env, constants)
│   ├── services/        # Shared services (email, upload, logger, socket)
│   ├── utils/           # Utilities (ApiError, asyncHandler, JWT)
│   ├── models/          # Mongoose models
│   ├── middleware/      # Express middleware
│   ├── modules/         # Feature modules (currently: auth; courses, payments planned for Phase 2)
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
