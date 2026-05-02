import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { List, X, Phone } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

// Create a motion-enabled Link component
const MotionLink = motion.create(Link)

const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Courses', href: '/courses' },
  { name: 'About', href: '/about' },
  { name: 'Instructors', href: '/instructors' },
  { name: 'Blog', href: '/blog' },
  { name: 'Payments', href: '/payments' },
  { name: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white dark:bg-neutral-900 ${
        scrolled ? 'shadow-[0_2px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_24px_rgba(0,0,0,0.4)] border-b border-slate-100 dark:border-neutral-800' : ''
      }`}
    >
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

          {/* Right: phone + CTA */}
          <div className="hidden lg:flex items-center gap-5">
            <ThemeToggle />
            <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:text-violet-600 dark:hover:text-violet-300 transition-colors">
              Login
            </Link>
            <Link
              to="/signup"
              className="hidden xl:inline-flex items-center justify-center rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(124,58,237,0.3)] transition hover:bg-violet-700"
            >
              Sign Up
            </Link>
            <motion.a
              href="tel:+80155564545"
              className="flex items-center gap-2 text-slate-600 dark:text-neutral-300 hover:text-violet-600 dark:hover:text-violet-300 transition-colors"
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
              <span className="text-sm font-medium">+801 555 645 45</span>
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-[0_4px_14px_rgba(124,58,237,0.3)]"
            >
              Get a Quote
            </motion.a>
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white p-2 transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={22} /> : <List size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-100 dark:border-neutral-800 py-5">
            <div className="flex flex-col gap-5">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === '/' ? location.pathname === '/' : location.pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`text-sm font-bold transition-colors ${
                      isActive 
                        ? 'text-violet-600 dark:text-violet-400' 
                        : 'text-slate-600 dark:text-neutral-300 hover:text-violet-600 dark:hover:text-violet-300'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              })}
              <div className="border-t border-slate-100 dark:border-neutral-800 pt-5 flex flex-col gap-3">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:text-violet-600 dark:hover:text-violet-300">
                  Login
                </Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className="bg-violet-600 text-white text-sm font-semibold px-5 py-3 rounded-lg text-center">
                  Sign Up
                </Link>
                <a href="tel:+80155564545" className="flex items-center gap-2 text-slate-600 dark:text-neutral-300">
                  <Phone size={15} weight="fill" className="text-violet-600 dark:text-violet-200" />
                  <span className="text-sm font-medium">+801 555 645 45</span>
                </a>
                <a href="#contact" className="bg-violet-600 text-white text-sm font-semibold px-5 py-3 rounded-lg text-center">
                  Get a Quote
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

