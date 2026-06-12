import { ICS206_SECTION_LABELS } from '@/features/ics206/constants'
import type { Ics206FormState } from '@/features/ics206/types'
import { formatIcs206YesNo } from '@/features/ics206/utils'

export type Ics206DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics206DocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics206DocxOptions = {
  header?: {
    cells: Ics206DocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics206DocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics206ExportContext = {
  incidentName?: string
}

export function ics206ExportFilenameBase(form: Ics206FormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-206_${form.id.slice(0, 8)}`
}

function formatOperationalPeriod(form: Ics206FormState): string {
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

export function buildIcs206ExportOptions(
  form: Ics206FormState,
  context: Ics206ExportContext = {}
): Ics206DocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'MARATHON',
        'MEDICAL PLAN (ICS 206)',
      ],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName || context.incidentName || '' },
        { label: '2. Operational Period:', value: formatOperationalPeriod(form) },
      ],
    },
    footer: {
      topLines: ['Prepared by (Medical Unit Leader):', 'Approved by (Safety Officer):'],
      cells: [
        { label: 'Prepared Name:', value: form.preparedByName },
        { label: 'Prepared Signature:', value: form.preparedBySignature },
        { label: 'Prepared Date/Time:', value: form.preparedByDateTime },
        { label: 'Approved Name:', value: form.approvedByName },
        { label: 'Approved Signature:', value: form.approvedBySignature },
        { label: 'Approved Date/Time:', value: form.approvedByDateTime },
      ],
    },
  }
}

export function buildIcs206DocxBlocks(
  form: Ics206FormState,
  context: Ics206ExportContext = {}
): Ics206DocxBlock[] {
  const blocks: Ics206DocxBlock[] = []
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

  blocks.push({ kind: 'title', text: 'Medical Plan (ICS-206)' })
  const subtitleParts: string[] = []
  if (form.incidentName.trim()) subtitleParts.push(form.incidentName.trim())
  else if (context.incidentName?.trim()) subtitleParts.push(context.incidentName.trim())
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  pushHeading(ICS206_SECTION_LABELS['incident-info'])
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Operational Period Date From', form.operationalPeriodDateFrom)
  pushField('Operational Period Date To', form.operationalPeriodDateTo)
  pushField('Operational Period Time From', form.operationalPeriodTimeFrom)
  pushField('Operational Period Time To', form.operationalPeriodTimeTo)

  pushHeading(ICS206_SECTION_LABELS['medical-aid-stations'])
  const filledStations = form.medicalAidStations.filter(
    (row) =>
      row.name.trim() ||
      row.location.trim() ||
      row.contactNumbersFrequency.trim() ||
      row.paramedicsOnSite
  )
  if (filledStations.length === 0) {
    pushParagraph('No medical aid stations recorded.')
  } else {
    filledStations.forEach((row, index) => {
      pushParagraph(`Medical Aid Station ${index + 1}`)
      pushField('Name', row.name)
      pushField('Location', row.location)
      pushField('Contact Number(s)/Frequency', row.contactNumbersFrequency)
      pushField('Paramedics on Site', formatIcs206YesNo(row.paramedicsOnSite))
    })
  }

  pushHeading(ICS206_SECTION_LABELS.transportation)
  const filledTransport = form.transportation.filter(
    (row) =>
      row.ambulanceService.trim() ||
      row.location.trim() ||
      row.contactNumbersFrequency.trim() ||
      row.levelOfService
  )
  if (filledTransport.length === 0) {
    pushParagraph('No transportation services recorded.')
  } else {
    filledTransport.forEach((row, index) => {
      pushParagraph(`Transportation ${index + 1}`)
      pushField('Ambulance Service', row.ambulanceService)
      pushField('Location', row.location)
      pushField('Contact Number(s)/Frequency', row.contactNumbersFrequency)
      pushField('Level of Service', row.levelOfService)
    })
  }

  pushHeading(ICS206_SECTION_LABELS.hospitals)
  const filledHospitals = form.hospitals.filter(
    (row) =>
      row.hospitalName.trim() ||
      row.addressLatLong.trim() ||
      row.contactNumbersFrequency.trim() ||
      row.travelTimeAir.trim() ||
      row.travelTimeGround.trim()
  )
  if (filledHospitals.length === 0) {
    pushParagraph('No hospitals recorded.')
  } else {
    filledHospitals.forEach((row, index) => {
      pushParagraph(`Hospital ${index + 1}`)
      pushField('Hospital Name', row.hospitalName)
      pushField('Address, Latitude & Longitude', row.addressLatLong)
      pushField('Contact Number(s)/Frequency', row.contactNumbersFrequency)
      pushField('Travel Time (Air)', row.travelTimeAir)
      pushField('Travel Time (Ground)', row.travelTimeGround)
      pushField('Trauma Center', formatIcs206YesNo(row.traumaCenterYes))
      pushField('Trauma Center Level', row.traumaCenterLevel)
      pushField('Burn Center', formatIcs206YesNo(row.burnCenterYes))
      pushField('Helipad', formatIcs206YesNo(row.helipadYes))
    })
  }

  pushHeading(ICS206_SECTION_LABELS['special-medical-emergency-procedures'])
  pushParagraph(form.specialMedicalEmergencyProcedures || 'No special medical emergency procedures recorded.')
  pushField(
    'Aviation assets utilized for rescue',
    form.aviationAssetsUtilized ? 'Yes — coordinate with Air Operations' : 'No'
  )

  pushHeading(ICS206_SECTION_LABELS['prepared-by'])
  pushField('Prepared By', form.preparedByName)
  pushField('Signature', form.preparedBySignature)
  pushField('Date/Time', form.preparedByDateTime)

  pushHeading(ICS206_SECTION_LABELS['approved-by'])
  pushField('Approved By', form.approvedByName)
  pushField('Signature', form.approvedBySignature)
  pushField('Date/Time', form.approvedByDateTime)

  return blocks
}
