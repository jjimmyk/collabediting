import { ICS215_DEFAULT_RESOURCE_COLUMNS } from '../src/features/ics215/constants'
import { buildIcs215DocxBlocks } from '../src/features/ics215/export'
import type { Ics215FormState } from '../src/features/ics215/types'
import {
  applyIcs215SectionDraft,
  computeIcs215ColumnTotals,
  computeIcs215ResourceTotals,
  createDefaultIcs215WorkAssignments,
  normalizeIcs215FormState,
} from '../src/features/ics215/utils'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const legacyForm = normalizeIcs215FormState({
  id: 'legacy-doc',
  incidentName: 'Legacy Incident',
  operationalPeriodDateFrom: '',
  operationalPeriodDateTo: '',
  operationalPeriodTimeFrom: '',
  operationalPeriodTimeTo: '',
  workAssignments: [
    {
      id: 1,
      branch: 'Operations Branch',
      divisionGroupOther: 'Division A',
      workAssignmentInstructions: 'Legacy instructions',
      resources: [
        {
          id: 1,
          categoryKindType: 'Helicopter',
          required: '2',
          have: '1',
          need: '1',
        },
        {
          id: 2,
          categoryKindType: 'Custom Truck',
          required: '3',
          have: '1',
          need: '2',
        },
      ],
      overheadPositions: 'Supervisor',
      specialEquipmentSupplies: 'Radios',
      reportingLocation: 'Base',
      requestedArrivalTime: '08:00',
    },
  ],
  totalResourcesRequired: '',
  totalResourcesHaveOnHand: '',
  totalResourcesNeedToOrder: '',
  preparedByName: '',
  preparedByPositionTitle: '',
  preparedBySignature: '',
  preparedDateTime: '',
} as unknown as Ics215FormState)

assert(legacyForm.resourceColumns.length >= 3, 'Legacy form should have default resource columns')
assert(
  legacyForm.resourceColumns.some((column) => column.label === 'Custom Truck'),
  'Legacy custom resource category should become a column'
)
assert(
  legacyForm.workAssignments[0]?.assignee === 'Division A',
  'Legacy division/group should migrate to assignee'
)
assert(
  legacyForm.workAssignments[0]?.workAssignment === 'Legacy instructions',
  'Legacy instructions should migrate to workAssignment'
)

const helicopterColumn = legacyForm.resourceColumns.find((column) => column.label === 'Helicopter')
assert(!!helicopterColumn, 'Helicopter column should exist after migration')
assert(
  legacyForm.workAssignments[0]?.resourceValues[helicopterColumn!.id]?.required === '2',
  'Legacy helicopter required value should migrate'
)

const columnTotals = computeIcs215ColumnTotals(
  legacyForm.resourceColumns,
  legacyForm.workAssignments
)
const helicopterTotals = columnTotals[helicopterColumn!.id]
assert(helicopterTotals?.required === '2', 'Column totals should sum required values')
assert(helicopterTotals?.have === '1', 'Column totals should sum have values')
assert(helicopterTotals?.need === '1', 'Column totals should sum need values')

const resourceTotals = computeIcs215ResourceTotals(
  legacyForm.resourceColumns,
  legacyForm.workAssignments
)
assert(resourceTotals.totalResourcesRequired === '5', 'Grand total required should be 5')
assert(resourceTotals.totalResourcesHaveOnHand === '2', 'Grand total have should be 2')
assert(resourceTotals.totalResourcesNeedToOrder === '3', 'Grand total need should be 3')

const workDraft = {
  resourceColumns: ICS215_DEFAULT_RESOURCE_COLUMNS,
  workAssignments: createDefaultIcs215WorkAssignments(ICS215_DEFAULT_RESOURCE_COLUMNS, 1).map(
    (row) => ({
      ...row,
      assignee: 'Operations Section Chief',
      workAssignment: 'Test assignment',
      resourceValues: {
        helicopter: { required: '1', have: '0', need: '1' },
        'small-boat': { required: '2', have: '1', need: '1' },
        'large-boat': { required: '0', have: '0', need: '0' },
      },
      status: 'Assigned',
    })
  ),
}

const savedForm = applyIcs215SectionDraft(
  normalizeIcs215FormState({
    id: 'draft-doc',
    incidentName: 'Draft Incident',
    operationalPeriodDateFrom: '',
    operationalPeriodDateTo: '',
    operationalPeriodTimeFrom: '',
    operationalPeriodTimeTo: '',
    resourceColumns: ICS215_DEFAULT_RESOURCE_COLUMNS,
    workAssignments: createDefaultIcs215WorkAssignments(),
    totalResourcesRequired: '',
    totalResourcesHaveOnHand: '',
    totalResourcesNeedToOrder: '',
    preparedByName: '',
    preparedByPositionTitle: '',
    preparedBySignature: '',
    preparedDateTime: '',
  }),
  'work-assignments',
  workDraft
)

assert(
  savedForm.totalResourcesRequired === '3',
  'Saving work assignments should sync resource totals'
)
assert(savedForm.totalResourcesHaveOnHand === '1', 'Saving work assignments should sync have total')
assert(savedForm.totalResourcesNeedToOrder === '2', 'Saving work assignments should sync need total')

const exportBlocks = buildIcs215DocxBlocks(savedForm)
const exportText = exportBlocks.map((block) => ('text' in block ? block.text : '')).join('\n')
assert(exportText.includes('Assignee: Operations Section Chief'), 'Export should include assignee')
assert(exportText.includes('Helicopter: Req 1'), 'Export should include resource column values')
assert(exportText.includes('Column Totals'), 'Export should include column totals section')
assert(exportText.includes('Status: Assigned'), 'Export should include status')

console.log('verify-ics215-work-assignments: all checks passed')
