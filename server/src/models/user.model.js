import mongoose from 'mongoose';
import validator from 'validator';

const { Schema, model } = mongoose;

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },

        email: {
            type: String,
            required: [true, 'Email address is required'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            validate: {
                validator: (value) => validator.isEmail(value),
                message: 'Please provide a valid email address',
            },
        },

        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false,
        },

        role: {
            type: String,
            enum: {
                values: ['user', 'admin', 'instructor'],
                message: 'Invalid user role',
            },
            default: 'user',
        },

        profileImage: {
            type: String,
            trim: true,
            validate: {
                validator: (value) =>
                    !value || validator.isURL(value),
                message: 'Invalid profile image URL',
            },
        },

        bio: {
            type: String,
            trim: true,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
        },

        phoneNumber: {
            type: String,
            trim: true,
            validate: {
                validator: (value) =>
                    !value || validator.isMobilePhone(value, 'any'),
                message: 'Invalid phone number',
            },
        },

        country: {
            type: String,
            trim: true,
            maxlength: [100, 'Country name cannot exceed 100 characters'],
        },

        city: {
            type: String,
            trim: true,
            maxlength: [100, 'City name cannot exceed 100 characters'],
        },

        address: {
            type: String,
            trim: true,
            maxlength: [300, 'Address cannot exceed 300 characters'],
        },

        zipCode: {
            type: String,
            trim: true,
            maxlength: [20, 'Zip code cannot exceed 20 characters'],
        },

        socialLinks: {
            facebook: {
                type: String,
                trim: true,
                validate: {
                    validator: (value) =>
                        !value || validator.isURL(value),
                    message: 'Invalid Facebook URL',
                },
            },

            twitter: {
                type: String,
                trim: true,
                validate: {
                    validator: (value) =>
                        !value || validator.isURL(value),
                    message: 'Invalid Twitter URL',
                },
            },

            instagram: {
                type: String,
                trim: true,
                validate: {
                    validator: (value) =>
                        !value || validator.isURL(value),
                    message: 'Invalid Instagram URL',
                },
            },

            linkedin: {
                type: String,
                trim: true,
                validate: {
                    validator: (value) =>
                        !value || validator.isURL(value),
                    message: 'Invalid LinkedIn URL',
                },
            },

            github: {
                type: String,
                trim: true,
                validate: {
                    validator: (value) =>
                        !value || validator.isURL(value),
                    message: 'Invalid GitHub URL',
                },
            },
        },

        twoStepEnabled: {
            type: Boolean,
            default: false,
        },

        accessToken: {
            type: String,
            select: false,
        },

        refreshToken: {
            type: String,
            select: false,
        },

        resetPasswordToken: {
            type: String,
            select: false,
        },

        resetPasswordExpires: {
            type: Date,
            select: false,
        },

        verificationToken: {
            type: String,
            select: false,
        },

        verificationExpires: {
            type: Date,
            select: false,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },

        notifications: [
            {
                type: {
                    type: String,
                    required: [true, 'Notification type is required'],
                    trim: true,
                    maxlength: [50, 'Notification type cannot exceed 50 characters'],
                },

                message: {
                    type: String,
                    required: [true, 'Notification message is required'],
                    trim: true,
                    maxlength: [500, 'Notification message cannot exceed 500 characters'],
                },

                read: {
                    type: Boolean,
                    default: false,
                },

                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Remove sensitive fields when returning user data
userSchema.methods.toJSON = function () {
    const user = this.toObject();

    delete user.password;
    delete user.accessToken;
    delete user.refreshToken;
    delete user.resetPasswordToken;
    delete user.verificationToken;

    return user;
};

// Handle duplicate email errors
userSchema.post('save', function (error, doc, next) {
    if (error.code === 11000) {
        next(new Error('Email already exists'));
    } else {
        next(error);
    }
});

// Automatically exclude soft deleted users
userSchema.pre(/^find/, function (next) {
    this.find({ isDeleted: false });
    next();
});

export const User = model('User', userSchema);