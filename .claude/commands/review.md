# /project:review — Code Review

Perform a thorough code review of recent changes or a specified file/directory.

## Steps

1. **Identify scope** — review staged changes, a specific file, or a directory passed as argument: `$ARGUMENTS`
2. **Check correctness** — logic errors, edge cases, off-by-one bugs
3. **Check security** — SQL injection, XSS, auth bypass, exposed secrets, OWASP Top 10
4. **Check code style** — follows `.claude/rules/code-style.md`
5. **Check API conventions** — follows `.claude/rules/api-conventions.md`
6. **Check test coverage** — are new code paths tested per `.claude/rules/testing.md`?
7. **Report findings** — list issues by severity: Critical / High / Medium / Low
8. **Suggest improvements** — concrete, actionable fixes for each issue

## Output Format

```
## Review: <scope>

### Critical
- ...

### High
- ...

### Medium
- ...

### Low / Style
- ...

### Summary
<1-2 sentence overall assessment>
```
