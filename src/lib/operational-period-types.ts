import type { OperationalPeriodFormKey } from '@/lib/operational-period-form-registry'

export type WorkspaceOperationalPeriod = {
  id: string
  workspaceId: string
  periodNumber: number
  startedAt: string
  startedBy: string | null
  startedByEmail: string | null
  startedByName: string | null
}

/** Frozen version row captured at operational period start (matches live *_versions tables). */
export type FrozenFormVersionSnapshot = {
  id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: unknown
  signatures: unknown[]
  section_id: string | null
}

export type OperationalPeriodFormSnapshot = {
  id: string
  operationalPeriodId: string
  formKey: OperationalPeriodFormKey
  documentId: string | null
  snapshot: unknown
  sourceVersionId: string | null
  versionSnapshots: FrozenFormVersionSnapshot[]
  createdAt: string
}

export type OperationalPeriodSingleFormBundleEntry = {
  kind: 'single'
  snapshot: unknown
  documentId: string | null
  versionSnapshots: FrozenFormVersionSnapshot[]
}

export type OperationalPeriodMultipleFormBundleItem = {
  documentId: string
  snapshot: unknown
  versionSnapshots: FrozenFormVersionSnapshot[]
}

export type OperationalPeriodSnapshotBundle = {
  periodNumber: number
  byFormKey: Partial<
    Record<
      OperationalPeriodFormKey,
      OperationalPeriodSingleFormBundleEntry | { kind: 'multiple'; items: OperationalPeriodMultipleFormBundleItem[] }
    >
  >
}

export type StartOperationalPeriodResult = {
  periodNumber: number
  startedOperationalPeriodCount: number
  workingOperationalPeriodNumber: number
  startedAt: string
}
