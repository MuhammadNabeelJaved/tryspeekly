import { GithubLogo, LinkedinLogo, XLogo } from '@phosphor-icons/react'

const FOOTER_LINKS = {
  Product: ['Features', 'Courses', 'Pricing', 'Certificate Programs', 'For Business'],
  Learn: ['Placement Test', 'Learning Paths', 'Live Sessions', 'AI Practice', 'Vocabulary'],
  Company: ['About', 'Blog', 'Careers', 'Press', 'Contact'],
  Legal: ['Privacy', 'Terms', 'Cookies', 'Accessibility'],
}

const SOCIAL = [
  { Icon: XLogo, label: 'X (Twitter)', href: '#' },
  { Icon: LinkedinLogo, label: 'LinkedIn', href: '#' },
  { Icon: GithubLogo, label: 'GitHub', href: '#' },
]

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">

        <div className="grid grid-cols-2 md:grid-cols-[220px_1fr] gap-12">

          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2.5 mb-5 w-fit">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 3.5h12M2 7.5h8M2 11.5h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Fluenta</span>
            </a>
            <p className="text-sm text-slate-400 leading-relaxed max-w-[28ch]">
              English fluency for careers, ambitions, and the life you deserve.
            </p>

            <div className="flex gap-3 mt-6">
              {SOCIAL.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Icon size={15} weight="fill" />
                </a>
              ))}
            </div>
          </div>

          {/* Links grid */}
          <div className="col-span-2 md:col-span-1 grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  {category}
                </p>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">© 2026 Fluenta. All rights reserved.</p>
          <p className="text-sm text-slate-500">Built for learners who mean business.</p>
        </div>
      </div>
    </footer>
  )
}
