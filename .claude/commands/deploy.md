# /project:deploy — Deployment Checklist

Run through the full deployment checklist before and after deploying: `$ARGUMENTS`

## Pre-Deploy Checklist

- [ ] All tests pass (`npm test` in both `client/` and `server/`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No `.env` secrets committed to git
- [ ] Environment variables documented and set in target environment
- [ ] Database migrations are backwards-compatible
- [ ] API changes are backwards-compatible or versioned
- [ ] Bundle size has not grown unexpectedly (`npm run build` in client/)

## Deploy Steps

1. Merge feature branch to `main`
2. Tag the release: `git tag v<version>`
3. Deploy server first, then client
4. Run smoke tests against production

## Post-Deploy Verification

- [ ] Health endpoint responds: `GET /api/health`
- [ ] Auth flow works end-to-end
- [ ] Critical user paths verified manually
- [ ] Error rates normal (check logs)
- [ ] Rollback plan ready if issues found within 30 min
