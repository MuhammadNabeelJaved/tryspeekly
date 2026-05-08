# Frontend-Backend Integration Design

**Date:** 2026-05-09  
**Status:** Approved  
**Approach:** Layered Integration (Phase-by-Phase)

## Goal

Integrate the React frontend with the MVC backend API to create a fully functional English learning platform with authentication, role-based dashboards, real-time messaging, and complete CRUD operations across all modules.

## Context

**Backend (Complete):**
- Professional MVC architecture (Controllers → Services → Models)
- 6 modules: Auth, Users, Courses, Enrollments, Messages, Payments
- 35 REST API endpoints
- JWT authentication with refresh tokens (httpOnly cookies)
- Socket.io for real-time messaging
- Joi validation, comprehensive error handling
- 217 passing tests, 75%+ coverage

**Frontend (UI Complete, No Backend Integration):**
- React + TypeScript + Tailwind CSS + Vite
- Beautiful UI with login, signup, and three dashboard pages (Student, Instructor, Admin)
- Mock API calls using `setTimeout` alerts
- No state management, no API client, no real data flow

**Integration Requirements:**
- React Context API for state management
- Axios for HTTP client with interceptors
- Full Socket.io integration for real-time features
- All three role dashboards connected to backend

---

## Architecture Overview

The integration creates three main layers:

### 1. Infrastructure Layer
**Location:** `client/src/lib/` and `client/src/contexts/`

- **`axiosClient.ts`** - Configured Axios instance with base URL, auth token interceptors, error handling
- **`AuthContext.tsx`** - React Context providing user state, login/logout/refresh methods
- **`ProtectedRoute.tsx`** - Route wrapper that checks authentication and role permissions
- **`socketClient.ts`** - Socket.io client initialization with JWT authentication

### 2. Service Layer
**Location:** `client/src/services/`

One service file per backend module:
- `authService.ts` - Login, register, logout, password reset, token refresh
- `usersService.ts` - Get profile, update profile, list users (admin)
- `coursesService.ts` - List courses, get details, create, update, delete
- `enrollmentsService.ts` - Enroll, get student progress, instructor's students
- `messagesService.ts` - Inbox, send message, conversation threads, mark as read
- `paymentsService.ts` - Payment history, create payment, admin view all

Each service exports typed functions that call API endpoints using the shared axios client.

### 3. UI Layer
**Location:** Existing `client/src/pages/` and `client/src/components/`

- Pages import services and call them in event handlers
- Use `useAuth()` hook to access auth context
- Loading and error states managed in components
- Real-time updates via Socket.io event listeners

### Data Flow

```
User Action 
  → Component Event Handler 
  → Service Function 
  → Axios Client (adds auth token via interceptor) 
  → Backend API 
  → Response 
  → Service Returns Typed Data 
  → Component Updates UI
```

Auth token refresh happens automatically via Axios response interceptor when backend returns 401.

---

## Directory Structure

### New Files and Folders

```
client/src/
├── lib/
│   ├── axiosClient.ts          # Axios instance with interceptors
│   └── socketClient.ts         # Socket.io client initialization
├── contexts/
│   └── AuthContext.tsx         # Auth state and methods
├── services/
│   ├── authService.ts          # Auth API calls
│   ├── usersService.ts         # User profile API calls
│   ├── coursesService.ts       # Courses API calls
│   ├── enrollmentsService.ts   # Enrollments API calls
│   ├── messagesService.ts      # Messages API calls
│   └── paymentsService.ts      # Payments API calls
├── hooks/
│   └── useAuth.ts              # Hook to access AuthContext
├── components/
│   ├── ProtectedRoute.tsx      # Route wrapper for auth
│   └── ErrorMessage.tsx        # Reusable error display component
├── types/
│   └── api.ts                  # TypeScript types for API responses
└── config/
    └── env.ts                  # Environment variables (API_URL)
```

### Modifications to Existing Files

- **`App.tsx`** - Wrap with `<AuthProvider>`, add `<ProtectedRoute>` for dashboards
- **`LoginPage.tsx`** - Replace mock setTimeout with `authService.login()`
- **`SignupPage.tsx`** - Replace mock setTimeout with `authService.register()`
- **`package.json`** - Add `axios` and `socket.io-client` dependencies
- **`.env`** (create) - Add `VITE_API_URL=http://localhost:5000`

### Existing Structure (No Changes)

- All current pages, components, and utils remain intact
- No changes to styling or UI components
- Dashboard pages will fetch data from services instead of using mock data

---

## Authentication Flow

### Login Process

1. User submits email/password on `LoginPage`
2. `authService.login(email, password)` calls `POST /api/auth/login`
3. Backend returns:
   ```json
   {
     "success": true,
     "data": {
       "user": { "_id": "...", "name": "...", "email": "...", "role": "student" },
       "tokens": { "access": "...", "refresh": "..." }
     }
   }
   ```
4. AuthContext stores:
   - **Access token** in memory (state variable) - more secure than localStorage
   - **Refresh token** in httpOnly cookie (backend sets this automatically)
   - **User object** in state
5. Initialize Socket.io with access token
6. Redirect user based on role:
   - `student` → `/dashboard`
   - `teacher` → `/instructor`
   - `admin` → `/admin`

### Token Refresh (Automatic)

Happens transparently when access token expires:

1. User makes API request with expired access token
2. Backend returns `401 Unauthorized`
3. Axios response interceptor detects 401 error
4. Calls `POST /api/auth/refresh` (refresh token sent via httpOnly cookie)
5. Backend returns new access token:
   ```json
   { "success": true, "data": { "accessToken": "..." } }
   ```
6. Update access token in AuthContext memory
7. Retry the original failed request with new token
8. If refresh fails (401), logout user and redirect to `/login`

### Logout Process

1. User clicks logout button
2. `authService.logout()` calls `POST /api/auth/logout`
3. Backend clears refresh token httpOnly cookie
4. AuthContext clears user and access token from memory
5. Disconnect Socket.io
6. Redirect to `/login`

### Signup Process

1. User submits form on `SignupPage` with: name, email, password, phone, country, role
2. `authService.register(data)` calls `POST /api/auth/register`
3. Backend validates, creates user, returns tokens (same format as login)
4. Auto-login: Store tokens and user in AuthContext
5. Initialize Socket.io
6. Redirect based on selected role

### Initial Page Load (Silent Re-authentication)

When user refreshes the page:

1. App mounts, AuthContext sets `isLoading: true`
2. Call `POST /api/auth/refresh` to check if refresh token exists and is valid
3. If successful:
   - Set `accessToken` and `user` in state (silent re-authentication)
   - Initialize Socket.io
4. If fails (401 or no refresh token):
   - User stays logged out
5. Set `isLoading: false`
6. App renders based on auth state

### Protected Routes

`<ProtectedRoute>` component logic:

1. Check `isLoading` from AuthContext
   - If `true`: Show `<Loader fullScreen />`
2. Check if `user` exists
   - If `null`: Redirect to `/login`
3. Check if `allowedRoles` prop specified
   - If user role not in `allowedRoles`: Show 403 error or redirect to their dashboard
4. If all checks pass: Render children components

**Usage Example:**
```tsx
<Route path="/dashboard/*" element={
  <ProtectedRoute allowedRoles={['student']}>
    <StudentDashboardPage />
  </ProtectedRoute>
} />
```

### Edge Cases

- **Wrong role access:** Student tries to access `/admin` → Redirect to `/dashboard` with error toast
- **Already logged in:** User visits `/login` while authenticated → Redirect to their dashboard
- **Role change:** If admin changes user's role, force re-login on next refresh
- **Multiple tabs:** Token refresh in one tab updates all tabs (via shared cookie)

---

## API Client Layer

### Axios Client Setup (`lib/axiosClient.ts`)

```typescript
import axios from 'axios';
import { config } from '../config/env';

const axiosClient = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true, // Send httpOnly cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Request Interceptor

Adds JWT access token to every request:

```typescript
axiosClient.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken(); // From AuthContext
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

### Response Interceptor

Handles token refresh and error transformation:

```typescript
axiosClient.interceptors.response.use(
  (response) => {
    // Unwrap backend's {success, data} envelope
    return response.data.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 - Attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { accessToken } = await refreshAccessToken();
        setAccessToken(accessToken); // Update in AuthContext
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest); // Retry original request
      } catch (refreshError) {
        // Refresh failed - logout user
        logout();
        return Promise.reject(refreshError);
      }
    }
    
    // Transform backend error format to client format
    const errorMessage = error.response?.data?.error || 'Something went wrong';
    const errorFields = error.response?.data?.fields || [];
    
    throw {
      message: errorMessage,
      fields: errorFields,
      statusCode: error.response?.status,
    };
  }
);
```

### Service Pattern

Each service file exports typed functions that use `axiosClient`:

```typescript
// services/coursesService.ts
import { axiosClient } from '../lib/axiosClient';
import type { Course, CreateCourseDto } from '../types/api';

export const coursesService = {
  getAll: () => axiosClient.get<Course[]>('/api/courses'),
  
  getById: (id: string) => axiosClient.get<Course>(`/api/courses/${id}`),
  
  create: (data: CreateCourseDto) => 
    axiosClient.post<Course>('/api/courses', data),
  
  update: (id: string, data: Partial<Course>) => 
    axiosClient.patch<Course>(`/api/courses/${id}`, data),
  
  delete: (id: string) => 
    axiosClient.delete(`/api/courses/${id}`),
  
  enroll: (courseId: string) => 
    axiosClient.post(`/api/courses/${courseId}/enroll`),
};
```

### Type Safety

All API types defined in `types/api.ts` matching backend schemas:

```typescript
// types/api.ts
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  phone?: string;
  country?: string;
  createdAt: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  enrollmentCount: number;
  createdAt: string;
}

export interface CreateCourseDto {
  title: string;
  description: string;
  price: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

// ... more types for Enrollment, Message, Payment, etc.
```

Services return typed promises, components get autocomplete and type checking.

---

## State Management

### AuthContext Structure (`contexts/AuthContext.tsx`)

```typescript
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  setAccessToken: (token: string) => void;
}
```

### State Variables

- **`user`** - Current user object (id, name, email, role, etc.) or `null` if logged out
- **`accessToken`** - JWT access token stored in memory (not localStorage for security)
- **`isLoading`** - `true` during auth operations (login, register, logout, initial load check)

### Methods

**`login(email, password)`**
- Calls `authService.login(email, password)`
- Updates `user` and `accessToken` state
- Initializes Socket.io
- Redirects to dashboard based on role

**`register(data)`**
- Calls `authService.register(data)`
- Updates `user` and `accessToken` state (auto-login)
- Initializes Socket.io
- Redirects to dashboard based on role

**`logout()`**
- Calls `authService.logout()` to clear backend refresh token
- Clears `user` and `accessToken` from state
- Disconnects Socket.io
- Redirects to `/login`

**`updateUser(user)`**
- Updates user object (for profile edits)
- Does not require API call (optimistic update)

**`setAccessToken(token)`**
- Internal method used by refresh token interceptor
- Updates access token in memory

### Initial Load Logic

When app mounts:

```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const { accessToken, user } = await authService.refresh();
      setAccessToken(accessToken);
      setUser(user);
      initializeSocket(accessToken);
    } catch (error) {
      // No valid refresh token - user stays logged out
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  checkAuth();
}, []);
```

### Provider Wrapping

In `App.tsx`:

```tsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* All routes */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### Usage in Components

```tsx
import { useAuth } from '../hooks/useAuth';

function SomePage() {
  const { user, login, logout, isLoading } = useAuth();
  
  if (isLoading) return <Loader fullScreen />;
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Security Design

**No localStorage/sessionStorage:**
- Access token lives in memory only (cleared on page refresh)
- More secure: XSS attacks can't steal tokens from localStorage
- Refresh token in httpOnly cookie (JavaScript can't access it)
- User must refresh token on page load via silent re-authentication (fast, transparent)

**Token Lifecycle:**
- Access token: Short-lived (15 minutes), stored in memory
- Refresh token: Long-lived (7 days), httpOnly cookie managed by backend
- Page refresh: Silent token refresh via `/api/auth/refresh`
- Tab close: Access token lost, next visit requires refresh

---

## Feature Integration Pattern

Every backend module (courses, enrollments, messages, payments) follows this consistent pattern:

### Step 1: Define Types (`types/api.ts`)

Match backend model schemas:

```typescript
export interface Enrollment {
  _id: string;
  student: string; // User ID
  course: string; // Course ID
  progress: number; // 0-100
  status: 'active' | 'completed' | 'dropped';
  enrolledAt: string;
  completedAt?: string;
}

export interface CreateEnrollmentDto {
  courseId: string;
}
```

### Step 2: Create Service (`services/enrollmentsService.ts`)

Export typed functions for all endpoints:

```typescript
import { axiosClient } from '../lib/axiosClient';
import type { Enrollment, CreateEnrollmentDto } from '../types/api';

export const enrollmentsService = {
  // Student: Get my enrollments
  getMine: () => 
    axiosClient.get<Enrollment[]>('/api/enrollments/me'),
  
  // Student: Enroll in a course
  enroll: (data: CreateEnrollmentDto) => 
    axiosClient.post<Enrollment>('/api/enrollments', data),
  
  // Student: Update progress
  updateProgress: (id: string, progress: number) => 
    axiosClient.patch<Enrollment>(`/api/enrollments/${id}`, { progress }),
  
  // Instructor: Get students in my courses
  getMyStudents: () => 
    axiosClient.get<Enrollment[]>('/api/enrollments/my-students'),
  
  // Admin: Get all enrollments
  getAll: () => 
    axiosClient.get<Enrollment[]>('/api/enrollments'),
};
```

### Step 3: Use in Component

Fetch data on mount, handle loading/error states:

```tsx
import { useState, useEffect } from 'react';
import { enrollmentsService } from '../services/enrollmentsService';
import type { Enrollment } from '../types/api';

function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const data = await enrollmentsService.getMine();
        setEnrollments(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load enrollments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEnrollments();
  }, []);
  
  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div>
      <h1>My Courses</h1>
      {enrollments.map(enrollment => (
        <EnrollmentCard key={enrollment._id} enrollment={enrollment} />
      ))}
    </div>
  );
}
```

### Step 4: Handle Mutations (Create/Update/Delete)

```tsx
const handleEnroll = async (courseId: string) => {
  try {
    setLoading(true);
    const newEnrollment = await enrollmentsService.enroll({ courseId });
    setEnrollments(prev => [...prev, newEnrollment]);
    showToast('Successfully enrolled!', 'success');
  } catch (err: any) {
    showToast(err.message || 'Enrollment failed', 'error');
  } finally {
    setLoading(false);
  }
};
```

### Repeat Pattern for All Modules

**Courses:**
- List all courses (public)
- Get course details (public)
- Create course (instructor/admin)
- Update course (instructor/admin)
- Delete course (admin)
- Enroll in course (student)

**Messages:**
- Get inbox/conversations
- Get conversation thread
- Send message
- Mark message as read
- Real-time updates via Socket.io

**Payments:**
- Get payment history
- Create new payment
- Admin: View all payments
- Admin: Update payment status

**Users:**
- Get my profile
- Update my profile
- Upload avatar (Cloudinary)
- Admin: List all users
- Admin: Update user role

### Consistency Benefits

- Same pattern across all features → Easy to understand
- Type-safe throughout → Fewer runtime errors
- Easy to test → Mock services in tests
- Easy to add new features → Copy existing pattern
- Centralized error handling → Consistent UX

---

## Real-Time Integration (Socket.io)

### Socket Client Setup (`lib/socketClient.ts`)

```typescript
import { io, Socket } from 'socket.io-client';
import { config } from '../config/env';

let socket: Socket | null = null;

export const initializeSocket = (accessToken: string): Socket => {
  if (socket?.connected) {
    return socket; // Already connected
  }
  
  socket = io(config.socketUrl, {
    auth: { token: accessToken },
    transports: ['websocket'], // Prefer WebSocket over polling
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection failed:', error);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });
  
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;
```

### Integration with AuthContext

Socket lifecycle tied to authentication:

```typescript
// In AuthContext
const login = async (email: string, password: string) => {
  const { user, tokens } = await authService.login(email, password);
  setUser(user);
  setAccessToken(tokens.access);
  
  // Initialize Socket.io after successful login
  initializeSocket(tokens.access);
  
  // Redirect based on role
  navigate(getRoleDashboard(user.role));
};

const logout = async () => {
  await authService.logout();
  setUser(null);
  setAccessToken(null);
  
  // Disconnect socket on logout
  disconnectSocket();
  
  navigate('/login');
};
```

### Real-Time Features

#### 1. Notifications

Backend emits `notification` event for:
- New course enrollment
- Assignment deadlines
- Payment confirmations
- System announcements

Frontend listening:

```tsx
// In dashboard layout or notification bell component
import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socketClient';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    
    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      showToast(notification.message, 'info');
      playNotificationSound();
    };
    
    socket.on('notification', handleNotification);
    
    return () => {
      socket.off('notification', handleNotification);
    };
  }, []);
  
  return (
    <div>
      <BellIcon />
      {notifications.length > 0 && <Badge count={notifications.length} />}
    </div>
  );
}
```

#### 2. Live Messaging

Backend events:
- `new-message` - Incoming message
- `message-read` - Message marked as read
- `user-typing` - Someone is typing

Frontend implementation:

```tsx
// In messages/chat page
function ChatPage({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    
    // Listen for new messages
    socket.on('new-message', (message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    });
    
    // Listen for typing indicators
    socket.on('user-typing', ({ userId, conversationId: typingConvId }) => {
      if (typingConvId === conversationId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });
    
    // Listen for read receipts
    socket.on('message-read', ({ messageId }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      ));
    });
    
    return () => {
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('message-read');
    };
  }, [conversationId]);
  
  const sendMessage = (content: string) => {
    const socket = getSocket();
    socket?.emit('send-message', { 
      recipientId: recipient._id, 
      content 
    });
  };
  
  const handleTyping = () => {
    const socket = getSocket();
    socket?.emit('typing', { conversationId });
  };
  
  return (
    <div>
      <MessageList messages={messages} />
      {isTyping && <TypingIndicator />}
      <MessageInput 
        onSend={sendMessage} 
        onTyping={handleTyping} 
      />
    </div>
  );
}
```

#### 3. Presence (Online/Offline Status)

```tsx
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;
  
  socket.on('user-online', ({ userId }) => {
    updateUserStatus(userId, 'online');
  });
  
  socket.on('user-offline', ({ userId }) => {
    updateUserStatus(userId, 'offline');
  });
  
  return () => {
    socket.off('user-online');
    socket.off('user-offline');
  };
}, []);
```

### Error Handling

```typescript
socket.on('connect_error', (error) => {
  console.error('Socket connection failed:', error);
  
  // Try to refresh token and reconnect
  if (error.message === 'Authentication error') {
    refreshTokenAndReconnect();
  }
});

const refreshTokenAndReconnect = async () => {
  try {
    const { accessToken } = await authService.refresh();
    setAccessToken(accessToken);
    disconnectSocket();
    initializeSocket(accessToken);
  } catch (err) {
    // Refresh failed - logout
    logout();
  }
};
```

### Backend Events Reference

From server's Socket.io implementation:

**Incoming (server → client):**
- `notification` - New notification
- `new-message` - Incoming message
- `message-read` - Message read receipt
- `user-typing` - Typing indicator
- `user-online` - User came online
- `user-offline` - User went offline

**Outgoing (client → server):**
- `send-message` - Send a message
- `typing` - Notify typing
- `mark-read` - Mark message as read
- `join-room` - Join a conversation room
- `leave-room` - Leave a conversation room

---

## Error Handling

### API Error Transformation

Backend error format:
```json
{
  "success": false,
  "error": "Validation failed",
  "fields": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password too weak" }
  ]
}
```

Axios interceptor transforms to:
```typescript
{
  message: "Validation failed",
  fields: [
    { field: "email", message: "Invalid email format" },
    { field: "password", message: "Password too weak" }
  ],
  statusCode: 400
}
```

### Error Types and Handling

#### 1. Validation Errors (400)

Show field-specific errors below form inputs:

```tsx
const handleSubmit = async (data) => {
  try {
    await coursesService.create(data);
    showToast('Course created successfully', 'success');
  } catch (error: any) {
    if (error.statusCode === 400 && error.fields) {
      // Set field-specific errors
      error.fields.forEach(({ field, message }) => {
        setErrors(prev => ({ ...prev, [field]: message }));
      });
    } else {
      // Generic error
      showToast(error.message, 'error');
    }
  }
};
```

#### 2. Authentication Errors (401)

Handled automatically by Axios response interceptor:
- Detects 401 response
- Attempts token refresh via `POST /api/auth/refresh`
- If refresh succeeds: Retries original request with new token
- If refresh fails: Logs out user and redirects to `/login`

No manual handling needed in components.

#### 3. Authorization Errors (403)

User authenticated but lacks permission:

```tsx
catch (error: any) {
  if (error.statusCode === 403) {
    showToast('You do not have permission to perform this action', 'error');
    navigate(-1); // Go back
  }
}
```

#### 4. Not Found Errors (404)

```tsx
catch (error: any) {
  if (error.statusCode === 404) {
    setError('Course not found');
    // Or redirect to 404 page
    navigate('/404');
  }
}
```

#### 5. Server Errors (500)

Generic error message (don't expose server details):

```tsx
catch (error: any) {
  if (error.statusCode === 500) {
    showToast('Something went wrong. Please try again later.', 'error');
  }
}
```

### Loading States

#### Component-Level Loading

For individual actions:

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (data) => {
  setIsSubmitting(true);
  try {
    await coursesService.create(data);
    showToast('Course created!', 'success');
  } catch (error: any) {
    showToast(error.message, 'error');
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <LoadingButton isLoading={isSubmitting} onClick={handleSubmit}>
    Create Course
  </LoadingButton>
);
```

#### Page-Level Loading

For data fetching:

```tsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [courses, setCourses] = useState([]);

useEffect(() => {
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await coursesService.getAll();
      setCourses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchCourses();
}, []);

if (loading) return <Loader />;
if (error) return <ErrorMessage message={error} />;
return <CoursesList courses={courses} />;
```

#### Global Loading (Auth)

AuthContext's `isLoading` for auth operations:

```tsx
const { user, isLoading } = useAuth();

if (isLoading) return <Loader fullScreen />;
```

### Toast Notifications

For user feedback on actions (success/error):

**Options:**
- Use existing notification system
- Add `react-hot-toast` library (lightweight, 3KB)
- Build custom toast component

**Usage:**
```tsx
import toast from 'react-hot-toast';

toast.success('Course created successfully!');
toast.error('Failed to enroll in course');
toast.loading('Processing payment...');
```

### Network Errors

Handle offline scenarios:

```tsx
if (!navigator.onLine) {
  showToast('No internet connection. Please check your network.', 'error');
  return;
}
```

### Error Boundary (for React errors)

Catch component errors:

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    console.error('React error:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorPage message="Something went wrong" />;
    }
    return this.props.children;
  }
}
```

---

## Environment Configuration

### Client Environment Variables

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**Production `.env.production`:**
```env
VITE_API_URL=https://api.yourplatform.com
VITE_SOCKET_URL=https://api.yourplatform.com
```

### Config Helper (`config/env.ts`)

```typescript
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;
```

**Usage:**
```typescript
import { config } from '../config/env';

const axiosClient = axios.create({
  baseURL: config.apiUrl,
  // ...
});
```

### Server Environment Variables

Update `server/.env`:

```env
# Existing variables...
CLIENT_URL=http://localhost:5173

# For production
# CLIENT_URL=https://yourplatform.com
```

### CORS Configuration

Backend already configured to allow `CLIENT_URL` from `.env`:

```typescript
// server/src/app.ts
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true, // Allow cookies
}));
```

### Security Notes

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Access token in memory only** - Cleared on page refresh, more secure than localStorage
3. **Refresh token in httpOnly cookie** - JavaScript cannot access it (XSS protection)
4. **`withCredentials: true`** - Axios sends cookies with cross-origin requests
5. **Environment variables** - Never expose secrets in client code (VITE_ prefix is public)

### Development Workflow

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

**Both communicate via CORS:**
- Frontend makes requests to `http://localhost:5000/api/*`
- Backend allows requests from `http://localhost:5173`
- Cookies sent with `credentials: 'include'`

### Build for Production

**Frontend:**
```bash
cd client
npm run build
# Creates optimized dist/ folder
# Serve via Nginx, Vercel, Netlify, or Cloudflare Pages
```

**Backend:**
```bash
cd server
npm run build
# Creates dist/ folder with compiled TypeScript
# Deploy to VPS, Railway, Render, or AWS
```

**Environment Setup:**
- Set production `VITE_API_URL` to backend domain
- Set production `CLIENT_URL` to frontend domain
- Use HTTPS in production (Let's Encrypt, Cloudflare SSL)

---

## Implementation Phases

### Phase 1: Core Infrastructure

**Goal:** Set up the foundation for all API communication and auth.

**Tasks:**
1. Install dependencies (`axios`, `socket.io-client`)
2. Create `config/env.ts` with environment variables
3. Create `lib/axiosClient.ts` with base configuration
4. Create `types/api.ts` with User, Auth response types
5. Create `contexts/AuthContext.tsx` with state and methods
6. Create `hooks/useAuth.ts` hook
7. Wrap `App.tsx` with `<AuthProvider>`
8. Test: Access `useAuth()` in a component, verify context works

**Deliverable:** Infrastructure ready for auth integration.

---

### Phase 2: Authentication Flow

**Goal:** Connect login/signup pages to backend, implement token management.

**Tasks:**
1. Create `services/authService.ts` with login, register, logout, refresh methods
2. Add request interceptor to attach access token
3. Add response interceptor for token refresh and error handling
4. Update `LoginPage.tsx` to call `authService.login()`
5. Update `SignupPage.tsx` to call `authService.register()`
6. Implement auto-redirect based on user role after login
7. Add logout button that calls `authService.logout()`
8. Implement silent re-authentication on app mount
9. Test: Login → Dashboard redirect → Refresh page → Still logged in

**Deliverable:** Full auth flow working (login, signup, logout, token refresh).

---

### Phase 3: Dashboard Routing

**Goal:** Set up role-based routing and protect dashboard pages.

**Tasks:**
1. Create `components/ProtectedRoute.tsx` with auth/role checks
2. Wrap dashboard routes with `<ProtectedRoute>`
3. Implement role-based access control (student, teacher, admin)
4. Add 403 error handling for wrong role access
5. Redirect logged-in users away from `/login` and `/signup`
6. Test: Student can access `/dashboard`, blocked from `/admin`

**Deliverable:** Protected routes working, role-based access enforced.

---

### Phase 4: Feature Modules (Iterative)

**Goal:** Connect each backend module to frontend UI.

#### 4.1: Courses Module

**Tasks:**
1. Add `Course` types to `types/api.ts`
2. Create `services/coursesService.ts` with getAll, getById, create, update, delete, enroll
3. Update `CoursesPage.tsx` to fetch and display courses from API
4. Update `CourseDetailsPage.tsx` to fetch course details
5. Add "Enroll" button that calls `coursesService.enroll()`
6. Admin/Instructor: Add course creation form
7. Test: View courses → Enroll → See enrollment confirmation

#### 4.2: Enrollments Module

**Tasks:**
1. Add `Enrollment` types to `types/api.ts`
2. Create `services/enrollmentsService.ts` with getMine, getMyStudents, updateProgress
3. Student: Display enrolled courses in dashboard
4. Student: Show progress bars for each enrollment
5. Instructor: Display students enrolled in their courses
6. Test: Student sees enrolled courses with progress

#### 4.3: Messages Module

**Tasks:**
1. Add `Message`, `Conversation` types to `types/api.ts`
2. Create `services/messagesService.ts` with getInbox, getThread, send, markAsRead
3. Create inbox page showing conversations
4. Create chat interface for viewing message threads
5. Add send message functionality
6. Test: Send message → Recipient sees it in inbox

#### 4.4: Payments Module

**Tasks:**
1. Add `Payment` types to `types/api.ts`
2. Create `services/paymentsService.ts` with getMyPayments, create, getAll (admin)
3. Student: Display payment history
4. Student: Add "Make Payment" form
5. Admin: View all payments with filters
6. Test: Student creates payment → Appears in history

#### 4.5: Users Module

**Tasks:**
1. Add user profile types to `types/api.ts`
2. Create `services/usersService.ts` with getProfile, updateProfile, uploadAvatar
3. Add profile page with editable fields
4. Add avatar upload (Cloudinary integration)
5. Admin: List all users with role management
6. Test: Update profile → Changes persist

**Deliverable (Phase 4 Complete):** All CRUD operations working for all modules.

---

### Phase 5: Real-Time Layer

**Goal:** Add Socket.io for real-time notifications and messaging.

**Tasks:**
1. Create `lib/socketClient.ts` with initialize, disconnect, getSocket functions
2. Integrate socket lifecycle with AuthContext (connect on login, disconnect on logout)
3. Create notification system listening to `notification` events
4. Add notification bell component with badge count
5. Update messages chat to listen for `new-message` events
6. Add typing indicators (`typing`, `user-typing` events)
7. Add read receipts (`message-read` event)
8. Test real-time flow:
   - User A sends message → User B sees it instantly
   - User B types → User A sees typing indicator
   - User B reads message → User A sees read receipt

**Deliverable:** Full real-time experience with notifications and live messaging.

---

## Success Criteria

The integration is complete when:

✅ **Authentication:**
- Users can register, login, logout
- Tokens refresh automatically on 401
- Silent re-authentication works on page refresh
- Role-based redirects work correctly

✅ **Protected Routes:**
- Unauthenticated users redirected to `/login`
- Wrong role access shows 403 or redirects
- Dashboard pages only accessible to authorized roles

✅ **API Integration:**
- All 35 backend endpoints have corresponding service functions
- Type-safe API calls throughout
- Loading and error states handled consistently

✅ **CRUD Operations:**
- Courses: List, view, create, update, delete, enroll
- Enrollments: View, update progress
- Messages: Inbox, send, read
- Payments: History, create, admin view
- Users: Profile view, update, avatar upload

✅ **Real-Time Features:**
- Notifications appear instantly
- Messages delivered in real-time
- Typing indicators work
- Read receipts update live

✅ **User Experience:**
- Fast page loads with proper loading states
- Clear error messages for all failure cases
- Smooth transitions between auth states
- No console errors or warnings

✅ **Code Quality:**
- TypeScript strict mode passing
- No `any` types (except error handling)
- Consistent patterns across all features
- Reusable components and services

---

## Testing Strategy

### Manual Testing Checklist

**Auth Flow:**
- [ ] Register new account → Auto-login → Redirected to correct dashboard
- [ ] Login with existing account → Redirected based on role
- [ ] Refresh page while logged in → Still logged in (silent refresh)
- [ ] Logout → Redirected to login page → Cannot access protected routes
- [ ] Invalid credentials → Error message shown
- [ ] Expired access token → Auto-refreshed → Request succeeds

**Protected Routes:**
- [ ] Student can access `/dashboard`, blocked from `/instructor` and `/admin`
- [ ] Instructor can access `/instructor`, blocked from `/admin`
- [ ] Admin can access `/admin`
- [ ] Unauthenticated user redirected from all dashboard routes

**Courses:**
- [ ] Public user can view course list and details
- [ ] Student can enroll in course
- [ ] Enrolled course appears in student dashboard
- [ ] Instructor can create/update course
- [ ] Admin can delete course

**Messages:**
- [ ] Send message to another user
- [ ] Receive message in inbox
- [ ] Real-time message delivery (no refresh needed)
- [ ] Typing indicator appears
- [ ] Read receipt updates

**Payments:**
- [ ] Student can view payment history
- [ ] Student can create new payment
- [ ] Admin can view all payments

**Error Handling:**
- [ ] Network error → User-friendly message
- [ ] 401 error → Token refresh attempted
- [ ] 403 error → Permission denied message
- [ ] 404 error → Not found message
- [ ] Validation error → Field-specific errors shown

### Automated Testing (Optional)

**Component Tests (Vitest + React Testing Library):**
- Test login form submission
- Test protected route behavior
- Test service mock calls
- Test error state rendering

**Integration Tests:**
- Backend tests already exist (217 passing)
- Frontend can add E2E tests with Playwright/Cypress if needed

---

## Dependencies to Add

### Client Dependencies

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.0",
    "react-hot-toast": "^2.4.1"
  }
}
```

**Installation:**
```bash
cd client
npm install axios socket.io-client react-hot-toast
```

### No Server Dependencies Needed

Backend already has all required dependencies:
- `express`
- `socket.io`
- `jsonwebtoken`
- `mongoose`
- `joi`
- etc.

---

## Risks and Mitigations

### Risk 1: Token Refresh Race Condition

**Problem:** Multiple 401 errors trigger multiple refresh calls simultaneously.

**Mitigation:** Use a refresh lock in Axios interceptor:
```typescript
let isRefreshing = false;
let refreshSubscribers = [];

// Queue requests while refreshing
// Only one refresh call at a time
```

### Risk 2: Socket Connection Stability

**Problem:** Socket disconnects due to network issues or token expiry.

**Mitigation:**
- Enable automatic reconnection in Socket.io config
- Re-authenticate socket after token refresh
- Show connection status indicator to user

### Risk 3: CORS Issues in Production

**Problem:** CORS errors when frontend and backend on different domains.

**Mitigation:**
- Ensure `CLIENT_URL` in server `.env` matches frontend domain
- Enable `credentials: true` in CORS config
- Use same domain with reverse proxy (Nginx) if possible

### Risk 4: Large Bundle Size

**Problem:** Adding Axios, Socket.io increases bundle size.

**Mitigation:**
- Lazy load Socket.io only when user logs in
- Use code splitting for dashboard pages
- Enable tree-shaking in Vite build
- Monitor bundle size with `vite-plugin-bundle-visualizer`

---

## Future Enhancements (Out of Scope)

These can be added after the initial integration:

- **React Query / SWR:** For server state caching and automatic refetching
- **Optimistic Updates:** Update UI before API response for snappier UX
- **Offline Support:** Service workers and IndexedDB for offline-first experience
- **Push Notifications:** Browser push API for notifications when tab is closed
- **File Upload Progress:** Show upload percentage for course materials
- **Infinite Scroll:** For long lists (courses, messages)
- **Search and Filters:** Client-side and server-side search
- **Dark Mode Persistence:** Save theme preference to backend
- **Analytics:** Track user behavior for insights

---

## Conclusion

This design provides a complete blueprint for integrating the React frontend with the MVC backend. The layered approach ensures:

- **Incremental Progress:** Each phase delivers working value
- **Type Safety:** TypeScript end-to-end
- **Consistency:** Same patterns across all features
- **Scalability:** Easy to add new features following established patterns
- **Security:** Token management, httpOnly cookies, no localStorage vulnerabilities
- **Real-Time:** Socket.io for instant updates
- **User Experience:** Proper loading states, error handling, smooth auth flow

**Next Step:** Create implementation plan breaking down each phase into executable tasks.
