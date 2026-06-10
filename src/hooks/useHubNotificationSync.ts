import { useEffect, useRef } from 'react'
import {
  fetchRecentHubUserNotifications,
  subscribeToHubUserNotifications,
  type HubUserNotificationRow,
} from '@/lib/hub-notification-service'

type UseHubNotificationSyncOptions = {
  enabled: boolean
  profileEmail: string | null
  onHydrate: (notifications: HubUserNotificationRow[]) => void
  onLiveNotification: (notification: HubUserNotificationRow) => void
}

export function useHubNotificationSync({
  enabled,
  profileEmail,
  onHydrate,
  onLiveNotification,
}: UseHubNotificationSyncOptions) {
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
      void fetchRecentHubUserNotifications(profileEmail, 50)
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

    return subscribeToHubUserNotifications(profileEmail, (notification) => {
      onLiveNotificationRef.current(notification)
    })
  }, [enabled, profileEmail])
}
