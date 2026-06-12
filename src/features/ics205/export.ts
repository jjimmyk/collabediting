import { ICS205_SECTION_LABELS } from '@/features/ics205/constants'
import type { Ics205FormState } from '@/features/ics205/types'

export type Ics205DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics205DocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics205DocxOptions = {
  header?: {
    cells: Ics205DocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics205DocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics205ExportContext = {
  incidentName?: string
}

export function ics205ExportFilenameBase(form: Ics205FormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-205_${form.id.slice(0, 8)}`
}

function formatOperationalPeriod(form: Ics205FormState): string {
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

export function buildIcs205ExportOptions(
  form: Ics205FormState,
  context: Ics205ExportContext = {}
): Ics205DocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'MARATHON',
        'INCIDENT RADIO COMMUNICATIONS PLAN (ICS 205-CG)',
      ],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName || context.incidentName || '' },
        {
          label: '2. Date/Time Prepared:',
          value: [form.preparedDate, form.preparedTime].filter((part) => part.trim()).join(' '),
        },
        { label: '3. Operational Period:', value: formatOperationalPeriod(form) },
      ],
    },
    footer: {
      topLines: ['Prepared by (Communications Unit Leader):'],
      cells: [
        { label: 'Name:', value: form.preparedByName },
        { label: 'Signature:', value: form.preparedBySignature },
        { label: 'Date/Time:', value: form.preparedByDateTime || new Date().toLocaleString() },
      ],
    },
  }
}

export function buildIcs205DocxBlocks(
  form: Ics205FormState,
  context: Ics205ExportContext = {}
): Ics205DocxBlock[] {
  const blocks: Ics205DocxBlock[] = []
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

  blocks.push({ kind: 'title', text: 'Incident Radio Communications Plan (ICS-205)' })
  const subtitleParts: string[] = []
  if (form.incidentName.trim()) subtitleParts.push(form.incidentName.trim())
  else if (context.incidentName?.trim()) subtitleParts.push(context.incidentName.trim())
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  pushHeading(ICS205_SECTION_LABELS['incident-info'])
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Date Prepared', form.preparedDate)
  pushField('Time Prepared', form.preparedTime)
  pushField('Operational Period Date From', form.operationalPeriodDateFrom)
  pushField('Operational Period Date To', form.operationalPeriodDateTo)
  pushField('Operational Period Time From', form.operationalPeriodTimeFrom)
  pushField('Operational Period Time To', form.operationalPeriodTimeTo)

  pushHeading(ICS205_SECTION_LABELS['basic-radio-channels'])
  if (form.radioChannels.length === 0) {
    pushParagraph('No radio channels recorded.')
  } else {
    form.radioChannels.forEach((row, index) => {
      pushParagraph(`Channel ${index + 1}`)
      pushField('Zone', row.zone)
      pushField('Group', row.group)
      pushField('Ch #', row.channelNumber)
      pushField('Function', row.function)
      pushField('Channel Name/Talkgroup', row.channelNameTalkgroup)
      pushField('Assignment', row.assignment)
      pushField('RX Freq (N/W)', [row.rxFreq, row.rxNw].filter(Boolean).join(' '))
      pushField('RX Tone/NAC', row.rxToneNac)
      pushField('TX Freq (N/W)', [row.txFreq, row.txNw].filter(Boolean).join(' '))
      pushField('TX Tone/NAC', row.txToneNac)
      pushField('Mode', row.mode)
      pushField('Remarks', row.remarks)
    })
  }

  pushHeading(ICS205_SECTION_LABELS['special-instructions'])
  pushParagraph(form.specialInstructions || 'No special instructions recorded.')

  pushHeading(ICS205_SECTION_LABELS['prepared-by'])
  pushField('Prepared By', form.preparedByName)
  pushField('Signature', form.preparedBySignature)
  pushField('Date/Time', form.preparedByDateTime)

  return blocks
}
