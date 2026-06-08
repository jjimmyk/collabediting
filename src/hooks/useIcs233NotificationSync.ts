import { useEffect, useRef } from 'react'
import {
  subscribeToIcs233ActionNotifications,
  type Ics233ActionNotificationRow,
} from '@/lib/ics233-notification-service'

type UseIcs233NotificationSyncOptions = {
  enabled: boolean
  profileEmail: string | null
  onNotification: (notification: Ics233ActionNotificationRow) => void
}

export function useIcs233NotificationSync({
  enabled,
  profileEmail,
  onNotification,
}: UseIcs233NotificationSyncOptions) {
  const onNotificationRef = useRef(onNotification)

  useEffect(() => {
    onNotificationRef.current = onNotification
  }, [onNotification])

  useEffect(() => {
    if (!enabled || !profileEmail) {
      return undefined
    }

    return subscribeToIcs233ActionNotifications(profileEmail, (notification) => {
      onNotificationRef.current(notification)
    })
  }, [enabled, profileEmail])
}
