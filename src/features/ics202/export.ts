import { buildIcs202ExportLayout, type Ics202ExportContext } from '@/features/ics202/export-layout'
import type { Ics202FormState } from '@/features/ics202/types'

export type { Ics202ExportContext, Ics202ExportLayoutBlock } from '@/features/ics202/export-layout'
export { buildIcs202ExportLayout, ics202ExportFilenameBase, ICS202_FORM_TITLE_LINES } from '@/features/ics202/export-layout'
export { downloadIcs202Docx, downloadIcs202Pdf } from '@/features/ics202/export-download'

/** Flat blocks for IAP bundle export and legacy consumers. */
export type Ics202DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

function pushParagraphLines(blocks: Ics202DocxBlock[], text: string) {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    blocks.push({ kind: 'paragraph', text: ' ' })
    return
  }
  for (const line of trimmed.split(/\r?\n/)) {
    blocks.push({ kind: 'paragraph', text: line.length > 0 ? line : ' ' })
  }
}

export function buildIcs202DocxBlocks(
  form: Ics202FormState,
  context: Ics202ExportContext = {}
): Ics202DocxBlock[] {
  const blocks: Ics202DocxBlock[] = [
    { kind: 'title', text: 'INCIDENT BRIEFING (ICS 202-CG)' },
  ]
  const incidentName = form.incidentName.trim() || context.incidentName?.trim() || ''
  if (incidentName) {
    blocks.push({ kind: 'subtitle', text: incidentName })
  }

  for (const block of buildIcs202ExportLayout(form, context)) {
    switch (block.kind) {
      case 'form-title':
        break
      case 'header-row':
        blocks.push({ kind: 'heading', text: 'Incident Information' })
        block.cells.forEach((cell) => {
          blocks.push({ kind: 'paragraph', text: `${cell.label} ${cell.value || ' '}` })
        })
        break
      case 'lifelines':
        blocks.push({ kind: 'heading', text: block.label })
        block.options.forEach((opt) => {
          blocks.push({
            kind: 'bullet',
            text: `${opt.checked ? '[X]' : '[ ]'} ${opt.label}`,
          })
        })
        break
      case 'text-box':
        blocks.push({ kind: 'heading', text: block.label })
        pushParagraphLines(blocks, block.body)
        break
      case 'objectives':
        blocks.push({ kind: 'heading', text: block.label })
        if (block.rows.length === 0) {
          blocks.push({ kind: 'paragraph', text: ' ' })
        } else {
          block.rows.forEach((row) => {
            const prefix = [row.kind, row.label].filter(Boolean).join(' ')
            pushParagraphLines(blocks, prefix ? `${prefix}  ${row.objective}` : row.objective)
          })
        }
        break
      case 'site-safety-plan':
        blocks.push({
          kind: 'heading',
          text: '8. Site Safety Plan Required / 9. Site Safety Plan located at',
        })
        blocks.push({
          kind: 'paragraph',
          text: `Required: ${block.required ? 'Yes' : 'No'}`,
        })
        pushParagraphLines(blocks, block.location)
        break
      case 'prepared-by':
        blocks.push({ kind: 'heading', text: block.label })
        blocks.push({ kind: 'paragraph', text: `Name: ${block.fields.name || ' '}` })
        blocks.push({
          kind: 'paragraph',
          text: `Position Title: ${block.fields.positionTitle || ' '}`,
        })
        blocks.push({ kind: 'paragraph', text: `Signature: ${block.fields.signature || ' '}` })
        blocks.push({ kind: 'paragraph', text: `Date/Time: ${block.fields.dateTime || ' '}` })
        break
      case 'page-footer':
        blocks.push({ kind: 'subtitle', text: block.pageLabel })
        break
      case 'page-break':
        blocks.push({ kind: 'subtitle', text: '—' })
        break
      default:
        break
    }
  }

  return blocks
}

/** @deprecated Boxed export no longer uses header/footer options. */
export function buildIcs202ExportOptions(
  form: Ics202FormState,
  context: Ics202ExportContext = {}
) {
  void form
  void context
  return {}
}
