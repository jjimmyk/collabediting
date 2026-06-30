import { buildRosterDisplayProjection } from '@/features/roster/build-roster-display-projection'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import {
  resolvePositionReportsTo,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import { ics201DisplayNameFromEmail } from '@/features/ics201/utils'
import type {
  Ics203AgencyRepresentativeRow,
  Ics203DivisionGroupRow,
  Ics203FormState,
  Ics203OperationsBranch,
} from '@/features/ics203/types'
import { cloneIcs203FormState, nextRowId } from '@/features/ics203/utils'
import type { WorkspacePositionType } from '@/features/roster/workspace-position-type'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

const OPERATIONS_SECTION_CHIEF = 'Operations Section Chief'
const PLANNING_SECTION_CHIEF = 'Planning Section Chief'
const LOGISTICS_SECTION_CHIEF = 'Logistics Section Chief'
const INCIDENT_COMMANDER = 'Incident Commander'

const ICS203_SCALAR_POSITION_MAP: Record<string, keyof Ics203FormState> = {
  'Incident Commander': 'icUcs',
  'Safety Officer': 'safetyOfficer',
  'Public Information Officer': 'publicInformationOfficer',
  'Liaison Officer': 'liaisonOfficer',
  'Planning Section Chief': 'planningChief',
  'Resources Unit Leader': 'resourcesUnit',
  'Situation Unit Leader': 'situationUnit',
  'Documentation Unit Leader': 'documentationUnit',
  'Demobilization Unit Leader': 'demobilizationUnit',
  'Technical Specialist': 'technicalSpecialists',
  'Logistics Section Chief': 'logisticsChief',
  'Support Branch Director': 'supportBranchDirector',
  'Supply Unit Leader': 'supplyUnit',
  'Facilities Unit Leader': 'facilitiesUnit',
  'Ground Support Unit Leader': 'groundSupportUnit',
  'Service Branch Director': 'serviceBranchDirector',
  'Communications Unit Leader': 'communicationsUnit',
  'Medical Unit Leader': 'medicalUnit',
  'Food Unit Leader': 'foodUnit',
  'Operations Section Chief': 'operationsChief',
  'Staging Area Manager': 'stagingArea',
  'Finance Section Chief': 'financeChief',
  'Time Unit Leader': 'timeUnit',
  'Procurement Unit Leader': 'procurementUnit',
  'Compensation Unit Leader': 'compensationClaimsUnit',
  'Cost Unit Leader': 'costUnit',
}

const DIVISION_GROUP_POSITION_TYPES = new Set<WorkspacePositionType>([
  'group',
  'division',
  'task_force',
  'strike_team',
])

export function formatIcs203RosterAssignee(member: WorkspaceRosterMember): string {
  const email = member.email.trim()
  if (!email) return ''
  const displayName = ics201DisplayNameFromEmail(email)
  return `${displayName} (${email})`
}

export function joinIcs203RosterAssignees(members: WorkspaceRosterMember[]): string {
  return members
    .filter((member) => member.status !== 'removed')
    .map((member) => formatIcs203RosterAssignee(member))
    .filter((label) => label.length > 0)
    .join('; ')
}

function isPositionUnder(
  catalog: WorkspacePositionCatalog,
  positionName: string,
  ancestor: string
): boolean {
  if (positionName === ancestor) {
    return true
  }
  let current: string | null = positionName
  const visited = new Set<string>()
  while (current && !visited.has(current)) {
    visited.add(current)
    if (current === ancestor) {
      return true
    }
    current = resolvePositionReportsTo(current, catalog)
  }
  return false
}

function assigneesAtPosition(
  entriesByPosition: Record<string, PositionRosterEntry>,
  positionName: string
): WorkspaceRosterMember[] {
  const entry = entriesByPosition[positionName]
  if (!entry) return []
  return entry.members.filter((member) => member.status !== 'removed')
}

function countFilledScalars(form: Ics203FormState): number {
  let count = 0
  for (const field of Object.values(ICS203_SCALAR_POSITION_MAP)) {
    const value = form[field]
    if (typeof value === 'string' && value.trim().length > 0) {
      count += 1
    }
  }
  return count
}

function countDivisionGroups(rows: Ics203DivisionGroupRow[]): number {
  return rows.filter((row) => row.supervisorName.trim().length > 0).length
}

function countAgencyRows(rows: Ics203AgencyRepresentativeRow[]): number {
  return rows.filter((row) => row.representativeName.trim().length > 0).length
}

function countOperationsBranches(branches: Ics203OperationsBranch[]): number {
  let count = 0
  for (const branch of branches) {
    if (branch.branchDirector.trim()) count += 1
    count += countDivisionGroups(branch.divisionGroups)
  }
  return count
}

function buildAgencyRepresentatives(
  roster: WorkspaceRosterMember[]
): Ics203AgencyRepresentativeRow[] {
  const rows: Ics203AgencyRepresentativeRow[] = []
  for (const member of roster) {
    if (member.status === 'removed') continue
    if (member.assignmentKind !== 'single_resource') continue
    if (member.orgChartReportsTo?.trim() !== INCIDENT_COMMANDER) continue
    const representativeName = formatIcs203RosterAssignee(member)
    if (!representativeName) continue
    rows.push({
      id: nextRowId(rows),
      agencyOrganization: '',
      representativeName,
    })
  }
  return rows
}

function buildDivisionGroupRow(
  positionName: string,
  members: WorkspaceRosterMember[],
  rows: Ics203DivisionGroupRow[]
): Ics203DivisionGroupRow | null {
  const supervisorName = joinIcs203RosterAssignees(members)
  if (!supervisorName) return null
  return {
    id: nextRowId(rows),
    identifier: positionName,
    supervisorName,
  }
}

export function buildIcs203FromNextOpRoster(input: {
  currentForm: Ics203FormState
  catalog: WorkspacePositionCatalog
  positionEntries: PositionRosterEntry[]
  roster: WorkspaceRosterMember[]
  assets: ResourceListItemData[]
}): { form: Ics203FormState; filledFieldCount: number } {
  const projected = buildRosterDisplayProjection({
    horizon: 'next_op',
    catalog: input.catalog,
    entries: input.positionEntries,
    roster: input.roster,
    assets: input.assets,
  })

  const form = cloneIcs203FormState(input.currentForm)
  const entriesByPosition = projected.entriesByPosition
  const scalarValues = new Map<keyof Ics203FormState, string[]>()

  for (const [positionName, field] of Object.entries(ICS203_SCALAR_POSITION_MAP)) {
    const label = joinIcs203RosterAssignees(assigneesAtPosition(entriesByPosition, positionName))
    if (!label) continue
    const existing = scalarValues.get(field) ?? []
    existing.push(label)
    scalarValues.set(field, existing)
  }

  for (const [field, labels] of scalarValues) {
    ;(form[field] as string) = labels.join('; ')
  }

  form.agencyRepresentatives = buildAgencyRepresentatives(input.roster)

  const operationsBranches: Ics203OperationsBranch[] = []
  const operationsBranchByPosition = new Map<string, Ics203OperationsBranch>()
  const planningDivisionGroups: Ics203DivisionGroupRow[] = []
  const logisticsDivisionGroups: Ics203DivisionGroupRow[] = []

  for (const entry of projected.entries) {
    if (entry.positionType !== 'branch') continue
    if (entry.position === OPERATIONS_SECTION_CHIEF) continue
    if (!isPositionUnder(input.catalog, entry.position, OPERATIONS_SECTION_CHIEF)) continue

    const branchDirector = joinIcs203RosterAssignees(
      assigneesAtPosition(entriesByPosition, entry.position)
    )
    if (!branchDirector) continue

    const branch: Ics203OperationsBranch = {
      id: nextRowId(operationsBranches),
      branchDirector,
      deputy: '',
      divisionGroups: [],
    }
    operationsBranches.push(branch)
    operationsBranchByPosition.set(entry.position, branch)
  }

  for (const entry of projected.entries) {
    if (ICS203_SCALAR_POSITION_MAP[entry.position]) continue
    if (!entry.positionType || !DIVISION_GROUP_POSITION_TYPES.has(entry.positionType)) continue

    const reportsTo = resolvePositionReportsTo(entry.position, input.catalog)
    const assignees = assigneesAtPosition(entriesByPosition, entry.position)

    if (reportsTo && operationsBranchByPosition.has(reportsTo)) {
      const branch = operationsBranchByPosition.get(reportsTo)!
      const row = buildDivisionGroupRow(entry.position, assignees, branch.divisionGroups)
      if (row) branch.divisionGroups.push(row)
      continue
    }

    if (isPositionUnder(input.catalog, entry.position, PLANNING_SECTION_CHIEF)) {
      const row = buildDivisionGroupRow(entry.position, assignees, planningDivisionGroups)
      if (row) planningDivisionGroups.push(row)
      continue
    }

    if (isPositionUnder(input.catalog, entry.position, LOGISTICS_SECTION_CHIEF)) {
      const row = buildDivisionGroupRow(entry.position, assignees, logisticsDivisionGroups)
      if (row) logisticsDivisionGroups.push(row)
    }
  }

  form.planningDivisionGroups = planningDivisionGroups
  form.logisticsDivisionGroups = logisticsDivisionGroups
  form.operationsBranches = operationsBranches

  const filledFieldCount =
    countFilledScalars(form) +
    countAgencyRows(form.agencyRepresentatives) +
    countDivisionGroups(form.planningDivisionGroups) +
    countDivisionGroups(form.logisticsDivisionGroups) +
    countOperationsBranches(form.operationsBranches)

  return { form, filledFieldCount }
}
