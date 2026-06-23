import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import {
  ICS215_TEMPLATE_FORM_PAGE_INDEX,
  ICS215_TEMPLATE_URL,
} from '@/features/ics215/export-template-constants'
import {
  ics215TemplateAssignmentField,
  ics215TemplateHeaderField,
  ics215TemplateKorHeaderField,
  ics215TemplateResourceField,
  ics215TemplateTotalsField,
  listIcs215TemplateFormFieldNames,
  type Ics215TemplateRhnField,
} from '@/features/ics215/export-template-fields'
import {
  assertIcs215TemplatePaginationInvariants,
  buildIcs215TemplateHeaderValues,
  paginateIcs215TemplateExport,
  type Ics215TemplatePagePlan,
} from '@/features/ics215/export-template-pagination'
import type { Ics215ExportContext } from '@/features/ics215/export-layout'
import type { Ics215FormState, Ics215ResourceValue } from '@/features/ics215/types'
import {
  drawTextInWidgetRect,
  getPdfTextFieldWidgetRect,
  type PdfWidgetRect,
} from '@/lib/pdf-template-utils'

const RHN_FIELDS: Ics215TemplateRhnField[] = ['required', 'have', 'need']

function clean(value: string | undefined | null): string {
  return (value ?? '').trim()
}

function resolveNeedValue(value: Ics215ResourceValue): string {
  const need = clean(value.need)
  if (need.length > 0) return need
  const required = Number.parseFloat(value.required)
  const have = Number.parseFloat(value.have)
  if (Number.isFinite(required) && Number.isFinite(have)) {
    const diff = required - have
    if (Number.isFinite(diff)) return String(diff)
  }
  return ''
}

function cacheTemplateFieldRects(
  pdfForm: ReturnType<PDFDocument['getForm']>
): Map<string, PdfWidgetRect> {
  const rects = new Map<string, PdfWidgetRect>()
  for (const name of listIcs215TemplateFormFieldNames()) {
    const rect = getPdfTextFieldWidgetRect(pdfForm, name)
    if (rect) rects.set(name, rect)
  }
  return rects
}

function fillFieldOnPage(
  page: PDFPage,
  font: PDFFont,
  rects: Map<string, PdfWidgetRect>,
  fieldName: string | undefined,
  value: string,
  fontSize = 8
): void {
  if (!fieldName) return
  const rect = rects.get(fieldName)
  if (!rect) return
  drawTextInWidgetRect(page, font, rect, value, { fontSize, maskBackground: true })
}

function fillFormPagePlan(
  page: PDFPage,
  font: PDFFont,
  rects: Map<string, PdfWidgetRect>,
  plan: Ics215TemplatePagePlan,
  header: ReturnType<typeof buildIcs215TemplateHeaderValues>
): void {
  fillFieldOnPage(page, font, rects, ics215TemplateHeaderField('incidentName'), header.incidentName)
  fillFieldOnPage(
    page,
    font,
    rects,
    ics215TemplateHeaderField('incidentLocation'),
    header.incidentLocation
  )
  fillFieldOnPage(page, font, rects, ics215TemplateHeaderField('datePrepared'), header.datePrepared, 7)
  fillFieldOnPage(page, font, rects, ics215TemplateHeaderField('opFrom'), header.opFrom, 7)
  fillFieldOnPage(page, font, rects, ics215TemplateHeaderField('opTo'), header.opTo, 7)
  fillFieldOnPage(
    page,
    font,
    rects,
    ics215TemplateHeaderField('pageNumber'),
    String(plan.pageNumber),
    8
  )
  fillFieldOnPage(
    page,
    font,
    rects,
    ics215TemplateHeaderField('pageTotal'),
    String(plan.totalPages),
    8
  )

  plan.assignmentRows.forEach((row, index) => {
    const slot = index + 1
    fillFieldOnPage(page, font, rects, ics215TemplateAssignmentField('assignee', slot), row.assignee)
    fillFieldOnPage(
      page,
      font,
      rects,
      ics215TemplateAssignmentField('workAssignment', slot),
      row.workAssignment
    )
    fillFieldOnPage(
      page,
      font,
      rects,
      ics215TemplateAssignmentField('overhead', slot),
      row.overheadPositions
    )
    fillFieldOnPage(
      page,
      font,
      rects,
      ics215TemplateAssignmentField('specialEquipment', slot),
      row.specialEquipmentSupplies
    )
    fillFieldOnPage(
      page,
      font,
      rects,
      ics215TemplateAssignmentField('reportingLocation', slot),
      row.reportingLocation
    )
    fillFieldOnPage(
      page,
      font,
      rects,
      ics215TemplateAssignmentField('arrivalTime', slot),
      row.requestedArrivalTime,
      7
    )

    plan.resourceColumns.forEach((column, resourceIndex) => {
      const resourceSlot = resourceIndex + 1
      const values = row.resourceValues[column.id] ?? { required: '', have: '', need: '' }
      fillFieldOnPage(
        page,
        font,
        rects,
        ics215TemplateResourceField('required', slot, resourceSlot),
        clean(values.required),
        7
      )
      fillFieldOnPage(
        page,
        font,
        rects,
        ics215TemplateResourceField('have', slot, resourceSlot),
        clean(values.have),
        7
      )
      fillFieldOnPage(
        page,
        font,
        rects,
        ics215TemplateResourceField('need', slot, resourceSlot),
        resolveNeedValue(values),
        7
      )
    })
  })

  plan.resourceColumns.forEach((column, resourceIndex) => {
    const resourceSlot = resourceIndex + 1
    fillFieldOnPage(
      page,
      font,
      rects,
      ics215TemplateKorHeaderField(resourceSlot),
      column.label,
      7
    )
  })

  if (plan.showTotals) {
    plan.resourceColumns.forEach((column, resourceIndex) => {
      const resourceSlot = resourceIndex + 1
      const totals = plan.columnTotals[column.id]
      if (!totals) return
      for (const rhn of RHN_FIELDS) {
        const value = rhn === 'need' ? resolveNeedValue(totals) : clean(totals[rhn])
        fillFieldOnPage(
          page,
          font,
          rects,
          ics215TemplateTotalsField(rhn, resourceSlot),
          value,
          7
        )
      }
    })
    fillFieldOnPage(
      page,
      font,
      rects,
      ics215TemplateHeaderField('preparedBy'),
      header.preparedBy
    )
  }
}

async function buildFilledTemplatePdf(
  templateBytes: ArrayBuffer | Uint8Array,
  form: Ics215FormState,
  context: Ics215ExportContext
): Promise<Uint8Array> {
  const template = await PDFDocument.load(templateBytes)
  const output = await PDFDocument.create()
  const templateForm = template.getForm()
  const fieldRects = cacheTemplateFieldRects(templateForm)
  const font = await output.embedFont(StandardFonts.Helvetica)
  const header = buildIcs215TemplateHeaderValues(form, context)
  const pages = paginateIcs215TemplateExport(form, context)
  assertIcs215TemplatePaginationInvariants(pages)

  for (const plan of pages) {
    const [copiedPage] = await output.copyPages(template, [ICS215_TEMPLATE_FORM_PAGE_INDEX])
    output.addPage(copiedPage)
    fillFormPagePlan(copiedPage, font, fieldRects, plan, header)
  }

  return output.save({ updateFieldAppearances: false })
}

export async function loadIcs215TemplateBytes(): Promise<ArrayBuffer> {
  const response = await fetch(ICS215_TEMPLATE_URL)
  if (!response.ok) {
    throw new Error(`Unable to load ICS-215 template (${response.status})`)
  }
  return response.arrayBuffer()
}

export async function fillIcs215TemplatePdf(
  form: Ics215FormState,
  context: Ics215ExportContext = {}
): Promise<Uint8Array> {
  const templateBytes = await loadIcs215TemplateBytes()
  return buildFilledTemplatePdf(templateBytes, form, context)
}

export async function fillIcs215TemplatePdfFromBytes(
  templateBytes: ArrayBuffer | Uint8Array,
  form: Ics215FormState,
  context: Ics215ExportContext = {}
): Promise<Uint8Array> {
  return buildFilledTemplatePdf(templateBytes, form, context)
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function downloadIcs215TemplatePdf(
  filename: string,
  form: Ics215FormState,
  context: Ics215ExportContext = {}
): Promise<void> {
  const bytes = await fillIcs215TemplatePdf(form, context)
  triggerBlobDownload(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), filename)
}

export {
  assertIcs215TemplatePaginationInvariants,
  paginateIcs215TemplateExport,
  type Ics215TemplatePagePlan,
} from '@/features/ics215/export-template-pagination'
