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
import type { OperationalPeriodSnapshotBundle } from '@/lib/operational-period-types'

const SNAPSHOT_AUTHOR_NAME = 'Operational Period Snapshot'
const SNAPSHOT_AUTHOR_COLOR = '#64748b'

function buildSnapshotVersion<T>(
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
    id: `op-snapshot-${Date.now()}`,
    createdAt: Date.now(),
    authorName: SNAPSHOT_AUTHOR_NAME,
    authorColor: SNAPSHOT_AUTHOR_COLOR,
    snapshot: clone(snapshot),
    signatures: [],
  }
}

function resolveHistoricalSingleFormView<TForm>(
  bundle: OperationalPeriodSnapshotBundle | null,
  formKey: OperationalPeriodFormKey,
  clone: (value: TForm) => TForm
): { form: TForm | null; versions: ReturnType<typeof buildSnapshotVersion<TForm>>[] } | null {
  const entry = bundle?.byFormKey[formKey]
  if (!entry || entry.kind !== 'single') return null
  const form = clone(entry.snapshot as TForm)
  return {
    form,
    versions: [buildSnapshotVersion(form, clone)],
  }
}

export function resolveHistoricalIcs201View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics201FormState | null; versions: Ics201Version[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'ics201', cloneIcs201FormState)
}

export function resolveHistoricalIcs202View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics202FormState | null; versions: Ics202Version[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'ics202', cloneIcs202FormState)
}

export function resolveHistoricalIcs203View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics203FormState | null; versions: Ics203Version[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'ics203', cloneIcs203FormState)
}

export function resolveHistoricalIapView(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: IapFormState | null; versions: IapVersion[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'iap', cloneIapFormState)
}

export function resolveHistoricalIcs234View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics234FormState | null; versions: Ics234Version[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'ics234', cloneIcs234FormState)
}

export function resolveHistoricalIcs215View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics215FormState | null; versions: Ics215Version[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'ics215', cloneIcs215FormState)
}

export function resolveHistoricalIcs215aView(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics215aFormState | null; versions: Ics215aVersion[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'ics215a', cloneIcs215aFormState)
}

export function resolveHistoricalIcs205View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics205FormState | null; versions: Ics205Version[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'ics205', cloneIcs205FormState)
}

export function resolveHistoricalIcs205aView(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics205aFormState | null; versions: Ics205aVersion[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'ics205a', cloneIcs205aFormState)
}

export function resolveHistoricalIcs206View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics206FormState | null; versions: Ics206Version[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'ics206', cloneIcs206FormState)
}

export function resolveHistoricalIcs208View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics208FormState | null; versions: Ics208Version[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'ics208', cloneIcs208FormState)
}

export function resolveHistoricalIcs208hmView(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics208hmFormState | null; versions: Ics208hmVersion[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'ics208hm', cloneIcs208hmFormState)
}

export function resolveHistoricalIcs209View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics209FormState | null; versions: Ics209Version[] } | null {
  return resolveHistoricalSingleFormView(bundle, 'ics209', cloneIcs209FormState)
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
    const form = cloneIcs204FormState(item.snapshot as Ics204FormState)
    forms.push(form)
    versionsById[form.id] = [buildSnapshotVersion(form, cloneIcs204FormState)]
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
