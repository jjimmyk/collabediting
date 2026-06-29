export type GeospatialCopNotificationSeverity = 'Critical' | 'High' | 'Medium' | 'Low'

export type GeospatialCopNotificationStatus = 'New' | 'Acknowledged' | 'Resolved'

export type GeospatialCopNotificationItem = {
  id: string
  mapKey: string
  title: string
  severity: GeospatialCopNotificationSeverity
  status: GeospatialCopNotificationStatus
  timestamp: string
  owner: string
  summary: string
  impact: string
  location: [number, number]
}

export const GEOSPATIAL_COP_GRIST_MILL_SOURCE = 'Grist Mill'

export const GEOSPATIAL_COP_NOTIFICATIONS: GeospatialCopNotificationItem[] = [
  {
    id: 'cop-notif-1',
    mapKey: 'geospatial-cop-notification-cop-notif-1',
    title:
      'Telegram channel posts target list naming Houston port terminal operators',
    severity: 'Critical',
    status: 'New',
    timestamp: '2026-04-26 13:48 CDT',
    owner: GEOSPATIAL_COP_GRIST_MILL_SOURCE,
    summary:
      'Grist Mill detected a Telegram channel (~2,400 subscribers) sharing a screenshot list of Port Houston and Barbours Cut terminal operator accounts, with calls to "keep pressure on loadout systems."',
    impact:
      'Elevates insider-threat and social-engineering risk for terminal gate staff, harbor security liaisons, and vendor helpdesk queues during active outage response.',
    location: [-95.028, 29.618],
  },
  {
    id: 'cop-notif-2',
    mapKey: 'geospatial-cop-notification-cop-notif-2',
    title: 'DarkNet forum thread claims Gulf Coast substation disruption',
    severity: 'High',
    status: 'New',
    timestamp: '2026-04-26 12:22 CDT',
    owner: GEOSPATIAL_COP_GRIST_MILL_SOURCE,
    summary:
      'Grist Mill surfaced a DarkNet forum thread attributing the Barbours Cut power event to a hacktivist collective; replies include unverified SCADA tag references and encouragement to probe backup feeders.',
    impact:
      'Supports cyber-fusion correlation with physical outage timeline; warrants escalation to CISA regional coordination and operator credential monitoring.',
    location: [-95.038, 29.628],
  },
  {
    id: 'cop-notif-3',
    mapKey: 'geospatial-cop-notification-cop-notif-3',
    title: 'Coordinated X posts amplify #PortHoustonDown hashtag',
    severity: 'High',
    status: 'Acknowledged',
    timestamp: '2026-04-26 11:05 CDT',
    owner: GEOSPATIAL_COP_GRIST_MILL_SOURCE,
    summary:
      'Grist Mill identified bot-like amplification of #PortHoustonDown and #ChannelBreaker across 140+ X accounts within 18 minutes, linking to recycled outage photos and a pastebin IOC list.',
    impact:
      'Information environment risk may complicate public messaging and draw copycat probing against exposed maritime OT remote access paths.',
    location: [-95.018, 29.608],
  },
  {
    id: 'cop-notif-4',
    mapKey: 'geospatial-cop-notification-cop-notif-4',
    title: 'Paste site dump references Barbours Cut substation identifiers',
    severity: 'Medium',
    status: 'New',
    timestamp: '2026-04-26 10:40 CDT',
    owner: GEOSPATIAL_COP_GRIST_MILL_SOURCE,
    summary:
      'Grist Mill flagged a paste site entry listing substation feeder labels and vendor remote-support URLs matching open-source port infrastructure disclosures from 2024.',
    impact:
      'Requires validation against CenterPoint asset inventory and tightening of vendor VPN allowlists during restoration operations.',
    location: [-95.045, 29.622],
  },
  {
    id: 'cop-notif-5',
    mapKey: 'geospatial-cop-notification-cop-notif-5',
    title: 'Reddit thread discusses ransomware group "ChannelBreaker" TTPs',
    severity: 'Medium',
    status: 'New',
    timestamp: '2026-04-26 09:15 CDT',
    owner: GEOSPATIAL_COP_GRIST_MILL_SOURCE,
    summary:
      'Grist Mill captured a trending Reddit thread in r/cybersecurity analyzing "ChannelBreaker" tradecraft, including lateral movement patterns consistent with IT-to-OT dwell timelines from the CYB-2407 case narrative.',
    impact:
      'Informs hunt hypotheses for fusion cell; low confidence of direct attribution but useful for analyst queue prioritization.',
    location: [-94.872, 29.351],
  },
]

export function getGeospatialCopNotificationSeverityBadgeClasses(
  severity: GeospatialCopNotificationSeverity
): string {
  switch (severity) {
    case 'Critical':
      return 'bg-red-600 text-white border-red-700/40'
    case 'High':
      return 'bg-orange-500 text-white border-orange-600/40'
    case 'Medium':
      return 'bg-amber-400 text-amber-950 border-amber-500/40'
    case 'Low':
      return 'bg-emerald-600 text-white border-emerald-700/40'
    default:
      return ''
  }
}
