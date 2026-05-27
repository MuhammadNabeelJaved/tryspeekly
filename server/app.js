import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './src/utils/apiErrors.js'
import { geoBlockMiddleware } from './src/middlewares/geo.middleware.js'

const app = express()

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

const corsOrigin = process.env.CLIENT_URL
    || /^http:\/\/localhost:\d+$/

app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.use(compression())

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use(cookieParser())

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
} else {
    app.use(morgan('combined'))
}

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, error: { message: 'Too many requests, please try again later.' } }
})
app.use(globalLimiter)
app.use(geoBlockMiddleware)

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
    })
})

import userRoutes from './src/routes/user.route.js'
import courseRoutes from './src/routes/course.route.js'
import enrollmentRoutes from './src/routes/enrollment.route.js'
import paymentRoutes from './src/routes/payment.route.js'
import messageRoutes from './src/routes/message.route.js'
import blogRoutes from './src/routes/blog.route.js'
import certificateRoutes from './src/routes/certificate.route.js'
import financialAidRoutes from './src/routes/financial-aid.route.js'
import supportRoutes from './src/routes/support.route.js'
import notificationRoutes from './src/routes/notification.route.js'
import assignmentRoutes from './src/routes/assignment.route.js'
import contactRoutes from './src/routes/contact.route.js'
import faqRoutes from './src/routes/faq.route.js'
import announcementRoutes from './src/routes/announcement.route.js'
import siteSettingsRoutes from './src/routes/site-settings.route.js'
import statsRoutes from './src/routes/stats.route.js'
import liveClassRoutes from './src/routes/live-class.route.js'
import seoRoutes from './src/routes/seo.route.js'
import reviewRoutes from './src/routes/review.route.js'
import geoRoutes from './src/routes/geo.route.js'
import salaryRoutes from './src/routes/salary.route.js'
import salaryRequestRoutes from './src/routes/salary-request.route.js'
import aiChatRoutes from './src/routes/ai-chat.route.js'
import couponRoutes from './src/routes/coupon.route.js'
import referralRoutes from './src/routes/referral.route.js'

app.use('/api/v1/users', userRoutes)
app.use('/api/v1/live-classes', liveClassRoutes)
app.use('/api/v1/courses', courseRoutes)
app.use('/api/v1/enrollments', enrollmentRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/messages', messageRoutes)
app.use('/api/v1/blogs', blogRoutes)
app.use('/api/v1/certificates', certificateRoutes)
app.use('/api/v1/financial-aid', financialAidRoutes)
app.use('/api/v1/support', supportRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/assignments', assignmentRoutes)
app.use('/api/v1/contact', contactRoutes)
app.use('/api/v1/faqs', faqRoutes)
app.use('/api/v1/announcements', announcementRoutes)
app.use('/api/v1/site-settings', siteSettingsRoutes)
app.use('/api/v1/stats', statsRoutes)
app.use('/api/v1/seo', seoRoutes)
app.use('/api/v1/reviews', reviewRoutes)
app.use('/api/v1/geo', geoRoutes)
app.use('/api/v1/salaries', salaryRoutes)
app.use('/api/v1/salary-requests', salaryRequestRoutes)
app.use('/api/v1/ai-chat', aiChatRoutes)
app.use('/api/v1/coupons', couponRoutes)
app.use('/api/v1/referrals', referralRoutes)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: { message: 'Route not found' }
    })
})

app.use(errorHandler)

export default app