import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './src/utils/apiErrors.js'

const app = express()

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
  max: 100,
  message: { success: false, error: { message: 'Too many requests, please try again later.' } }
})
app.use(globalLimiter)

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is healthy',
    timestamp: new Date().toISOString() 
  })
})

import authRoutes from './src/routes/auth.route.js'
import userRoutes from './src/routes/user.route.js'

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: { message: 'Route not found' } 
  })
})

app.use(errorHandler)

export default app