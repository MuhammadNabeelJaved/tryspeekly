import { motion } from 'framer-motion'
import Hero from '@/components/Hero'
import Stats from '@/components/Stats'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import Testimonials from '@/components/Testimonials'
import Reviews from '@/components/Reviews'
import Process from '@/components/Process'
import Blog from '@/components/Blog'

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const sectionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  }
}

export default function Home() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={sectionVariants}><Hero /></motion.div>
      <motion.div variants={sectionVariants}><Stats /></motion.div>
      <motion.div variants={sectionVariants}><Features /></motion.div>
      <motion.div variants={sectionVariants}><HowItWorks /></motion.div>
      <motion.div variants={sectionVariants}><Testimonials /></motion.div>
      <motion.div variants={sectionVariants}><Reviews /></motion.div>
      <motion.div variants={sectionVariants}><Process /></motion.div>
      <motion.div variants={sectionVariants}><Blog /></motion.div>
    </motion.div>
  )
}
