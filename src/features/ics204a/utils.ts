import type { Ics204FormState, Ics204ResourceAssignedRow } from '@/features/ics204/types'
import type { Ics204ResourceSnapshot } from '@/features/ics204/types'
import type { Ics204aBuildContext, Ics204aFormState, Ics204aOtherAttachments } from '@/features/ics204a/types'

const EMPTY_OTHER_ATTACHMENTS = (): Ics204aOtherAttachments => ({
  mapChart: '',
  weatherForecast: '',
  tidesCurrents: '',
  notes: '',
})

export function createEmptyIcs204aForm(): Ics204aFormState {
  return {
    incidentName: '',
    incidentLocation: '',
    operationalPeriodFrom: '',
    operationalPeriodTo: '',
    branch: '',
    divisionGroup: '',
    resourceIdentifier: '',
    leader: '',
    assignmentLocation: '',
    workAssignmentSpecialInstructions: '',
    siteSafetyPlanLocation: '',
    otherAttachments: EMPTY_OTHER_ATTACHMENTS(),
    preparedByName: '',
    preparedByDateTime: '',
    reviewedByPscName: '',
    reviewedByPscDateTime: '',
    reviewedByOscIscName: '',
    reviewedByOscIscDateTime: '',
  }
}

function normalizeOtherAttachments(value: Partial<Ics204aOtherAttachments> | undefined): Ics204aOtherAttachments {
  return {
    mapChart: String(value?.mapChart ?? ''),
    weatherForecast: String(value?.weatherForecast ?? ''),
    tidesCurrents: String(value?.tidesCurrents ?? ''),
    notes: String(value?.notes ?? ''),
  }
}

export function normalizeIcs204aFormState(partial?: Partial<Ics204aFormState> | null): Ics204aFormState {
  const empty = createEmptyIcs204aForm()
  if (!partial) return empty
  return {
    incidentName: String(partial.incidentName ?? ''),
    incidentLocation: String(partial.incidentLocation ?? ''),
    operationalPeriodFrom: String(partial.operationalPeriodFrom ?? ''),
    operationalPeriodTo: String(partial.operationalPeriodTo ?? ''),
    branch: String(partial.branch ?? ''),
    divisionGroup: String(partial.divisionGroup ?? ''),
    resourceIdentifier: String(partial.resourceIdentifier ?? ''),
    leader: String(partial.leader ?? ''),
    assignmentLocation: String(partial.assignmentLocation ?? ''),
    workAssignmentSpecialInstructions: String(partial.workAssignmentSpecialInstructions ?? ''),
    siteSafetyPlanLocation: String(partial.siteSafetyPlanLocation ?? ''),
    otherAttachments: normalizeOtherAttachments(partial.otherAttachments),
    preparedByName: String(partial.preparedByName ?? ''),
    preparedByDateTime: String(partial.preparedByDateTime ?? ''),
    reviewedByPscName: String(partial.reviewedByPscName ?? ''),
    reviewedByPscDateTime: String(partial.reviewedByPscDateTime ?? ''),
    reviewedByOscIscName: String(partial.reviewedByOscIscName ?? ''),
    reviewedByOscIscDateTime: String(partial.reviewedByOscIscDateTime ?? ''),
  }
}

export function cloneIcs204aFormState(form: Ics204aFormState): Ics204aFormState {
  const normalized = normalizeIcs204aFormState(form)
  return {
    ...normalized,
    otherAttachments: { ...normalized.otherAttachments },
  }
}

function joinInstructionParts(parts: Array<string | undefined | null>): string {
  return parts
    .map((part) => (part ?? '').trim())
    .filter((part) => part.length > 0 && part !== '---')
    .join('\n\n')
}

export function buildDefaultIcs204aFromResource(
  parentForm: Ics204FormState,
  row: Ics204ResourceAssignedRow,
  resource: Ics204ResourceSnapshot,
  context: Ics204aBuildContext = {}
): Ics204aFormState {
  const divisionGroup = parentForm.division.trim() || parentForm.group.trim()
  const workAssignmentNotes = parentForm.workAssignments
    .map((assignment) =>
      joinInstructionParts([
        assignment.assignment,
        assignment.specialEquipmentSupplies,
        assignment.reportingLocation,
      ])
    )
    .filter((entry) => entry.length > 0)
    .join('\n\n')

  return normalizeIcs204aFormState({
    incidentName: context.incidentName ?? '',
    incidentLocation: context.incidentLocation ?? '',
    operationalPeriodFrom: context.operationalPeriodFrom ?? '',
    operationalPeriodTo: context.operationalPeriodTo ?? '',
    branch: parentForm.branch,
    divisionGroup,
    resourceIdentifier: resource.unitName.trim() || resource.name,
    leader: resource.teamLead,
    assignmentLocation: resource.currentLocation.trim() || resource.location,
    workAssignmentSpecialInstructions: joinInstructionParts([
      row.reportingInfoNotes,
      resource.capabilities,
      resource.notes,
      workAssignmentNotes,
    ]),
    siteSafetyPlanLocation: '',
    otherAttachments: EMPTY_OTHER_ATTACHMENTS(),
    preparedByName: context.preparedByName ?? '',
    preparedByDateTime: new Date().toLocaleString(),
    reviewedByPscName: '',
    reviewedByPscDateTime: '',
    reviewedByOscIscName: '',
    reviewedByOscIscDateTime: '',
  })
}

export function resolveIcs204aForRow(row: Ics204ResourceAssignedRow): Ics204aFormState | null {
  if (!row.has204A) return null
  return row.ics204a ? cloneIcs204aFormState(row.ics204a) : null
}
