export type HubNotificationRecipient = {
  id: string
  name: string
  email: string
  role?: string
}

export const HUB_NOTIFICATION_RECIPIENTS: HubNotificationRecipient[] = [
  {
    id: 'user-rivera',
    name: 'Alex Rivera',
    email: 'alex.rivera@uscg.mil',
    role: 'FEMA Region 4 IMAT Lead',
  },
  {
    id: 'user-chen',
    name: 'Sam Chen',
    email: 'sam.chen@uscg.mil',
    role: 'Transportation Operations Analyst',
  },
  {
    id: 'user-park',
    name: 'Jordan Park',
    email: 'jordan.park@uscg.mil',
    role: 'Emergency Coordinator',
  },
  {
    id: 'user-blake',
    name: 'Morgan Blake',
    email: 'morgan.blake@uscg.mil',
    role: 'Hazmat Response Specialist',
  },
  {
    id: 'user-singh',
    name: 'Priya Singh',
    email: 'priya.singh@uscg.mil',
    role: 'GIS / Situational Awareness Analyst',
  },
  {
    id: 'user-okafor',
    name: 'Chidi Okafor',
    email: 'chidi.okafor@uscg.mil',
    role: 'Logistics Liaison',
  },
  {
    id: 'user-vance',
    name: 'Eleanor Vance',
    email: 'eleanor.vance@uscg.mil',
    role: 'Incident Commander',
  },
  {
    id: 'user-hayes',
    name: 'Marcus Hayes',
    email: 'marcus.hayes@uscg.mil',
    role: 'Deputy Incident Commander',
  },
  {
    id: 'user-king',
    name: 'Jimmy King',
    email: 'jimmy.king@disastertech.com',
    role: 'Org Admin',
  },
  {
    id: 'user-james',
    name: 'James King',
    email: 'jamespking47@gmail.com',
    role: 'Incident Commander',
  },
]

export function dedupeHubNotificationRecipients(
  recipients: HubNotificationRecipient[]
): HubNotificationRecipient[] {
  const seen = new Set<string>()
  return recipients.filter((recipient) => {
    const email = recipient.email.trim().toLowerCase()
    if (seen.has(email)) {
      return false
    }
    seen.add(email)
    return true
  })
}
