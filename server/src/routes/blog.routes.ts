import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { validateJoi } from '../middleware/validateJoi';
import { blogValidation } from '../validations/blog.validation';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// Optional authentication middleware just for blogs (to read public blogs without token)
import { verifyAccessToken } from '../utils/jwt';
import User from '../models/User.model';
import { Request, Response, NextFunction } from 'express';

const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = { ...decoded, _id: user._id.toString() };
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
};

// Get all blogs (Public / All users)
router.get(
  '/',
  optionalAuthenticate,
  validateJoi(blogValidation.list),
  blogController.getAllBlogs
);

// Get blog by slug (Public / All users)
router.get(
  '/slug/:slug',
  optionalAuthenticate,
  validateJoi(blogValidation.getBySlug),
  blogController.getBlogBySlug
);

// Get blog by ID (Public / All users)
router.get(
  '/:id',
  optionalAuthenticate,
  validateJoi(blogValidation.getById),
  blogController.getBlogById
);

// Admin-only routes
router.use(authenticate, authorize('admin'));

// Create blog
router.post(
  '/',
  validateJoi(blogValidation.create),
  blogController.createBlog
);

// Update blog
router.patch(
  '/:id',
  validateJoi(blogValidation.update),
  blogController.updateBlog
);

// Delete blog
router.delete(
  '/:id',
  validateJoi(blogValidation.delete),
  blogController.deleteBlog
);

export default router;
