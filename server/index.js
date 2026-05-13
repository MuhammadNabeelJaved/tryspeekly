import dns from 'dns'
import 'dotenv/config'
import app from './app.js'
import connectDB from './src/database/db.js'

// Override DNS to use Google Public DNS for MongoDB Atlas SRV record lookup
// This MUST be before any network calls
dns.setServers(['8.8.8.8', '8.8.4.4'])

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
  })
}).catch((err) => {
  console.error('✗ Failed to connect to MongoDB:', err.message)
  process.exit(1)
})