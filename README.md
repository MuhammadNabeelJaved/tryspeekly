# English Learning Platform

A modern, full-stack Learning Management System (LMS) designed for English language education. This platform connects students with instructors, offering comprehensive course management, real-time communication, and progress tracking capabilities.

## Features

### For Students
- 📚 Browse and enroll in English courses
- 📊 Track learning progress and achievements
- 🎓 Earn certificates upon course completion
- 💳 Secure payment processing
- 💬 Direct messaging with instructors
- 🔔 Real-time notifications
- 🎯 Financial aid application support

### For Instructors
- 📖 Create and manage courses with rich curriculum
- 👥 Student management and progress tracking
- 📝 Assignment creation and grading
- 📹 Live class scheduling and management
- 💬 Student messaging system
- 📊 Analytics and reporting
- 🎯 Course pricing and enrollment control

### For Administrators
- 👤 User management (students & instructors)
- 📚 Course oversight and approval
- 💰 Payment and financial aid management
- 📄 CMS for platform content
- 📊 System-wide analytics
- ⚙️ Platform settings and configuration
- 🛠️ Support ticket management

## Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **React Router 7** - Client-side routing
- **Framer Motion** - Animations
- **React Hook Form** - Form handling
- **Phosphor Icons** - Icon library
- **Vitest** - Unit testing

### Backend
- **Node.js 18+** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Winston** - Logging
- **Jest** - Unit & integration testing
- **Cloudinary** - File uploads
- **Resend** - Email service

### Security & Middleware
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - DDoS protection
- **Express Validator** - Input validation
- **Mongo Sanitize** - NoSQL injection prevention
- **IP Whitelist** - Admin route protection

## Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- npm or yarn
- Git

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/MuhammadNabeelJaved/english-learning-platform.git
cd english-learning-platform
```

### 2. Install dependencies

#### Frontend
```bash
cd client
npm install
```

#### Backend
```bash
cd server
npm install
```

### 3. Environment Configuration

#### Frontend (.env)
Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

#### Backend (.env)
Create `server/.env`:
```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/english-learning-platform

# JWT
JWT_ACCESS_SECRET=your-access-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Admin Seeding
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-admin-password

# Security
ADMIN_IP_WHITELIST=127.0.0.1,::1
```

### 4. Seed Admin User
```bash
cd server
npm run seed:admin
```

## Running the Project

### Development Mode

#### Terminal 1 - Backend
```bash
cd server
npm run dev
```
Server runs on [http://localhost:5000](http://localhost:5000)

#### Terminal 2 - Frontend
```bash
cd client
npm run dev
```
Client runs on [http://localhost:5173](http://localhost:5173)

### Production Build

#### Backend
```bash
cd server
npm run build
npm start
```

#### Frontend
```bash
cd client
npm run build
npm run preview
```

## Project Structure

```
english-learning-platform/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   │   ├── admin/     # Admin dashboard pages
│   │   │   ├── instructor/# Instructor dashboard pages
│   │   │   └── student/   # Student dashboard pages
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── public/            # Static assets
│   └── package.json
│
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utility functions
│   │   ├── scripts/      # Seed scripts
│   │   └── server.ts     # Entry point
│   ├── tests/            # Test files
│   │   ├── integration/  # API integration tests
│   │   └── unit/         # Unit tests
│   ├── logs/             # Winston logs
│   └── package.json
│
├── docs/                 # Documentation
├── .claude/              # Claude Code configuration
├── CLAUDE.md             # Project instructions
└── README.md             # This file
```

## Testing

### Frontend Tests
```bash
cd client
npm test              # Run tests
npm run test:watch    # Watch mode
```

### Backend Tests
```bash
cd server
npm test              # Run all tests with coverage
npm run test:watch    # Watch mode
```

## API Documentation

The API follows RESTful conventions. Key endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (instructor)
- `GET /api/users/profile` - Get user profile
- `POST /api/enrollments` - Enroll in course

Full API documentation available in `docs/api-conventions.md`.

## Scripts

### Client Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm test` - Run tests

### Server Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Start production server
- `npm test` - Run tests with coverage
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run seed:admin` - Seed admin user

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Commit Convention
Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `style:` - Formatting changes
- `chore:` - Maintenance tasks

## License

This project is licensed under the UNLICENSED license - see the LICENSE file for details.

## Support

For issues and questions:
- Open an issue on GitHub
- Email: graphicsanimation786@gmail.com

## Acknowledgments

- Built with modern web technologies
- Designed for scalability and maintainability
- Security-first approach with comprehensive testing

---

**Happy Learning! 📚✨**
