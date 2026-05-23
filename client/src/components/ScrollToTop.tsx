import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from '@phosphor-icons/react'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  // Top: 0 takes us all the way back
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    // Show button when page is scrolled down 400px
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-[4.5rem] md:bottom-20 right-[5.5rem] sm:right-[6.5rem] z-50 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_8px_30px_rgba(124,58,237,0.5)] dark:shadow-[0_8px_30px_rgba(124,58,237,0.8)] border-2 border-white dark:border-neutral-800 hover:bg-violet-700 hover:shadow-[0_12px_40px_rgba(124,58,237,0.6)] dark:bg-violet-500 dark:hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} weight="bold" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
