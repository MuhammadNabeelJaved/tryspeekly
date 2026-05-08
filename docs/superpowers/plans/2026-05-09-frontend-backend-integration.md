# Frontend-Backend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate React frontend with MVC backend API for full-stack English learning platform with auth, role-based dashboards, real-time messaging, and complete CRUD operations.

**Architecture:** Three-layer integration: Infrastructure (Axios client, AuthContext, Socket.io), Service layer (typed API functions per module), UI layer (React components calling services).

**Tech Stack:** React, TypeScript, Axios, Socket.io-client, React Context API, React Router, Tailwind CSS

---

## File Structure Overview

**New Files (15 total):**
- `client/.env` - Environment config
- `client/src/config/env.ts` - Config helper
- `client/src/lib/axiosClient.ts` - Axios instance with interceptors
- `client/src/lib/socketClient.ts` - Socket.io client
- `client/src/types/api.ts` - API TypeScript types
- `client/src/contexts/AuthContext.tsx` - Auth state management
- `client/src/hooks/useAuth.ts` - Auth hook
- `client/src/services/authService.ts` - Auth API calls
- `client/src/services/usersService.ts` - Users API calls
- `client/src/services/coursesService.ts` - Courses API calls
- `client/src/services/enrollmentsService.ts` - Enrollments API calls
- `client/src/services/messagesService.ts` - Messages API calls
- `client/src/services/paymentsService.ts` - Payments API calls
- `client/src/components/ProtectedRoute.tsx` - Route protection
- `client/src/components/ErrorMessage.tsx` - Error display

**Modified Files (4 core + dashboard pages):**
- `client/package.json` - Add dependencies
- `client/src/App.tsx` - Wrap with AuthProvider, add ProtectedRoute
- `client/src/pages/LoginPage.tsx` - Connect to backend
- `client/src/pages/SignupPage.tsx` - Connect to backend
- Dashboard pages (will be updated in Phase 4)

---

## Phase 1: Core Infrastructure

### Task 1: Install Dependencies and Setup Environment

**Files:**
- Modify: `client/package.json`
- Create: `client/.env`

- [ ] **Step 1: Install axios, socket.io-client, and react-hot-toast**

```bash
cd client
npm install axios socket.io-client react-hot-toast
```

Expected: Dependencies added to package.json

- [ ] **Step 2: Create .env file with API URL**

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

- [ ] **Step 3: Verify .env is gitignored**

Check that `client/.gitignore` contains `.env` (it should already)

- [ ] **Step 4: Commit**

```bash
git add client/package.json client/package-lock.json
git commit -m "feat(client): add axios, socket.io-client, react-hot-toast dependencies"
```

---

### Task 2: Create Environment Configuration Helper

**Files:**
- Create: `client/src/config/env.ts`

- [ ] **Step 1: Create config directory**

```bash
mkdir -p "client/src/config"
```

- [ ] **Step 2: Write env.ts with type-safe config**

```typescript
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;
```

- [ ] **Step 3: Commit**

```bash
git add client/src/config/env.ts
git commit -m "feat(client): add environment configuration helper"
```

---

### Task 3: Create API TypeScript Types

**Files:**
- Create: `client/src/types/api.ts`

- [ ] **Step 1: Create types directory**

```bash
mkdir -p "client/src/types"
```

- [ ] **Step 2: Write api.ts with User and Auth types**

```typescript
// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  phone?: string;
  country?: string;
  avatar?: string;
  createdAt: string;
}

// Auth types
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  role: 'student' | 'teacher';
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface RefreshResponse {
  accessToken: string;
}

// Error types
export interface ApiError {
  message: string;
  fields?: Array<{ field: string; message: string }>;
  statusCode?: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/types/api.ts
git commit -m "feat(client): add API TypeScript types for User and Auth"
```

---

### Task 4: Create Axios Client with Base Configuration

**Files:**
- Create: `client/src/lib/axiosClient.ts`

- [ ] **Step 1: Create lib directory**

```bash
mkdir -p "client/src/lib"
```

- [ ] **Step 2: Write axiosClient.ts with base setup (no interceptors yet)**

```typescript
import axios from 'axios';
import { config } from '../config/env';

export const axiosClient = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors will be added in Phase 2
```

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/axiosClient.ts
git commit -m "feat(client): create Axios client with base configuration"
```

---

### Task 5: Create AuthContext with State and Methods

**Files:**
- Create: `client/src/contexts/AuthContext.tsx`

- [ ] **Step 1: Create contexts directory**

```bash
mkdir -p "client/src/contexts"
```

- [ ] **Step 2: Write AuthContext.tsx with complete implementation**

```typescript
import { createContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Silent re-authentication will be implemented in Phase 2
  useEffect(() => {
    // For now, just set loading to false
    setIsLoading(false);
  }, []);

  const value = {
    user,
    accessToken,
    isLoading,
    setUser,
    setAccessToken,
    setIsLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/contexts/AuthContext.tsx
git commit -m "feat(client): create AuthContext with state management"
```

---

### Task 6: Create useAuth Hook

**Files:**
- Create: `client/src/hooks/useAuth.ts`

- [ ] **Step 1: Create hooks directory**

```bash
mkdir -p "client/src/hooks"
```

- [ ] **Step 2: Write useAuth.ts hook**

```typescript
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/hooks/useAuth.ts
git commit -m "feat(client): add useAuth hook for accessing AuthContext"
```

---

### Task 7: Wrap App with AuthProvider

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Import AuthProvider in App.tsx**

Add to imports at top of file:

```typescript
import { AuthProvider } from './contexts/AuthContext'
```

- [ ] **Step 2: Wrap entire app with AuthProvider**

Change the `App` function return to wrap everything:

```typescript
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollHandler />
        <Suspense fallback={<Loader fullScreen />}>
          <Routes>
            <Route path="/admin/*" element={<AdminPage />} />
            <Route path="/dashboard/*" element={<StudentDashboardPage />} />
            <Route path="/instructor/*" element={<InstructorDashboardPage />} />
            <Route path="/certificate/:id" element={<CertificateViewPage />} />
            <Route path="/*" element={<PublicLayout />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

- [ ] **Step 3: Test that app still runs without errors**

```bash
cd client
npm run dev
```

Open http://localhost:5173 and verify no console errors

- [ ] **Step 4: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat(client): wrap App with AuthProvider"
```

---

### Task 8: Verify Infrastructure Setup

**Files:**
- None (testing task)

- [ ] **Step 1: Create a test component to verify useAuth works**

Temporarily add to `client/src/pages/Home.tsx` at the top of the component:

```typescript
import { useAuth } from '../hooks/useAuth';

// Inside Home component, before the return:
const { user, isLoading } = useAuth();
console.log('Auth state:', { user, isLoading });
```

- [ ] **Step 2: Run dev server and check console**

```bash
cd client
npm run dev
```

Expected console output: `Auth state: { user: null, isLoading: false }`

- [ ] **Step 3: Remove test code from Home.tsx**

Remove the import and console.log added in Step 1

- [ ] **Step 4: Commit (if any cleanup needed)**

```bash
git add client/src/pages/Home.tsx
git commit -m "test(client): verify AuthContext setup works"
```

**Phase 1 Complete:** Infrastructure ready for authentication integration.

---

## Phase 2: Authentication Flow

### Task 9: Create Auth Service with API Methods

**Files:**
- Create: `client/src/services/authService.ts`

- [ ] **Step 1: Create services directory**

```bash
mkdir -p "client/src/services"
```

- [ ] **Step 2: Write authService.ts with all auth methods**

```typescript
import { axiosClient } from '../lib/axiosClient';
import type { LoginDto, RegisterDto, AuthResponse, RefreshResponse } from '../types/api';

export const authService = {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await axiosClient.post<{ success: boolean; data: AuthResponse }>(
      '/api/auth/login',
      credentials
    );
    return response.data.data;
  },

  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await axiosClient.post<{ success: boolean; data: AuthResponse }>(
      '/api/auth/register',
      data
    );
    return response.data.data;
  },

  async logout(): Promise<void> {
    await axiosClient.post('/api/auth/logout');
  },

  async refresh(): Promise<RefreshResponse> {
    const response = await axiosClient.post<{ success: boolean; data: RefreshResponse }>(
      '/api/auth/refresh'
    );
    return response.data.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await axiosClient.post('/api/auth/forgot-password', { email });
  },

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    await axiosClient.post('/api/auth/reset-password', { email, otp, newPassword });
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add client/src/services/authService.ts
git commit -m "feat(client): create authService with login, register, logout, refresh methods"
```

---

### Task 10: Add Axios Request Interceptor for Auth Token

**Files:**
- Modify: `client/src/lib/axiosClient.ts`

- [ ] **Step 1: Add request interceptor to attach access token**

Add after the `axiosClient` creation:

```typescript
// Store for access token (will be set by AuthContext)
let accessToken: string | null = null;

export const setAxiosAccessToken = (token: string | null) => {
  accessToken = token;
};

// Request interceptor - Add auth token to headers
axiosClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

- [ ] **Step 2: Export the setter function**

Verify this line is at the bottom:

```typescript
export { axiosClient, setAxiosAccessToken };
```

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/axiosClient.ts
git commit -m "feat(client): add Axios request interceptor for auth token"
```

---

### Task 11: Add Axios Response Interceptor for Token Refresh

**Files:**
- Modify: `client/src/lib/axiosClient.ts`

- [ ] **Step 1: Add response interceptor with token refresh logic**

Add after the request interceptor:

```typescript
// Flag to prevent multiple refresh calls
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

// Response interceptor - Handle token refresh and errors
axiosClient.interceptors.response.use(
  (response) => {
    // Unwrap {success, data} envelope from backend
    return response.data.data ? { ...response, data: response.data.data } : response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt token refresh
        const response = await axiosClient.post<{ success: boolean; data: { accessToken: string } }>(
          '/api/auth/refresh'
        );
        const newAccessToken = response.data.data.accessToken;
        
        accessToken = newAccessToken;
        isRefreshing = false;
        onTokenRefreshed(newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - user needs to login again
        isRefreshing = false;
        refreshSubscribers = [];
        
        // Clear token and redirect to login (will be handled by AuthContext)
        accessToken = null;
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    // Transform backend error format
    const apiError = {
      message: error.response?.data?.error || error.message || 'Something went wrong',
      fields: error.response?.data?.fields || [],
      statusCode: error.response?.status,
    };

    return Promise.reject(apiError);
  }
);
```

- [ ] **Step 2: Commit**

```bash
git add client/src/lib/axiosClient.ts
git commit -m "feat(client): add Axios response interceptor for token refresh and error handling"
```

---

### Task 12: Update AuthContext with Login/Logout/Refresh Methods

**Files:**
- Modify: `client/src/contexts/AuthContext.tsx`

- [ ] **Step 1: Import authService and setAxiosAccessToken**

Add to imports:

```typescript
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { setAxiosAccessToken } from '../lib/axiosClient';
import type { LoginDto, RegisterDto } from '../types/api';
import toast from 'react-hot-toast';
```

- [ ] **Step 2: Update AuthContextType interface**

Replace the interface with:

```typescript
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
}
```

- [ ] **Step 3: Implement login, register, logout methods in AuthProvider**

Replace the AuthProvider component with:

```typescript
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Update axios token when accessToken changes
  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    setAxiosAccessToken(token);
  };

  // Silent re-authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { accessToken: token } = await authService.refresh();
        setAccessToken(token);
        // User info will be fetched after implementing usersService
        setIsLoading(false);
      } catch (error) {
        // No valid refresh token - user not logged in
        setUser(null);
        setAccessToken(null);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginDto) => {
    setIsLoading(true);
    try {
      const { user: userData, tokens } = await authService.login(credentials);
      setUser(userData);
      setAccessToken(tokens.access);
      toast.success(`Welcome back, ${userData.name}!`);
      
      // Redirect based on role
      const dashboards = {
        student: '/dashboard',
        teacher: '/instructor',
        admin: '/admin',
      };
      window.location.href = dashboards[userData.role];
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterDto) => {
    setIsLoading(true);
    try {
      const { user: userData, tokens } = await authService.register(data);
      setUser(userData);
      setAccessToken(tokens.access);
      toast.success(`Welcome, ${userData.name}!`);
      
      // Redirect based on role
      const dashboards = {
        student: '/dashboard',
        teacher: '/instructor',
        admin: '/admin',
      };
      window.location.href = dashboards[userData.role];
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      toast.success('Logged out successfully');
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    accessToken,
    isLoading,
    login,
    register,
    logout,
    setAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/contexts/AuthContext.tsx
git commit -m "feat(client): add login, register, logout methods to AuthContext"
```

---

### Task 13: Connect LoginPage to Backend

**Files:**
- Modify: `client/src/pages/LoginPage.tsx`

- [ ] **Step 1: Import useAuth hook**

Add to imports:

```typescript
import { useAuth } from '../hooks/useAuth'
```

- [ ] **Step 2: Replace mock API call with authService.login**

In the `LoginPage` component, replace the `handleSubmit` function:

```typescript
const { login, isLoading: authLoading } = useAuth();

const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault()

  const emailValid = validateEmail()
  const passwordValid = validatePassword()

  if (!emailValid || !passwordValid) return

  setIsLoading(true)

  try {
    await login({ email, password });
    // Redirect happens in AuthContext
  } catch (error: any) {
    // Error toast shown in AuthContext
    if (error.fields) {
      error.fields.forEach(({ field, message }: any) => {
        setErrors(prev => ({ ...prev, [field]: message }));
      });
    }
  } finally {
    setIsLoading(false)
  }
}
```

- [ ] **Step 3: Remove mock social login alert**

Replace `handleSocialLogin` function:

```typescript
const handleSocialLogin = (provider: 'google' | 'github') => {
  console.log(`Social login with ${provider}`)
  // TODO: Implement OAuth flow
  alert(`Social login with ${provider} - OAuth not implemented yet`)
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/LoginPage.tsx
git commit -m "feat(client): connect LoginPage to backend auth API"
```

---

### Task 14: Connect SignupPage to Backend

**Files:**
- Modify: `client/src/pages/SignupPage.tsx`

- [ ] **Step 1: Import useAuth hook**

Add to imports:

```typescript
import { useAuth } from '../hooks/useAuth'
```

- [ ] **Step 2: Add phone and country fields to state**

Add after the existing state declarations:

```typescript
const [phone, setPhone] = useState('')
const [country, setCountry] = useState('')
const [role, setRole] = useState<'student' | 'teacher'>('student')
```

Update errors state:

```typescript
const [errors, setErrors] = useState({ 
  name: '', 
  email: '', 
  password: '', 
  confirmPassword: '',
  phone: '',
  country: ''
})
```

- [ ] **Step 3: Add phone and country validation functions**

```typescript
const validatePhone = () => {
  if (!phone || phone.length < 10) {
    setErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number' }))
    return false
  }
  setErrors(prev => ({ ...prev, phone: '' }))
  return true
}

const validateCountry = () => {
  if (!country || country.length < 2) {
    setErrors(prev => ({ ...prev, country: 'Please enter your country' }))
    return false
  }
  setErrors(prev => ({ ...prev, country: '' }))
  return true
}
```

- [ ] **Step 4: Replace mock API call with authService.register**

Replace the `handleSubmit` function:

```typescript
const { register, isLoading: authLoading } = useAuth();

const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault()

  const nameValid = validateName()
  const emailValid = validateEmail()
  const passwordValid = validatePassword()
  const confirmValid = validateConfirmPassword()
  const phoneValid = validatePhone()
  const countryValid = validateCountry()

  if (!nameValid || !emailValid || !passwordValid || !confirmValid || !phoneValid || !countryValid) return

  setIsLoading(true)

  try {
    await register({ name, email, password, phone, country, role });
    // Redirect happens in AuthContext
  } catch (error: any) {
    // Error toast shown in AuthContext
    if (error.fields) {
      error.fields.forEach(({ field, message }: any) => {
        setErrors(prev => ({ ...prev, [field]: message }));
      });
    }
  } finally {
    setIsLoading(false)
  }
}
```

- [ ] **Step 5: Add phone and country form fields**

Add after the email FormInput in the form:

```tsx
<FormInput
  label="Phone number"
  type="tel"
  value={phone}
  onChange={setPhone}
  onBlur={validatePhone}
  error={errors.phone}
  placeholder="+1 234 567 8900"
  required
  disabled={isLoading}
/>

<FormInput
  label="Country"
  type="text"
  value={country}
  onChange={setCountry}
  onBlur={validateCountry}
  error={errors.country}
  placeholder="United States"
  required
  disabled={isLoading}
/>

<div>
  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
    I want to
  </label>
  <div className="flex gap-4">
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-400">
      <input
        type="radio"
        name="role"
        value="student"
        checked={role === 'student'}
        onChange={(e) => setRole('student')}
        disabled={isLoading}
        className="h-4 w-4 text-violet-600 focus:ring-violet-500"
      />
      Learn (Student)
    </label>
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-400">
      <input
        type="radio"
        name="role"
        value="teacher"
        checked={role === 'teacher'}
        onChange={(e) => setRole('teacher')}
        disabled={isLoading}
        className="h-4 w-4 text-violet-600 focus:ring-violet-500"
      />
      Teach (Instructor)
    </label>
  </div>
</div>
```

- [ ] **Step 6: Remove mock social login**

Same as LoginPage - update `handleSocialLogin` to show TODO alert

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/SignupPage.tsx
git commit -m "feat(client): connect SignupPage to backend with phone, country, role fields"
```

---

### Task 15: Test Authentication Flow

**Files:**
- None (manual testing task)

- [ ] **Step 1: Ensure backend is running**

```bash
cd server
npm run dev
```

Expected: Server running on http://localhost:5000

- [ ] **Step 2: Ensure frontend is running**

```bash
cd client
npm run dev
```

Expected: Frontend running on http://localhost:5173

- [ ] **Step 3: Test registration flow**

1. Open http://localhost:5173/signup
2. Fill in all fields (name, email, password, confirm, phone, country, role: student)
3. Click "Create account"
4. Expected: Success toast, redirect to /dashboard

- [ ] **Step 4: Test logout (will add button in next task)**

Open browser console and run:
```javascript
// Access logout from AuthContext
// Will add UI button in Phase 3
```

For now, manually clear cookies and refresh to test login

- [ ] **Step 5: Test login flow**

1. Open http://localhost:5173/login
2. Enter credentials from Step 3
3. Click "Sign in"
4. Expected: Success toast, redirect to /dashboard

- [ ] **Step 6: Test page refresh (silent re-auth)**

1. While logged in, refresh the page
2. Expected: Still logged in, no redirect to login

- [ ] **Step 7: Test invalid credentials**

1. Try login with wrong password
2. Expected: Error toast with message

**Phase 2 Complete:** Authentication flow working (login, signup, token refresh).

---

## Phase 3: Dashboard Routing

### Task 16: Create ProtectedRoute Component

**Files:**
- Create: `client/src/components/ProtectedRoute.tsx`

- [ ] **Step 1: Write ProtectedRoute.tsx with auth and role checks**

```typescript
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from './Loader';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('student' | 'teacher' | 'admin')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loader while checking auth
  if (isLoading) {
    return <Loader fullScreen />;
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role permissions if specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Wrong role - redirect to their dashboard
    const dashboards = {
      student: '/dashboard',
      teacher: '/instructor',
      admin: '/admin',
    };
    return <Navigate to={dashboards[user.role]} replace />;
  }

  // All checks passed - render children
  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ProtectedRoute.tsx
git commit -m "feat(client): create ProtectedRoute component with role-based access control"
```

---

### Task 17: Wrap Dashboard Routes with ProtectedRoute

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Import ProtectedRoute**

Add to imports:

```typescript
import ProtectedRoute from './components/ProtectedRoute'
```

- [ ] **Step 2: Wrap dashboard routes with ProtectedRoute**

In the `Routes` section, update the three dashboard routes:

```tsx
<Routes>
  <Route path="/admin/*" element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminPage />
    </ProtectedRoute>
  } />
  
  <Route path="/dashboard/*" element={
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboardPage />
    </ProtectedRoute>
  } />
  
  <Route path="/instructor/*" element={
    <ProtectedRoute allowedRoles={['teacher']}>
      <InstructorDashboardPage />
    </ProtectedRoute>
  } />
  
  <Route path="/certificate/:id" element={<CertificateViewPage />} />
  <Route path="/*" element={<PublicLayout />} />
</Routes>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat(client): wrap dashboard routes with ProtectedRoute"
```

---

### Task 18: Redirect Logged-in Users from Login/Signup Pages

**Files:**
- Modify: `client/src/pages/LoginPage.tsx`
- Modify: `client/src/pages/SignupPage.tsx`

- [ ] **Step 1: Add redirect check to LoginPage**

At the top of the `LoginPage` component, after `useAuth()` call:

```typescript
import { Navigate } from 'react-router-dom';

// Inside component
const { user, login, isLoading: authLoading } = useAuth();

// Redirect if already logged in
if (user) {
  const dashboards = {
    student: '/dashboard',
    teacher: '/instructor',
    admin: '/admin',
  };
  return <Navigate to={dashboards[user.role]} replace />;
}
```

- [ ] **Step 2: Add redirect check to SignupPage**

Same pattern as LoginPage - add after `useAuth()` call

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/LoginPage.tsx client/src/pages/SignupPage.tsx
git commit -m "feat(client): redirect logged-in users away from login/signup pages"
```

---

### Task 19: Test Protected Routes

**Files:**
- None (manual testing task)

- [ ] **Step 1: Test unauthenticated access**

1. Clear cookies/localStorage and refresh
2. Try to access http://localhost:5173/dashboard
3. Expected: Redirect to /login

- [ ] **Step 2: Test student role access**

1. Login as student
2. Access /dashboard
3. Expected: Dashboard loads
4. Try to access /admin
5. Expected: Redirect back to /dashboard

- [ ] **Step 3: Test teacher role access**

1. Create teacher account or login as teacher
2. Access /instructor
3. Expected: Instructor dashboard loads
4. Try to access /admin
5. Expected: Redirect to /instructor

- [ ] **Step 4: Test logged-in user accessing login page**

1. While logged in, go to /login
2. Expected: Redirect to appropriate dashboard

**Phase 3 Complete:** Protected routes working with role-based access control.

---

## Phase 4: Feature Modules

### Task 20: Add Course Types to API Types

**Files:**
- Modify: `client/src/types/api.ts`

- [ ] **Step 1: Add Course interfaces**

Add to the file:

```typescript
// Course types
export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: User | string; // Populated or ID
  price: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  syllabus?: string[];
  prerequisites?: string[];
  enrollmentCount: number;
  thumbnail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  title: string;
  description: string;
  price: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  syllabus?: string[];
  prerequisites?: string[];
  thumbnail?: string;
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> {
  isActive?: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/types/api.ts
git commit -m "feat(client): add Course TypeScript types"
```

---

### Task 21: Create Courses Service

**Files:**
- Create: `client/src/services/coursesService.ts`

- [ ] **Step 1: Write coursesService.ts**

```typescript
import { axiosClient } from '../lib/axiosClient';
import type { Course, CreateCourseDto, UpdateCourseDto } from '../types/api';

export const coursesService = {
  async getAll(): Promise<Course[]> {
    const response = await axiosClient.get('/api/courses');
    return response.data;
  },

  async getById(id: string): Promise<Course> {
    const response = await axiosClient.get(`/api/courses/${id}`);
    return response.data;
  },

  async create(data: CreateCourseDto): Promise<Course> {
    const response = await axiosClient.post('/api/courses', data);
    return response.data;
  },

  async update(id: string, data: UpdateCourseDto): Promise<Course> {
    const response = await axiosClient.patch(`/api/courses/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/api/courses/${id}`);
  },

  // Instructor-specific
  async getMyCourses(): Promise<Course[]> {
    const response = await axiosClient.get('/api/courses/my-courses');
    return response.data;
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/services/coursesService.ts
git commit -m "feat(client): create coursesService for courses API calls"
```

---

### Task 22: Update CoursesPage to Fetch from API

**Files:**
- Modify: `client/src/pages/CoursesPage.tsx`

- [ ] **Step 1: Import coursesService and types**

Add to imports:

```typescript
import { useState, useEffect } from 'react';
import { coursesService } from '../services/coursesService';
import type { Course } from '../types/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
```

- [ ] **Step 2: Add state for courses, loading, error**

At the top of the component:

```typescript
const [courses, setCourses] = useState<Course[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
```

- [ ] **Step 3: Fetch courses on mount**

```typescript
useEffect(() => {
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await coursesService.getAll();
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  fetchCourses();
}, []);
```

- [ ] **Step 4: Add loading and error states to render**

Before the existing JSX return:

```typescript
if (loading) return <Loader fullScreen />;
if (error) return (
  <div className="min-h-screen flex items-center justify-center">
    <p className="text-red-600 dark:text-red-400">{error}</p>
  </div>
);
```

- [ ] **Step 5: Update courses rendering to use fetched data**

Replace any hardcoded course data with the `courses` state array

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/CoursesPage.tsx
git commit -m "feat(client): connect CoursesPage to backend API"
```

---

### Task 23: Update CourseDetailsPage to Fetch from API

**Files:**
- Modify: `client/src/pages/CourseDetailsPage.tsx`

- [ ] **Step 1: Import necessary dependencies**

```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesService } from '../services/coursesService';
import type { Course } from '../types/api';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
```

- [ ] **Step 2: Add state and fetch course by ID**

```typescript
const { id } = useParams<{ id: string }>();
const { user } = useAuth();
const navigate = useNavigate();
const [course, setCourse] = useState<Course | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [enrolling, setEnrolling] = useState(false);

useEffect(() => {
  const fetchCourse = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await coursesService.getById(id);
      setCourse(data);
    } catch (err: any) {
      setError(err.message || 'Course not found');
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  fetchCourse();
}, [id]);
```

- [ ] **Step 3: Add loading and error states**

```typescript
if (loading) return <Loader fullScreen />;
if (error || !course) return (
  <div className="min-h-screen flex items-center justify-center">
    <p className="text-red-600 dark:text-red-400">{error || 'Course not found'}</p>
  </div>
);
```

- [ ] **Step 4: Update render to use fetched course data**

Replace hardcoded course data with `course` state

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/CourseDetailsPage.tsx
git commit -m "feat(client): connect CourseDetailsPage to backend API"
```

---

### Task 24: Add Enrollment Types and Service

**Files:**
- Modify: `client/src/types/api.ts`
- Create: `client/src/services/enrollmentsService.ts`

- [ ] **Step 1: Add Enrollment types to api.ts**

```typescript
// Enrollment types
export interface Enrollment {
  _id: string;
  student: User | string;
  course: Course | string;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'dropped';
  enrolledAt: string;
  completedAt?: string;
}

export interface CreateEnrollmentDto {
  courseId: string;
}

export interface UpdateEnrollmentDto {
  progress?: number;
  status?: 'active' | 'completed' | 'dropped';
}
```

- [ ] **Step 2: Create enrollmentsService.ts**

```typescript
import { axiosClient } from '../lib/axiosClient';
import type { Enrollment, CreateEnrollmentDto, UpdateEnrollmentDto } from '../types/api';

export const enrollmentsService = {
  async getMine(): Promise<Enrollment[]> {
    const response = await axiosClient.get('/api/enrollments/me');
    return response.data;
  },

  async enroll(data: CreateEnrollmentDto): Promise<Enrollment> {
    const response = await axiosClient.post('/api/enrollments', data);
    return response.data;
  },

  async updateProgress(id: string, data: UpdateEnrollmentDto): Promise<Enrollment> {
    const response = await axiosClient.patch(`/api/enrollments/${id}`, data);
    return response.data;
  },

  // Instructor: Get students in my courses
  async getMyStudents(): Promise<Enrollment[]> {
    const response = await axiosClient.get('/api/enrollments/my-students');
    return response.data;
  },

  // Admin: Get all enrollments
  async getAll(): Promise<Enrollment[]> {
    const response = await axiosClient.get('/api/enrollments');
    return response.data;
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add client/src/types/api.ts client/src/services/enrollmentsService.ts
git commit -m "feat(client): add Enrollment types and enrollmentsService"
```

---

### Task 25: Add Message Types and Service

**Files:**
- Modify: `client/src/types/api.ts`
- Create: `client/src/services/messagesService.ts`

- [ ] **Step 1: Add Message types to api.ts**

```typescript
// Message types
export interface Message {
  _id: string;
  sender: User | string;
  recipient: User | string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface SendMessageDto {
  recipientId: string;
  content: string;
}
```

- [ ] **Step 2: Create messagesService.ts**

```typescript
import { axiosClient } from '../lib/axiosClient';
import type { Message, SendMessageDto } from '../types/api';

export const messagesService = {
  async getInbox(): Promise<Message[]> {
    const response = await axiosClient.get('/api/messages/inbox');
    return response.data;
  },

  async getConversation(userId: string): Promise<Message[]> {
    const response = await axiosClient.get(`/api/messages/conversation/${userId}`);
    return response.data;
  },

  async send(data: SendMessageDto): Promise<Message> {
    const response = await axiosClient.post('/api/messages', data);
    return response.data;
  },

  async markAsRead(messageId: string): Promise<void> {
    await axiosClient.patch(`/api/messages/${messageId}/read`);
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add client/src/types/api.ts client/src/services/messagesService.ts
git commit -m "feat(client): add Message types and messagesService"
```

---

### Task 26: Add Payment Types and Service

**Files:**
- Modify: `client/src/types/api.ts`
- Create: `client/src/services/paymentsService.ts`

- [ ] **Step 1: Add Payment types to api.ts**

```typescript
// Payment types
export interface Payment {
  _id: string;
  user: User | string;
  course: Course | string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'credit_card' | 'paypal' | 'bank_transfer';
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  courseId: string;
  amount: number;
  method: 'credit_card' | 'paypal' | 'bank_transfer';
}

export interface UpdatePaymentDto {
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
}
```

- [ ] **Step 2: Create paymentsService.ts**

```typescript
import { axiosClient } from '../lib/axiosClient';
import type { Payment, CreatePaymentDto, UpdatePaymentDto } from '../types/api';

export const paymentsService = {
  async getMyPayments(): Promise<Payment[]> {
    const response = await axiosClient.get('/api/payments/my-payments');
    return response.data;
  },

  async create(data: CreatePaymentDto): Promise<Payment> {
    const response = await axiosClient.post('/api/payments', data);
    return response.data;
  },

  // Admin only
  async getAll(): Promise<Payment[]> {
    const response = await axiosClient.get('/api/payments');
    return response.data;
  },

  async updateStatus(id: string, data: UpdatePaymentDto): Promise<Payment> {
    const response = await axiosClient.patch(`/api/payments/${id}`, data);
    return response.data;
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add client/src/types/api.ts client/src/services/paymentsService.ts
git commit -m "feat(client): add Payment types and paymentsService"
```

---

### Task 27: Add Users Service

**Files:**
- Create: `client/src/services/usersService.ts`

- [ ] **Step 1: Add update profile DTO type to api.ts**

```typescript
// User update types
export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  country?: string;
  avatar?: string;
}
```

- [ ] **Step 2: Create usersService.ts**

```typescript
import { axiosClient } from '../lib/axiosClient';
import type { User, UpdateProfileDto } from '../types/api';

export const usersService = {
  async getProfile(): Promise<User> {
    const response = await axiosClient.get('/api/users/me');
    return response.data;
  },

  async updateProfile(data: UpdateProfileDto): Promise<User> {
    const response = await axiosClient.patch('/api/users/me', data);
    return response.data;
  },

  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await axiosClient.post('/api/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Admin only
  async getAll(): Promise<User[]> {
    const response = await axiosClient.get('/api/users');
    return response.data;
  },

  async updateRole(userId: string, role: 'student' | 'teacher' | 'admin'): Promise<User> {
    const response = await axiosClient.patch(`/api/users/${userId}/role`, { role });
    return response.data;
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add client/src/types/api.ts client/src/services/usersService.ts
git commit -m "feat(client): add usersService for profile and user management"
```

---

### Task 28: Update AuthContext to Fetch User Profile After Refresh

**Files:**
- Modify: `client/src/contexts/AuthContext.tsx`

- [ ] **Step 1: Import usersService**

Add to imports:

```typescript
import { usersService } from '../services/usersService';
```

- [ ] **Step 2: Update silent re-auth to fetch user profile**

Replace the `useEffect` hook:

```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      const { accessToken: token } = await authService.refresh();
      setAccessToken(token);
      
      // Fetch user profile
      const userData = await usersService.getProfile();
      setUser(userData);
      
      setIsLoading(false);
    } catch (error) {
      // No valid refresh token - user not logged in
      setUser(null);
      setAccessToken(null);
      setIsLoading(false);
    }
  };

  checkAuth();
}, []);
```

- [ ] **Step 3: Commit**

```bash
git add client/src/contexts/AuthContext.tsx
git commit -m "feat(client): fetch user profile during silent re-authentication"
```

---

### Task 29: Test Feature Services

**Files:**
- None (manual testing task)

- [ ] **Step 1: Test courses list page**

1. Open http://localhost:5173/courses
2. Expected: Courses loaded from backend API
3. Click on a course
4. Expected: Course details page shows correct data

- [ ] **Step 2: Test enrollment (basic)**

Open browser console and run:
```javascript
// Test enrollmentsService
import { enrollmentsService } from './services/enrollmentsService';
const result = await enrollmentsService.getMine();
console.log('My enrollments:', result);
```

- [ ] **Step 3: Verify all services are created**

Check that all service files exist and export correct methods:
- authService ✓
- usersService ✓
- coursesService ✓
- enrollmentsService ✓
- messagesService ✓
- paymentsService ✓

**Phase 4 Complete:** All service layers created and basic integration tested.

---

## Phase 5: Real-Time Layer

### Task 30: Create Socket.io Client

**Files:**
- Create: `client/src/lib/socketClient.ts`

- [ ] **Step 1: Write socketClient.ts with initialization and cleanup**

```typescript
import { io, Socket } from 'socket.io-client';
import { config } from '../config/env';

let socket: Socket | null = null;

export const initializeSocket = (accessToken: string): Socket => {
  // Don't create new socket if already connected
  if (socket?.connected) {
    return socket;
  }

  // Create socket connection with JWT auth
  socket = io(config.socketUrl, {
    auth: {
      token: accessToken,
    },
    transports: ['websocket'], // Prefer WebSocket over polling
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
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
    console.log('Socket disconnected manually');
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/lib/socketClient.ts
git commit -m "feat(client): create Socket.io client with auth and reconnection"
```

---

### Task 31: Integrate Socket Lifecycle with AuthContext

**Files:**
- Modify: `client/src/contexts/AuthContext.tsx`

- [ ] **Step 1: Import socket functions**

Add to imports:

```typescript
import { initializeSocket, disconnectSocket } from '../lib/socketClient';
```

- [ ] **Step 2: Initialize socket after successful login**

In the `login` method, after setting user and token:

```typescript
const login = async (credentials: LoginDto) => {
  setIsLoading(true);
  try {
    const { user: userData, tokens } = await authService.login(credentials);
    setUser(userData);
    setAccessToken(tokens.access);
    
    // Initialize Socket.io
    initializeSocket(tokens.access);
    
    toast.success(`Welcome back, ${userData.name}!`);
    
    const dashboards = {
      student: '/dashboard',
      teacher: '/instructor',
      admin: '/admin',
    };
    window.location.href = dashboards[userData.role];
  } catch (error: any) {
    toast.error(error.message || 'Login failed');
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

- [ ] **Step 3: Initialize socket after successful registration**

Same pattern in the `register` method

- [ ] **Step 4: Initialize socket after silent re-auth**

In the `useEffect` hook, after fetching user:

```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      const { accessToken: token } = await authService.refresh();
      setAccessToken(token);
      
      const userData = await usersService.getProfile();
      setUser(userData);
      
      // Initialize Socket.io
      initializeSocket(token);
      
      setIsLoading(false);
    } catch (error) {
      setUser(null);
      setAccessToken(null);
      setIsLoading(false);
    }
  };

  checkAuth();
}, []);
```

- [ ] **Step 5: Disconnect socket on logout**

In the `logout` method, before clearing state:

```typescript
const logout = async () => {
  try {
    await authService.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Disconnect socket
    disconnectSocket();
    
    setUser(null);
    setAccessToken(null);
    toast.success('Logged out successfully');
    window.location.href = '/login';
  }
};
```

- [ ] **Step 6: Commit**

```bash
git add client/src/contexts/AuthContext.tsx
git commit -m "feat(client): integrate Socket.io lifecycle with AuthContext"
```

---

### Task 32: Create Notification Bell Component (Example Real-Time Feature)

**Files:**
- Create: `client/src/components/NotificationBell.tsx`

- [ ] **Step 1: Write NotificationBell.tsx with socket listener**

```typescript
import { useState, useEffect } from 'react';
import { Bell } from '@phosphor-icons/react';
import { getSocket } from '../lib/socketClient';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for new notifications
    const handleNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.success(notification.message, {
        icon: '🔔',
      });
    };

    socket.on('notification', handleNotification);

    // Cleanup
    return () => {
      socket.off('notification', handleNotification);
    };
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400"
      >
        <Bell size={24} weight={unreadCount > 0 ? 'fill' : 'regular'} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-200 p-4 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Notifications
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                No notifications
              </p>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  className="border-b border-slate-100 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
                >
                  <p className="text-sm text-slate-900 dark:text-white">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/NotificationBell.tsx
git commit -m "feat(client): add NotificationBell component with real-time updates"
```

---

### Task 33: Add Real-Time Message Listeners (Example Pattern)

**Files:**
- Create: `client/src/hooks/useRealtimeMessages.ts`

- [ ] **Step 1: Create custom hook for real-time messages**

```typescript
import { useState, useEffect } from 'react';
import { getSocket } from '../lib/socketClient';
import type { Message } from '../types/api';

export function useRealtimeMessages(conversationUserId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    // Listen for typing indicators
    const handleUserTyping = ({ userId }: { userId: string }) => {
      if (userId === conversationUserId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    // Listen for read receipts
    const handleMessageRead = ({ messageId }: { messageId: string }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, read: true } : msg
        )
      );
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('message-read', handleMessageRead);

    // Cleanup
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('message-read', handleMessageRead);
    };
  }, [conversationUserId]);

  const sendMessage = (recipientId: string, content: string) => {
    const socket = getSocket();
    socket?.emit('send-message', { recipientId, content });
  };

  const sendTyping = () => {
    const socket = getSocket();
    if (conversationUserId) {
      socket?.emit('typing', { userId: conversationUserId });
    }
  };

  const markAsRead = (messageId: string) => {
    const socket = getSocket();
    socket?.emit('mark-read', { messageId });
  };

  return {
    messages,
    setMessages,
    isTyping,
    sendMessage,
    sendTyping,
    markAsRead,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/useRealtimeMessages.ts
git commit -m "feat(client): add useRealtimeMessages hook for real-time chat"
```

---

### Task 34: Test Real-Time Features

**Files:**
- None (manual testing task)

- [ ] **Step 1: Test socket connection on login**

1. Login to the app
2. Open browser console
3. Expected: "Socket connected: <socket-id>" message

- [ ] **Step 2: Test socket disconnection on logout**

1. Logout from the app
2. Check browser console
3. Expected: "Socket disconnected manually" message

- [ ] **Step 3: Test notification bell (if added to UI)**

1. Trigger a notification from backend (or simulate via socket)
2. Expected: Bell icon shows badge count, toast appears

- [ ] **Step 4: Test socket reconnection**

1. Login and verify socket connected
2. Stop backend server
3. Expected: "Socket connection error" in console
4. Restart backend server
5. Expected: Socket reconnects automatically

- [ ] **Step 5: Test real-time message hook pattern**

This can be tested when implementing actual chat UI in dashboard pages

**Phase 5 Complete:** Real-time layer integrated with Socket.io notifications and messaging.

---

## Final Integration Tasks

### Task 35: Create ErrorMessage Component

**Files:**
- Create: `client/src/components/ErrorMessage.tsx`

- [ ] **Step 1: Write ErrorMessage.tsx**

```typescript
import { WarningCircle } from '@phosphor-icons/react';

interface ErrorMessageProps {
  message: string;
  retry?: () => void;
}

export default function ErrorMessage({ message, retry }: ErrorMessageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950">
      <div className="rounded-lg border border-red-200 bg-white p-8 text-center shadow-lg dark:border-red-800 dark:bg-neutral-900">
        <WarningCircle size={48} className="mx-auto text-red-500" weight="fill" />
        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
          Something went wrong
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{message}</p>
        {retry && (
          <button
            onClick={retry}
            className="mt-6 rounded-lg bg-violet-600 px-6 py-2 text-white hover:bg-violet-700"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ErrorMessage.tsx
git commit -m "feat(client): add ErrorMessage component for error states"
```

---

### Task 36: Add React Hot Toast Provider to App

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Import Toaster component**

Add to imports:

```typescript
import { Toaster } from 'react-hot-toast'
```

- [ ] **Step 2: Add Toaster to App**

Inside the AuthProvider, add Toaster:

```tsx
<AuthProvider>
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 4000,
      style: {
        background: '#333',
        color: '#fff',
      },
      success: {
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff',
        },
      },
      error: {
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        },
      },
    }}
  />
  <BrowserRouter>
    {/* ... rest of app */}
  </BrowserRouter>
</AuthProvider>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat(client): add React Hot Toast provider for notifications"
```

---

### Task 37: Update Server .env with CLIENT_URL

**Files:**
- Modify: `server/.env`

- [ ] **Step 1: Add CLIENT_URL to server/.env**

Add or update:

```env
CLIENT_URL=http://localhost:5173
```

- [ ] **Step 2: Verify CORS is configured correctly in server**

Check `server/src/app.ts` has:

```typescript
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
```

- [ ] **Step 3: Restart server if needed**

```bash
cd server
npm run dev
```

- [ ] **Step 4: Commit**

```bash
git add server/.env
git commit -m "config(server): add CLIENT_URL for CORS configuration"
```

---

### Task 38: Final End-to-End Testing

**Files:**
- None (comprehensive testing task)

- [ ] **Step 1: Test complete auth flow**

1. Register new user → Success toast → Dashboard redirect
2. Logout → Success toast → Login page
3. Login → Success toast → Dashboard redirect
4. Refresh page → Still logged in (silent re-auth)
5. Check network tab: Access token in Authorization header, cookies present

- [ ] **Step 2: Test protected routes**

1. Logout and try accessing /dashboard → Redirect to /login
2. Login as student → Can access /dashboard
3. Try accessing /admin → Redirect back to /dashboard
4. Create teacher account → Can access /instructor
5. Try accessing /admin → Redirect to /instructor

- [ ] **Step 3: Test courses integration**

1. Go to /courses → Courses loaded from backend
2. Click course → Details page loads
3. Check network tab: GET /api/courses requests successful

- [ ] **Step 4: Test real-time socket**

1. Login → Check console for "Socket connected"
2. Keep browser open for 1 minute
3. Socket should stay connected (no disconnect messages)
4. Logout → "Socket disconnected manually" in console

- [ ] **Step 5: Test error handling**

1. Try login with wrong password → Error toast
2. Stop backend server → Try loading courses → Error message
3. Restart server → Retry → Success

- [ ] **Step 6: Test token refresh**

1. Login successfully
2. Wait for access token to expire (or manually invalidate)
3. Make an API call (refresh page or navigate)
4. Expected: Token refreshes automatically, no error

**All Tasks Complete:** Full-stack integration working end-to-end!

---

## Post-Integration Checklist

- [ ] All 6 services created (auth, users, courses, enrollments, messages, payments)
- [ ] All protected routes working with role-based access
- [ ] Login, register, logout working with token refresh
- [ ] Silent re-authentication working on page refresh
- [ ] Socket.io connected and receiving events
- [ ] Error handling with toast notifications
- [ ] Loading states for all async operations
- [ ] Type safety across all API calls
- [ ] No console errors or warnings
- [ ] Backend and frontend communicating via CORS

---

## Success Criteria (from Spec)

✅ **Authentication:**
- Users can register, login, logout
- Tokens refresh automatically on 401
- Silent re-authentication works on page refresh
- Role-based redirects work correctly

✅ **Protected Routes:**
- Unauthenticated users redirected to /login
- Wrong role access redirects to correct dashboard
- Dashboard pages only accessible to authorized roles

✅ **API Integration:**
- All service layers created for 6 backend modules
- Type-safe API calls throughout
- Loading and error states handled consistently

✅ **Real-Time Features:**
- Socket.io connected on login, disconnected on logout
- Real-time notification pattern established
- Real-time messaging hook pattern established

✅ **Code Quality:**
- TypeScript strict mode passing
- Consistent patterns across all services
- Reusable components (ProtectedRoute, ErrorMessage, NotificationBell)

---

## Next Steps (Out of Scope for This Plan)

After completing this integration:

1. **Dashboard Implementation:**
   - Connect student dashboard to enrollments and courses
   - Connect instructor dashboard to their courses and students
   - Connect admin dashboard to all users, courses, payments

2. **Feature Enhancements:**
   - Course creation/edit forms for instructors
   - Payment processing UI
   - Messaging/chat UI
   - User profile editing
   - Avatar upload

3. **Testing:**
   - Unit tests for services
   - Component tests for auth flow
   - E2E tests with Playwright/Cypress

4. **Production:**
   - Environment setup for production
   - Build and deployment configuration
   - Performance optimization
   - Analytics integration

---

## Notes

- **TDD Approach:** Backend already has 217 tests. Frontend focuses on integration testing via manual testing steps.
- **Commit Frequency:** Every task commits changes. Keep commits atomic and descriptive.
- **Error Handling:** All async operations have try-catch with user-friendly error messages.
- **Type Safety:** All API calls are fully typed with TypeScript interfaces.
- **Real-Time:** Socket.io lifecycle tied to authentication state for security.
- **CORS:** Backend allows CLIENT_URL with credentials for cookie-based auth.
