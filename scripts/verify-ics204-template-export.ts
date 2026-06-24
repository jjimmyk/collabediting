import fs from 'node:fs'
import path from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildIcs204AssignedLocationFields, serializeIcs204WorkAssignments } from '../src/features/ics204/export-layout'
import {
  assertIcs204TemplatePaginationInvariants,
  paginateIcs204TemplateExport,
  parseIcs204EmergencyCommunications,
} from '../src/features/ics204/export-template-pagination'
import { fillIcs204TemplatePdfFromBytes } from '../src/features/ics204/export-template-pdf'
import { buildDemoIcs204ResourceSnapshot, createEmptyIcs204Form } from '../src/features/ics204/utils'

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

const templateBytes = fs.readFileSync(path.resolve('public/ics-204-cg-template.pdf'))

const emptyForm = createEmptyIcs204Form('fixture-template-export')
const emptyPages = paginateIcs204TemplateExport(emptyForm, { incidentName: 'Fixture Incident' })
assert(emptyPages.length === 1, 'Empty export should produce one form page')
assertIcs204TemplatePaginationInvariants(emptyPages)

const emptyPdf = await fillIcs204TemplatePdfFromBytes(templateBytes, emptyForm, {
  incidentName: 'Fixture Incident',
})
const emptyDoc = await PDFDocument.load(emptyPdf)
assert(emptyDoc.getPageCount() === 1, 'Empty export PDF should contain one page')
assert(
  !extractPdfTextRough(emptyPdf).includes('PRIVACY ACT STATEMENT'),
  'Export must not include instructions page'
)

const resourceForm = createEmptyIcs204Form('fixture-resources')
resourceForm.resourcesAssigned = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  resourceId: index + 1,
  assetKey: null,
  reportingInfoNotes: `Notes ${index + 1}`,
  has204A: index % 2 === 0,
  resourceSnapshot: buildDemoIcs204ResourceSnapshot({
    id: index + 1,
    name: `Resource ${index + 1}`,
    teamLead: `Leader ${index + 1}`,
    quantity: index + 1,
  }),
}))
const resourcePages = paginateIcs204TemplateExport(resourceForm)
assert(resourcePages.length === 3, 'Twelve resources should paginate to three form pages')
assert(resourcePages[0].resourceRows.length === 5, 'First page should hold five resources')
assert(resourcePages[2].resourceRows.length === 2, 'Third page should hold two resources')

const longWorkForm = createEmptyIcs204Form('fixture-long-work')
longWorkForm.workAssignments = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
  assignment: `Assignment ${index + 1}: ${'detail '.repeat(80)}`,
  priority: String(index + 1),
  resourceRequirements: [],
  overheadPositions: 'Safety Officer',
  specialEquipmentSupplies: 'Radios',
  reportingLocation: 'Staging',
  requestedArrivalTime: '08:00',
}))
longWorkForm.specialInstructions = 'Instruction line.\n'.repeat(50)
const longPages = paginateIcs204TemplateExport(longWorkForm)
assert(longPages.length >= 2, 'Long work assignments and instructions should paginate')

const emergency = parseIcs204EmergencyCommunications(
  'Medical: Clinic A\nEvacuation: Route 7\nOther: Command net'
)
assert(emergency.medical === 'Clinic A', 'Emergency parser should read medical field')
assert(emergency.evacuation === 'Route 7', 'Emergency parser should read evacuation field')
assert(emergency.other === 'Command net', 'Emergency parser should read other field')

const locationForm = createEmptyIcs204Form('fixture-location')
locationForm.branch = 'Branch Alpha'
locationForm.division = 'Division Bravo'
locationForm.group = 'Group Charlie'
locationForm.stagingArea = 'Staging Delta'
const locationFields = buildIcs204AssignedLocationFields(locationForm)
assert(locationFields.branch === 'Branch: Branch Alpha', 'Branch field should include label prefix')
assert(locationFields.division === 'Division: Division Bravo', 'Division field should include label prefix')
assert(
  serializeIcs204WorkAssignments({
    ...locationForm,
    workAssignments: [
      {
        id: 1,
        assignment: 'Conduct shoreline assessment.',
        priority: '1',
        resourceRequirements: [{ id: 1, resource: 'Boats', required: '2', have: '1', need: '1' }],
        overheadPositions: '',
        specialEquipmentSupplies: '',
        reportingLocation: '',
        requestedArrivalTime: '',
      },
    ],
  }).includes('Conduct shoreline assessment'),
  'Work assignments should include assignment text'
)
assert(
  !serializeIcs204WorkAssignments({
    ...locationForm,
    workAssignments: [
      {
        id: 1,
        assignment: 'Conduct shoreline assessment.',
        priority: '1',
        resourceRequirements: [{ id: 1, resource: 'Boats', required: '2', have: '1', need: '1' }],
        overheadPositions: '',
        specialEquipmentSupplies: '',
        reportingLocation: '',
        requestedArrivalTime: '',
      },
    ],
  }).includes('Resource Requirements'),
  'Work assignments should omit resource needs'
)
assert(
  !serializeIcs204WorkAssignments({
    ...locationForm,
    workAssignments: [
      {
        id: 1,
        assignment: 'Conduct shoreline assessment.',
        priority: '1',
        resourceRequirements: [],
        overheadPositions: '',
        specialEquipmentSupplies: '',
        reportingLocation: '',
        requestedArrivalTime: '',
      },
    ],
  }).includes('Assignment 1'),
  'Work assignments should omit assignment numbering'
)

const filledPdf = await fillIcs204TemplatePdfFromBytes(templateBytes, resourceForm)
const filledDoc = await PDFDocument.load(filledPdf)
assert(filledDoc.getPageCount() === 3, 'Filled resource export should contain three form pages')

console.log('verify-ics204-template-export: all checks passed')
