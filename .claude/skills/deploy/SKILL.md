# Deploy Skill

Trigger: Claude is asked to help with deployment, release, or production readiness.

## Auto-Invoked When
- User mentions "deploy", "release", "production", "go live"
- Reviewing deployment configuration files (Dockerfile, CI/CD, nginx config)
- Setting up environment variables for production

## Pre-Deploy Verification Steps

1. **Build check** — confirm client and server build without errors
2. **Test gate** — all tests must pass; warn if test suite is incomplete
3. **Secret audit** — scan for hardcoded secrets or `.env` in git history
4. **Dependency audit** — run `npm audit` and flag HIGH/CRITICAL vulnerabilities
5. **Bundle analysis** — flag if client bundle size increased >20% unexpectedly
6. **Migration safety** — confirm DB migrations are backwards-compatible (no destructive changes without a fallback plan)

## Production Environment Checklist
- [ ] `NODE_ENV=production` is set
- [ ] All required env vars are set in the target environment
- [ ] CORS origins are locked to production domain(s) only
- [ ] Rate limiting is enabled on auth endpoints
- [ ] Error monitoring (e.g., Sentry) is configured
- [ ] Health check endpoint works: `GET /api/health`

## Rollback Plan
- Document the rollback steps before deploying
- Keep the previous Docker image or build artifact for 24 hours
- Monitor error rates for 30 minutes post-deploy
