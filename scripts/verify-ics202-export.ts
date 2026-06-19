import { buildIcs202DocxXml } from '@/features/ics202/export-docx-layout'
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

export function runIcs202ExportPaginationFixtureChecks(): void {
  const form = createEmptyIcs202Form('fixture-export', {
    incidentName: 'planning p 61426',
    incidentPriorities: Array.from({ length: 48 }, (_, index) => `priority line ${index}`).join(
      '\n'
    ),
    criticalInformationRequirements: '',
    limitationsAndConstraints: '',
    keyDecisionsAndProcedures: '',
  })

  const pages = paginateIcs202Export(buildIcs202ExportLayout(form, { incidentName: form.incidentName }))
  assert(pages.length >= 2, 'Expected multi-page export for long incident priorities.')
  assertIcs202PaginationInvariants(pages)

  pages.forEach((page) => {
    assert(page.preparedBy.label.length > 0, 'Every page must include prepared-by chrome.')
    assert(page.headerCells.length === 3, 'Every page must repeat boxes 1–3.')
  })

  const overflowPage = pages.find((page) =>
    page.segments.some(
      (segment) =>
        segment.kind === 'text-box' &&
        segment.label === formatIcs202ContinuedLabel('5. Incident Priorities:')
    )
  )
  assert(overflowPage !== undefined, 'Expected Box 5 continuation label on overflow page.')

  const firstPage = pages[0]
  assert(firstPage.preparedBy.label.includes('10.'), 'First form page must use Box 10 prepared-by.')
  assert(firstPage.displayPageNumber === 1, 'Page numbering should start at 1.')
  assert(firstPage.totalPages === pages.length, 'Total pages should match physical page count.')

  const documentXml = buildIcs202DocxXml(pages)
  const headerCount = (documentXml.match(/1\. Incident Name:/g) ?? []).length
  assert(headerCount === pages.length, 'DOCX must repeat header row on every page.')
  pages.forEach((page) => {
    const preparedCount = (documentXml.match(new RegExp(escapeRegex(page.preparedBy.label), 'g')) ?? [])
      .length
    assert(preparedCount >= 1, `DOCX must include prepared-by label: ${page.preparedBy.label}`)
  })
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

runIcs202ExportPaginationFixtureChecks()
console.log('ICS-202 export pagination checks passed.')
