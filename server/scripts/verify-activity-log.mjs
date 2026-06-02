/**
 * Verification for the team activity log middleware.
 *
 * Exercises the REAL logActivity middleware exactly as Express invokes it.
 * The DB write (ActivityLog.create — Mongoose's job) is stubbed at the shared
 * module singleton, so we assert OUR gating + payload-mapping logic without
 * needing a live database connection.
 *
 * Run: node scripts/verify-activity-log.mjs
 */
import { logActivity } from '../src/middlewares/activityLogger.js'
import ActivityLog from '../src/models/activity-log.model.js'

let passed = 0
let failed = 0
const check = (name, cond) => {
  if (cond) { passed++; console.log(`  ✅ ${name}`) }
  else      { failed++; console.log(`  ❌ ${name}`) }
}

// Stub the model write — capture every payload the middleware tries to persist.
const writes = []
ActivityLog.create = async (payload) => { writes.push(payload); return payload }

// Drive middleware → next() (controller) → res.json, like Express does.
// NOTE: the real authenticate middleware sets req.user = { id, role, permissions }
// (id, NOT _id). Fixtures below use `id` to match production exactly.
function runMiddleware({ user, statusCode = 200, action = 'create', resource = 'blog', getInfo, body }) {
  return new Promise((resolve) => {
    const req = { user, ip: '127.0.0.1' }
    const res = {
      statusCode,
      json(b) { this._body = b; return this },
    }
    logActivity(action, resource, getInfo)(req, res, () => {
      const result = res.json(body ?? { success: statusCode < 300 })
      resolve(result)
    })
  })
}

async function main() {
  // ── Case 1: team_member + 2xx → write happens with correct payload ─────────
  console.log('Case 1: team_member create (201)')
  writes.length = 0
  const memberId = 'member-123'
  const returned = await runMiddleware({
    user: { id: memberId, role: 'team_member' },
    statusCode: 201,
    action: 'create',
    resource: 'blog',
    getInfo: (req, b) => ({ resourceId: b.data._id, resourceName: b.data.title, details: 'Created blog post' }),
    body: { success: true, data: { _id: 'blog-1', title: 'My Post' } },
  })
  check('exactly one log written', writes.length === 1)
  check('teamMember = acting user', writes[0]?.teamMember === memberId)
  check('action mapped', writes[0]?.action === 'create')
  check('resource mapped', writes[0]?.resource === 'blog')
  check('resourceId from getInfo', writes[0]?.resourceId === 'blog-1')
  check('resourceName from getInfo', writes[0]?.resourceName === 'My Post')
  check('details from getInfo', writes[0]?.details === 'Created blog post')
  check('ip captured from req', writes[0]?.ip === '127.0.0.1')
  check('res.json still returns the response body', returned?._body?.data?.title === 'My Post')

  // ── Case 2: admin → NOT logged (admins are not tracked) ────────────────────
  console.log('\nCase 2: admin action (must NOT log)')
  writes.length = 0
  await runMiddleware({ user: { id: 'admin-1', role: 'admin' }, statusCode: 200 })
  check('admin action produced no log', writes.length === 0)

  // ── Case 3: team_member + 4xx → NOT logged (only successful actions) ───────
  console.log('\nCase 3: team_member action that fails (403, must NOT log)')
  writes.length = 0
  await runMiddleware({ user: { id: 'member-9', role: 'team_member' }, statusCode: 403 })
  check('failed action produced no log', writes.length === 0)

  // ── Case 4: team_member + 500 → NOT logged ─────────────────────────────────
  console.log('\nCase 4: team_member action with server error (500, must NOT log)')
  writes.length = 0
  await runMiddleware({ user: { id: 'member-9', role: 'team_member' }, statusCode: 500 })
  check('500 response produced no log', writes.length === 0)

  // ── Case 5: unauthenticated (no user) → NOT logged, no crash ───────────────
  console.log('\nCase 5: no user on request (must NOT log, must not crash)')
  writes.length = 0
  await runMiddleware({ user: undefined, statusCode: 200 })
  check('no-user request produced no log', writes.length === 0)

  // ── Case 6: middleware without getInfo → still logs with safe defaults ─────
  console.log('\nCase 6: team_member action with no getInfo callback')
  writes.length = 0
  await runMiddleware({ user: { id: 'm2', role: 'team_member' }, statusCode: 200, action: 'delete', resource: 'review', getInfo: undefined })
  check('logs even without getInfo', writes.length === 1)
  check('resourceName defaults to empty string', writes[0]?.resourceName === '')
  check('resourceId defaults to null', writes[0]?.resourceId === null)
  check('details defaults to empty string', writes[0]?.details === '')

  // ── Case 7: write rejection is swallowed (fire-and-forget, no crash) ───────
  console.log('\nCase 7: DB write failure must not break the response')
  writes.length = 0
  ActivityLog.create = async () => { throw new Error('simulated DB failure') }
  let crashed = false
  let responseBody = null
  try {
    const r = await runMiddleware({ user: { id: 'm3', role: 'team_member' }, statusCode: 200, body: { ok: true } })
    responseBody = r?._body
  } catch { crashed = true }
  // give the rejected promise a tick to settle
  await new Promise(r => setTimeout(r, 50))
  check('response was not blocked by DB failure', responseBody?.ok === true)
  check('middleware did not throw on DB failure', crashed === false)

  console.log(`\n${'='.repeat(40)}\nRESULT: ${passed} passed, ${failed} failed`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch(err => { console.error('TEST CRASHED:', err); process.exit(1) })
