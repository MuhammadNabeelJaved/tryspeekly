import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import Home from '@/pages/Home'
import CoursesPage from '@/pages/CoursesPage'
import './App.css'

// Scroll handler for hash links across routes
function ScrollHandler() {
  const { pathname, hash } = useLocation()
  
  useEffect(() => {
    if (hash) {
// Small timeout to ensure page content is rendered before scrolling
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''))
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  
  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollHandler />
      <div className="min-h-[100dvh] w-full overflow-x-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
        <Navbar />
        <main className="relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<CoursesPage />} />
          </Routes>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </BrowserRouter>
  )
}

export default App
