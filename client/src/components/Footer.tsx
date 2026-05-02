import { useForm } from 'react-hook-form'
import { LinkedinLogo, TwitterLogo, FacebookLogo, InstagramLogo, Phone, EnvelopeSimple, MapPin, ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

const FOOTER_LINKS = {
  Courses: ['Beginner English', 'Intermediate English', 'Advanced English', 'Business English', 'IELTS Preparation'],
  Company: ['About Us', 'Our Instructors', 'Success Stories', 'Careers', 'Contact Us'],
  Resources: ['Learning Blog', 'Grammar Guide', 'Financial Aid', 'Practice Tests', 'Help Center'],
}

const SOCIAL = [
  { Icon: LinkedinLogo, label: 'LinkedIn', href: '#' },
  { Icon: TwitterLogo, label: 'Twitter', href: '#' },
  { Icon: FacebookLogo, label: 'Facebook', href: '#' },
  { Icon: InstagramLogo, label: 'Instagram', href: '#' },
]

export default function Footer() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { email: '' }
  })

  const onSubmit = (data: any) => {
    alert("Subscribed " + data.email)
    reset()
  }

  return (
    <footer className="bg-slate-50 dark:bg-neutral-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 lg:pt-24 pb-8">

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10 md:gap-16 mb-12 md:mb-16">

          {/* Brand column */}
          <div>
            <a href="#" className="flex items-center gap-2.5 mb-6 w-fit">
              <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,0.3)]">
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M3 6l6-3 6 3-6 3-6-3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M3 12l6 3 6-3" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M3 9l6 3 6-3" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">EnglishPro</span>
            </a>

            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-8 max-w-[28ch]">
              Empowering learners worldwide to achieve English fluency through interactive courses, expert instruction, and personalized learning experiences.
            </p>

            {/* Contact info */}
            <div className="space-y-4 mb-8">
              <a href="tel:+80155564545" className="flex items-center gap-3 text-slate-600 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm font-medium">
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <Phone size={14} weight="fill" className="text-violet-600 dark:text-violet-400" />
                </div>
                +801 555 645 45
              </a>
              <a href="mailto:hello@englishlms.com" className="flex items-center gap-3 text-slate-600 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm font-medium">
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <EnvelopeSimple size={14} weight="fill" className="text-violet-600 dark:text-violet-400" />
                </div>
                hello@englishlms.com
              </a>
              <p className="flex items-start gap-3 text-slate-600 dark:text-neutral-400 text-sm font-medium">
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={14} weight="fill" className="text-violet-600 dark:text-violet-400" />
                </div>
                123 Business Ave, New York
              </p>
            </div>

            {/* Social */}
            <div className="flex gap-3">
              {SOCIAL.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-violet-600 dark:hover:bg-violet-600 hover:border-violet-600 dark:hover:border-violet-600 rounded-lg flex items-center justify-center text-slate-400 dark:text-neutral-500 hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
                >
                  <Icon size={18} weight="fill" />
                </a>
              ))}
            </div>
          </div>

          {/* Links + Newsletter */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <p className="text-xs font-bold text-slate-900 dark:text-neutral-300 uppercase tracking-wider mb-6">{category}</p>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link}>
                      {link === 'Financial Aid' ? (
                        <Link to="/financial-aid" className="text-sm text-slate-600 dark:text-neutral-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">
                          {link}
                        </Link>
                      ) : (
                        <a href="#" className="text-sm text-slate-600 dark:text-neutral-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">
                          {link}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter */}
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-neutral-300 uppercase tracking-wider mb-6">Newsletter</p>
              <p className="text-sm text-slate-600 dark:text-neutral-500 leading-relaxed mb-5 font-medium">
                Subscribe to get the latest courses and tips.
              </p>
              <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <input
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                    placeholder="Enter your email"
                    className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-neutral-300 placeholder-slate-400 dark:placeholder-neutral-600 text-sm px-4 py-3 rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all w-full shadow-sm"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message as string}</p>}
                </div>
                <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-[0_4px_12px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2 group">
                  Subscribe Now <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 dark:text-neutral-600 font-medium">
            &copy; {new Date().getFullYear()} EnglishPro. All rights reserved.
          </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-sm text-slate-500 dark:text-neutral-600 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-slate-500 dark:text-neutral-600 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">Terms of Service</Link>
              <Link to="/cookies" className="text-sm text-slate-500 dark:text-neutral-600 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">Cookie Policy</Link>
            </div>
        </div>
      </div>
    </footer>
  )
}