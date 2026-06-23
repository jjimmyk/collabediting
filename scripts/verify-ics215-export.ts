import {
  assertIcs215DocxLayoutConsistency,
  buildIcs215DocxDocumentRelsXml,
  buildIcs215DocxFooterXml,
  buildIcs215DocxHeaderXml,
  buildIcs215DocxXml,
} from '../src/features/ics215/export-docx-layout'
import { buildIcs215ExportLayout } from '../src/features/ics215/export-layout'
import {
  ICS215_LEGACY_ASSIGNMENT_ROWS_PER_BLOCK,
  ics215LegacyTotalColCount,
} from '../src/features/ics215/export-legacy-table'
import {
  assertIcs215PaginationInvariants,
  formatIcs215ContinuedLabel,
  paginateIcs215Export,
} from '../src/features/ics215/export-pagination'
import { ICS215_MAX_RESOURCE_COLUMNS_PER_PAGE } from '../src/features/ics215/constants'
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
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'aircrew', label: 'Aircrew' },
  { id: 'diver', label: 'Diver' },
  { id: 'medic', label: 'Medic' },
  { id: 'engineer', label: 'Engineer' },
  { id: 'supervisor', label: 'Supervisor' },
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

const wideResourcePages = paginateIcs215Export(
  buildIcs215ExportLayout(longForm, {
    incidentName: 'Wide Fixture',
    incidentLocation: 'Gulf Coast',
  })
)
const wideSliceCount = Math.ceil(
  longForm.resourceColumns.length / ICS215_MAX_RESOURCE_COLUMNS_PER_PAGE
)
assert(
  wideSliceCount >= 2,
  'Fixture should exceed max resource columns per page for horizontal continuation'
)
const continuedSegments = wideResourcePages.flatMap((page) => page.segments)
assert(
  continuedSegments.some((segment) => segment.label.includes('(Continued)')),
  'Wide resource export should include continued segments'
)

const continuedLabel = formatIcs215ContinuedLabel('Work Assignments')
assert(continuedLabel.includes('(Continued)'), 'Continued label should include suffix')

const documentXml = buildIcs215DocxXml(emptyPages)
assertIcs215DocxLayoutConsistency(documentXml)
assert(documentXml.includes('<w:vMerge'), 'Legacy DOCX should use vertical merge cells')
assert(documentXml.includes('12. Total Resources Required'), 'Footer should include section 12')
assert(
  buildIcs215DocxHeaderXml(emptyPages[0].headerCells, emptyPages[0].operationalPeriod).includes(
    'OPERATIONAL PLANNING WORKSHEET'
  ),
  'Header should include ICS-215 title'
)
assert(
  buildIcs215DocxHeaderXml(emptyPages[0].headerCells, emptyPages[0].operationalPeriod).includes(
    '2. Incident Location:'
  ),
  'Header should use two-row boxes 1–4 layout'
)
assert(
  !buildIcs215DocxFooterXml(emptyPages[0].preparedByFooter, emptyPages[0].footerLeft).includes(
    '15. Prepared By:'
  ),
  'Word footer should not include prepared-by box'
)
assert(documentXml.includes('15. Prepared By:'), 'Document body should include box 15')
assert(
  buildIcs215DocxDocumentRelsXml(emptyPages.length).includes('footer1.xml'),
  'Document rels should include footer parts'
)

const lastPage = emptyPages[emptyPages.length - 1]
const lastSegment = lastPage.segments[lastPage.segments.length - 1]
assert(
  lastSegment.showResourceTotalsFooter === true,
  'Final segment should show legacy resource totals footer'
)
assert(
  lastSegment.showPreparedByFooter === true,
  'Final segment should show inline prepared-by box 15'
)
assert(
  ics215LegacyTotalColCount(lastSegment.resourceColumns.length) ===
    3 + lastSegment.resourceColumns.length + 4,
  'Legacy column count should be assignee + work + kinds+RHN + resources + overflow'
)
assert(
  documentXml.includes('<w:textDirection w:val="tbRl"/>'),
  'Legacy DOCX should use vertical text for kinds/resource headers'
)
assert(
  ICS215_LEGACY_ASSIGNMENT_ROWS_PER_BLOCK === 3,
  'Each assignment should render as three REQ/HAVE/NEED rows'
)

console.log('verify-ics215-export: all checks passed')
