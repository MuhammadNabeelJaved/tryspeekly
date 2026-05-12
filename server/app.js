import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './database/db.js';
import userRoutes from './routes/user.routes.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { crossOriginResourcePolicy, crossOriginEmbedderPolicy, crossOriginOpenerPolicy, frameguard, hidePoweredBy } from 'helmet';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet(
    crossOriginResourcePolicy, { policy: "cross-origin" },
    crossOriginEmbedderPolicy, { policy: "require-corp" },
    crossOriginOpenerPolicy, { policy: "same-origin" },
    crossOriginResourcePolicy, { policy: "cross-origin" },
    frameguard, { action: "deny" },
    hidePoweredBy,
));

// Connect to MongoDB
connectDB();

// Rate limiting middleware
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
}));



// Routes
app.use('/api/users', userRoutes);


// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: { message: 'Server Error' } });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;