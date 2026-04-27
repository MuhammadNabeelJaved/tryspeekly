# Security Review Skill

Trigger: Claude detects a security-sensitive change (auth, API endpoints, file uploads, user input handling, secrets management).

## Auto-Invoked When
- Modifying auth middleware or JWT handling
- Adding new API endpoints that accept user input
- Handling file uploads or external data
- Adding environment variable usage or secrets
- Changing CORS, CSP, or security headers

## Security Checklist

### Authentication & Authorization
- [ ] JWT tokens are verified on every protected route
- [ ] Tokens have appropriate expiry (`accessToken`: 15min, `refreshToken`: 7d)
- [ ] No sensitive data in JWT payload
- [ ] Password hashing uses bcrypt with cost factor ≥ 12

### Input Validation
- [ ] All user input is validated and sanitized before use
- [ ] File upload types and sizes are restricted
- [ ] Query parameters are validated before DB queries

### Injection
- [ ] No raw SQL strings with user input
- [ ] MongoDB queries use parameterized style (object keys from schema, not user input)
- [ ] No `eval()` or dynamic code execution with user data

### Data Exposure
- [ ] API responses never include password hashes or internal IDs
- [ ] Error messages don't leak stack traces or schema details
- [ ] `.env` files are in `.gitignore`

### Transport
- [ ] All API calls use HTTPS in production
- [ ] Sensitive cookies are `HttpOnly`, `Secure`, `SameSite=Strict`

## Report Format
List findings as: `[SEVERITY] Finding — Recommendation`
Severity levels: CRITICAL / HIGH / MEDIUM / LOW / INFO
