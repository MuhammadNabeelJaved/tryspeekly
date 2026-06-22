import Courses from '@/components/Courses'
import SEOMeta from '@/components/SEOMeta'

export default function CoursesPage() {
  return (
    <div className="pt-[72px] lg:pt-[80px]">
      <SEOMeta slug="courses" fallbackTitle="English Test Prep Courses — IELTS, PTE, TOEFL and More | TrySpeekly" fallbackDescription="Browse TrySpeekly's complete English test preparation courses including IELTS, PTE, TOEFL, Cambridge English, Duolingo, OET, and LangCert. Premium non-AI study materials and live private sessions included." />
      <Courses />
    </div>
  )
}
