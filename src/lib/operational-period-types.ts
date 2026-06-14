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

export type OperationalPeriodFormSnapshot = {
  id: string
  operationalPeriodId: string
  formKey: OperationalPeriodFormKey
  documentId: string | null
  snapshot: unknown
  sourceVersionId: string | null
  createdAt: string
}

export type OperationalPeriodSnapshotBundle = {
  periodNumber: number
  byFormKey: Partial<
    Record<
      OperationalPeriodFormKey,
      | { kind: 'single'; snapshot: unknown; documentId: string | null }
      | { kind: 'multiple'; items: Array<{ documentId: string; snapshot: unknown }> }
    >
  >
}

export type StartOperationalPeriodResult = {
  periodNumber: number
  startedOperationalPeriodCount: number
  workingOperationalPeriodNumber: number
  startedAt: string
}
