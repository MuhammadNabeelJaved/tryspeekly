// server/src/services/index.ts
// Barrel export for all services
export * from './auth.service';
// TODO: Export other services as they are migrated to MVC
// export * from './users.service';
// export * from './courses.service';
// export * from './enrollments.service';
// export * from './messages.service';
// export * from './payments.service';

// Existing shared utilities
export * from './email.service';
export * from './logger.service';
export * from './socket.service';
export * from './upload.service';
