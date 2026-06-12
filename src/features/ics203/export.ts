import { ICS203_SECTION_LABELS } from '@/features/ics203/constants'
import type { Ics203FormState } from '@/features/ics203/types'

export type Ics203DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics203DocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics203DocxOptions = {
  header?: {
    cells: Ics203DocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics203DocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics203ExportContext = {
  incidentName?: string
}

export function ics203ExportFilenameBase(form: Ics203FormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-203_${form.id.slice(0, 8)}`
}

export function buildIcs203ExportOptions(
  form: Ics203FormState,
  context: Ics203ExportContext = {}
): Ics203DocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'MARATHON',
        'ORGANIZATION ASSIGNMENT LIST (ICS 203)',
      ],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName || context.incidentName || '' },
        {
          label: '2. Operational Period:',
          value: [form.operationalPeriodFrom, form.operationalPeriodTo]
            .filter((part) => part.trim().length > 0)
            .join(' – '),
        },
      ],
    },
    footer: {
      topLines: ['Prepared by:'],
      cells: [
        { label: 'Name:', value: form.preparedByName },
        { label: 'Position/Title:', value: form.preparedByPositionTitle },
        { label: 'Date/Time:', value: form.preparedDateTime || new Date().toLocaleString() },
      ],
    },
  }
}

export function buildIcs203DocxBlocks(
  form: Ics203FormState,
  context: Ics203ExportContext = {}
): Ics203DocxBlock[] {
  const blocks: Ics203DocxBlock[] = []
  const pushHeading = (text: string) => blocks.push({ kind: 'heading', text })
  const pushParagraph = (text: string | undefined | null) => {
    const trimmed = (text ?? '').trim()
    if (trimmed.length === 0) return
    blocks.push({ kind: 'paragraph', text: trimmed })
  }
  const pushField = (label: string, value: string | undefined | null) => {
    const trimmed = (value ?? '').trim()
    if (trimmed.length === 0) return
    pushParagraph(`${label}: ${trimmed}`)
  }

  blocks.push({ kind: 'title', text: 'Organization Assignment List (ICS-203)' })
  const subtitle = form.incidentName.trim() || context.incidentName?.trim()
  if (subtitle) blocks.push({ kind: 'subtitle', text: subtitle })

  pushHeading(ICS203_SECTION_LABELS['incident-info'])
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Operational Period From', form.operationalPeriodFrom)
  pushField('Operational Period To', form.operationalPeriodTo)

  pushHeading(ICS203_SECTION_LABELS['command-staff'])
  pushField('IC/UCs', form.icUcs)
  pushField('Deputy', form.commandDeputy)
  pushField('Safety Officer', form.safetyOfficer)
  pushField('Public Information Officer', form.publicInformationOfficer)
  pushField('Liaison Officer', form.liaisonOfficer)

  pushHeading(ICS203_SECTION_LABELS['agency-representatives'])
  if (form.agencyRepresentatives.length === 0) {
    pushParagraph('No agency representatives recorded.')
  } else {
    form.agencyRepresentatives.forEach((row, index) => {
      pushParagraph(
        `${index + 1}. ${row.agencyOrganization || 'Agency'} — ${row.representativeName || 'Representative'}`
      )
    })
  }

  pushHeading(ICS203_SECTION_LABELS['planning-section'])
  pushField('Chief', form.planningChief)
  pushField('Deputy', form.planningDeputy)
  pushField('Resources Unit', form.resourcesUnit)
  pushField('Situation Unit', form.situationUnit)
  pushField('Documentation Unit', form.documentationUnit)
  pushField('Demobilization Unit', form.demobilizationUnit)
  pushField('Technical Specialists', form.technicalSpecialists)
  form.planningDivisionGroups.forEach((row) => {
    pushField(`Division/Group ${row.identifier}`, row.supervisorName)
  })

  pushHeading(ICS203_SECTION_LABELS['logistics-section'])
  pushField('Chief', form.logisticsChief)
  pushField('Deputy', form.logisticsDeputy)
  pushField('Support Branch Director', form.supportBranchDirector)
  pushField('Supply Unit', form.supplyUnit)
  pushField('Facilities Unit', form.facilitiesUnit)
  pushField('Ground Support Unit', form.groundSupportUnit)
  pushField('Service Branch Director', form.serviceBranchDirector)
  pushField('Communications Unit', form.communicationsUnit)
  pushField('Medical Unit', form.medicalUnit)
  pushField('Food Unit', form.foodUnit)
  pushField('Air Operations Branch', form.airOperationsBranch)
  pushField('Air Ops Branch Director', form.airOpsBranchDirector)

  pushHeading(ICS203_SECTION_LABELS['operations-section'])
  pushField('Chief', form.operationsChief)
  pushField('Deputy', form.operationsDeputy)
  pushField('Staging Area', form.stagingArea)
  form.operationsBranches.forEach((branch, index) => {
    pushParagraph(`Branch ${index + 1}`)
    pushField('Branch Director', branch.branchDirector)
    pushField('Deputy', branch.deputy)
    branch.divisionGroups.forEach((row) => {
      pushField(`Division/Group ${row.identifier}`, row.supervisorName)
    })
  })
  pushField('Air Operations Branch', form.operationsAirOperationsBranch)
  pushField('Air Ops Branch Director', form.operationsAirOpsBranchDirector)

  pushHeading(ICS203_SECTION_LABELS['finance-section'])
  pushField('Chief', form.financeChief)
  pushField('Deputy', form.financeDeputy)
  pushField('Time Unit', form.timeUnit)
  pushField('Procurement Unit', form.procurementUnit)
  pushField('Compensation/Claims Unit', form.compensationClaimsUnit)
  pushField('Cost Unit', form.costUnit)

  pushHeading(ICS203_SECTION_LABELS['prepared-by'])
  pushField('Prepared By', form.preparedByName)
  pushField('Position/Title', form.preparedByPositionTitle)
  pushField('Signature', form.preparedBySignature)
  pushField('Date/Time Prepared', form.preparedDateTime)

  return blocks
}
