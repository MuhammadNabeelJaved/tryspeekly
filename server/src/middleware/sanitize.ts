import mongoSanitize from 'express-mongo-sanitize';

export const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized ${key} in ${req.method} ${req.path}`);
  },
});
