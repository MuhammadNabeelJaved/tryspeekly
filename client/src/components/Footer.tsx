import { LinkedinLogo, TwitterLogo, FacebookLogo, InstagramLogo, Phone, EnvelopeSimple, MapPin, ArrowRight } from '@phosphor-icons/react'

const FOOTER_LINKS = {
  Courses: ['Beginner English', 'Intermediate English', 'Advanced English', 'Business English', 'IELTS Preparation'],
  Company: ['About Us', 'Our Instructors', 'Success Stories', 'Careers', 'Contact Us'],
  Resources: ['Learning Blog', 'Grammar Guide', 'Vocabulary Builder', 'Practice Tests', 'Help Center'],
}

const SOCIAL = [
  { Icon: LinkedinLogo, label: 'LinkedIn', href: '#' },
  { Icon: TwitterLogo, label: 'Twitter', href: '#' },
  { Icon: FacebookLogo, label: 'Facebook', href: '#' },
  { Icon: InstagramLogo, label: 'Instagram', href: '#' },
]

export default function Footer() {
  return (
    <footer id="contact" className="bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 lg:pt-20 pb-8">

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 md:gap-12 mb-10 md:mb-12">

          {/* Brand column */}
          <div>
            <a href="#" className="flex items-center gap-2.5 mb-5 w-fit">
              <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,0.4)]">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M3 6l6-3 6 3-6 3-6-3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M3 12l6 3 6-3" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M3 9l6 3 6-3" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">EnglishPro</span>
            </a>

            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-[28ch]">
              Empowering learners worldwide to achieve English fluency through interactive courses, expert instruction, and personalized learning experiences.
            </p>

            {/* Contact info */}
            <div className="space-y-3 mb-6">
              <a href="tel:+80155564545" className="flex items-center gap-2.5 text-gray-400 hover:text-violet-400 transition-colors text-sm">
                <Phone size={14} weight="fill" className="text-violet-500 flex-shrink-0" />
                +801 555 645 45
              </a>
              <a href="mailto:hello@englishlms.com" className="flex items-center gap-2.5 text-gray-400 hover:text-violet-400 transition-colors text-sm">
                <EnvelopeSimple size={14} weight="fill" className="text-violet-500 flex-shrink-0" />
                hello@englishlms.com
              </a>
              <p className="flex items-start gap-2.5 text-gray-400 text-sm">
                <MapPin size={14} weight="fill" className="text-violet-500 flex-shrink-0 mt-0.5" />
                123 Business Ave, New York, NY 10001
              </p>
            </div>

            {/* Social */}
            <div className="flex gap-2.5">
              {SOCIAL.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 bg-white/5 hover:bg-violet-600 border border-white/10 hover:border-violet-600 rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition-all duration-200"
                >
                  <Icon size={15} weight="fill" />
                </a>
              ))}
            </div>
          </div>

          {/* Links + Newsletter */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">{category}</p>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Newsletter</p>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Subscribe to get the latest business insights.
              </p>
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="bg-white/5 border border-white/10 text-gray-300 placeholder-gray-600 text-sm px-3 py-2.5 rounded-lg outline-none focus:border-violet-500 transition-colors w-full"
                />
                <button className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  Subscribe <ArrowRight size={13} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">© 2026 Next Agency. All rights reserved.</p>
          <p className="text-sm text-gray-600">Designed with excellence for growing businesses.</p>
        </div>
      </div>
    </footer>
  )
}
