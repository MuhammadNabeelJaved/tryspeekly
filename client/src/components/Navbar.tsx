import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { List, X, Phone, SquaresFour, SignOut } from '@phosphor-icons/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '../context/AuthContext'
import OffersMarquee from './OffersMarquee'
import UserAvatar from './UserAvatar'
import type { Offer } from '@/services/offers.service'

// Create a motion-enabled Link component
const MotionLink = motion.create(Link)

const NAV_LINKS = [
  { name: 'Courses', href: '/courses' },
  { name: 'Instructors', href: '/instructors' },
  { name: 'Blog', href: '/blog' },
  { name: 'Payments', href: '/payments' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

export default function Navbar({ offers = [] }: { offers?: Offer[] }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const mobileProfileRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  const handleLogout = async () => {
    setProfileOpen(false)
    setMobileProfileOpen(false)
    await logout()
    navigate('/')
  }

  const dashboardLink = user
    ? user.role === 'admin' ? '/admin'
    : user.role === 'teacher' ? '/instructor'
    : user.role === 'team_member' ? '/team'
    : '/dashboard'
    : null

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
      if (mobileProfileRef.current && !mobileProfileRef.current.contains(e.target as Node)) {
        setMobileProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white dark:bg-neutral-900 ${
        scrolled ? 'shadow-[0_2px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_24px_rgba(0,0,0,0.4)] border-b border-slate-100 dark:border-neutral-800' : ''
      }`}
    >
      <OffersMarquee offers={offers} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px] lg:h-[80px]">

          {/* Logo */}
          <MotionLink
            to="/"
            className="flex items-center gap-2.5 flex-shrink-0"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div
              className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,0.35)]"
              whileHover={{
                rotate: [0, -5, 5, 0],
                scale: 1.1
              }}
              transition={{
                rotate: { duration: 0.5, ease: "easeInOut" },
                scale: { duration: 0.2 }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 6l6-3 6 3-6 3-6-3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M3 12l6 3 6-3" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M3 9l6 3 6-3" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <motion.span
              className="text-xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors"
              whileHover={{ color: "#7c3aed" }}
              transition={{ duration: 0.2 }}
            >
              EnglishPro
            </motion.span>
          </MotionLink>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const isActive = link.href === '/' ? location.pathname === '/' : location.pathname.startsWith(link.href)
              return (
                <MotionLink
                  key={link.name}
                  to={link.href}
                  className={`text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-600 dark:text-neutral-300 hover:text-violet-600 dark:hover:text-violet-300'
                  }`}
                  whileHover={{
                    scale: 1.05,
                    y: -1
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {link.name}
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400 rounded-full"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </MotionLink>
              )
            })}
          </nav>

          {/* Right: Actions */}
          <div className="hidden lg:flex items-center gap-4">
            
            {/* Contact Number */}
            <motion.a
              href="tel:+923086925545"
              className="flex items-center gap-2 text-slate-600 dark:text-neutral-300 hover:text-violet-600 dark:hover:text-violet-300 transition-colors mr-2"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.div
                className="w-8 h-8 bg-violet-50 dark:bg-violet-800/40 rounded-full flex items-center justify-center"
                whileHover={{
                  backgroundColor: "#ddd6fe",
                  scale: 1.1
                }}
                transition={{ duration: 0.2 }}
              >
                <Phone size={15} weight="fill" className="text-violet-600 dark:text-violet-200" />
              </motion.div>
              <span className="text-sm font-bold tracking-tight">+92 308 692 5545</span>
            </motion.a>

            <div className="w-px h-6 bg-slate-200 dark:bg-neutral-800 hidden xl:block"></div>

            {isAuthenticated ? (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(p => !p)}
                  className="flex items-center gap-2 rounded-xl p-1 pr-2.5 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="Profile menu"
                >
                  <UserAvatar
                    src={user?.profileImage}
                    name={user?.name}
                    size="sm"
                  />
                  <span className="text-sm font-bold text-slate-700 dark:text-neutral-200 max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 overflow-hidden z-50"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-3">
                        <UserAvatar src={user?.profileImage} name={user?.name} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                          <p className="text-xs text-slate-400 dark:text-neutral-500 truncate capitalize">{user?.role}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-2">
                        {dashboardLink && (
                          <Link
                            to={dashboardLink}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-neutral-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                          >
                            <SquaresFour size={16} weight="bold" />
                            Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-neutral-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <SignOut size={16} weight="bold" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-slate-600 dark:text-neutral-300 hover:text-violet-600 dark:hover:text-violet-300 transition-colors">
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="hidden xl:inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(124,58,237,0.3)] transition hover:bg-violet-700"
                >
                  Sign Up
                </Link>
              </>
            )}

            <div className="ml-1">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />

            {/* Mobile profile avatar + dropdown */}
            {isAuthenticated && (
              <div ref={mobileProfileRef} className="relative">
                <button
                  onClick={() => { setMobileProfileOpen(p => !p); setMenuOpen(false) }}
                  className="flex items-center justify-center rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="Profile menu"
                >
                  <UserAvatar src={user?.profileImage} name={user?.name} size="sm" />
                </button>

                <AnimatePresence>
                  {mobileProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 overflow-hidden z-50"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-3">
                        <UserAvatar src={user?.profileImage} name={user?.name} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                          <p className="text-xs text-slate-400 dark:text-neutral-500 truncate capitalize">{user?.role}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-2">
                        {dashboardLink && (
                          <Link
                            to={dashboardLink}
                            onClick={() => setMobileProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-neutral-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                          >
                            <SquaresFour size={16} weight="bold" />
                            Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-neutral-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <SignOut size={16} weight="bold" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button
              onClick={() => { setMenuOpen(p => !p); setMobileProfileOpen(false) }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-all"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-slate-100 dark:border-neutral-800 overflow-hidden"
            >
              <div className="py-5 flex flex-col gap-2">
                {NAV_LINKS.map((link) => {
                  const isActive = link.href === '/' ? location.pathname === '/' : location.pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        isActive 
                          ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' 
                          : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {link.name}
                    </Link>
                  )
                })}
                
                <div className="h-px bg-slate-100 dark:bg-neutral-800 my-3 mx-4" />
                
                <div className="px-4 flex flex-col gap-3">
                  <a href="tel:+923086925545" className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-neutral-800 py-3 rounded-xl text-slate-700 dark:text-neutral-200 transition-colors">
                    <Phone size={18} weight="fill" className="text-violet-600 dark:text-violet-400" />
                    <span className="text-sm font-bold tracking-tight">+92 308 692 5545</span>
                  </a>
                  
                  {!isAuthenticated && (
                  <>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      <Link to="/login" onClick={() => setMenuOpen(false)} className="bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-white text-sm font-bold py-3 rounded-xl text-center transition-colors">
                        Login
                      </Link>
                      <Link to="/signup" onClick={() => setMenuOpen(false)} className="bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-bold py-3 rounded-xl text-center transition-colors">
                        Sign Up
                      </Link>
                    </div>
                  </>
                )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

