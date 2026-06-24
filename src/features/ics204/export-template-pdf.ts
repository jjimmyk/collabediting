import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import {
  ICS204_TEMPLATE_FORM_PAGE_INDEX,
  ICS204_TEMPLATE_URL,
} from '@/features/ics204/export-template-constants'
import {
  ics204TemplateCommunicationRowField,
  ics204TemplateEmergencyField,
  ics204TemplateHeaderField,
  ics204TemplateLargeTextField,
  ics204TemplateLargeTextRect,
  ics204TemplatePersonnelField,
  ics204TemplateResourceRowField,
  ics204TemplateSignatureField,
  listIcs204TemplateFormFieldNames,
} from '@/features/ics204/export-template-fields'
import type { Ics204ExportContext } from '@/features/ics204/export-layout'
import {
  assertIcs204TemplatePaginationInvariants,
  paginateIcs204TemplateExport,
  type Ics204TemplatePagePlan,
} from '@/features/ics204/export-template-pagination'
import type { Ics204FormState } from '@/features/ics204/types'
import type { Ics201VersionSignature } from '@/features/ics201/types'
import {
  drawTextInWidgetRect,
  getPdfTextFieldWidgetRect,
  type PdfWidgetRect,
} from '@/lib/pdf-template-utils'

function withContinuedPrefix(text: string, continued: boolean): string {
  const trimmed = text.trim()
  if (!continued || trimmed.length === 0) return trimmed
  return `(Continued)\n${trimmed}`
}

function cacheTemplateFieldRects(
  pdfForm: ReturnType<PDFDocument['getForm']>
): Map<string, PdfWidgetRect> {
  const rects = new Map<string, PdfWidgetRect>()
  for (const name of listIcs204TemplateFormFieldNames()) {
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
  options: { fontSize?: number; lineHeight?: number } = {}
): void {
  if (!fieldName) return
  const rect = rects.get(fieldName)
  if (!rect) return
  drawTextInWidgetRect(page, font, rect, value, {
    fontSize: options.fontSize ?? 8,
    lineHeight: options.lineHeight ?? 10,
    maskBackground: true,
  })
}

function fillCheckboxOnPage(
  pdfForm: ReturnType<PDFDocument['getForm']>,
  fieldName: string | undefined,
  checked: boolean
): void {
  if (!fieldName || !checked) return
  try {
    pdfForm.getCheckBox(fieldName).check()
  } catch {
    // Missing or non-checkbox widget.
  }
}

function fillHeader(page: PDFPage, font: PDFFont, rects: Map<string, PdfWidgetRect>, plan: Ics204TemplatePagePlan) {
  fillFieldOnPage(page, font, rects, ics204TemplateHeaderField('incidentName'), plan.header.incidentName)
  fillFieldOnPage(
    page,
    font,
    rects,
    ics204TemplateHeaderField('operationalPeriodFrom'),
    plan.header.operationalPeriodFrom,
    { fontSize: 7 }
  )
  fillFieldOnPage(
    page,
    font,
    rects,
    ics204TemplateHeaderField('operationalPeriodTo'),
    plan.header.operationalPeriodTo,
    { fontSize: 7 }
  )
  fillFieldOnPage(page, font, rects, ics204TemplateHeaderField('branch'), plan.header.branch, { fontSize: 7 })
  fillFieldOnPage(page, font, rects, ics204TemplateHeaderField('division'), plan.header.division, {
    fontSize: 7,
  })
  fillFieldOnPage(page, font, rects, ics204TemplateHeaderField('group'), plan.header.group, { fontSize: 7 })
  fillFieldOnPage(
    page,
    font,
    rects,
    ics204TemplateHeaderField('stagingArea'),
    plan.header.stagingArea,
    { fontSize: 7 }
  )
  fillFieldOnPage(
    page,
    font,
    rects,
    ics204TemplateHeaderField('pageNumber'),
    String(plan.pageNumber),
    { fontSize: 7 }
  )
  fillFieldOnPage(
    page,
    font,
    rects,
    ics204TemplateHeaderField('pageTotal'),
    String(plan.totalPages),
    { fontSize: 7 }
  )
}

function fillPersonnel(page: PDFPage, font: PDFFont, rects: Map<string, PdfWidgetRect>, plan: Ics204TemplatePagePlan) {
  if (!plan.showPersonnel) return
  const roles = [
    ['sectionChief', plan.personnel.sectionChief],
    ['branchDirector', plan.personnel.branchDirector],
    ['divisionGroupSupervisor', plan.personnel.divisionGroupSupervisor],
  ] as const
  for (const [role, values] of roles) {
    fillFieldOnPage(
      page,
      font,
      rects,
      ics204TemplatePersonnelField(role, 'name'),
      values.name,
      { fontSize: 7 }
    )
    fillFieldOnPage(
      page,
      font,
      rects,
      ics204TemplatePersonnelField(role, 'contact'),
      values.contact,
      { fontSize: 7 }
    )
  }
}

function fillResourceRows(
  page: PDFPage,
  font: PDFFont,
  rects: Map<string, PdfWidgetRect>,
  pdfForm: ReturnType<PDFDocument['getForm']>,
  plan: Ics204TemplatePagePlan
) {
  plan.resourceRows.forEach((row, index) => {
    const slot = index + 1
    fillFieldOnPage(
      page,
      font,
      rects,
      ics204TemplateResourceRowField('resourceIdentifier', slot),
      row.resourceIdentifier,
      { fontSize: 7 }
    )
    fillFieldOnPage(page, font, rects, ics204TemplateResourceRowField('leader', slot), row.leader, {
      fontSize: 7,
    })
    fillFieldOnPage(
      page,
      font,
      rects,
      ics204TemplateResourceRowField('personCount', slot),
      row.personCount,
      { fontSize: 7 }
    )
    fillFieldOnPage(
      page,
      font,
      rects,
      ics204TemplateResourceRowField('contactInformation', slot),
      row.contactInformation,
      { fontSize: 7 }
    )
    fillFieldOnPage(
      page,
      font,
      rects,
      ics204TemplateResourceRowField('reportingInfoNotes', slot),
      row.reportingInfoNotes,
      { fontSize: 7 }
    )
    fillCheckboxOnPage(pdfForm, ics204TemplateResourceRowField('has204A', slot), row.has204A)
  })
}

function fillLargeTextFields(page: PDFPage, font: PDFFont, rects: Map<string, PdfWidgetRect>, plan: Ics204TemplatePagePlan) {
  const workRect = ics204TemplateLargeTextRect('workAssignments')
  fillFieldOnPage(
    page,
    font,
    rects,
    ics204TemplateLargeTextField('workAssignments'),
    withContinuedPrefix(plan.workAssignmentsText, plan.workAssignmentsContinued),
    { fontSize: workRect.fontSize, lineHeight: workRect.lineHeight }
  )
  const specialRect = ics204TemplateLargeTextRect('specialInstructions')
  fillFieldOnPage(
    page,
    font,
    rects,
    ics204TemplateLargeTextField('specialInstructions'),
    withContinuedPrefix(plan.specialInstructionsText, plan.specialInstructionsContinued),
    { fontSize: specialRect.fontSize, lineHeight: specialRect.lineHeight }
  )
}

function fillCommunications(page: PDFPage, font: PDFFont, rects: Map<string, PdfWidgetRect>, plan: Ics204TemplatePagePlan) {
  plan.communicationRows.forEach((row, index) => {
    const slot = index + 1
    fillFieldOnPage(
      page,
      font,
      rects,
      ics204TemplateCommunicationRowField('nameFunction', slot),
      row.nameFunction,
      { fontSize: 7 }
    )
    fillFieldOnPage(
      page,
      font,
      rects,
      ics204TemplateCommunicationRowField('contactInformation', slot),
      row.contactInformation,
      { fontSize: 7 }
    )
  })

  if (plan.showEmergency) {
    fillFieldOnPage(page, font, rects, ics204TemplateEmergencyField('medical'), plan.emergency.medical, {
      fontSize: 7,
    })
    fillFieldOnPage(
      page,
      font,
      rects,
      ics204TemplateEmergencyField('evacuation'),
      plan.emergency.evacuation,
      { fontSize: 7 }
    )
    fillFieldOnPage(page, font, rects, ics204TemplateEmergencyField('other'), plan.emergency.other, {
      fontSize: 7,
    })
  }
}

function splitSignatureDateTime(dateTime: string): { text: string; date: string } {
  const trimmed = dateTime.trim()
  if (!trimmed) return { text: '', date: '' }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return { text: trimmed, date: '' }
  }
  return {
    text: trimmed,
    date: parsed.toLocaleDateString(),
  }
}

function fillSignatures(page: PDFPage, font: PDFFont, rects: Map<string, PdfWidgetRect>, plan: Ics204TemplatePagePlan) {
  if (!plan.showSignatures) return
  const { preparedBy, reviewedPsc, reviewedOsc } = plan.signatureFooter
  const prepared = splitSignatureDateTime(preparedBy.dateTime)
  const psc = splitSignatureDateTime(reviewedPsc.dateTime)
  const osc = splitSignatureDateTime(reviewedOsc.dateTime)

  fillFieldOnPage(
    page,
    font,
    rects,
    ics204TemplateSignatureField('preparedByDateTime'),
    [preparedBy.name, prepared.text].filter(Boolean).join(' — '),
    { fontSize: 7 }
  )
  fillFieldOnPage(page, font, rects, ics204TemplateSignatureField('preparedByDate'), prepared.date, {
    fontSize: 7,
  })
  fillFieldOnPage(
    page,
    font,
    rects,
    ics204TemplateSignatureField('reviewedPscDateTime'),
    [reviewedPsc.name, psc.text].filter(Boolean).join(' — '),
    { fontSize: 7 }
  )
  fillFieldOnPage(page, font, rects, ics204TemplateSignatureField('reviewedPscDate'), psc.date, {
    fontSize: 7,
  })
  fillFieldOnPage(
    page,
    font,
    rects,
    ics204TemplateSignatureField('reviewedOscDateTime'),
    [reviewedOsc.name, osc.text].filter(Boolean).join(' — '),
    { fontSize: 7 }
  )
  fillFieldOnPage(page, font, rects, ics204TemplateSignatureField('reviewedOscDate'), osc.date, {
    fontSize: 7,
  })
}

function fillFormPagePlan(
  page: PDFPage,
  font: PDFFont,
  rects: Map<string, PdfWidgetRect>,
  pdfForm: ReturnType<PDFDocument['getForm']>,
  plan: Ics204TemplatePagePlan
): void {
  fillHeader(page, font, rects, plan)
  fillPersonnel(page, font, rects, plan)
  fillResourceRows(page, font, rects, pdfForm, plan)
  fillLargeTextFields(page, font, rects, plan)
  fillCommunications(page, font, rects, plan)
  fillSignatures(page, font, rects, plan)
}

async function buildFilledTemplatePdf(
  templateBytes: ArrayBuffer | Uint8Array,
  form: Ics204FormState,
  context: Ics204ExportContext,
  signatures: Ics201VersionSignature[]
): Promise<Uint8Array> {
  const template = await PDFDocument.load(templateBytes)
  const output = await PDFDocument.create()
  const templateForm = template.getForm()
  const fieldRects = cacheTemplateFieldRects(templateForm)
  const font = await output.embedFont(StandardFonts.Helvetica)
  const pages = paginateIcs204TemplateExport(form, context, signatures)
  assertIcs204TemplatePaginationInvariants(pages)

  for (const plan of pages) {
    const [copiedPage] = await output.copyPages(template, [ICS204_TEMPLATE_FORM_PAGE_INDEX])
    output.addPage(copiedPage)
    const outputForm = output.getForm()
    fillFormPagePlan(copiedPage, font, fieldRects, outputForm, plan)
  }

  return output.save({ updateFieldAppearances: false })
}

export async function loadIcs204TemplateBytes(): Promise<ArrayBuffer> {
  const response = await fetch(ICS204_TEMPLATE_URL)
  if (!response.ok) {
    throw new Error(`Unable to load ICS-204 template (${response.status})`)
  }
  return response.arrayBuffer()
}

export async function fillIcs204TemplatePdf(
  form: Ics204FormState,
  context: Ics204ExportContext = {},
  signatures: Ics201VersionSignature[] = []
): Promise<Uint8Array> {
  const templateBytes = await loadIcs204TemplateBytes()
  return buildFilledTemplatePdf(templateBytes, form, context, signatures)
}

export async function fillIcs204TemplatePdfFromBytes(
  templateBytes: ArrayBuffer | Uint8Array,
  form: Ics204FormState,
  context: Ics204ExportContext = {},
  signatures: Ics201VersionSignature[] = []
): Promise<Uint8Array> {
  return buildFilledTemplatePdf(templateBytes, form, context, signatures)
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function downloadIcs204TemplatePdf(
  filename: string,
  form: Ics204FormState,
  context: Ics204ExportContext = {},
  signatures: Ics201VersionSignature[] = []
): Promise<void> {
  const bytes = await fillIcs204TemplatePdf(form, context, signatures)
  triggerBlobDownload(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), filename)
}

export {
  assertIcs204TemplatePaginationInvariants,
  paginateIcs204TemplateExport,
  type Ics204TemplatePagePlan,
} from '@/features/ics204/export-template-pagination'
