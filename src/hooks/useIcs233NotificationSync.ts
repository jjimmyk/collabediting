import { useEffect, useRef } from 'react'
import {
  fetchRecentIcs233ActionNotifications,
  subscribeToIcs233ActionNotifications,
  type Ics233ActionNotificationRow,
} from '@/lib/ics233-notification-service'

type UseIcs233NotificationSyncOptions = {
  enabled: boolean
  profileEmail: string | null
  onHydrate: (notifications: Ics233ActionNotificationRow[]) => void
  onLiveNotification: (notification: Ics233ActionNotificationRow) => void
}

export function useIcs233NotificationSync({
  enabled,
  profileEmail,
  onHydrate,
  onLiveNotification,
}: UseIcs233NotificationSyncOptions) {
  const onHydrateRef = useRef(onHydrate)
  const onLiveNotificationRef = useRef(onLiveNotification)
  const hydratedForEmailRef = useRef<string | null>(null)

  useEffect(() => {
    onHydrateRef.current = onHydrate
  }, [onHydrate])

  useEffect(() => {
    onLiveNotificationRef.current = onLiveNotification
  }, [onLiveNotification])

  useEffect(() => {
    if (!enabled || !profileEmail) {
      hydratedForEmailRef.current = null
      return undefined
    }

    const normalizedEmail = profileEmail.trim().toLowerCase()
    let cancelled = false

    if (hydratedForEmailRef.current !== normalizedEmail) {
      hydratedForEmailRef.current = normalizedEmail
      void fetchRecentIcs233ActionNotifications(profileEmail, 50)
        .then((notifications) => {
          if (cancelled) {
            return
          }
          onHydrateRef.current(notifications)
        })
        .catch(() => {
          // Realtime subscription still delivers new notifications.
        })
    }

    return subscribeToIcs233ActionNotifications(profileEmail, (notification) => {
      onLiveNotificationRef.current(notification)
    })
  }, [enabled, profileEmail])
}
