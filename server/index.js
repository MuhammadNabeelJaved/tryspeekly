import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app.js'

const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/english-website'

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✓ MongoDB connected successfully')
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message)
    process.exit(1)
  }
}

const server = app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
})

process.on('unhandledRejection', (err) => {
  console.error('✗ Unhandled Rejection:', err.message)
  server.close(() => process.exit(1))
})

process.on('uncaughtException', (err) => {
  console.error('✗ Uncaught Exception:', err.message)
  process.exit(1)
})

connectDB()