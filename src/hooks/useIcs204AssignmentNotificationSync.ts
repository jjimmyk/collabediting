import { useEffect, useRef } from 'react'
import {
  fetchRecentIcs204AssignmentNotifications,
  subscribeToIcs204AssignmentNotifications,
  type Ics204AssignmentNotificationRow,
} from '@/lib/ics204-assignment-notification-service'

type UseIcs204AssignmentNotificationSyncOptions = {
  enabled: boolean
  profileEmail: string | null
  onHydrate: (notifications: Ics204AssignmentNotificationRow[]) => void
  onLiveNotification: (notification: Ics204AssignmentNotificationRow) => void
}

export function useIcs204AssignmentNotificationSync({
  enabled,
  profileEmail,
  onHydrate,
  onLiveNotification,
}: UseIcs204AssignmentNotificationSyncOptions) {
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
      void fetchRecentIcs204AssignmentNotifications(profileEmail, 50)
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

    return subscribeToIcs204AssignmentNotifications(profileEmail, (notification) => {
      onLiveNotificationRef.current(notification)
    })
  }, [enabled, profileEmail])
}
