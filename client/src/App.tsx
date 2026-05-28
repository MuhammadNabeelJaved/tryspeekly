import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState, Suspense, lazy, Component, type ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'
import { GeoProvider, useGeo } from '@/context/GeoContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import Loader from '@/components/Loader'
import AIChatWidget from '@/components/AIChatWidget'
import { offersService, type Offer } from '@/services/offers.service'

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
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
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
  const [activeOffers, setActiveOffers] = useState<Offer[]>([])

  useEffect(() => {
    let mounted = true
    offersService.getActiveOffers()
      .then(response => {
        if (mounted && response.success) {
          setActiveOffers(response.data.filter(offer => offer.bannerText?.trim()))
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-white transition-colors duration-300 dark:bg-neutral-950">
      <Navbar offers={activeOffers} />
      <main className={`relative flex flex-1 flex-col ${activeOffers.length > 0 ? 'pt-8' : ''}`}>
        <Suspense fallback={<Loader page />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/instructors" element={<InstructorsPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/slug/:slug" element={<BlogPostPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailsPage />} />
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
      <AIChatWidget />
    </div>
  )
}

function GeoWall({ children }: { children: React.ReactNode }) {
  const { isBlocked, loading } = useGeo()
  if (loading) return <Loader fullScreen />
  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🌍</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Not Available in Your Region</h1>
          <p className="text-slate-500 dark:text-neutral-400">
            We're sorry, but this service is currently not available in your country.
          </p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

function App() {
  return (
    <AppErrorBoundary>
    <BrowserRouter>
      <GeoProvider>
      <AuthProvider>
        <SocketProvider>
          <GeoWall>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '12px', fontSize: '14px', fontWeight: '500', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' },
              success: { style: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' } },
              error:   { style: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' } },
            }}
          />
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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/*" element={<PublicLayout />} />
            </Routes>
          </Suspense>
          </GeoWall>
        </SocketProvider>
      </AuthProvider>
      </GeoProvider>
    </BrowserRouter>
    </AppErrorBoundary>
  )
}

export default App
