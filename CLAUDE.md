# LinkedIn Project — Claude Memory

## Project Overview
Full-stack English learning platform with a `client/` (frontend) and `server/` (backend) monorepo structure.

## Stack
- **Client:** React + TypeScript + Tailwind CSS + Vite
- **Server:** Node.js + Express + TypeScript + MongoDB/Mongoose
- **Auth:** JWT-based authentication
- **Real-time:** Socket.io for notifications/messaging

## Project Structure
```
Project/
├── client/     # React frontend
└── server/     # Express backend API
```

## Key Conventions
- Use TypeScript strictly — no `any` types unless absolutely necessary
- Prefer functional components and React hooks on the client
- RESTful API design on the server; follow conventions in `.claude/rules/api-conventions.md`
- All code style rules live in `.claude/rules/code-style.md`
- Testing patterns live in `.claude/rules/testing.md`

## Git Workflow
- Branch from `main` for features: `feat/<name>`
- Branch from `main` for fixes: `fix/<name>`
- Squash-merge PRs to keep history clean

## Environment
- Client runs on port `5173` (Vite)
- Server runs on port `5000`
- `.env` files are gitignored — never commit secrets

## Custom Commands
- `/project:review` — review code quality and security
- `/project:fix-issue` — triage and fix a reported bug
- `/project:deploy` — run deployment checklist
