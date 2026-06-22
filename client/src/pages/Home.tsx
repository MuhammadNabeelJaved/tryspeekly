import { motion } from 'framer-motion'
import Hero from '@/components/Hero'
import Stats from '@/components/Stats'
import Features from '@/components/Features'
import HomeCourses from '@/components/HomeCourses'
import HowItWorks from '@/components/HowItWorks'
import FinancialAidSection from '@/components/FinancialAidSection'
import Testimonials from '@/components/Testimonials'
import Reviews from '@/components/Reviews'
import Process from '@/components/Process'
import Blog from '@/components/Blog'
import HomeInstructors from '@/components/HomeInstructors'
import NewsletterSection from '@/components/NewsletterSection'
import SEOMeta from '@/components/SEOMeta'

// Below-fold sections fade in on scroll — keeps them opacity:0 while async
// API content loads, preventing layout shifts from being counted as CLS.
// Hero is rendered immediately (outside this wrapper) to keep LCP fast.
const fadeIn = { initial: { opacity: 0 }, whileInView: { opacity: 1 } as const, viewport: { once: true }, transition: { duration: 0.4 } }

export default function Home() {
  return (
    <>
      <SEOMeta slug="home" fallbackTitle="TrySpeekly — IELTS, PTE and English Test Prep Online" fallbackDescription="Ace your IELTS, PTE, TOEFL, Cambridge, Duolingo, or OET with TrySpeekly's personalized 1-on-1 coaching. Flexible timings, session-based packages, and expert trainers who stay until you get it." />
      <Hero />
      <motion.div {...fadeIn}><Stats /></motion.div>
      <motion.div {...fadeIn}><HomeCourses /></motion.div>
      <motion.div {...fadeIn}><Features /></motion.div>
      <motion.div {...fadeIn}><HowItWorks /></motion.div>
      <motion.div {...fadeIn}><Testimonials /></motion.div>
      <motion.div {...fadeIn}><Reviews /></motion.div>
      <motion.div {...fadeIn}><Process /></motion.div>
      <motion.div {...fadeIn}><Blog /></motion.div>
      <motion.div {...fadeIn}><HomeInstructors /></motion.div>
      <motion.div {...fadeIn}><NewsletterSection /></motion.div>
      <motion.div {...fadeIn}><FinancialAidSection /></motion.div>
    </>
  )
}
