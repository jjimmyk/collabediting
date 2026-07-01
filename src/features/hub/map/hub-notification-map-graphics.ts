import Graphic from '@arcgis/core/Graphic'

export const HUB_NOTIFICATION_MAP_KIND = 'hub-notification'
export const HUB_NOTIFICATION_THREAT_MAP_KIND = 'hub-notification-threat'

export type OperationalStatus = 'Operational' | 'Partially Operational' | 'Not Operational'

export type HubNotificationMapSource = {
  id: number
  title: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  status: string
  owner: string
  timestamp: string
  summary: string
  location: [number, number]
  regionalThreats?: {
    region: string
    threats: {
      id: string
      resource: string
      risk: string
      location: [number, number]
      operationalStatus: OperationalStatus
    }[]
  }
}

export function hubNotificationMapKey(notificationId: number): string {
  return `notification-${notificationId}`
}

export function hubNotificationThreatMapKey(
  notificationId: number,
  threatIndex: number
): string {
  return `notification-${notificationId}-threat-${threatIndex}`
}

function severityColor(
  severity: HubNotificationMapSource['severity']
): [number, number, number, number] {
  switch (severity) {
    case 'Critical':
      return [220, 38, 38, 0.95]
    case 'High':
      return [249, 115, 22, 0.95]
    case 'Medium':
      return [245, 158, 11, 0.95]
    case 'Low':
      return [5, 150, 105, 0.95]
    default:
      return [37, 99, 235, 0.95]
  }
}

function operationalStatusColor(
  status: OperationalStatus
): [number, number, number, number] {
  switch (status) {
    case 'Not Operational':
      return [220, 38, 38, 0.95]
    case 'Partially Operational':
      return [245, 158, 11, 0.95]
    case 'Operational':
      return [5, 150, 105, 0.95]
    default:
      return [37, 99, 235, 0.95]
  }
}

function buildNotificationPopupContent(source: HubNotificationMapSource): string {
  return [
    `<b>Severity:</b> ${source.severity}`,
    `<b>Status:</b> ${source.status}`,
    `<b>Source:</b> ${source.owner}`,
    `<b>Time:</b> ${source.timestamp}`,
    `<b>Summary:</b> ${source.summary}`,
  ].join('<br/>')
}

function buildThreatPopupContent(
  threat: NonNullable<HubNotificationMapSource['regionalThreats']>['threats'][number],
  timestamp: string
): string {
  return [
    `<b>ID:</b> ${threat.id}`,
    `<b>Status:</b> ${threat.operationalStatus}`,
    `<b>Updated:</b> ${timestamp}`,
    `<b>Description:</b> ${threat.risk}`,
  ].join('<br/>')
}

export function buildHubNotificationGraphic(source: HubNotificationMapSource): Graphic {
  const mapKey = hubNotificationMapKey(source.id)

  return new Graphic({
    geometry: {
      type: 'point',
      longitude: source.location[0],
      latitude: source.location[1],
    },
    symbol: {
      type: 'simple-marker',
      color: severityColor(source.severity),
      size: 14,
      outline: {
        color: [255, 255, 255, 1],
        width: 1.5,
      },
    },
    attributes: {
      mapKey,
      kind: HUB_NOTIFICATION_MAP_KIND,
      title: source.title,
      severity: source.severity,
      status: source.status,
      owner: source.owner,
      timestamp: source.timestamp,
    },
    popupTemplate: {
      title: source.title,
      content: buildNotificationPopupContent(source),
    },
  })
}

export function buildHubNotificationThreatGraphic(
  source: HubNotificationMapSource,
  threatIndex: number
): Graphic | null {
  const threat = source.regionalThreats?.threats[threatIndex]
  if (!threat) {
    return null
  }

  const mapKey = hubNotificationThreatMapKey(source.id, threatIndex)

  return new Graphic({
    geometry: {
      type: 'point',
      longitude: threat.location[0],
      latitude: threat.location[1],
    },
    symbol: {
      type: 'simple-marker',
      color: operationalStatusColor(threat.operationalStatus),
      size: 11,
      outline: {
        color: [255, 255, 255, 1],
        width: 1.5,
      },
    },
    attributes: {
      mapKey,
      kind: HUB_NOTIFICATION_THREAT_MAP_KIND,
      title: threat.resource,
      threatId: threat.id,
      operationalStatus: threat.operationalStatus,
      timestamp: source.timestamp,
    },
    popupTemplate: {
      title: threat.resource,
      content: buildThreatPopupContent(threat, source.timestamp),
    },
  })
}

export function syncHubNotificationMapGraphics(
  notifications: HubNotificationMapSource[]
): globalThis.Map<string, Graphic> {
  const graphicsByKey = new globalThis.Map<string, Graphic>()

  for (const notification of notifications) {
    if (!notification.location) {
      continue
    }

    const notificationGraphic = buildHubNotificationGraphic(notification)
    const notificationMapKey = hubNotificationMapKey(notification.id)
    graphicsByKey.set(notificationMapKey, notificationGraphic)

    const threats = notification.regionalThreats?.threats ?? []
    for (let threatIndex = 0; threatIndex < threats.length; threatIndex += 1) {
      const threatGraphic = buildHubNotificationThreatGraphic(notification, threatIndex)
      if (!threatGraphic) {
        continue
      }
      const threatMapKey = hubNotificationThreatMapKey(notification.id, threatIndex)
      graphicsByKey.set(threatMapKey, threatGraphic)
    }
  }

  return graphicsByKey
}
