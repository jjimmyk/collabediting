export type EventNotificationUser = {
  id: string
  name: string
  role: string
}

export type EventNotificationUserGroup = {
  id: string
  name: string
  description: string
}

export const EVENT_NOTIFICATION_USERS: EventNotificationUser[] = [
  { id: 'user-rivera', name: 'Alex Rivera', role: 'FEMA Region 4 IMAT Lead' },
  { id: 'user-chen', name: 'Sam Chen', role: 'Transportation Operations Analyst' },
  { id: 'user-park', name: 'Jordan Park', role: 'Emergency Coordinator' },
  { id: 'user-blake', name: 'Morgan Blake', role: 'Hazmat Response Specialist' },
  { id: 'user-singh', name: 'Priya Singh', role: 'GIS / Situational Awareness Analyst' },
  { id: 'user-okafor', name: 'Chidi Okafor', role: 'Logistics Liaison' },
  { id: 'user-vance', name: 'Eleanor Vance', role: 'Incident Commander' },
  { id: 'user-hayes', name: 'Marcus Hayes', role: 'Deputy Incident Commander' },
]

export const EVENT_NOTIFICATION_USER_GROUPS: EventNotificationUserGroup[] = [
  {
    id: 'group-r4-imat',
    name: 'FEMA Region 4 IMAT',
    description: 'Region 4 Incident Management Assistance Team on-call roster.',
  },
  {
    id: 'group-r4-watch',
    name: 'Region 4 Watch Desk',
    description: '24/7 regional coordination and notification desk.',
  },
  {
    id: 'group-dot-tmc',
    name: 'DOT Transportation Management Center',
    description: 'State DOT TMC leads and corridor duty officers.',
  },
  {
    id: 'group-ccmer-duty',
    name: 'CCMER Duty Officers',
    description: 'Corporate Crisis and Emergency Management duty rotation.',
  },
  {
    id: 'group-esf-1',
    name: 'ESF-1 Transportation Liaisons',
    description: 'Federal transportation emergency support function liaisons.',
  },
]

export const getEventNotificationUserById = (userId: string) =>
  EVENT_NOTIFICATION_USERS.find((user) => user.id === userId)

export const getEventNotificationUserGroupById = (groupId: string) =>
  EVENT_NOTIFICATION_USER_GROUPS.find((group) => group.id === groupId)

export const formatEventRuleNotificationSummary = (options: {
  sendNotificationOnCreate: boolean
  notificationUserIds: string[]
  notificationGroupIds: string[]
}) => {
  if (!options.sendNotificationOnCreate) {
    return 'Notifications disabled'
  }

  const userLabels = options.notificationUserIds
    .map((userId) => getEventNotificationUserById(userId)?.name)
    .filter(Boolean) as string[]
  const groupLabels = options.notificationGroupIds
    .map((groupId) => getEventNotificationUserGroupById(groupId)?.name)
    .filter(Boolean) as string[]

  if (userLabels.length === 0 && groupLabels.length === 0) {
    return 'Notifications enabled — no recipients selected'
  }

  return [
    ...userLabels,
    ...groupLabels.map((label) => `${label} (group)`),
  ].join('; ')
}

export const buildEventNotificationRecipientsLabel = (options: {
  notificationUserIds: string[]
  notificationGroupIds: string[]
}) => {
  const userLabels = options.notificationUserIds
    .map((userId) => {
      const user = getEventNotificationUserById(userId)
      return user ? `${user.name} (${user.role})` : null
    })
    .filter(Boolean) as string[]
  const groupLabels = options.notificationGroupIds
    .map((groupId) => getEventNotificationUserGroupById(groupId)?.name)
    .filter(Boolean) as string[]

  return [...userLabels, ...groupLabels].join('; ')
}
