import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, type Variants } from 'framer-motion'
import toast from 'react-hot-toast'
import { Envelope, Phone, MapPin, PaperPlaneRight, LinkedinLogo, TwitterLogo, FacebookLogo, InstagramLogo } from '@phosphor-icons/react'
import { contactService } from '../services/contact.service'
import { extractApiError } from '../utils/apiError'

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const SOCIAL = [
  { Icon: LinkedinLogo, label: 'LinkedIn', href: '#' },
  { Icon: TwitterLogo, label: 'Twitter', href: '#' },
  { Icon: FacebookLogo, label: 'Facebook', href: '#' },
  { Icon: InstagramLogo, label: 'Instagram', href: '#' },
]

export default function ContactPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', subject: '', message: '' }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (data: { name: string; email: string; subject: string; message: string }) => {
    setIsSubmitting(true)
    try {
      await contactService.submit(data)
      toast.success('Message sent! We\'ll get back to you soon.')
      reset()
    } catch (err: unknown) {
      toast.error(extractApiError(err, 'Failed to send message. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] pt-[120px] lg:pt-[140px] pb-16 lg:pb-24 bg-white dark:bg-neutral-950 overflow-hidden transition-colors duration-300">
      
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-200/40 dark:bg-violet-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-fuchsia-200/30 dark:bg-fuchsia-900/15 rounded-full blur-[80px]" />
      </div>

      <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 mb-4">
            <span className="h-px w-8 bg-violet-600 dark:bg-violet-500"></span>
            <span className="text-violet-600 dark:text-violet-400 font-semibold uppercase tracking-wider text-sm">Get In Touch</span>
            <span className="h-px w-8 bg-violet-600 dark:bg-violet-500"></span>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
            Let's start a <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">conversation</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg text-slate-500 dark:text-neutral-400">
            Have questions about our courses or need support? Our team is here to help you on your English learning journey.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-[45%_55%] gap-12 lg:gap-8 items-start">
          
          {/* LEFT: Contact Info */}
          <motion.div variants={itemVariants} className="space-y-8 lg:pr-12">
            <div className="bg-slate-50 dark:bg-neutral-900/50 p-8 rounded-3xl border border-slate-100 dark:border-neutral-800">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Envelope size={24} weight="fill" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-neutral-400 mb-1">Email Us</p>
                    <a href="mailto:hello@englishlms.com" className="text-lg font-semibold text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      hello@englishlms.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Phone size={24} weight="fill" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-neutral-400 mb-1">Call Us</p>
                    <a href="tel:+923086925545" className="text-lg font-semibold text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      +92 308 692 5545
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} weight="fill" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-neutral-400 mb-1">Visit Us</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      123 Education Street<br />New York, NY 10001
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-10 pt-8 border-t border-slate-200 dark:border-neutral-800">
                <p className="text-sm font-medium text-slate-500 dark:text-neutral-400 mb-4">Follow us on social media</p>
                <div className="flex gap-3">
                  {SOCIAL.map(({ Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="w-10 h-10 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl flex items-center justify-center text-slate-600 dark:text-neutral-400 transition-all shadow-sm hover:-translate-y-1"
                    >
                      <Icon size={20} weight="fill" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Contact Form */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-900 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-neutral-800 rounded-3xl p-8 lg:p-10">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Send us a message</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-neutral-300">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    {...register('name', { required: 'Name is required' })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 transition-all"
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-neutral-300">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 transition-all"
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message as string}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-sm font-medium text-slate-700 dark:text-neutral-300">Subject</label>
                <input
                  type="text"
                  id="subject"
                  {...register('subject', { required: 'Subject is required' })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 transition-all"
                  placeholder="How can we help you?"
                />
                {errors.subject && <p className="text-xs text-red-500">{errors.subject.message as string}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-neutral-300">Message</label>
                <textarea
                  id="message"
                  rows={5}
                  {...register('message', { required: 'Message is required' })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 transition-all resize-none"
                  placeholder="Tell us more about your inquiry..."
                ></textarea>
                {errors.message && <p className="text-xs text-red-500">{errors.message.message as string}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-all active:scale-[0.98] hover:shadow-[0_16px_40px_rgba(124,58,237,0.45)] disabled:opacity-70 disabled:cursor-not-allowed group mt-4"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
                {!isSubmitting && <PaperPlaneRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}