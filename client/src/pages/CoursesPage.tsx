import Courses from '@/components/Courses'
import SEOMeta from '@/components/SEOMeta'

export default function CoursesPage() {
  return (
    <div className="pt-[72px] lg:pt-[80px]">
      <SEOMeta slug="courses" fallbackTitle="Courses — TrySpeekly" fallbackDescription="Browse our IELTS, Business English, and General English courses taught by certified instructors." />
      <Courses />
    </div>
  )
}
