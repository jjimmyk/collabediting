import { ICS204_FORM_TITLE_LINES } from '@/features/ics204/constants'
import type { Ics201VersionSignature } from '@/features/ics201/types'
import type {
  Ics204FormState,
  Ics204ResourceAssignedRow,
  Ics204WorkAssignmentRow,
} from '@/features/ics204/types'
import { resolveIcs204ResourceSnapshot } from '@/features/ics204/utils'

export type Ics204ExportContext = {
  incidentName?: string
  operationalPeriodFrom?: string
  operationalPeriodTo?: string
}

export type Ics204HeaderCell = {
  label: string
  value: string
  subLabels?: string[]
}

export type Ics204PersonnelRow = {
  position: string
  name: string
  contact: string
}

export type Ics204ResourceExportRow = {
  resourceIdentifier: string
  leader: string
  personCount: string
  contactInformation: string
  reportingInfoNotes: string
  has204A: boolean
}

export type Ics204CommunicationRow = {
  nameFunction: string
  contactInformation: string
}

export type Ics204SignatureBox = {
  label: string
  name: string
  dateTime: string
}

export type Ics204SignatureFooter = {
  preparedBy: Ics204SignatureBox
  reviewedPsc: Ics204SignatureBox
  reviewedOsc: Ics204SignatureBox
}

export type Ics204ExportLayoutBlock =
  | { kind: 'header-row'; cells: Ics204HeaderCell[] }
  | { kind: 'personnel-table'; label: string; rows: Ics204PersonnelRow[] }
  | { kind: 'resources-table'; label: string; rows: Ics204ResourceExportRow[] }
  | { kind: 'text-box'; label: string; body: string }
  | { kind: 'communications'; label: string; rows: Ics204CommunicationRow[]; emergency: string }
  | { kind: 'signature-footer'; footer: Ics204SignatureFooter }

function resolveIncidentName(form: Ics204FormState, context: Ics204ExportContext): string {
  return context.incidentName?.trim() ?? ''
}

function formatOperationalPeriod(context: Ics204ExportContext): string {
  const from = context.operationalPeriodFrom?.trim() ?? ''
  const to = context.operationalPeriodTo?.trim() ?? ''
  return [
    from.length > 0 ? `From: ${from}` : 'From:',
    to.length > 0 ? `To: ${to}` : 'To:',
  ].join('\n')
}

function formatAssignedLocation(form: Ics204FormState): string {
  return [
    form.branch.trim() ? form.branch.trim() : '',
    form.division.trim() ? form.division.trim() : '',
    form.group.trim() ? form.group.trim() : '',
    form.stagingArea.trim() ? form.stagingArea.trim() : '',
  ]
    .filter((line) => line.length > 0)
    .join('\n')
}

function buildHeaderCells(
  form: Ics204FormState,
  context: Ics204ExportContext
): Ics204HeaderCell[] {
  return [
    {
      label: '1. Incident Name:',
      value: resolveIncidentName(form, context),
    },
    {
      label: '2. Operational Period (Date/Time):',
      value: formatOperationalPeriod(context),
    },
    {
      label: '3. Assigned Location:',
      value: formatAssignedLocation(form),
      subLabels: ['Branch', 'Division', 'Group', 'Staging Area'],
    },
  ]
}

function buildPersonnelRows(form: Ics204FormState): Ics204PersonnelRow[] {
  return [
    { position: 'Section Chief', name: form.sectionChief, contact: '' },
    { position: 'Branch Director', name: form.branchDirector, contact: '' },
    {
      position: 'Division/Group Supervisor',
      name: form.divisionGroupSupervisor,
      contact: '',
    },
  ]
}

function buildResourceExportRow(row: Ics204ResourceAssignedRow): Ics204ResourceExportRow {
  const resource = resolveIcs204ResourceSnapshot(row)
  return {
    resourceIdentifier: resource.name,
    leader: resource.teamLead,
    personCount: resource.quantity > 0 ? String(resource.quantity) : '',
    contactInformation: resource.pointOfContact || resource.owner,
    reportingInfoNotes: row.reportingInfoNotes,
    has204A: row.has204A,
  }
}

function serializeWorkAssignment(row: Ics204WorkAssignmentRow, index: number): string {
  const lines: string[] = [`Assignment ${index + 1}`]
  if (row.priority.trim()) lines.push(`Priority: ${row.priority.trim()}`)
  if (row.assignment.trim()) lines.push(row.assignment.trim())
  if (row.reportingLocation.trim()) {
    lines.push(`Reporting Location: ${row.reportingLocation.trim()}`)
  }
  if (row.requestedArrivalTime.trim()) {
    lines.push(`Requested Arrival: ${row.requestedArrivalTime.trim()}`)
  }
  if (row.resourceRequirements.length > 0) {
    lines.push('Resource Requirements:')
    row.resourceRequirements.forEach((requirement) => {
      lines.push(
        `- ${requirement.resource || 'Resource'} — Required: ${requirement.required || '—'} · Have: ${requirement.have || '—'} · Need: ${requirement.need || '—'}`
      )
    })
  }
  if (row.overheadPositions.trim()) {
    lines.push(`Overhead Positions: ${row.overheadPositions.trim()}`)
  }
  if (row.specialEquipmentSupplies.trim()) {
    lines.push(`Special Equipment & Supplies: ${row.specialEquipmentSupplies.trim()}`)
  }
  return lines.join('\n')
}

export function serializeIcs204WorkAssignments(form: Ics204FormState): string {
  if (form.workAssignments.length === 0) {
    return ''
  }
  return form.workAssignments
    .map((row, index) => serializeWorkAssignment(row, index))
    .join('\n\n')
}

function parseCommunicationRows(text: string): Ics204CommunicationRow[] {
  const trimmed = text.trim()
  if (!trimmed) {
    return [{ nameFunction: ' ', contactInformation: ' ' }]
  }

  const rows: Ics204CommunicationRow[] = []
  for (const line of trimmed.split(/\r?\n/)) {
    const segment = line.trim()
    if (!segment) continue
    const separatorIndex = segment.indexOf(':')
    if (separatorIndex > 0) {
      rows.push({
        nameFunction: segment.slice(0, separatorIndex).trim(),
        contactInformation: segment.slice(separatorIndex + 1).trim() || ' ',
      })
      continue
    }
    rows.push({ nameFunction: segment, contactInformation: ' ' })
  }
  return rows.length > 0 ? rows : [{ nameFunction: ' ', contactInformation: ' ' }]
}

function formatSignatureDateTime(signature: Ics201VersionSignature | undefined): string {
  if (!signature) {
    return ''
  }
  return new Date(signature.signedAt).toLocaleString()
}

export function buildIcs204SignatureFooter(
  signatures: Ics201VersionSignature[] = []
): Ics204SignatureFooter {
  const author = signatures[0]
  const psc = signatures.find((entry) => entry.role === 'Planning Section Chief')
  const osc = signatures.find((entry) => entry.role === 'Operations Section Chief')

  return {
    preparedBy: {
      label: '9. Prepared By:',
      name: author?.name ?? '',
      dateTime: formatSignatureDateTime(author),
    },
    reviewedPsc: {
      label: '10. Reviewed by (PSC):',
      name: psc?.name ?? '',
      dateTime: formatSignatureDateTime(psc),
    },
    reviewedOsc: {
      label: '11. Reviewed by (OSC/ISC):',
      name: osc?.name ?? '',
      dateTime: formatSignatureDateTime(osc),
    },
  }
}

export function ics204ExportFilenameBase(form: Ics204FormState): string {
  const unit = form.assignedUnit.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return unit.length > 0 ? unit : `ICS-204_${form.id.slice(0, 8)}`
}

export function buildIcs204ExportLayout(
  form: Ics204FormState,
  context: Ics204ExportContext = {},
  signatures: Ics201VersionSignature[] = []
): Ics204ExportLayoutBlock[] {
  return [
    { kind: 'header-row', cells: buildHeaderCells(form, context) },
    {
      kind: 'personnel-table',
      label: '4. Operations or Intelligence/Inspections Personnel:',
      rows: buildPersonnelRows(form),
    },
    {
      kind: 'resources-table',
      label: '5. Resources Assigned:',
      rows: form.resourcesAssigned.map(buildResourceExportRow),
    },
    {
      kind: 'text-box',
      label: '6. Work Assignments:',
      body: serializeIcs204WorkAssignments(form),
    },
    {
      kind: 'text-box',
      label: '7. Special Instructions:',
      body: form.specialInstructions,
    },
    {
      kind: 'communications',
      label: '8. Communications:',
      rows: parseCommunicationRows(form.communications),
      emergency: form.emergencyCommunications,
    },
    {
      kind: 'signature-footer',
      footer: buildIcs204SignatureFooter(signatures),
    },
  ]
}

export { ICS204_FORM_TITLE_LINES }
