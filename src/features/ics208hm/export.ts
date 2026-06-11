import { ICS208HM_SECTION_LABELS } from '@/features/ics208hm/constants'
import type { Ics208hmFormState } from '@/features/ics208hm/types'
import {
  formatIcs208hmSiteMapIncludes,
  formatIcs208hmYesNo,
} from '@/features/ics208hm/utils'

export type Ics208hmDocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics208hmDocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics208hmDocxOptions = {
  header?: {
    cells: Ics208hmDocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics208hmDocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics208hmExportContext = {
  incidentName?: string
}

export function ics208hmExportFilenameBase(form: Ics208hmFormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-208HM_${form.id.slice(0, 8)}`
}

function formatOperationalPeriod(form: Ics208hmFormState): string {
  const fromParts = [form.operationalPeriodDateFrom, form.operationalPeriodTimeFrom]
    .filter((part) => part.trim().length > 0)
    .join(' ')
  const toParts = [form.operationalPeriodDateTo, form.operationalPeriodTimeTo]
    .filter((part) => part.trim().length > 0)
    .join(' ')
  if (fromParts.length === 0 && toParts.length === 0) return ''
  if (fromParts.length > 0 && toParts.length > 0) return `${fromParts} – ${toParts}`
  return fromParts || toParts
}

export function buildIcs208hmExportOptions(
  form: Ics208hmFormState,
  context: Ics208hmExportContext = {}
): Ics208hmDocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'U.S. COAST GUARD',
        'SITE SAFETY AND CONTROL PLAN (ICS 208 HM)',
      ],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName || context.incidentName || '' },
        { label: '2. Date Prepared:', value: form.datePrepared },
        { label: '3. Operational Period:', value: formatOperationalPeriod(form) },
      ],
    },
    footer: {
      topLines: ['Safety Briefing Signatures:'],
      cells: [
        { label: 'Asst. Safety Officer - HM:', value: form.asstSafetyOfficerHmSignature },
        { label: 'Briefing Completed:', value: form.safetyBriefingCompletedTime },
        { label: 'HM Group Supervisor:', value: form.hmGroupSupervisorSignature },
        { label: 'Incident Commander:', value: form.incidentCommanderSignature },
      ],
    },
  }
}

export function buildIcs208hmDocxBlocks(
  form: Ics208hmFormState,
  context: Ics208hmExportContext = {}
): Ics208hmDocxBlock[] {
  const blocks: Ics208hmDocxBlock[] = []
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

  blocks.push({ kind: 'title', text: 'Site Safety and Control Plan (ICS 208 HM)' })
  const subtitleParts: string[] = []
  if (form.incidentName.trim()) subtitleParts.push(form.incidentName.trim())
  else if (context.incidentName?.trim()) subtitleParts.push(context.incidentName.trim())
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  pushHeading(ICS208HM_SECTION_LABELS['incident-info'])
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Date Prepared', form.datePrepared)
  pushField('Operational Period', formatOperationalPeriod(form))

  pushHeading(ICS208HM_SECTION_LABELS['site-information'])
  pushField('Incident Location', form.incidentLocation)

  pushHeading(ICS208HM_SECTION_LABELS.organization)
  const org = form.organization
  pushField('Incident Commander', org.incidentCommander)
  pushField('HM Group Supervisor', org.hmGroupSupervisor)
  pushField('Tech. Specialist - HM Reference', org.techSpecialistHmReference)
  pushField('Safety Officer', org.safetyOfficer)
  pushField('Entry Leader', org.entryLeader)
  pushField('Site Access Control Leader', org.siteAccessControlLeader)
  pushField('Asst. Safety Officer - HM', org.asstSafetyOfficerHm)
  pushField('Decontamination Leader', org.decontaminationLeader)
  pushField('Safe Refuge Area Mgr', org.safeRefugeAreaMgr)
  pushField('Environmental Health', org.environmentalHealth)
  pushField('Other Function 15', org.orgFunction15)
  pushField('Other Function 16', org.orgFunction16)
  for (const row of form.entryTeam) {
    if (!row.entryName.trim() && !row.deconName.trim()) continue
    pushParagraph(
      `Entry ${row.id}: ${row.entryName} (PPE ${row.entryPpeLevel}) / Decon: ${row.deconName} (PPE ${row.deconPpeLevel})`
    )
  }

  pushHeading(ICS208HM_SECTION_LABELS['hazard-risk-analysis'])
  for (const row of form.materials) {
    if (!row.material.trim()) continue
    pushParagraph(
      `Material ${row.id}: ${row.material} | Container: ${row.containerType} | Qty: ${row.qty} | State: ${row.physState}`
    )
    if (row.comment.trim()) pushParagraph(`Comment: ${row.comment}`)
  }

  pushHeading(ICS208HM_SECTION_LABELS['hazard-monitoring'])
  pushField('LEL Instrument(s)', form.lelInstruments)
  pushField('O₂ Instrument(s)', form.o2Instruments)
  pushField('Toxicity/PPM Instrument(s)', form.toxicityPpmInstruments)
  pushField('Radiological Instrument(s)', form.radiologicalInstruments)
  pushField('Comment', form.hazardMonitoringComment)

  pushHeading(ICS208HM_SECTION_LABELS['decontamination-procedures'])
  pushField('Standard Decontamination Procedures', formatIcs208hmYesNo(form.standardDeconProceduresYesNo))
  pushParagraph(form.decontaminationProceduresComment)

  pushHeading(ICS208HM_SECTION_LABELS['site-communications'])
  pushField('Command Frequency', form.commandFrequency)
  pushField('Tactical Frequency', form.tacticalFrequency)
  pushField('Entry Frequency', form.entryFrequency)

  pushHeading(ICS208HM_SECTION_LABELS['medical-assistance'])
  pushField('Medical Monitoring', formatIcs208hmYesNo(form.medicalMonitoringYesNo))
  pushField(
    'Medical Treatment and Transport In-place',
    formatIcs208hmYesNo(form.medicalTreatmentTransportInPlaceYesNo)
  )
  pushParagraph(form.medicalAssistanceComment)

  pushHeading(ICS208HM_SECTION_LABELS['site-map'])
  pushField('Map Elements', formatIcs208hmSiteMapIncludes(form.siteMapIncludes))
  pushParagraph(form.siteMap)

  pushHeading(ICS208HM_SECTION_LABELS['entry-objectives'])
  pushParagraph(form.entryObjectives)

  pushHeading(ICS208HM_SECTION_LABELS['sop-safe-work-practices'])
  pushField('SOP Modifications', formatIcs208hmYesNo(form.sopModificationsYesNo))
  pushParagraph(form.sopModificationsComment)

  pushHeading(ICS208HM_SECTION_LABELS['emergency-procedures'])
  pushParagraph(form.emergencyProcedures)

  pushHeading(ICS208HM_SECTION_LABELS['safety-briefing'])
  pushField('Asst. Safety Officer - HM Signature', form.asstSafetyOfficerHmSignature)
  pushField('Safety Briefing Completed (Time)', form.safetyBriefingCompletedTime)
  pushField('HM Group Supervisor Signature', form.hmGroupSupervisorSignature)
  pushField('Incident Commander Signature', form.incidentCommanderSignature)

  return blocks
}
