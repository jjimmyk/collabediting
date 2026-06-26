import {
  getHumanSitrepAuthorName,
  getLatestSitrepVersion,
  getSitrepVersionLabel,
  isSitrepVersionSigned,
} from '@/features/sitrep/editor-utils'
import type { SitrepVersion } from '@/features/sitrep/types'

export type SitrepTimelineMarker = {
  versionId: string
  version: SitrepVersion
  createdAt: number
  offsetPercent: number
  isLatest: boolean
  isSigned: boolean
  label: string
  authorName: string
}

export type SitrepVersionTimeline = {
  markers: SitrepTimelineMarker[]
  rangeStart: number
  rangeEnd: number
}

export function buildSitrepVersionTimelineMarkers(
  versions: readonly SitrepVersion[]
): SitrepVersionTimeline {
  if (versions.length === 0) {
    return { markers: [], rangeStart: 0, rangeEnd: 0 }
  }

  const sorted = [...versions].sort((left, right) => left.createdAt - right.createdAt)
  const rangeStart = sorted[0]!.createdAt
  const rangeEnd = sorted[sorted.length - 1]!.createdAt
  const latest = getLatestSitrepVersion([...versions])
  const span = rangeEnd - rangeStart

  const markers = sorted.map((version) => {
    const offsetPercent =
      span === 0 ? 50 : ((version.createdAt - rangeStart) / span) * 100

    return {
      versionId: version.id,
      version,
      createdAt: version.createdAt,
      offsetPercent,
      isLatest: latest?.id === version.id,
      isSigned: isSitrepVersionSigned(version),
      label: getSitrepVersionLabel(version.id, [...versions]),
      authorName: getHumanSitrepAuthorName(version),
    }
  })

  return { markers, rangeStart, rangeEnd }
}

export function formatSitrepTimelineTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const sameDay = new Date().toDateString() === date.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
