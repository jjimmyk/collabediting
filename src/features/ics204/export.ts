import { ICS204_SECTION_LABELS } from '@/features/ics204/constants'
import type { Ics204FormState } from '@/features/ics204/types'
import { resolveIcs204ResourceSnapshot } from '@/features/ics204/utils'

export type Ics204DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics204DocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics204DocxOptions = {
  header?: {
    cells: Ics204DocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics204DocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics204ExportContext = {
  incidentName?: string
  operationalPeriod?: string
}

export function ics204ExportFilenameBase(form: Ics204FormState): string {
  const unit = form.assignedUnit.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return unit.length > 0 ? unit : `ICS-204_${form.id.slice(0, 8)}`
}

export function buildIcs204ExportOptions(
  form: Ics204FormState,
  context: Ics204ExportContext = {}
): Ics204DocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'MARATHON',
        'ASSIGNMENT LIST (ICS 204-CG)',
      ],
      cells: [
        { label: '1. Incident Name:', value: context.incidentName ?? '' },
        { label: '2. Operational Period:', value: context.operationalPeriod ?? '' },
        { label: '3. Assigned Unit:', value: form.assignedUnit },
      ],
    },
    footer: {
      topLines: ['Prepared by:'],
      cells: [
        { label: 'Name:', value: form.sectionChief || form.branchDirector || '' },
        {
          label: 'Position/Title:',
          value: form.divisionGroupSupervisor || form.branchDirector || 'Operations',
        },
        { label: 'Date/Time:', value: new Date().toLocaleString() },
      ],
    },
  }
}

export function buildIcs204DocxBlocks(
  form: Ics204FormState,
  context: Ics204ExportContext = {}
): Ics204DocxBlock[] {
  const blocks: Ics204DocxBlock[] = []
  const pushHeading = (text: string) => blocks.push({ kind: 'heading', text })
  const pushParagraph = (text: string | undefined | null) => {
    const trimmed = (text ?? '').trim()
    if (trimmed.length === 0) return
    for (const line of trimmed.split(/\r?\n/)) {
      const segment = line.trim()
      if (segment.length === 0) continue
      blocks.push({ kind: 'paragraph', text: segment })
    }
  }
  const pushBullet = (text: string | undefined | null) => {
    const trimmed = (text ?? '').trim()
    if (trimmed.length === 0) return
    blocks.push({ kind: 'bullet', text: trimmed })
  }
  const pushField = (label: string, value: string | undefined | null) => {
    const trimmed = (value ?? '').trim()
    if (trimmed.length === 0) return
    pushParagraph(`${label}: ${trimmed}`)
  }

  blocks.push({ kind: 'title', text: 'Assignment List (ICS-204)' })
  const subtitleParts: string[] = []
  if (form.assignedUnit.trim()) subtitleParts.push(form.assignedUnit.trim())
  if (context.incidentName?.trim()) subtitleParts.push(context.incidentName.trim())
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  pushHeading(ICS204_SECTION_LABELS['assignment-info'])
  pushField('Assigned Unit', form.assignedUnit)
  pushField('Operations Section Chief', form.sectionChief)
  pushField('Branch Director', form.branchDirector)
  pushField('Division/Group Supervisor', form.divisionGroupSupervisor)
  pushField('Branch', form.branch)
  pushField('Division', form.division)
  pushField('Group', form.group)
  pushField('Staging Area', form.stagingArea)

  pushHeading(ICS204_SECTION_LABELS['resources-assigned'])
  if (form.resourcesAssigned.length === 0) {
    pushParagraph('No resources assigned.')
  } else {
    form.resourcesAssigned.forEach((row, index) => {
      const resource = resolveIcs204ResourceSnapshot(row)
      pushParagraph(`Resource ${index + 1}: ${resource.name}`)
      pushField('Leader', resource.teamLead)
      pushField('# of Persons', resource.quantity > 0 ? String(resource.quantity) : '')
      pushField('Contact Info', resource.pointOfContact || resource.owner)
      pushField('Current Location', resource.currentLocation || resource.location)
      pushField('Reporting Info/Notes', row.reportingInfoNotes)
      pushField('204A Attachment', row.has204A ? 'X' : '')
      if (resource.capabilities.trim()) {
        pushField('Capabilities', resource.capabilities)
      }
    })
  }

  pushHeading(ICS204_SECTION_LABELS['work-assignments'])
  if (form.workAssignments.length === 0) {
    pushParagraph('No work assignments.')
  } else {
    form.workAssignments.forEach((row, index) => {
      pushParagraph(`Assignment ${index + 1}`)
      pushField('Work Assignment', row.assignment)
      pushField('Priority', row.priority)
      pushField('Requested Arrival Time', row.requestedArrivalTime)
      pushField('Reporting Location', row.reportingLocation)
      if (row.resourceRequirements.length > 0) {
        pushParagraph('Resource Requirements:')
        row.resourceRequirements.forEach((requirement) => {
          pushBullet(
            `${requirement.resource || 'Resource'} — Required: ${requirement.required || '—'} · Have: ${requirement.have || '—'} · Need: ${requirement.need || '—'}`
          )
        })
      }
      if (row.overheadPositions.trim()) {
        pushField('Overhead Positions', row.overheadPositions)
      }
      if (row.specialEquipmentSupplies.trim()) {
        pushField('Special Equipment & Supplies', row.specialEquipmentSupplies)
      }
    })
  }

  pushHeading(ICS204_SECTION_LABELS['special-instructions'])
  if (form.specialInstructions.trim().length === 0) {
    pushParagraph('No special instructions recorded.')
  } else {
    pushParagraph(form.specialInstructions)
  }

  pushHeading(ICS204_SECTION_LABELS.communications)
  if (form.communications.trim().length === 0 && form.emergencyCommunications.trim().length === 0) {
    pushParagraph('No communications recorded.')
  } else {
    if (form.communications.trim()) {
      pushParagraph('Communications:')
      pushParagraph(form.communications)
    }
    if (form.emergencyCommunications.trim()) {
      pushParagraph('Emergency Communications:')
      pushParagraph(form.emergencyCommunications)
    }
  }

  return blocks
}
