import { useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Ics201CollaboratorPresence, Ics201SectionId } from '@/features/ics201/types'
import { ics201AuthorColorFromId, ics201InitialsFromEmail } from '@/features/ics201/utils'
import { getSupabaseClient } from '@/lib/supabase'

const ICS201_SECTION_IDS: Ics201SectionId[] = [
  'report-info',
  'incident-briefing',
  'map-sketch',
  'current-situation',
  'objectives',
  'actions',
  'org-chart',
  'resources',
  'safety-analysis',
  'hazmat-assessment',
]

type PresencePayload = {
  userId: string
  email: string
  position: string
  color: string
  activeSection: Ics201SectionId | null
  lastSeen: number
}

type UseIcs201PresenceOptions = {
  enabled: boolean
  documentId: string | null
  userId: string | null
  userEmail: string
  userPosition: string
  activeSection: Ics201SectionId | null
}

function parsePresenceState(
  state: Record<string, PresencePayload[]>,
  selfUserId: string | null
): Ics201CollaboratorPresence[] {
  const collaborators = new Map<string, Ics201CollaboratorPresence>()

  Object.values(state).forEach((entries) => {
    entries.forEach((entry) => {
      if (!entry?.userId) return
      const email = entry.email ?? ''
      collaborators.set(entry.userId, {
        id: entry.userId,
        email,
        name: email,
        initials: ics201InitialsFromEmail(email || 'User'),
        color: entry.color,
        position: entry.position,
        activeSection: entry.activeSection ?? null,
        isSelf: entry.userId === selfUserId,
      })
    })
  })

  return Array.from(collaborators.values()).sort((left, right) =>
    left.email.localeCompare(right.email)
  )
}

export function useIcs201Presence({
  enabled,
  documentId,
  userId,
  userEmail,
  userPosition,
  activeSection,
}: UseIcs201PresenceOptions) {
  const [collaborators, setCollaborators] = useState<Ics201CollaboratorPresence[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSubscribedRef = useRef(false)

  const selfColor = useMemo(
    () => (userId ? ics201AuthorColorFromId(userId) : '#16a34a'),
    [userId]
  )

  useEffect(() => {
    if (!enabled || !documentId || !userId) {
      setCollaborators([])
      channelRef.current = null
      isSubscribedRef.current = false
      return undefined
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      setCollaborators([])
      return undefined
    }

    const channel = supabase.channel(`ics201-presence:${documentId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    const syncCollaborators = () => {
      const state = channel.presenceState() as Record<string, PresencePayload[]> | undefined
      if (!state) return
      setCollaborators(parsePresenceState(state, userId))
    }

    channel.on('presence', { event: 'sync' }, syncCollaborators)
    channel.on('presence', { event: 'join' }, syncCollaborators)
    channel.on('presence', { event: 'leave' }, syncCollaborators)

    void channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true
        await channel.track({
          userId,
          email: userEmail,
          position: userPosition,
          color: selfColor,
          activeSection,
          lastSeen: Date.now(),
        })
        syncCollaborators()
      }
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false
      }
    })

    channelRef.current = channel

    return () => {
      isSubscribedRef.current = false
      channelRef.current = null
      void supabase.removeChannel(channel)
    }
  }, [documentId, enabled, userId])

  useEffect(() => {
    const channel = channelRef.current
    if (!enabled || !channel || !userId || !isSubscribedRef.current) {
      return
    }

    void channel.track({
      userId,
      email: userEmail,
      position: userPosition,
      color: selfColor,
      activeSection,
      lastSeen: Date.now(),
    })
  }, [activeSection, enabled, selfColor, userEmail, userId, userPosition])

  const activeEditors = useMemo(
    () => collaborators.filter((collaborator) => collaborator.activeSection !== null),
    [collaborators]
  )

  const otherActiveEditors = useMemo(
    () => activeEditors.filter((collaborator) => !collaborator.isSelf),
    [activeEditors]
  )

  const sectionEditors = useMemo(() => {
    return ICS201_SECTION_IDS.reduce(
      (accumulator, sectionId) => {
        accumulator[sectionId] = collaborators.filter(
          (collaborator) => collaborator.activeSection === sectionId
        )
        return accumulator
      },
      {} as Record<Ics201SectionId, Ics201CollaboratorPresence[]>
    )
  }, [collaborators])

  const getEditorsForSection = (sectionId: Ics201SectionId) => sectionEditors[sectionId] ?? []

  return {
    collaborators,
    activeEditors,
    otherActiveEditors,
    sectionEditors,
    getEditorsForSection,
    selfColor,
  }
}
