import type { Notification } from '../types/api'

export function getNotificationPath(
  notif: Notification,
  prefix: 'admin' | 'dashboard' | 'instructor'
): { path: string; state?: Record<string, unknown> } {
  if (notif.type === 'message') {
    return { path: `/${prefix}/messages`, state: { openUserId: notif.relatedId } }
  }

  switch (prefix) {
    case 'admin':
      if (notif.type === 'payment') return { path: '/admin/payments' }
      if (notif.type === 'financial_aid') return { path: '/admin/financial-aid' }
      if (notif.type === 'course') return { path: '/admin/courses' }
      if (notif.type === 'user') return { path: '/admin/students' }
      return { path: '/admin/notifications' }
    case 'dashboard':
      if (notif.type === 'payment') return { path: '/dashboard/payments' }
      if (notif.type === 'financial_aid') return { path: '/dashboard/financial-aid' }
      if (notif.type === 'course') return { path: '/dashboard/my-courses' }
      return { path: '/dashboard/notifications' }
    case 'instructor':
      if (notif.type === 'course') return { path: '/instructor/my-courses' }
      return { path: '/instructor/notifications' }
  }
}
