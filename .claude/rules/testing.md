# Testing Rules

Claude loads these rules when writing or reviewing tests.

---

## Framework

### Client (client/)
- **Vitest** + **React Testing Library** + `@testing-library/jest-dom`
- Config: `client/vitest.config.ts` (separate from `vite.config.ts`)
- Setup file: `client/src/test/setup.ts` — imports `@testing-library/jest-dom`
- Environment: `jsdom`; globals enabled (`describe`, `it`, `expect` available globally)

### Server (server/)
- **No test infrastructure exists yet.** The server has no Jest config, no test files, and no testing devDependencies.
- If server tests are added: use **Jest + Supertest**. Install separately and create a `jest.config.js`.

---

## Test File Location

- Component tests: `src/components/<Name>/__tests__/<Name>.test.tsx`
- Page tests: `src/pages/__tests__/<Name>.test.tsx`
- Utility tests: `src/utils/__tests__/<name>.test.ts`
- Keep test files co-located with their source — do NOT put all tests in a top-level `tests/` folder

---

## What to Test

- Every React component: render output, user interactions, prop-driven state changes
- Utility functions: all branches (valid + invalid input)
- Auth-gated UI: what renders for each role / unauthenticated state
- Form validation: required fields, invalid formats, error message visibility

## What NOT to Test

- Implementation details (internal state, private helpers)
- Third-party library behavior (React Router, Axios, etc.)
- Styling / CSS class names
- Simple components with no logic (pure presentational wrappers)

---

## Patterns

### Imports — always import explicitly from `vitest`
Even though `globals: true` is set, import explicitly so the source of each utility is clear:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
```

### Mocking — use `vi.fn()`, never `jest.fn()`
```tsx
const handleClick = vi.fn()
fireEvent.click(screen.getByRole('button', { name: /submit/i }))
expect(handleClick).toHaveBeenCalledTimes(1)
```

### Pages that need a router — use a `renderWithRouter` helper
```tsx
const renderWithRouter = (component: React.ReactElement) =>
  render(<BrowserRouter>{component}</BrowserRouter>)

renderWithRouter(<LoginPage />)
```

### Querying — prefer accessible queries
```tsx
screen.getByRole('button', { name: /sign in/i })   // ✓ role + accessible name
screen.getByLabelText(/email address/i)             // ✓ form inputs
screen.getByText(/invalid credentials/i)            // ✓ visible text
screen.getByTestId('submit-btn')                    // ✗ last resort only
```

### Async assertions — `waitFor` or `findBy*`
```tsx
// waitFor: for actions that trigger async state changes
await waitFor(() => {
  expect(screen.getByText(/error message/i)).toBeInTheDocument()
})

// findBy*: shorthand for getBy* inside waitFor
expect(await screen.findByText(/success/i)).toBeInTheDocument()
```

### Utility unit tests — no render needed
```ts
import { describe, it, expect } from 'vitest'
import { isValidEmail } from '../validation'

describe('isValidEmail', () => {
  it('returns true for valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })
  it('returns false for invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false)
  })
})
```

### Server API tests (when added)
```js
// Uses /api/v1/ prefix — not /api/
describe('POST /api/v1/users/login', () => {
  it('returns 200 and tokens for valid credentials', async () => { ... })
  it('returns 401 for wrong password', async () => { ... })
  it('returns 400 for missing fields', async () => { ... })
})
```

---

## Rules

- Tests must be deterministic — no random data, no time-dependent assertions without mocking
- Prefer `findBy*` over `getBy*` for async UI assertions
- Test user-visible behavior — not implementation details
- Use regex with `i` flag for text queries to avoid case sensitivity failures: `/sign in/i`
- One `describe` per component/utility; group related cases with nested `describe` blocks
- Each `it` tests exactly one behavior — keep assertions focused
