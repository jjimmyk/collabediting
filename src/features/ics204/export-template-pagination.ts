import {
  ICS204_TEMPLATE_COMMUNICATION_ROWS_PER_PAGE,
  ICS204_TEMPLATE_RESOURCE_ROWS_PER_PAGE,
} from '@/features/ics204/export-template-constants'
import { ics204TemplateLargeTextRect } from '@/features/ics204/export-template-fields'
import type {
  Ics204CommunicationRow,
  Ics204ExportContext,
  Ics204ResourceExportRow,
  Ics204SignatureFooter,
} from '@/features/ics204/export-layout'
import {
  buildIcs204SignatureFooter,
  buildResourceExportRow,
  parseCommunicationRows,
  serializeIcs204WorkAssignments,
} from '@/features/ics204/export-layout'
import type { Ics204FormState, Ics204ResourceAssignedRow } from '@/features/ics204/types'
import type { Ics201VersionSignature } from '@/features/ics201/types'
import { wrapIcs204TextLines } from '@/features/ics204/export-pagination'

export type Ics204TemplatePersonnelRow = {
  name: string
  contact: string
}

export type Ics204TemplateEmergencyValues = {
  medical: string
  evacuation: string
  other: string
}

export type Ics204TemplatePagePlan = {
  pageNumber: number
  totalPages: number
  showPersonnel: boolean
  showEmergency: boolean
  showSignatures: boolean
  header: {
    incidentName: string
    operationalPeriodFrom: string
    operationalPeriodTo: string
    branch: string
    division: string
    group: string
    stagingArea: string
  }
  personnel: {
    sectionChief: Ics204TemplatePersonnelRow
    branchDirector: Ics204TemplatePersonnelRow
    divisionGroupSupervisor: Ics204TemplatePersonnelRow
  }
  resourceRows: Ics204ResourceExportRow[]
  resourcesContinued: boolean
  workAssignmentsText: string
  workAssignmentsContinued: boolean
  specialInstructionsText: string
  specialInstructionsContinued: boolean
  communicationRows: Ics204CommunicationRow[]
  communicationsContinued: boolean
  emergency: Ics204TemplateEmergencyValues
  signatureFooter: Ics204SignatureFooter
}

function sliceItems<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]]
  const slices: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    slices.push(items.slice(index, index + size))
  }
  return slices
}

function estimateMaxLinesPerLargeTextBox(
  key: 'workAssignments' | 'specialInstructions'
): number {
  const rect = ics204TemplateLargeTextRect(key)
  const usableHeight = Math.max(0, rect.height - rect.padding * 2)
  return Math.max(1, Math.floor((usableHeight + rect.lineHeight - rect.fontSize) / rect.lineHeight))
}

function splitLargeTextIntoChunks(
  text: string,
  key: 'workAssignments' | 'specialInstructions'
): string[] {
  const trimmed = text.trim()
  if (!trimmed) return ['']
  const rect = ics204TemplateLargeTextRect(key)
  const maxWidth = Math.max(1, rect.width - rect.padding * 2)
  const lines = wrapIcs204TextLines(trimmed, maxWidth, rect.fontSize)
  const maxLines = estimateMaxLinesPerLargeTextBox(key)
  const chunks: string[] = []
  for (let index = 0; index < lines.length; index += maxLines) {
    chunks.push(lines.slice(index, index + maxLines).join('\n'))
  }
  return chunks.length > 0 ? chunks : ['']
}

export function parseIcs204EmergencyCommunications(text: string): Ics204TemplateEmergencyValues {
  const trimmed = text.trim()
  if (!trimmed) {
    return { medical: '', evacuation: '', other: '' }
  }

  const result: Ics204TemplateEmergencyValues = { medical: '', evacuation: '', other: '' }
  const lines = trimmed.split(/\r?\n/)
  let current: keyof Ics204TemplateEmergencyValues | null = null
  const buffer: string[] = []

  const flush = () => {
    if (!current) return
    result[current] = buffer.join('\n').trim()
    buffer.length = 0
  }

  for (const line of lines) {
    const medicalMatch = line.match(/^medical\s*:?\s*(.*)$/i)
    const evacuationMatch = line.match(/^evacuation\s*:?\s*(.*)$/i)
    const otherMatch = line.match(/^other\s*:?\s*(.*)$/i)
    if (medicalMatch) {
      flush()
      current = 'medical'
      if (medicalMatch[1]?.trim()) buffer.push(medicalMatch[1].trim())
      continue
    }
    if (evacuationMatch) {
      flush()
      current = 'evacuation'
      if (evacuationMatch[1]?.trim()) buffer.push(evacuationMatch[1].trim())
      continue
    }
    if (otherMatch) {
      flush()
      current = 'other'
      if (otherMatch[1]?.trim()) buffer.push(otherMatch[1].trim())
      continue
    }
    if (current) {
      buffer.push(line)
    } else {
      result.other = result.other ? `${result.other}\n${line}` : line
    }
  }
  flush()
  return result
}

export function buildIcs204TemplateHeaderValues(
  form: Ics204FormState,
  context: Ics204ExportContext
): Ics204TemplatePagePlan['header'] {
  return {
    incidentName: context.incidentName?.trim() ?? '',
    operationalPeriodFrom: context.operationalPeriodFrom?.trim() ?? '',
    operationalPeriodTo: context.operationalPeriodTo?.trim() ?? '',
    branch: form.branch.trim(),
    division: form.division.trim(),
    group: form.group.trim(),
    stagingArea: form.stagingArea.trim(),
  }
}

function buildResourceExportRows(form: Ics204FormState): Ics204ResourceExportRow[] {
  return form.resourcesAssigned.map((row: Ics204ResourceAssignedRow) => buildResourceExportRow(row))
}

function buildPersonnelValues(form: Ics204FormState): Ics204TemplatePagePlan['personnel'] {
  return {
    sectionChief: { name: form.sectionChief.trim(), contact: '' },
    branchDirector: { name: form.branchDirector.trim(), contact: '' },
    divisionGroupSupervisor: {
      name: form.divisionGroupSupervisor.trim(),
      contact: '',
    },
  }
}

export function paginateIcs204TemplateExport(
  form: Ics204FormState,
  context: Ics204ExportContext = {},
  signatures: Ics201VersionSignature[] = []
): Ics204TemplatePagePlan[] {
  const header = buildIcs204TemplateHeaderValues(form, context)
  const personnel = buildPersonnelValues(form)
  const signatureFooter = buildIcs204SignatureFooter(signatures)
  const emergency = parseIcs204EmergencyCommunications(form.emergencyCommunications)

  const resourceRows = buildResourceExportRows(form)
  const communicationRows = parseCommunicationRows(form.communications)
  const workText = serializeIcs204WorkAssignments(form)
  const specialText = form.specialInstructions.trim()

  const resourceChunks = sliceItems(resourceRows, ICS204_TEMPLATE_RESOURCE_ROWS_PER_PAGE)
  const communicationChunks = sliceItems(communicationRows, ICS204_TEMPLATE_COMMUNICATION_ROWS_PER_PAGE)
  const workChunks = splitLargeTextIntoChunks(workText, 'workAssignments')
  const specialChunks = splitLargeTextIntoChunks(specialText, 'specialInstructions')

  const totalPages = Math.max(
    resourceChunks.length,
    communicationChunks.length,
    workChunks.length,
    specialChunks.length,
    1
  )

  const pages: Ics204TemplatePagePlan[] = []
  for (let index = 0; index < totalPages; index += 1) {
    pages.push({
      pageNumber: index + 1,
      totalPages,
      showPersonnel: index === 0,
      showEmergency: index === totalPages - 1,
      showSignatures: index === totalPages - 1,
      header,
      personnel,
      resourceRows: resourceChunks[index] ?? [],
      resourcesContinued: index > 0 && (resourceChunks[index]?.length ?? 0) > 0,
      workAssignmentsText: workChunks[index] ?? '',
      workAssignmentsContinued: index > 0 && Boolean(workChunks[index]),
      specialInstructionsText: specialChunks[index] ?? '',
      specialInstructionsContinued: index > 0 && Boolean(specialChunks[index]),
      communicationRows: communicationChunks[index] ?? [],
      communicationsContinued: index > 0 && (communicationChunks[index]?.length ?? 0) > 0,
      emergency,
      signatureFooter,
    })
  }

  return pages
}

export function assertIcs204TemplatePaginationInvariants(pages: Ics204TemplatePagePlan[]): void {
  if (pages.length === 0) {
    throw new Error('ICS-204 template export produced no pages.')
  }
  pages.forEach((page, index) => {
    if (page.pageNumber !== index + 1) {
      throw new Error('ICS-204 template page numbering is out of sequence.')
    }
    if (page.totalPages !== pages.length) {
      throw new Error('ICS-204 template total page count mismatch.')
    }
    if (page.resourceRows.length > ICS204_TEMPLATE_RESOURCE_ROWS_PER_PAGE) {
      throw new Error('ICS-204 template page exceeds resource row capacity.')
    }
    if (page.communicationRows.length > ICS204_TEMPLATE_COMMUNICATION_ROWS_PER_PAGE) {
      throw new Error('ICS-204 template page exceeds communication row capacity.')
    }
  })
  const last = pages[pages.length - 1]
  if (!last.showSignatures) {
    throw new Error('ICS-204 template final page must include signatures.')
  }
}
