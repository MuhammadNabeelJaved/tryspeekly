import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Star, X, PencilSimple } from '@phosphor-icons/react'

const REVIEWS = [
  {
    name: "Alex Thompson",
    role: "UX Designer",
    content: "The interface is incredibly intuitive. I went from beginner to intermediate in just 3 months. Highly recommended for busy professionals.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80"
  },
  {
    name: "Maria Garcia",
    role: "Graduate Student",
    content: "My trainer was incredibly patient and the live sessions felt exactly like a one-on-one class. My pronunciation improved drastically in just weeks.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80"
  },
  {
    name: "James Wilson",
    role: "Software Engineer",
    content: "Simple, effective, and efficient. The lessons are bite-sized which makes it easy to stay consistent every single day.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80"
  }
]

export default function Reviews() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', review: '' }
  })

  const onSubmit = (data: any) => {
    // Add custom rating validation if needed
    if (rating === 0) {
      toast.error('Please select a star rating before submitting.')
      return
    }
    console.log(data, rating)
    setIsModalOpen(false)
    reset()
    setRating(0)
  }

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-neutral-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4"
          >
            What our learners say
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400 text-lg"
          >
            Trusted by thousands of students worldwide.
          </motion.p>
        </div>

        <div className="relative overflow-hidden mb-16">
          {/* Infinite Scroll Container */}
          <motion.div 
            className="flex gap-8 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 40,
              ease: "linear",
              repeat: Infinity
            }}
            whileHover={{ animationPlayState: "paused" }}
          >
            {/* Double the array to create seamless loop */}
            {[...REVIEWS, ...REVIEWS].map((review, i) => (
              <motion.div
                key={i}
                className="w-[350px] sm:w-[450px] p-8 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 flex flex-col h-full shrink-0 shadow-sm"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={18} weight="fill" className="text-violet-500" />
                  ))}
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8 flex-grow italic">
                  "{review.content}"
                </p>

                <div className="flex items-center gap-4 mt-auto">
                  <img 
                    src={review.avatar} 
                    alt={review.name} 
                    className="w-10 h-10 rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-300 shadow-sm"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{review.name}</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{review.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Fade Gradients for seamless look */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-neutral-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-neutral-950 to-transparent z-10 pointer-events-none" />
        </div>

        {/* Write a Review Button Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center pt-8 border-t border-gray-100 dark:border-neutral-800"
        >
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm font-medium">Have you learned with us?</p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 hover:border-violet-500 dark:hover:border-violet-500 px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
          >
            <PencilSimple size={18} />
            Write a Review
          </motion.button>
        </motion.div>

      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-800">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Write a Review</h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>
                
                <form className="p-6" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    
                    {/* Interactive Star Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Overall Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 -ml-1 transition-transform hover:scale-110 focus:outline-none"
                          >
                            <Star 
                              size={32} 
                              weight={(hoverRating || rating) >= star ? "fill" : "regular"} 
                              className={(hoverRating || rating) >= star ? "text-violet-500" : "text-gray-300 dark:text-neutral-600"} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
                      <input 
                        type="text" 
                        {...register('name', { required: 'Name is required' })}
                        className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                        placeholder="John Doe"
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message as string}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Review</label>
                      <textarea 
                        rows={4}
                        {...register('review', { required: 'Review is required' })}
                        className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none"
                        placeholder="What did you like about learning with us?"
                      />
                      {errors.review && <p className="text-xs text-red-500 mt-1">{errors.review.message as string}</p>}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm transition-colors"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
