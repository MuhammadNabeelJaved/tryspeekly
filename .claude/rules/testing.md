# Testing Rules

Claude loads these rules when writing or reviewing tests.

## Framework
- **Client:** Vitest + React Testing Library
- **Server:** Jest + Supertest for API integration tests

## What to Test
- Every API endpoint: happy path + error cases (400, 401, 403, 404, 500)
- Business logic in service files
- Complex React components with user interactions
- Auth middleware behavior

## What NOT to Test
- Implementation details (internal state, private methods)
- Third-party library behavior
- Simple getters/setters with no logic

## Patterns

### API Tests (server/)
```ts
describe('POST /api/posts', () => {
  it('creates a post for authenticated user', async () => { ... });
  it('returns 401 for unauthenticated requests', async () => { ... });
  it('returns 400 for missing required fields', async () => { ... });
});
```

### Component Tests (client/)
```tsx
it('shows error message on failed login', async () => {
  render(<LoginForm />);
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
});
```

## Rules
- Tests must be deterministic — no random data, no time-dependent assertions without mocking
- Prefer `findBy*` over `getBy*` for async UI assertions
- Do not test implementation details — test user-visible behavior
- Integration tests hit the real database via a test connection — do not mock the DB layer
