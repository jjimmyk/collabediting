import type { Ics201Version, Ics201VersionRow } from '@/features/ics201/types'
import { mapIcs201VersionRow } from '@/features/ics201/utils'
import type { Ics202Version, Ics202VersionRow } from '@/features/ics202/types'
import { mapIcs202VersionRow } from '@/features/ics202/utils'
import type { Ics203Version, Ics203VersionRow } from '@/features/ics203/types'
import { mapIcs203VersionRow } from '@/features/ics203/utils'
import type { Ics204Version, Ics204VersionRow } from '@/features/ics204/types'
import { mapIcs204VersionRow } from '@/features/ics204/utils'
import type { Ics205Version, Ics205VersionRow } from '@/features/ics205/types'
import { mapIcs205VersionRow } from '@/features/ics205/utils'
import type { Ics205aVersion, Ics205aVersionRow } from '@/features/ics205a/types'
import { mapIcs205aVersionRow } from '@/features/ics205a/utils'
import type { Ics206Version, Ics206VersionRow } from '@/features/ics206/types'
import { mapIcs206VersionRow } from '@/features/ics206/utils'
import type { Ics208Version, Ics208VersionRow } from '@/features/ics208/types'
import { mapIcs208VersionRow } from '@/features/ics208/utils'
import type { Ics208hmVersion, Ics208hmVersionRow } from '@/features/ics208hm/types'
import { mapIcs208hmVersionRow } from '@/features/ics208hm/utils'
import type { Ics209Version, Ics209VersionRow } from '@/features/ics209/types'
import { mapIcs209VersionRow } from '@/features/ics209/utils'
import type { Ics215Version, Ics215VersionRow } from '@/features/ics215/types'
import { mapIcs215VersionRow } from '@/features/ics215/utils'
import type { Ics215aVersion, Ics215aVersionRow } from '@/features/ics215a/types'
import { mapIcs215aVersionRow } from '@/features/ics215a/utils'
import type { Ics234Version, Ics234VersionRow } from '@/features/ics234/types'
import { mapIcs234VersionRow } from '@/features/ics234/utils'
import type { IapVersion, IapVersionRow } from '@/features/iap/types'
import { mapIapVersionRow } from '@/features/iap/utils'
import type { FrozenFormVersionSnapshot } from '@/lib/operational-period-types'

export function normalizeFrozenVersionSnapshots(data: unknown): FrozenFormVersionSnapshot[] {
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const row = entry as Record<string, unknown>
      if (typeof row.id !== 'string' || typeof row.created_at !== 'string') {
        return null
      }
      return {
        id: row.id,
        created_at: row.created_at,
        author_id: typeof row.author_id === 'string' ? row.author_id : null,
        author_name: typeof row.author_name === 'string' ? row.author_name : 'Unknown',
        author_color: typeof row.author_color === 'string' ? row.author_color : '#64748b',
        snapshot: row.snapshot,
        signatures: Array.isArray(row.signatures) ? row.signatures : [],
        section_id: typeof row.section_id === 'string' ? row.section_id : null,
      } satisfies FrozenFormVersionSnapshot
    })
    .filter((entry): entry is FrozenFormVersionSnapshot => entry !== null)
}

function asVersionRow<T extends { id: string; created_at: string }>(
  row: FrozenFormVersionSnapshot
): T {
  return row as unknown as T
}

export function mapFrozenVersionsToIcs201Versions(
  rows: FrozenFormVersionSnapshot[]
): Ics201Version[] {
  return rows.map((row) => mapIcs201VersionRow(asVersionRow<Ics201VersionRow>(row)))
}

export function mapFrozenVersionsToIcs202Versions(
  rows: FrozenFormVersionSnapshot[]
): Ics202Version[] {
  return rows.map((row) => mapIcs202VersionRow(asVersionRow<Ics202VersionRow>(row)))
}

export function mapFrozenVersionsToIcs203Versions(
  rows: FrozenFormVersionSnapshot[]
): Ics203Version[] {
  return rows.map((row) => mapIcs203VersionRow(asVersionRow<Ics203VersionRow>(row)))
}

export function mapFrozenVersionsToIcs204Versions(
  rows: FrozenFormVersionSnapshot[]
): Ics204Version[] {
  return rows.map((row) => mapIcs204VersionRow(asVersionRow<Ics204VersionRow>(row)))
}

export function mapFrozenVersionsToIapVersions(rows: FrozenFormVersionSnapshot[]): IapVersion[] {
  return rows.map((row) => mapIapVersionRow(asVersionRow<IapVersionRow>(row)))
}

export function mapFrozenVersionsToIcs234Versions(
  rows: FrozenFormVersionSnapshot[]
): Ics234Version[] {
  return rows.map((row) => mapIcs234VersionRow(asVersionRow<Ics234VersionRow>(row)))
}

export function mapFrozenVersionsToIcs215Versions(
  rows: FrozenFormVersionSnapshot[]
): Ics215Version[] {
  return rows.map((row) => mapIcs215VersionRow(asVersionRow<Ics215VersionRow>(row)))
}

export function mapFrozenVersionsToIcs215aVersions(
  rows: FrozenFormVersionSnapshot[]
): Ics215aVersion[] {
  return rows.map((row) => mapIcs215aVersionRow(asVersionRow<Ics215aVersionRow>(row)))
}

export function mapFrozenVersionsToIcs205Versions(
  rows: FrozenFormVersionSnapshot[]
): Ics205Version[] {
  return rows.map((row) => mapIcs205VersionRow(asVersionRow<Ics205VersionRow>(row)))
}

export function mapFrozenVersionsToIcs205aVersions(
  rows: FrozenFormVersionSnapshot[]
): Ics205aVersion[] {
  return rows.map((row) => mapIcs205aVersionRow(asVersionRow<Ics205aVersionRow>(row)))
}

export function mapFrozenVersionsToIcs206Versions(
  rows: FrozenFormVersionSnapshot[]
): Ics206Version[] {
  return rows.map((row) => mapIcs206VersionRow(asVersionRow<Ics206VersionRow>(row)))
}

export function mapFrozenVersionsToIcs208Versions(
  rows: FrozenFormVersionSnapshot[]
): Ics208Version[] {
  return rows.map((row) => mapIcs208VersionRow(asVersionRow<Ics208VersionRow>(row)))
}

export function mapFrozenVersionsToIcs208hmVersions(
  rows: FrozenFormVersionSnapshot[]
): Ics208hmVersion[] {
  return rows.map((row) => mapIcs208hmVersionRow(asVersionRow<Ics208hmVersionRow>(row)))
}

export function mapFrozenVersionsToIcs209Versions(
  rows: FrozenFormVersionSnapshot[]
): Ics209Version[] {
  return rows.map((row) => mapIcs209VersionRow(asVersionRow<Ics209VersionRow>(row)))
}
