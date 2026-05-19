import Notification from '../models/notification.model.js'
import { emitToUser } from './socket.js'

export const createAndEmitNotification = async ({
  recipientId,
  title,
  message,
  type = 'system',
  severity = 'low',
  relatedId,
  relatedType,
}) => {
  const notification = await Notification.create({
    recipient: recipientId,
    title,
    message,
    type,
    severity,
    relatedId,
    relatedType,
  })
  emitToUser(recipientId, 'new_notification', notification)
  return notification
}
