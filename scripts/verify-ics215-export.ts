import {
  assertIcs215DocxLayoutConsistency,
  buildIcs215DocxDocumentRelsXml,
  buildIcs215DocxFooterXml,
  buildIcs215DocxHeaderXml,
  buildIcs215DocxXml,
} from '../src/features/ics215/export-docx-layout'
import { buildIcs215ExportLayout } from '../src/features/ics215/export-layout'
import {
  assertIcs215PaginationInvariants,
  formatIcs215ContinuedLabel,
  paginateIcs215Export,
} from '../src/features/ics215/export-pagination'
import { createEmptyIcs215Form, createEmptyResourceValues } from '../src/features/ics215/utils'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const emptyForm = createEmptyIcs215Form('fixture-export')
const emptyLayout = buildIcs215ExportLayout(emptyForm, {
  incidentName: 'Fixture Incident',
  incidentLocation: 'District 7 — Southeast',
})
const emptyPages = paginateIcs215Export(emptyLayout)
assert(emptyPages.length >= 1, 'Empty ICS-215 export should produce at least one page')
assertIcs215PaginationInvariants(emptyPages)

const longForm = createEmptyIcs215Form('fixture-long')
longForm.resourceColumns = [
  { id: 'helicopter', label: 'Helicopter' },
  { id: 'small-boat', label: 'Small Boat' },
  { id: 'large-boat', label: 'Large Boat' },
  { id: 'crew', label: 'Crew' },
]
longForm.workAssignments = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  assignee: `Division ${index + 1}`,
  workAssignment: `Assignment line ${index + 1}: `.padEnd(120, 'x'),
  resourceValues: createEmptyResourceValues(longForm.resourceColumns),
  overheadPositions: 'Safety Officer',
  specialEquipmentSupplies: 'Radios, PPE',
  reportingLocation: 'Staging Area Alpha',
  requestedArrivalTime: '08:00',
  status: 'Planned',
}))
const longPages = paginateIcs215Export(
  buildIcs215ExportLayout(longForm, {
    incidentName: 'Long Fixture',
    incidentLocation: 'Gulf Coast',
  })
)
assert(longPages.length >= 2, 'Long ICS-215 export should paginate to multiple pages')
assertIcs215PaginationInvariants(longPages)

const continuedLabel = formatIcs215ContinuedLabel('Work Assignments')
assert(continuedLabel.includes('(Continued)'), 'Continued label should include suffix')

const documentXml = buildIcs215DocxXml(emptyPages)
assertIcs215DocxLayoutConsistency(documentXml)
assert(
  buildIcs215DocxHeaderXml(emptyPages[0].headerCells, emptyPages[0].operationalPeriod).includes(
    'OPERATIONAL PLANNING WORKSHEET'
  ),
  'Header should include ICS-215 title'
)
assert(
  buildIcs215DocxFooterXml(emptyPages[0].preparedByFooter, emptyPages[0].footerLeft).includes(
    '15. Prepared By:'
  ),
  'Footer should include prepared-by box'
)
assert(
  buildIcs215DocxDocumentRelsXml(emptyPages.length).includes('footer1.xml'),
  'Document rels should include footer parts'
)

console.log('verify-ics215-export: all checks passed')
