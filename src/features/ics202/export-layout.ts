import {
  ICS202_COMMUNITY_LIFELINES,
  ICS202_FORM_TITLE_LINES,
} from '@/features/ics202/constants'
import type { Ics202FormState, Ics202ObjectiveRow } from '@/features/ics202/types'

export type Ics202ExportContext = {
  incidentName?: string
}

export type Ics202HeaderCell = {
  label: string
  value: string
  subLabels?: string[]
}

export type Ics202PreparedByFields = {
  name: string
  positionTitle: string
  signature: string
  dateTime: string
}

export type Ics202LifelineOption = {
  id: string
  label: string
  checked: boolean
}

export type Ics202ExportLayoutBlock =
  | { kind: 'form-title' }
  | { kind: 'header-row'; cells: Ics202HeaderCell[] }
  | { kind: 'lifelines'; label: string; options: Ics202LifelineOption[] }
  | { kind: 'text-box'; label: string; body: string }
  | { kind: 'objectives'; label: string; rows: Ics202ObjectiveRow[] }
  | { kind: 'site-safety-plan'; required: boolean; location: string }
  | { kind: 'prepared-by'; label: string; fields: Ics202PreparedByFields }
  | { kind: 'page-break' }
  | { kind: 'page-footer'; left: string; pageLabel: string }

function resolveIncidentName(form: Ics202FormState, context: Ics202ExportContext): string {
  return form.incidentName.trim() || context.incidentName?.trim() || ''
}

function buildHeaderCells(form: Ics202FormState, context: Ics202ExportContext): Ics202HeaderCell[] {
  return [
    {
      label: '1. Incident Name:',
      value: resolveIncidentName(form, context),
    },
    {
      label: '2. Incident Location:',
      value: form.incidentLocation,
    },
    {
      label: '3. Operational Period (Date/Time):',
      value: [
        form.operationalPeriodFrom.trim()
          ? `From: ${form.operationalPeriodFrom.trim()}`
          : 'From:',
        form.operationalPeriodTo.trim() ? `To: ${form.operationalPeriodTo.trim()}` : 'To:',
      ].join('\n'),
    },
  ]
}

function buildPreparedByFields(form: Ics202FormState): Ics202PreparedByFields {
  return {
    name: form.preparedByName,
    positionTitle: form.preparedByPositionTitle || 'Planning Section Chief',
    signature: form.preparedBySignature,
    dateTime: form.preparedDateTime,
  }
}

function buildLifelineOptions(form: Ics202FormState): Ics202LifelineOption[] {
  return ICS202_COMMUNITY_LIFELINES.map((item) => ({
    id: item.id,
    label: item.label,
    checked: Boolean(form.communityLifelines[item.id]),
  }))
}

export function ics202ExportFilenameBase(form: Ics202FormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-202_${form.id.slice(0, 8)}`
}

/** USCG ICS 202-CG pages 2–3 layout (boxed sections). */
export function buildIcs202ExportLayout(
  form: Ics202FormState,
  context: Ics202ExportContext = {}
): Ics202ExportLayoutBlock[] {
  const headerCells = buildHeaderCells(form, context)
  const preparedBy = buildPreparedByFields(form)

  const page2: Ics202ExportLayoutBlock[] = [
    { kind: 'form-title' },
    { kind: 'header-row', cells: headerCells },
    {
      kind: 'lifelines',
      label: '4. Community Lifelines:',
      options: buildLifelineOptions(form),
    },
    {
      kind: 'text-box',
      label: '5. Incident Priorities:',
      body: form.incidentPriorities,
    },
    {
      kind: 'objectives',
      label: '6. Incident Objectives:',
      rows: form.objectives,
    },
    {
      kind: 'text-box',
      label: '7. Operational Period Command Emphasis: (Safety, Direction)',
      body: form.commandEmphasis,
    },
    {
      kind: 'site-safety-plan',
      required: form.siteSafetyPlanRequired,
      location: form.siteSafetyPlanLocation,
    },
    {
      kind: 'prepared-by',
      label: '10. Prepared by:',
      fields: preparedBy,
    },
    {
      kind: 'page-footer',
      left: 'ICS 202-CG (08/25)  Expiration: 08/35',
      pageLabel: 'Page 2 of 3',
    },
    { kind: 'page-break' },
    { kind: 'form-title' },
    { kind: 'header-row', cells: headerCells },
    {
      kind: 'text-box',
      label: '11. Critical Information Requirements:',
      body: form.criticalInformationRequirements,
    },
    {
      kind: 'text-box',
      label: '12. Limitations and Constraints:',
      body: form.limitationsAndConstraints,
    },
    {
      kind: 'text-box',
      label: '13. Key Decisions and Procedures:',
      body: form.keyDecisionsAndProcedures,
    },
    {
      kind: 'prepared-by',
      label: '14. Prepared by:',
      fields: preparedBy,
    },
    {
      kind: 'page-footer',
      left: 'ICS 202-CG (08/25)  Expiration: 08/35',
      pageLabel: 'Page 3 of 3',
    },
  ]

  return page2
}

export { ICS202_FORM_TITLE_LINES }
