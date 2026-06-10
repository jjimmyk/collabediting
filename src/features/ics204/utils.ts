import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import type {
  Ics204FormState,
  Ics204Version,
  Ics204VersionRow,
} from '@/features/ics204/types'

export function cloneIcs204FormState(form: Ics204FormState): Ics204FormState {
  return {
    ...form,
    resourcesAssigned: form.resourcesAssigned.map((row) => ({ ...row })),
    workAssignments: form.workAssignments.map((row) => ({
      ...row,
      resourceRequirements: row.resourceRequirements.map((entry) => ({ ...entry })),
    })),
  }
}

export function mapIcs204VersionRow(row: Ics204VersionRow): Ics204Version {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs204FormState(row.snapshot),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs204Form(id: string, label?: string): Ics204FormState {
  return {
    id,
    assignedUnit: label ?? 'New Assignment List',
    branch: '',
    division: '',
    group: '',
    stagingArea: '',
    sectionChief: '',
    branchDirector: '',
    divisionGroupSupervisor: '',
    resourcesAssigned: [],
    workAssignments: [],
    specialInstructions: '',
    communications: '',
  }
}

export function createLocalIcs204DocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics204AuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(documentId: string, form: Ics204FormState): Ics204FormState {
  return cloneIcs204FormState({ ...form, id: documentId })
}
