import {
  ICS209_LIFE_SAFETY_THREAT_LABELS,
  ICS209_SECTION_LABELS,
  ICS209_TIME_HORIZON_LABELS,
} from '@/features/ics209/constants'
import type { Ics209FormState } from '@/features/ics209/types'
import {
  formatIcs209PercentMetric,
  formatIcs209ReportVersion,
  formatIcs209TimeHorizon,
} from '@/features/ics209/utils'

export type Ics209DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics209DocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics209DocxOptions = {
  header?: {
    cells: Ics209DocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics209DocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics209ExportContext = {
  incidentName?: string
}

export function ics209ExportFilenameBase(form: Ics209FormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-209_${form.id.slice(0, 8)}`
}

function formatTimePeriod(form: Ics209FormState): string {
  const from = form.timePeriodFrom.trim().replace('T', ' ')
  const to = form.timePeriodTo.trim().replace('T', ' ')
  if (!from && !to) return ''
  if (from && to) return `${from} – ${to}`
  return from || to
}

export function buildIcs209ExportOptions(
  form: Ics209FormState,
  context: Ics209ExportContext = {}
): Ics209DocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'FEDERAL EMERGENCY MANAGEMENT AGENCY',
        'INCIDENT STATUS SUMMARY (ICS 209)',
      ],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName || context.incidentName || '' },
        { label: '2. Incident Number:', value: form.incidentNumber },
        { label: '11. For Time Period:', value: formatTimePeriod(form) },
      ],
    },
    footer: {
      topLines: ['Approval & Routing:'],
      cells: [
        { label: '12. Prepared By:', value: form.preparedByName },
        { label: '13. Date/Time Submitted:', value: form.submittedDateTime },
        { label: '14. Approved By:', value: form.approvedByName },
        { label: '15. Sent To:', value: form.primarySentTo },
      ],
    },
  }
}

export function buildIcs209DocxBlocks(
  form: Ics209FormState,
  context: Ics209ExportContext = {}
): Ics209DocxBlock[] {
  const blocks: Ics209DocxBlock[] = []
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
  const pushField = (label: string, value: string | undefined | null) => {
    const trimmed = (value ?? '').trim()
    if (trimmed.length === 0) return
    pushParagraph(`${label}: ${trimmed}`)
  }
  const pushTimeHorizon = (label: string, fields: Ics209FormState['projectedActivity']) => {
    pushHeading(label)
    for (const horizon of ICS209_TIME_HORIZON_LABELS) {
      const value = fields[horizon.key]?.trim()
      if (value) pushParagraph(`${horizon.label}: ${value}`)
    }
  }

  blocks.push({ kind: 'title', text: 'Incident Status Summary (ICS 209)' })
  const subtitleParts: string[] = []
  if (form.incidentName.trim()) subtitleParts.push(form.incidentName.trim())
  else if (context.incidentName?.trim()) subtitleParts.push(context.incidentName.trim())
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  pushHeading(ICS209_SECTION_LABELS['incident-info'])
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Incident Number', form.incidentNumber)
  pushField('Report Version', formatIcs209ReportVersion(form.reportVersion))
  pushField('Report #', form.reportNumber)
  pushField('Incident Commander(s)', form.incidentCommanders)
  pushField('Incident Management Organization', form.incidentManagementOrganization)
  pushField('Incident Start Date', form.incidentStartDate)
  pushField('Incident Start Time', form.incidentStartTime)
  pushField('Time Zone', form.incidentStartTimeZone)
  pushField('Current Incident Size/Area', form.currentIncidentSize)
  pushField('Percent', formatIcs209PercentMetric(form.percentMetric, form.percentValue))
  pushField('Incident Definition', form.incidentDefinition)
  pushField('Incident Complexity Level', form.incidentComplexityLevel)
  pushField('Time Period From', form.timePeriodFrom)
  pushField('Time Period To', form.timePeriodTo)

  pushHeading(ICS209_SECTION_LABELS['approval-routing'])
  pushField('Prepared By', form.preparedByName)
  pushField('ICS Position', form.preparedByPosition)
  pushField('Date/Time Prepared', form.preparedByDateTime)
  pushField('Date/Time Submitted', form.submittedDateTime)
  pushField('Submitted Time Zone', form.submittedTimeZone)
  pushField('Approved By', form.approvedByName)
  pushField('Approved Position', form.approvedByPosition)
  pushField('Signature', form.approvedBySignature)
  pushField('Primary Sent To', form.primarySentTo)

  pushHeading(ICS209_SECTION_LABELS['location-info'])
  pushField('State', form.locationState)
  pushField('County/Parish/Borough', form.locationCounty)
  pushField('City', form.locationCity)
  pushField('Unit or Other', form.locationUnitOrOther)
  pushField('Incident Jurisdiction', form.incidentJurisdiction)
  pushField('Location Ownership', form.locationOwnership)
  pushField('Longitude', form.longitude)
  pushField('Latitude', form.latitude)
  pushField('US National Grid', form.usNationalGrid)
  pushField('Legal Description', form.legalDescription)
  pushField('Short Location Description', form.shortLocationDescription)
  pushField('UTM Coordinates', form.utmCoordinates)
  pushField('Geospatial Data Notes', form.geospatialDataNotes)

  pushHeading(ICS209_SECTION_LABELS['incident-summary'])
  pushField('Significant Events', form.significantEvents)
  pushField('Primary Materials/Hazards', form.primaryMaterialsHazards)
  pushField('Damage Assessment Summary', form.damageAssessmentSummary)
  for (const row of form.damageRows) {
    if (!row.category.trim() && !row.damaged.trim()) continue
    pushParagraph(
      `${row.category}: Threatened ${row.threatened72hr || '—'} | Damaged ${row.damaged || '—'} | Destroyed ${row.destroyed || '—'}`
    )
  }

  pushHeading(ICS209_SECTION_LABELS['public-responder-status'])
  pushParagraph('Public Status Summary (Block 31)')
  for (const row of form.publicStatusRows) {
    if (!row.count.trim() && !row.thisPeriod.trim() && !row.toDate.trim()) continue
    pushParagraph(
      `${row.label}: This Period ${row.thisPeriod || '—'} | To Date ${row.toDate || '—'} | Count ${row.count || '—'}`
    )
  }
  pushField('Total Civilians Affected (This Period)', form.publicTotalAffectedThisPeriod)
  pushField('Total Civilians Affected (To Date)', form.publicTotalAffectedToDate)
  pushParagraph('Responder Status Summary (Block 32)')
  for (const row of form.responderStatusRows) {
    if (!row.count.trim() && !row.thisPeriod.trim() && !row.toDate.trim()) continue
    pushParagraph(
      `${row.label}: This Period ${row.thisPeriod || '—'} | To Date ${row.toDate || '—'} | Count ${row.count || '—'}`
    )
  }
  pushField('Total Responders Affected (This Period)', form.responderTotalAffectedThisPeriod)
  pushField('Total Responders Affected (To Date)', form.responderTotalAffectedToDate)

  pushHeading(ICS209_SECTION_LABELS['life-safety-threat'])
  pushField('Life, Safety, and Health Remarks', form.lifeSafetyThreatRemarks)
  pushField('Threat Active', form.lifeSafetyThreatActive ? 'Yes' : 'No')
  pushField('Threat Notes', form.lifeSafetyThreatNotes)
  for (const [key, label] of Object.entries(ICS209_LIFE_SAFETY_THREAT_LABELS)) {
    if (form.lifeSafetyThreats[key as keyof typeof form.lifeSafetyThreats]) {
      blocks.push({ kind: 'bullet', text: label })
    }
  }

  pushHeading(ICS209_SECTION_LABELS['weather-projections'])
  pushField('Weather Concerns', form.weatherConcerns)
  pushTimeHorizon('Projected Incident Activity (Block 36)', form.projectedActivity)

  pushHeading(ICS209_SECTION_LABELS['strategic-objectives'])
  pushParagraph(form.strategicObjectives)

  pushTimeHorizon(ICS209_SECTION_LABELS['threat-summary'], form.threatSummary)
  pushTimeHorizon(ICS209_SECTION_LABELS['critical-resources'], form.criticalResourceNeeds)

  pushHeading(ICS209_SECTION_LABELS['strategic-discussion'])
  pushParagraph(form.strategicDiscussion)

  pushHeading(ICS209_SECTION_LABELS['planned-actions-projections'])
  pushField('Planned Actions Next Period', form.plannedActionsNextPeriod)
  pushField('Projected Final Size/Area', form.projectedFinalSize)
  pushField('Anticipated Completion Date', form.anticipatedCompletionDate)
  pushField('Projected Demobilization Start', form.projectedDemobilizationStartDate)
  pushField('Estimated Costs to Date', form.estimatedCostsToDate)
  pushField('Projected Final Cost Estimate', form.projectedFinalCostEstimate)

  pushHeading(ICS209_SECTION_LABELS.remarks)
  pushParagraph(form.remarks)

  pushHeading(ICS209_SECTION_LABELS['resource-commitment'])
  for (const row of form.agencyResourceRows) {
    if (!row.agency.trim()) continue
    const resourceParts = form.resourceColumns
      .map((column) => {
        const cell = row.resourceCounts[column.id]
        if (!cell?.resources.trim() && !cell?.personnel.trim()) return ''
        return `${column.label}: ${cell.resources || '0'}/${cell.personnel || '0'}`
      })
      .filter(Boolean)
    pushParagraph(
      `${row.agency} — Additional Personnel: ${row.additionalPersonnel || '—'} | Total Personnel: ${row.totalPersonnel || '—'}${resourceParts.length ? ` | ${resourceParts.join(' · ')}` : ''}`
    )
  }
  pushField('Total Resources', form.totalResources)
  pushField('Cooperating Organizations', form.cooperatingOrganizations)

  return blocks
}
