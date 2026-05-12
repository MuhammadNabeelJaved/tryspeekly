# English Website Backend

Professional Express + TypeScript backend using an MVC-style structure:

- `routes/` wires endpoints and middleware.
- `controllers/` handles HTTP request/response concerns.
- `services/` contains business logic.
- `models/` contains Mongoose schemas.
- `validations/` contains Joi request schemas.
- `middleware/` contains auth, authorization, validation, rate limiting, and error handling.

## Commands

```bash
npm run dev
npm run build
npm start
```

Copy `.env.example` to `.env` and set `MONGODB_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` before running against a real database.

## API Base

`/api`

Main modules: auth, users, courses, enrollments, payments, messages, and blogs.
