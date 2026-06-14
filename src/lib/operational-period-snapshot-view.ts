import type { Ics201VersionSignature } from '@/features/ics201/types'
import type { Ics201FormState, Ics201Version } from '@/features/ics201/types'
import { cloneIcs201FormState } from '@/features/ics201/utils'
import type { Ics202FormState, Ics202Version } from '@/features/ics202/types'
import { cloneIcs202FormState } from '@/features/ics202/utils'
import type { Ics203FormState, Ics203Version } from '@/features/ics203/types'
import { cloneIcs203FormState } from '@/features/ics203/utils'
import type { Ics204FormState, Ics204Version } from '@/features/ics204/types'
import { cloneIcs204FormState } from '@/features/ics204/utils'
import type { Ics205FormState, Ics205Version } from '@/features/ics205/types'
import { cloneIcs205FormState } from '@/features/ics205/utils'
import type { Ics205aFormState, Ics205aVersion } from '@/features/ics205a/types'
import { cloneIcs205aFormState } from '@/features/ics205a/utils'
import type { Ics206FormState, Ics206Version } from '@/features/ics206/types'
import { cloneIcs206FormState } from '@/features/ics206/utils'
import type { Ics208FormState, Ics208Version } from '@/features/ics208/types'
import { cloneIcs208FormState } from '@/features/ics208/utils'
import type { Ics208hmFormState, Ics208hmVersion } from '@/features/ics208hm/types'
import { cloneIcs208hmFormState } from '@/features/ics208hm/utils'
import type { Ics209FormState, Ics209Version } from '@/features/ics209/types'
import { cloneIcs209FormState } from '@/features/ics209/utils'
import type { Ics215FormState, Ics215Version } from '@/features/ics215/types'
import { cloneIcs215FormState } from '@/features/ics215/utils'
import type { Ics215aFormState, Ics215aVersion } from '@/features/ics215a/types'
import { cloneIcs215aFormState } from '@/features/ics215a/utils'
import type { Ics234FormState, Ics234Version } from '@/features/ics234/types'
import { cloneIcs234FormState } from '@/features/ics234/utils'
import type { IapFormState, IapVersion } from '@/features/iap/types'
import { cloneIapFormState } from '@/features/iap/utils'
import { normalizeIcs233RowsFromDb } from '@/lib/ics233-service'
import type { Ics233TaskRow } from '@/lib/ics233-workflow'
import type { OperationalPeriodFormKey } from '@/lib/operational-period-form-registry'
import type {
  FrozenFormVersionSnapshot,
  OperationalPeriodSingleFormBundleEntry,
  OperationalPeriodSnapshotBundle,
} from '@/lib/operational-period-types'
import {
  mapFrozenVersionsToIcs201Versions,
  mapFrozenVersionsToIcs202Versions,
  mapFrozenVersionsToIcs203Versions,
  mapFrozenVersionsToIcs204Versions,
  mapFrozenVersionsToIapVersions,
  mapFrozenVersionsToIcs234Versions,
  mapFrozenVersionsToIcs215Versions,
  mapFrozenVersionsToIcs215aVersions,
  mapFrozenVersionsToIcs205Versions,
  mapFrozenVersionsToIcs205aVersions,
  mapFrozenVersionsToIcs206Versions,
  mapFrozenVersionsToIcs208Versions,
  mapFrozenVersionsToIcs208hmVersions,
  mapFrozenVersionsToIcs209Versions,
  normalizeFrozenVersionSnapshots,
} from '@/lib/operational-period-version-map'

const SNAPSHOT_AUTHOR_NAME = 'Operational Period Snapshot'
const SNAPSHOT_AUTHOR_COLOR = '#64748b'

function buildFallbackVersion<T>(
  snapshot: T,
  clone: (value: T) => T
): {
  id: string
  createdAt: number
  authorName: string
  authorColor: string
  snapshot: T
  signatures: Ics201VersionSignature[]
} {
  return {
    id: `op-snapshot-fallback`,
    createdAt: Date.now(),
    authorName: SNAPSHOT_AUTHOR_NAME,
    authorColor: SNAPSHOT_AUTHOR_COLOR,
    snapshot: clone(snapshot),
    signatures: [],
  }
}

function resolveHistoricalSingleFormView<TForm, TVersion extends { snapshot: TForm }>(
  entry: OperationalPeriodSingleFormBundleEntry | undefined,
  mapVersions: (rows: FrozenFormVersionSnapshot[]) => TVersion[],
  clone: (value: TForm) => TForm
): { form: TForm | null; versions: TVersion[] } | null {
  if (!entry || entry.kind !== 'single') return null

  const mappedVersions = mapVersions(entry.versionSnapshots)
  if (mappedVersions.length > 0) {
    const latest = mappedVersions[mappedVersions.length - 1]
    return {
      form: clone(latest.snapshot),
      versions: mappedVersions,
    }
  }

  const form = clone(entry.snapshot as TForm)
  return {
    form,
    versions: [buildFallbackVersion(form, clone) as unknown as TVersion],
  }
}

function getSingleEntry(
  bundle: OperationalPeriodSnapshotBundle | null,
  formKey: OperationalPeriodFormKey
): OperationalPeriodSingleFormBundleEntry | undefined {
  const entry = bundle?.byFormKey[formKey]
  if (!entry || entry.kind !== 'single') return undefined
  return entry
}

export function resolveHistoricalIcs201View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics201FormState | null; versions: Ics201Version[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'ics201'),
    mapFrozenVersionsToIcs201Versions,
    cloneIcs201FormState
  )
}

export function resolveHistoricalIcs202View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics202FormState | null; versions: Ics202Version[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'ics202'),
    mapFrozenVersionsToIcs202Versions,
    cloneIcs202FormState
  )
}

export function resolveHistoricalIcs203View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics203FormState | null; versions: Ics203Version[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'ics203'),
    mapFrozenVersionsToIcs203Versions,
    cloneIcs203FormState
  )
}

export function resolveHistoricalIapView(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: IapFormState | null; versions: IapVersion[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'iap'),
    mapFrozenVersionsToIapVersions,
    cloneIapFormState
  )
}

export function resolveHistoricalIcs234View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics234FormState | null; versions: Ics234Version[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'ics234'),
    mapFrozenVersionsToIcs234Versions,
    cloneIcs234FormState
  )
}

export function resolveHistoricalIcs215View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics215FormState | null; versions: Ics215Version[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'ics215'),
    mapFrozenVersionsToIcs215Versions,
    cloneIcs215FormState
  )
}

export function resolveHistoricalIcs215aView(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics215aFormState | null; versions: Ics215aVersion[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'ics215a'),
    mapFrozenVersionsToIcs215aVersions,
    cloneIcs215aFormState
  )
}

export function resolveHistoricalIcs205View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics205FormState | null; versions: Ics205Version[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'ics205'),
    mapFrozenVersionsToIcs205Versions,
    cloneIcs205FormState
  )
}

export function resolveHistoricalIcs205aView(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics205aFormState | null; versions: Ics205aVersion[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'ics205a'),
    mapFrozenVersionsToIcs205aVersions,
    cloneIcs205aFormState
  )
}

export function resolveHistoricalIcs206View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics206FormState | null; versions: Ics206Version[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'ics206'),
    mapFrozenVersionsToIcs206Versions,
    cloneIcs206FormState
  )
}

export function resolveHistoricalIcs208View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics208FormState | null; versions: Ics208Version[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'ics208'),
    mapFrozenVersionsToIcs208Versions,
    cloneIcs208FormState
  )
}

export function resolveHistoricalIcs208hmView(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics208hmFormState | null; versions: Ics208hmVersion[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'ics208hm'),
    mapFrozenVersionsToIcs208hmVersions,
    cloneIcs208hmFormState
  )
}

export function resolveHistoricalIcs209View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics209FormState | null; versions: Ics209Version[] } | null {
  return resolveHistoricalSingleFormView(
    getSingleEntry(bundle, 'ics209'),
    mapFrozenVersionsToIcs209Versions,
    cloneIcs209FormState
  )
}

export function resolveHistoricalIcs204View(bundle: OperationalPeriodSnapshotBundle | null): {
  forms: Ics204FormState[]
  versionsById: Record<string, Ics204Version[]>
} | null {
  const entry = bundle?.byFormKey.ics204
  if (!entry || entry.kind !== 'multiple') return null

  const forms: Ics204FormState[] = []
  const versionsById: Record<string, Ics204Version[]> = {}

  for (const item of entry.items) {
    const mappedVersions = mapFrozenVersionsToIcs204Versions(item.versionSnapshots)
    if (mappedVersions.length > 0) {
      const latest = mappedVersions[mappedVersions.length - 1]
      forms.push(cloneIcs204FormState(latest.snapshot))
      versionsById[latest.snapshot.id] = mappedVersions
      continue
    }

    const form = cloneIcs204FormState(item.snapshot as Ics204FormState)
    forms.push(form)
    versionsById[form.id] = [
      buildFallbackVersion(form, cloneIcs204FormState) as unknown as Ics204Version,
    ]
  }

  return { forms, versionsById }
}

export function resolveHistoricalIcs233Rows(
  bundle: OperationalPeriodSnapshotBundle | null
): Ics233TaskRow[] | null {
  const entry = bundle?.byFormKey.ics233
  if (!entry || entry.kind !== 'single') return null
  const snapshot = entry.snapshot
  if (Array.isArray(snapshot)) {
    return normalizeIcs233RowsFromDb(snapshot)
  }
  if (snapshot && typeof snapshot === 'object' && Array.isArray((snapshot as { rows?: unknown }).rows)) {
    return normalizeIcs233RowsFromDb((snapshot as { rows: unknown }).rows)
  }
  return []
}

export function resolveDisplayForm<T>(
  isViewingHistorical: boolean,
  liveForm: T | null,
  historicalView: { form: T | null } | null | undefined
): T | null {
  if (!isViewingHistorical) return liveForm
  return historicalView?.form ?? null
}

export function resolveDisplayVersions<T>(
  isViewingHistorical: boolean,
  liveVersions: T[],
  historicalView: { versions: T[] } | null | undefined
): T[] {
  if (!isViewingHistorical) return liveVersions
  return historicalView?.versions ?? []
}

export function hasOperationalPeriodFormSnapshot(
  bundle: OperationalPeriodSnapshotBundle | null,
  formKey: OperationalPeriodFormKey
): boolean {
  const entry = bundle?.byFormKey[formKey]
  if (!entry) return false
  if (entry.kind === 'multiple') return entry.items.length > 0
  return entry.snapshot !== null && entry.snapshot !== undefined
}

export function hasOperationalPeriodIcs233Snapshot(
  bundle: OperationalPeriodSnapshotBundle | null
): boolean {
  return bundle?.byFormKey.ics233?.kind === 'single'
}

export { normalizeFrozenVersionSnapshots }
