import type { Ics201VersionSignature } from '@/features/ics201/types'
import type { Ics201FormState, Ics201Version } from '@/features/ics201/types'
import { cloneIcs201FormState } from '@/features/ics201/utils'
import type { Ics202FormState, Ics202Version } from '@/features/ics202/types'
import { cloneIcs202FormState } from '@/features/ics202/utils'
import type { Ics203FormState, Ics203Version } from '@/features/ics203/types'
import { cloneIcs203FormState } from '@/features/ics203/utils'
import type { Ics204FormState, Ics204Version } from '@/features/ics204/types'
import { cloneIcs204FormState } from '@/features/ics204/utils'
import type { IapFormState, IapVersion } from '@/features/iap/types'
import { cloneIapFormState } from '@/features/iap/utils'
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

export function resolveHistoricalIcs201View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics201FormState | null; versions: Ics201Version[] } | null {
  const entry = bundle?.byFormKey.ics201
  if (!entry || entry.kind !== 'single') return null
  const form = cloneIcs201FormState(entry.snapshot as Ics201FormState)
  return {
    form,
    versions: [buildSnapshotVersion(form, cloneIcs201FormState)],
  }
}

export function resolveHistoricalIcs202View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics202FormState | null; versions: Ics202Version[] } | null {
  const entry = bundle?.byFormKey.ics202
  if (!entry || entry.kind !== 'single') return null
  const form = cloneIcs202FormState(entry.snapshot as Ics202FormState)
  return {
    form,
    versions: [buildSnapshotVersion(form, cloneIcs202FormState)],
  }
}

export function resolveHistoricalIcs203View(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: Ics203FormState | null; versions: Ics203Version[] } | null {
  const entry = bundle?.byFormKey.ics203
  if (!entry || entry.kind !== 'single') return null
  const form = cloneIcs203FormState(entry.snapshot as Ics203FormState)
  return {
    form,
    versions: [buildSnapshotVersion(form, cloneIcs203FormState)],
  }
}

export function resolveHistoricalIapView(
  bundle: OperationalPeriodSnapshotBundle | null
): { form: IapFormState | null; versions: IapVersion[] } | null {
  const entry = bundle?.byFormKey.iap
  if (!entry || entry.kind !== 'single') return null
  const form = cloneIapFormState(entry.snapshot as IapFormState)
  return {
    form,
    versions: [buildSnapshotVersion(form, cloneIapFormState)],
  }
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
