import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes.js';

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

// Rate limiting middleware
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
}));



// Routes
app.use('/api/users', userRoutes);