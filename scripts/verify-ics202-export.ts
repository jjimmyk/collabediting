import {
  assertIcs202DocxLayoutConsistency,
  buildIcs202DocxDocumentRelsXml,
  buildIcs202DocxFooterXml,
  buildIcs202DocxHeaderXml,
  buildIcs202DocxXml,
} from '@/features/ics202/export-docx-layout'
import { buildIcs202ExportLayout } from '@/features/ics202/export-layout'
import {
  assertIcs202PaginationInvariants,
  formatIcs202ContinuedLabel,
  paginateIcs202Export,
} from '@/features/ics202/export-pagination'
import { createEmptyIcs202Form } from '@/features/ics202/utils'

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

const USER_FIXTURE_PRIORITIES = `asdsadf
asdfadfasd
asdfasdfs
as
sdfasdfasdas
sdfasdfadfsfas
asdfasfdsafsd
hahahahahahaha
hahahahahaa
asdfasdfsadffad
asdfasdsfasdfsd
asdfasdsfadfsa
dasdfasdfs`

function buildUserFixtureForm() {
  return createEmptyIcs202Form('fixture-export', {
    incidentName: 'planning p 61426',
    incidentPriorities: USER_FIXTURE_PRIORITIES,
    commandEmphasis: 'this is a version of the 202 and now imma sign this',
    criticalInformationRequirements: '',
    limitationsAndConstraints: '',
    keyDecisionsAndProcedures: '',
    preparedByName: 'Jimmy King',
    preparedByPositionTitle: 'Incident Commander',
    preparedDateTime: '2026-06-18T14:23',
  })
}

function countTinyContinuations(pages: ReturnType<typeof paginateIcs202Export>): number {
  return pages.reduce((count, page) => {
    return (
      count +
      page.segments.filter(
        (segment) =>
          segment.kind === 'text-box' &&
          segment.continued &&
          segment.bodyLines.length <= 3
      ).length
    )
  }, 0)
}

export function runIcs202ExportPaginationFixtureChecks(): void {
  const userForm = buildUserFixtureForm()
  const userPages = paginateIcs202Export(
    buildIcs202ExportLayout(userForm, { incidentName: userForm.incidentName })
  )
  assertIcs202PaginationInvariants(userPages)

  userPages.forEach((page) => {
    assert(page.preparedBy.label.length > 0, 'Every page must include prepared-by chrome.')
  })

  const userContinuedSegments = userPages.flatMap((page) =>
    page.segments.filter(
      (segment) =>
        segment.kind === 'text-box' &&
        segment.label === formatIcs202ContinuedLabel('5. Incident Priorities:')
    )
  )
  assert(
    userContinuedSegments.length === 0,
    'User fixture should not produce a spurious Box 5 continuation page.'
  )
  assert(
    countTinyContinuations(userPages) === 0,
    'Continuation segments should not contain tiny one-line overflow chunks.'
  )

  const longForm = createEmptyIcs202Form('fixture-long', {
    incidentName: 'planning p 61426',
    incidentPriorities: Array.from({ length: 48 }, (_, index) => `priority line ${index}`).join(
      '\n'
    ),
  })
  const longPages = paginateIcs202Export(
    buildIcs202ExportLayout(longForm, { incidentName: longForm.incidentName })
  )
  assert(longPages.length >= 2, 'Expected multi-page export for long incident priorities.')
  assertIcs202PaginationInvariants(longPages)

  const overflowPage = longPages.find((page) =>
    page.segments.some(
      (segment) =>
        segment.kind === 'text-box' &&
        segment.label === formatIcs202ContinuedLabel('5. Incident Priorities:')
    )
  )
  assert(overflowPage !== undefined, 'Expected Box 5 continuation label on genuine overflow.')
  assert(
    overflowPage!.segments.some(
      (segment) =>
        segment.kind === 'text-box' &&
        segment.label === formatIcs202ContinuedLabel('5. Incident Priorities:') &&
        segment.bodyLines.length > 3
    ),
    'Continuation page should carry a meaningful chunk of Box 5 content.'
  )

  const documentXml = buildIcs202DocxXml(userPages)
  const headerXml = buildIcs202DocxHeaderXml(userPages[0].headerCells)
  const footerXml = buildIcs202DocxFooterXml(userPages[0].footerLeft)
  const relsXml = buildIcs202DocxDocumentRelsXml()

  assertIcs202DocxLayoutConsistency(documentXml)
  assert(headerXml.includes('1. Incident Name:'), 'Header part must include boxes 1–3.')
  assert(headerXml.includes('INCIDENT BRIEFING (ICS 202-CG)'), 'Header part must include form title.')
  assert(footerXml.includes('NUMPAGES'), 'Footer part must include total page count field.')
  assert(relsXml.includes('header1.xml'), 'Document relationships must link header part.')
  assert(relsXml.includes('footer1.xml'), 'Document relationships must link footer part.')
  assert(
    (documentXml.match(/10\. Prepared by:/g) ?? []).length ===
      userPages.filter((page) => page.preparedBy.label.includes('10.')).length,
    'Each logical page must render Box 10 prepared-by in the document body.'
  )
}

runIcs202ExportPaginationFixtureChecks()
console.log('ICS-202 export pagination checks passed.')
