import type { Ics202FormState } from '@/features/ics202/types'
import { buildIcs202DocxBlocks } from '@/features/ics202/export'
import type { Ics203FormState } from '@/features/ics203/types'
import { buildIcs203DocxBlocks } from '@/features/ics203/export'
import type { Ics204FormState } from '@/features/ics204/types'
import { buildIcs204DocxBlocks } from '@/features/ics204/export'
import type { Ics205FormState } from '@/features/ics205/types'
import { buildIcs205DocxBlocks } from '@/features/ics205/export'
import type { Ics206FormState } from '@/features/ics206/types'
import { buildIcs206DocxBlocks } from '@/features/ics206/export'
import type { Ics208FormState } from '@/features/ics208/types'
import { buildIcs208DocxBlocks } from '@/features/ics208/export'
import { IAP_SECTION_LABELS } from '@/features/iap/constants'
import type { IapFormChecklistItem, IapFormState } from '@/features/iap/types'

export type IapDocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type IapDocxHeaderFooterCell = {
  label: string
  value?: string
}

export type IapDocxOptions = {
  header?: {
    cells: IapDocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: IapDocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type IapExportContext = {
  incidentName?: string
}

export type IapAppendableForms = {
  ics202?: Ics202FormState | null
  ics203?: Ics203FormState | null
  ics204?: Ics204FormState[] | null
  ics205?: Ics205FormState | null
  ics206?: Ics206FormState | null
  ics208?: Ics208FormState | null
}

export function iapExportFilenameBase(form: IapFormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `IAP_${form.id.slice(0, 8)}`
}

export function buildIapExportOptions(
  form: IapFormState,
  context: IapExportContext = {}
): IapDocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'UNITED STATES COAST GUARD',
        'INCIDENT ACTION PLAN (IAP) COVER SHEET',
      ],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName || context.incidentName || '' },
        { label: '2. Incident Location:', value: form.incidentLocation },
        {
          label: '3. Operational Period:',
          value: [form.operationalPeriodFrom, form.operationalPeriodTo]
            .filter((part) => part.trim().length > 0)
            .join(' – '),
        },
      ],
    },
  }
}

function checklistLabel(item: IapFormChecklistItem): string {
  if (item.id.startsWith('other-') && item.customLabel?.trim()) {
    return item.customLabel.trim()
  }
  return item.label
}

function appendChecklistFormBlocks(
  blocks: IapDocxBlock[],
  item: IapFormChecklistItem,
  appendableForms: IapAppendableForms,
  context: IapExportContext
) {
  const label = checklistLabel(item)
  blocks.push({ kind: 'heading', text: label })

  switch (item.id) {
    case 'ics-202':
      if (appendableForms.ics202) {
        blocks.push(...buildIcs202DocxBlocks(appendableForms.ics202, context))
      } else {
        blocks.push({ kind: 'paragraph', text: '(ICS 202-CG not available in this workspace.)' })
      }
      break
    case 'ics-203':
      if (appendableForms.ics203) {
        blocks.push(...buildIcs203DocxBlocks(appendableForms.ics203, context))
      } else {
        blocks.push({ kind: 'paragraph', text: '(ICS 203-CG not available in this workspace.)' })
      }
      break
    case 'ics-204':
      if (appendableForms.ics204?.length) {
        appendableForms.ics204.forEach((form204, index) => {
          if (appendableForms.ics204!.length > 1) {
            blocks.push({ kind: 'subtitle', text: `ICS 204-CG ${index + 1}` })
          }
          blocks.push(...buildIcs204DocxBlocks(form204, context))
        })
      } else {
        blocks.push({ kind: 'paragraph', text: '(ICS 204-CG not available in this workspace.)' })
      }
      break
    case 'ics-205':
      if (appendableForms.ics205) {
        blocks.push(...buildIcs205DocxBlocks(appendableForms.ics205, context))
      } else {
        blocks.push({ kind: 'paragraph', text: '(ICS 205-CG not available in this workspace.)' })
      }
      break
    case 'ics-206':
      if (appendableForms.ics206) {
        blocks.push(...buildIcs206DocxBlocks(appendableForms.ics206, context))
      } else {
        blocks.push({ kind: 'paragraph', text: '(ICS 206-CG not available in this workspace.)' })
      }
      break
    case 'ics-207':
      blocks.push({
        kind: 'paragraph',
        text: '(ICS 207-CG Organization Chart — attach separately when available.)',
      })
      break
    case 'ics-208':
      if (appendableForms.ics208) {
        blocks.push(...buildIcs208DocxBlocks(appendableForms.ics208, context))
      } else {
        blocks.push({ kind: 'paragraph', text: '(ICS 208-CG not available in this workspace.)' })
      }
      break
    case 'map-chart':
      blocks.push({
        kind: 'paragraph',
        text: '(Map / Chart attachment — include operational map or chart when available.)',
      })
      break
    case 'weather':
      blocks.push({
        kind: 'paragraph',
        text: '(Weather Forecast / Tides / Currents — include forecast data when available.)',
      })
      break
    default:
      blocks.push({
        kind: 'paragraph',
        text: label.trim().length > 0 ? label : '(Other attachment.)',
      })
      break
  }
}

export function buildIapDocxBlocks(
  form: IapFormState,
  context: IapExportContext = {},
  appendableForms: IapAppendableForms = {}
): IapDocxBlock[] {
  const blocks: IapDocxBlock[] = []
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

  blocks.push({ kind: 'title', text: 'Incident Action Plan (IAP) Cover Sheet' })
  const subtitleParts: string[] = []
  if (form.incidentName.trim()) subtitleParts.push(form.incidentName.trim())
  else if (context.incidentName?.trim()) subtitleParts.push(context.incidentName.trim())
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  blocks.push({ kind: 'heading', text: IAP_SECTION_LABELS['cover-sheet'] })
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Incident Location', form.incidentLocation)
  pushField('Operational Period From', form.operationalPeriodFrom)
  pushField('Operational Period To', form.operationalPeriodTo)

  blocks.push({ kind: 'heading', text: IAP_SECTION_LABELS['incident-commanders'] })
  if (form.incidentCommanders.length === 0) {
    pushParagraph('No incident commanders recorded.')
  } else {
    form.incidentCommanders.forEach((row, index) => {
      const signedLabel = row.signedAt
        ? `Signed ${new Date(row.signedAt).toLocaleString()}`
        : 'Not signed'
      pushParagraph(
        `${index + 1}. ${row.organization || '(Organization)'} — ${row.name || '(Name)'} (${signedLabel})`
      )
    })
  }

  blocks.push({ kind: 'heading', text: IAP_SECTION_LABELS['forms-checklist'] })
  pushParagraph('The items checked below are included in this Incident Action Plan:')
  const includedItems = form.formsChecklist.filter((item) => item.included)
  if (includedItems.length === 0) {
    pushParagraph('No forms selected for inclusion.')
  } else {
    includedItems.forEach((item) => {
      blocks.push({ kind: 'bullet', text: `☑ ${checklistLabel(item)}` })
    })
  }

  if (includedItems.length > 0) {
    blocks.push({ kind: 'heading', text: 'Included Forms and Attachments' })
    includedItems.forEach((item) => {
      appendChecklistFormBlocks(blocks, item, appendableForms, context)
    })
  }

  return blocks
}
