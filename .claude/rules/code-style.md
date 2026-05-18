# Code Style Rules

Claude loads these rules whenever editing TypeScript, React, or Node.js files.

---

## General (both client and server)
- Prefer `const` over `let`; never use `var`
- Arrow functions for callbacks; named functions for top-level declarations
- Max line length: 100 characters
- No trailing whitespace; files end with a single newline
- `async/await` everywhere — avoid raw Promise chains

## Naming
- Components: `PascalCase` (e.g., `UserCard`, `PostFeed`)
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Client files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- Server files: `kebab-case.model.js`, `kebab-case.controller.js`, `kebab-case.route.js`
- Types/Interfaces (client): `PascalCase`; prefix with `I` only when needed for disambiguation

---

## React (client/) — TypeScript
- TypeScript strict mode — no implicit `any`; no explicit `any` unless absolutely unavoidable
- Functional components only — no class components (AppErrorBoundary is the sole exception)
- Custom hooks must start with `use` (e.g., `useAuth`, `usePosts`)
- Avoid prop drilling beyond 2 levels — use Context or a state manager
- Key props must be stable and unique — never use array index as key for dynamic lists
- Use path alias `@/` for all internal imports (e.g., `@/context/AuthContext`)
- Lazy-load page-level components with `React.lazy()` + `<Suspense>`

---

## Node/Express (server/) — JavaScript (ES Modules)
The server is **plain JavaScript** with `"type": "module"`. No TypeScript, no `@types`, no `tsc`.

### Imports
- Always include the `.js` extension in import paths (required for ESM):
  ```js
  import asyncHandler from '../utils/asyncHandler.js'   // ✓
  import asyncHandler from '../utils/asyncHandler'       // ✗
  ```
- No path aliases — use relative paths (`../utils/`, `../models/`)
- Group imports: 1) Node built-ins, 2) Third-party, 3) Internal — blank line between groups

### Route handlers
- Wrap every handler with `asyncHandler` from `../utils/asyncHandler.js`:
  ```js
  export const getUser = asyncHandler(async (req, res) => { ... })
  ```
- Handlers must be thin — destructure from `req.body`/`req.params`, call model/util, return response
- Use `router.route('/path').get(...).post(...)` chaining in route files

### Error handling
- **Throw** custom error classes instead of manually returning error responses:
  ```js
  throw new NotFoundError('Course not found')          // ✓
  return res.status(404).json({ ... })                  // ✗ (except in edge cases)
  ```
- Available classes (from `../utils/apiErrors.js`):
  `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`,
  `ConflictError`, `ValidationError`, `TooManyRequestsError`, `InternalServerError`
- Never expose stack traces in production responses

### Exports
- **Named exports** for middlewares and utilities
- **Default exports** for models, route files, and `asyncHandler`
- Controllers export named functions, one per handler

### Models
- Define Mongoose schemas with inline validation messages:
  ```js
  required: [true, 'Email is required']
  ```
- Always add `select: false` to sensitive fields (e.g., `password`, OTP fields)
- Strip sensitive fields before sending to client — use a `safeUser()` / `safeCourse()` helper

### Section comments
Use this style for logical sections within a file:
```js
// ─── Section Name ─────────────────────────────────────────────────────────────
```

---

## Imports (client/)
- Group imports: 1) Node built-ins, 2) Third-party, 3) Internal — with a blank line between groups
- Use path alias `@/` instead of deep relative imports (`../../../`)
