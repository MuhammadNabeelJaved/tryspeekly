// server/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import coursesRoutes from './courses.routes';
// TODO: Import other routes as they are migrated to MVC
// import enrollmentsRoutes from './enrollments.routes';
// import messagesRoutes from './messages.routes';
// import paymentsRoutes from './payments.routes';

const router = Router();

// Register all routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/courses', coursesRoutes);
// TODO: Register other routes as they are migrated to MVC
// router.use('/enrollments', enrollmentsRoutes);
// router.use('/messages', messagesRoutes);
// router.use('/payments', paymentsRoutes);

export default router;
