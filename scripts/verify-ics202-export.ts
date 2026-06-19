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

const MAD_DOG_FIXTURE_PRIORITIES = `asdfasdafsd
 
asdfasdfasdsfasdf
 
asdfasdfafsdfds
 
sdfasdfasdfsdf
d
asdfasdfsfsdfsadfasdf
 
 
 
asdfasdfssadfsadfsf
 
 
 
asdfasdfadfs
 
 
 
asdfasdfasdf
 
 
 
asdfasdfasdfasdf
 
 
 
asdfasdfasdfasdfasdf`

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

function buildMadDogFixtureForm() {
  return createEmptyIcs202Form('fixture-mad-dog', {
    incidentName: 'BP Mad Dog Process Area Gas Release',
    incidentPriorities: MAD_DOG_FIXTURE_PRIORITIES,
    commandEmphasis: 'Monitor gas readings and maintain process area isolation.',
    preparedByName: 'Jimmy King',
    preparedByPositionTitle: 'Incident Commander',
    preparedDateTime: '2026-06-11T16:27',
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

function assertDocxFooterLayout(pages: ReturnType<typeof paginateIcs202Export>): void {
  const documentXml = buildIcs202DocxXml(pages)
  const headerXml = buildIcs202DocxHeaderXml(pages[0].headerCells)
  const relsXml = buildIcs202DocxDocumentRelsXml(pages.length)

  assertIcs202DocxLayoutConsistency(documentXml)
  assert(headerXml.includes('1. Incident Name:'), 'Header part must include boxes 1–3.')
  assert(headerXml.includes('INCIDENT BRIEFING (ICS 202-CG)'), 'Header part must include form title.')
  assert(relsXml.includes('header1.xml'), 'Document relationships must link header part.')

  pages.forEach((page, index) => {
    const footerXml = buildIcs202DocxFooterXml(page.preparedBy, page.footerLeft)
    assert(
      footerXml.includes(page.preparedBy.label),
      `Footer ${index + 1} must include prepared-by label.`
    )
    assert(
      footerXml.includes('ICS 202-CG (08/25)'),
      `Footer ${index + 1} must include ICS expiration line.`
    )
    assert(relsXml.includes(`footer${index + 1}.xml`), `Relationships must link footer${index + 1}.xml.`)
  })

  assert(
    !documentXml.includes('10. Prepared by:') && !documentXml.includes('14. Prepared by:'),
    'Prepared-by must not appear in document body.'
  )
  assert(documentXml.includes('<w:cantSplit/>'), 'DOCX must guard section rows with cantSplit.')
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
    userContinuedSegments.length >= 1,
    'Planning fixture must split Box 5 with an explicit (Continued) segment.'
  )
  const planningContinuationPage = userPages.find((page) =>
    page.segments.some(
      (segment) =>
        segment.kind === 'text-box' &&
        segment.label === formatIcs202ContinuedLabel('5. Incident Priorities:')
    )
  )
  assert(planningContinuationPage !== undefined, 'Planning fixture must label Box 5 continuation pages.')
  const planningContinuedSegment = planningContinuationPage!.segments.find(
    (segment) =>
      segment.kind === 'text-box' &&
      segment.label === formatIcs202ContinuedLabel('5. Incident Priorities:')
  )
  assert(
    planningContinuedSegment?.kind === 'text-box' && planningContinuedSegment.bodyLines.length > 0,
    'Planning continuation page must carry Box 5 body lines.'
  )
  const planningContinuationPageIndex = userPages.indexOf(planningContinuationPage!)
  assert(
    planningContinuationPageIndex >= 1,
    'Planning fixture must not place Box 5 continuation on the first page.'
  )
  assert(
    countTinyContinuations(userPages) === 0,
    'Continuation segments should not contain tiny one-line overflow chunks.'
  )

  assertDocxFooterLayout(userPages)
  assert(
    buildIcs202DocxXml(userPages).includes('5. Incident Priorities (Continued):'),
    'Planning fixture DOCX must include Box 5 continuation label.'
  )

  const madDogPages = paginateIcs202Export(
    buildIcs202ExportLayout(buildMadDogFixtureForm(), {
      incidentName: 'BP Mad Dog Process Area Gas Release',
    })
  )
  assertIcs202PaginationInvariants(madDogPages)
  assert(madDogPages.length >= 2, 'Mad Dog fixture should paginate across multiple logical pages.')

  const continuedLabel = formatIcs202ContinuedLabel('5. Incident Priorities:')
  const continuationPage = madDogPages.find((page) =>
    page.segments.some(
      (segment) => segment.kind === 'text-box' && segment.label === continuedLabel
    )
  )
  assert(continuationPage !== undefined, 'Mad Dog fixture must label Box 5 continuation pages.')
  const madDogContinuedSegment = continuationPage!.segments.find(
    (segment) => segment.kind === 'text-box' && segment.label === continuedLabel
  )
  assert(
    madDogContinuedSegment?.kind === 'text-box' && madDogContinuedSegment.bodyLines.length > 0,
    'Mad Dog continuation page must carry Box 5 body lines.'
  )
  assertDocxFooterLayout(madDogPages)

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
}

runIcs202ExportPaginationFixtureChecks()
console.log('ICS-202 export pagination checks passed.')
