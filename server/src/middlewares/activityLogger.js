import ActivityLog from '../models/activity-log.model.js'

/**
 * HOF returning Express middleware that logs a team_member action.
 * Only fires for role === 'team_member' and 2xx responses. Fire-and-forget.
 *
 * @param {string} action - create|update|delete|approve|reject|send|other
 * @param {string} resource - e.g. 'blog', 'review', 'payment'
 * @param {function} [getInfo] - optional (req, resBody) => { resourceId, resourceName, details }
 */
export const logActivity = (action, resource, getInfo) => (req, res, next) => {
  if (req.user?.role !== 'team_member') return next()

  const originalJson = res.json.bind(res)
  res.json = function (body) {
    res.json = originalJson
    const result = originalJson(body)

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const info = getInfo ? getInfo(req, body) : {}
      ActivityLog.create({
        teamMember:   req.user._id,
        action,
        resource,
        resourceId:   info.resourceId   ?? null,
        resourceName: info.resourceName ?? '',
        details:      info.details      ?? '',
        ip:           req.ip ?? '',
      }).catch(err => console.error('[ActivityLog]', err.message))
    }

    return result
  }

  next()
}
