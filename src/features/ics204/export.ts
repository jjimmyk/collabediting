import {
  buildIcs204ExportLayout,
  type Ics204ExportContext,
  type Ics204ExportLayoutBlock,
  ICS204_FORM_TITLE_LINES,
  ics204ExportFilenameBase,
} from '@/features/ics204/export-layout'
import {
  downloadIcs204Docx,
  downloadIcs204Pdf,
  paginateIcs204Export,
} from '@/features/ics204/export-download'
import type { Ics204PhysicalPage } from '@/features/ics204/export-pagination'
import type { Ics204FormState } from '@/features/ics204/types'
import type { Ics201VersionSignature } from '@/features/ics201/types'

export type { Ics204ExportContext, Ics204ExportLayoutBlock } from '@/features/ics204/export-layout'
export type { Ics204PhysicalPage } from '@/features/ics204/export-pagination'
export {
  buildIcs204ExportLayout,
  buildIcs204AssignedLocationFields,
  buildIcs204SignatureFooter,
  ics204ExportFilenameBase,
  ICS204_FORM_TITLE_LINES,
  serializeIcs204WorkAssignments,
} from '@/features/ics204/export-layout'
export { downloadIcs204Docx, downloadIcs204Pdf, paginateIcs204Export } from '@/features/ics204/export-download'
export {
  downloadIcs204TemplatePdf,
  fillIcs204TemplatePdf,
  paginateIcs204TemplateExport,
} from '@/features/ics204/export-template-pdf'

/** Flat blocks for IAP bundle export and legacy consumers. */
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

export type Ics204ExportContextLegacy = Ics204ExportContext

function pushParagraphLines(blocks: Ics204DocxBlock[], text: string) {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    blocks.push({ kind: 'paragraph', text: ' ' })
    return
  }
  for (const line of trimmed.split(/\r?\n/)) {
    blocks.push({ kind: 'paragraph', text: line.length > 0 ? line : ' ' })
  }
}

export function buildIcs204DocxBlocks(
  form: Ics204FormState,
  context: Ics204ExportContext = {},
  signatures: Ics201VersionSignature[] = []
): Ics204DocxBlock[] {
  const blocks: Ics204DocxBlock[] = [
    { kind: 'title', text: ICS204_FORM_TITLE_LINES[ICS204_FORM_TITLE_LINES.length - 1] },
  ]
  if (context.incidentName?.trim()) {
    blocks.push({ kind: 'subtitle', text: context.incidentName.trim() })
  }

  for (const block of buildIcs204ExportLayout(form, context, signatures)) {
    switch (block.kind) {
      case 'header-row':
        blocks.push({ kind: 'heading', text: 'Incident Information' })
        block.cells.forEach((cell) => {
          blocks.push({ kind: 'paragraph', text: `${cell.label} ${cell.value || ' '}` })
        })
        break
      case 'personnel-table':
        blocks.push({ kind: 'heading', text: block.label })
        block.rows.forEach((row) => {
          blocks.push({
            kind: 'paragraph',
            text: `${row.position}: ${row.name || ' '} — ${row.contact || ' '}`,
          })
        })
        break
      case 'resources-table':
        blocks.push({ kind: 'heading', text: block.label })
        if (block.rows.length === 0) {
          blocks.push({ kind: 'paragraph', text: ' ' })
        } else {
          block.rows.forEach((row) => {
            blocks.push({
              kind: 'bullet',
              text: `${row.resourceIdentifier || ' '} · ${row.leader || ' '} · ${row.personCount || ' '} · ${row.has204A ? '[X]' : '[ ]'}`,
            })
          })
        }
        break
      case 'text-box':
        blocks.push({ kind: 'heading', text: block.label })
        pushParagraphLines(blocks, block.body)
        break
      case 'communications':
        blocks.push({ kind: 'heading', text: block.label })
        block.rows.forEach((row) => {
          blocks.push({
            kind: 'paragraph',
            text: `${row.nameFunction}: ${row.contactInformation}`,
          })
        })
        if (block.emergency.trim()) {
          blocks.push({ kind: 'heading', text: 'Emergency Communications:' })
          pushParagraphLines(blocks, block.emergency)
        }
        break
      case 'signature-footer':
        blocks.push({ kind: 'heading', text: block.footer.preparedBy.label })
        blocks.push({
          kind: 'paragraph',
          text: `${block.footer.preparedBy.name || ' '} · ${block.footer.preparedBy.dateTime || ' '}`,
        })
        break
      default:
        break
    }
  }

  return blocks
}

/** @deprecated Boxed export no longer uses header/footer options. */
export function buildIcs204ExportOptions(
  form: Ics204FormState,
  context: Ics204ExportContext = {}
) {
  void form
  void context
  return {}
}
