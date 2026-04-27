# Code Style Rules

Claude loads these rules whenever editing TypeScript, React, or Node.js files.

## General
- Use TypeScript strictly — `"strict": true` in tsconfig; no implicit `any`
- Prefer `const` over `let`; never use `var`
- Arrow functions for callbacks; named functions for top-level declarations
- Max line length: 100 characters
- No trailing whitespace; files end with a single newline

## Naming
- Components: `PascalCase` (e.g., `UserCard`, `PostFeed`)
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- Types/Interfaces: `PascalCase`, prefix interfaces with `I` only if needed for disambiguation

## React (client/)
- Functional components only — no class components
- Custom hooks must start with `use` (e.g., `useAuth`, `usePosts`)
- Co-locate component styles with the component file
- Avoid prop drilling beyond 2 levels — use Context or state management
- Key props must be stable and unique — never use array index as key for dynamic lists

## Node/Express (server/)
- Route handlers must be thin — business logic lives in service files
- Always validate request body/params before processing
- Never expose stack traces in API responses
- Use `async/await` — avoid raw Promise chains

## Imports
- Group imports: 1) Node built-ins, 2) Third-party, 3) Internal — with a blank line between groups
- Use path aliases (`@/`) instead of deep relative imports (`../../../`)
