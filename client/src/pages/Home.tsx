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

export default function Home() {
  return (
    <>
      <SEOMeta slug="home" fallbackTitle="TrySpeekly — Learn English Online" fallbackDescription="Master English with expert instructors. IELTS prep, Business English, and General English courses with certificates." />
      <Hero />
      <Stats />
      <HomeCourses />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Reviews />
      <Process />
      <Blog />
      <HomeInstructors />
      <NewsletterSection />
      <FinancialAidSection />
    </>
  )
}
