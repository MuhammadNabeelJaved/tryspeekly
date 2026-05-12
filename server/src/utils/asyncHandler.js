// Async Handler Middleware
// This middleware is used to handle asynchronous errors in Express routes.
// It wraps the route handler and catches any errors, passing them to the next middleware (error handler).

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;