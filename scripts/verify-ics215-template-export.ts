import fs from 'node:fs'
import path from 'node:path'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { ics215TemplateResourceField } from '../src/features/ics215/export-template-fields'
import {
  assertIcs215TemplatePaginationInvariants,
  paginateIcs215TemplateExport,
} from '../src/features/ics215/export-template-pagination'
import { fillIcs215TemplatePdfFromBytes } from '../src/features/ics215/export-template-pdf'
import { createEmptyIcs215Form, createEmptyResourceValues } from '../src/features/ics215/utils'
import {
  getPdfTextFieldWidgetRect,
  resolveFontSizeForWidgetRect,
} from '../src/lib/pdf-template-utils'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function extractPdfTextRough(pdfBytes: Uint8Array): string {
  const raw = Buffer.from(pdfBytes).toString('latin1')
  const chunks: string[] = []
  const pattern = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(raw)) !== null) {
    chunks.push(
      match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\')
    )
  }
  return chunks.join(' ')
}

const templateBytes = fs.readFileSync(path.resolve('public/ics-215-cg-template.pdf'))
const templateDoc = await PDFDocument.load(templateBytes)
const templateForm = templateDoc.getForm()
const templateFont = await templateDoc.embedFont(StandardFonts.Helvetica)
const reqRect = getPdfTextFieldWidgetRect(templateForm, ics215TemplateResourceField('required', 1, 1) ?? '')
assert(reqRect, 'REQ Row 1 widget rect should exist')
const reqLayout = resolveFontSizeForWidgetRect(reqRect, templateFont, '11', { fontSize: 7 })
assert(
  reqRect.y + reqRect.height - reqLayout.padding - reqLayout.fontSize >= reqRect.y + reqLayout.padding,
  'REQ/HAVE/NEED cells should fit at least one line after adaptive layout'
)

const emptyForm = createEmptyIcs215Form('fixture-template-export')
const emptyPages = paginateIcs215TemplateExport(emptyForm)
assert(emptyPages.length === 1, 'Empty export should produce one form page')
assertIcs215TemplatePaginationInvariants(emptyPages)

const emptyPdf = await fillIcs215TemplatePdfFromBytes(templateBytes, emptyForm)
const emptyDoc = await PDFDocument.load(emptyPdf)
assert(emptyDoc.getPageCount() === 1, 'Empty export PDF should contain one page')
assert(
  !extractPdfTextRough(emptyPdf).includes('PRIVACY ACT STATEMENT'),
  'Export must not include instructions page'
)

const mediumForm = createEmptyIcs215Form('fixture-medium')
mediumForm.incidentName = 'Medium Fixture'
mediumForm.workAssignments = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  assignee: `Division ${index + 1}`,
  workAssignment: `Work assignment ${index + 1}`,
  resourceValues: createEmptyResourceValues(mediumForm.resourceColumns),
  overheadPositions: 'Safety Officer',
  specialEquipmentSupplies: 'Radios',
  reportingLocation: 'Staging',
  requestedArrivalTime: '08:00',
  status: 'Planned',
}))
const mediumPages = paginateIcs215TemplateExport(mediumForm)
assert(mediumPages.length === 2, 'Nine assignments should paginate to two form pages')
assert(mediumPages[0].assignmentRows.length === 8, 'First page should hold eight assignments')
assert(mediumPages[1].assignmentRows.length === 1, 'Second page should hold one assignment')

const wideForm = createEmptyIcs215Form('fixture-wide')
wideForm.resourceColumns = Array.from({ length: 15 }, (_, index) => ({
  id: `resource-${index + 1}`,
  label: `Resource ${index + 1}`,
}))
wideForm.workAssignments = [
  {
    id: 1,
    assignee: 'Division Alpha',
    workAssignment: 'Single assignment',
    resourceValues: createEmptyResourceValues(wideForm.resourceColumns),
    overheadPositions: '',
    specialEquipmentSupplies: '',
    reportingLocation: '',
    requestedArrivalTime: '',
    status: 'Planned',
  },
]
const widePages = paginateIcs215TemplateExport(wideForm)
assert(widePages.length === 2, 'Fifteen resource columns should paginate horizontally')
assert(widePages[0].resourceColumns.length === 12, 'First slice should contain twelve columns')
assert(widePages[1].resourceColumns.length === 3, 'Second slice should contain three columns')

const filledPdf = await fillIcs215TemplatePdfFromBytes(templateBytes, mediumForm)
const filledDoc = await PDFDocument.load(filledPdf)
assert(filledDoc.getPageCount() === 2, 'Filled medium export should contain two form pages')

const rhnForm = createEmptyIcs215Form('fixture-rhn')
const firstColumn = rhnForm.resourceColumns[0]
const secondColumn = rhnForm.resourceColumns[1]
const rhnValues = createEmptyResourceValues(rhnForm.resourceColumns)
rhnValues[firstColumn.id] = { required: '11', have: '22', need: '33' }
rhnValues[secondColumn.id] = { required: '44', have: '55', need: '66' }
rhnForm.workAssignments = [
  {
    id: 1,
    assignee: 'Division Alpha',
    workAssignment: 'Verify REQ/HAVE/NEED export rendering',
    resourceValues: rhnValues,
    overheadPositions: '',
    specialEquipmentSupplies: '',
    reportingLocation: '',
    requestedArrivalTime: '',
    status: 'Planned',
  },
]
const rhnPdf = await fillIcs215TemplatePdfFromBytes(templateBytes, rhnForm)
const rhnDoc = await PDFDocument.load(rhnPdf)
assert(rhnDoc.getPageCount() === 1, 'RHN fixture export should produce one form page')

console.log('verify-ics215-template-export: all checks passed')
