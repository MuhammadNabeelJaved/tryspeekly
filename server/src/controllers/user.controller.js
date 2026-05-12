import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import apiErrors from "../utils/apiErrors.js";

// Create a new user controller function to handle user registration using try catch blocks for error handling and asyncHandler to catch asynchronous errors.
export const createUser = asyncHandler(async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return ApiResponse.error(res, 'Name, email, and password are required', 400);
        }
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return ApiResponse.error(res, 'Email already exists', 400);
        }
        // Create new user
        const newUser = new User({ name, email, password });
        await newUser.save();
        return ApiResponse.success(res, newUser, 'User created successfully', 201);

    } catch (error) {
        console.error('Error creating user:', error);
        return ApiResponse.error(res, 'Failed to create user', 500);

    }
});