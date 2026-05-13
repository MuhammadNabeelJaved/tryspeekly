import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, Suspense, lazy, Component, type ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import Loader from '@/components/Loader'

const Home = lazy(() => import('@/pages/Home'))
const CoursesPage = lazy(() => import('@/pages/CoursesPage'))
const CourseDetailsPage = lazy(() => import('@/pages/CourseDetailsPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const InstructorsPage = lazy(() => import('@/pages/InstructorsPage'))
const BlogPage = lazy(() => import('@/pages/BlogPage'))
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'))
const TermsOfServicePage = lazy(() => import('@/pages/TermsOfServicePage'))
const CookiePolicyPage = lazy(() => import('@/pages/CookiePolicyPage'))
const PaymentsPage = lazy(() => import('@/pages/PaymentsPage'))
const FinancialAidPage = lazy(() => import('@/pages/FinancialAidPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const SignupPage = lazy(() => import('@/pages/SignupPage'))
const EmailVerificationPage = lazy(() => import('@/pages/EmailVerificationPage'))
const StudentDashboardPage = lazy(() => import('@/pages/StudentDashboardPage'))
const InstructorDashboardPage = lazy(() => import('@/pages/InstructorDashboardPage'))
const CertificateViewPage = lazy(() => import('@/pages/CertificateViewPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))

import './App.css'

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error) {
    console.error('[AppErrorBoundary]', error)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 px-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-slate-500 dark:text-neutral-400 mb-6">An unexpected error occurred. Please reload.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function ScrollHandler() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''))
        if (element) element.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

function PublicLayout() {
  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-white dark:bg-neutral-950 transition-colors duration-300">
      <Navbar />
      <main className="relative">
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/instructors" element={<InstructorsPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/financial-aid" element={<FinancialAidPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}

function App() {
  return (
    <AppErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ScrollHandler />
          <Suspense fallback={<Loader fullScreen />}>
            <Routes>
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instructor/*"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <InstructorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/certificate/:id" element={<CertificateViewPage />} />
              <Route path="/*" element={<PublicLayout />} />
            </Routes>
          </Suspense>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
    </AppErrorBoundary>
  )
}

export default App
