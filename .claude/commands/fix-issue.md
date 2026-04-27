# /project:fix-issue — Triage & Fix a Bug

Given a bug report or issue description: `$ARGUMENTS`

## Steps

1. **Reproduce** — understand the reported behavior vs expected behavior
2. **Locate** — search relevant files using Grep/Glob; identify the root cause
3. **Understand** — read the failing code path completely before touching anything
4. **Hypothesize** — state the root cause in one sentence before fixing
5. **Fix** — make the minimal change needed; do not refactor surrounding code
6. **Verify** — confirm the fix addresses the root cause without introducing regressions
7. **Test** — run or write a test that would have caught this bug

## Rules
- Never skip the hypothesis step — if you can't state the root cause, keep investigating
- Fix the cause, not the symptom
- One fix per PR — don't bundle unrelated cleanup
