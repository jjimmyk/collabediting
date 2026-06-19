import {
  assertIcs204DocxLayoutConsistency,
  buildIcs204DocxDocumentRelsXml,
  buildIcs204DocxFooterXml,
  buildIcs204DocxHeaderXml,
  buildIcs204DocxXml,
} from '../src/features/ics204/export-docx-layout'
import { buildIcs204ExportLayout } from '../src/features/ics204/export-layout'
import {
  assertIcs204PaginationInvariants,
  formatIcs204ContinuedLabel,
  paginateIcs204Export,
} from '../src/features/ics204/export-pagination'
import { createEmptyIcs204Form, buildDemoIcs204ResourceSnapshot } from '../src/features/ics204/utils'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const emptyForm = createEmptyIcs204Form('fixture-export')
const emptyLayout = buildIcs204ExportLayout(emptyForm, {
  incidentName: 'Fixture Incident',
  operationalPeriodFrom: '2026-06-14T06:00',
  operationalPeriodTo: '2026-06-14T18:00',
})
const emptyPages = paginateIcs204Export(emptyLayout)
assert(emptyPages.length >= 1, 'Empty ICS-204 export should produce at least one page')
assertIcs204PaginationInvariants(emptyPages)

const longWorkForm = createEmptyIcs204Form('fixture-long-work', 'Division A')
longWorkForm.workAssignments = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  assignment: `Assignment line ${index + 1}: `.padEnd(120, 'x'),
  priority: String(index + 1),
  resourceRequirements: [],
  overheadPositions: 'Safety Officer',
  specialEquipmentSupplies: 'Radios, PPE',
  reportingLocation: 'Staging Area Alpha',
  requestedArrivalTime: '08:00',
}))
longWorkForm.specialInstructions = 'Special instruction line.\n'.repeat(40)
longWorkForm.resourcesAssigned = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  resourceId: index + 1,
  assetKey: null,
  reportingInfoNotes: `Reporting notes ${index + 1}`,
  has204A: index % 2 === 0,
  resourceSnapshot: buildDemoIcs204ResourceSnapshot({
    id: index + 1,
    name: `Resource ${index + 1}`,
    teamLead: `Leader ${index + 1}`,
    quantity: index + 2,
  }),
}))
const longPages = paginateIcs204Export(
  buildIcs204ExportLayout(longWorkForm, { incidentName: 'Long Fixture' })
)
assert(longPages.length >= 2, 'Long ICS-204 export should paginate to multiple pages')
assertIcs204PaginationInvariants(longPages)

const continuedLabel = formatIcs204ContinuedLabel('6. Work Assignments:')
assert(continuedLabel.includes('(Continued)'), 'Continued label should include suffix')

const documentXml = buildIcs204DocxXml(emptyPages)
assertIcs204DocxLayoutConsistency(documentXml)
assert(
  buildIcs204DocxHeaderXml(emptyPages[0].headerCells).includes('ASSIGNMENT LIST ATTACHMENT'),
  'Header should include ICS-204 title'
)
assert(
  buildIcs204DocxFooterXml(emptyPages[0].signatureFooter, emptyPages[0].footerLeft).includes(
    '9. Prepared By:'
  ),
  'Footer should include prepared-by box'
)
assert(
  buildIcs204DocxDocumentRelsXml(emptyPages.length).includes('footer1.xml'),
  'Document rels should include footer parts'
)

console.log('verify-ics204-export: all checks passed')
