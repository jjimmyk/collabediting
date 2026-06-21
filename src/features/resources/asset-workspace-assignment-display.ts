import type { Ics204FormState } from '@/features/ics204/types'
import { getIcs204ResourceRowAssetKey } from '@/features/ics204/utils'
import {
  resolveIcs204AssignedUnitDisplayLabel,
  type Ics204AssignedUnitOption,
} from '@/features/ics204/ics204-assigned-unit-options'
import type { ResourceListItemData } from '@/features/resources/types'
import {
  formatOperationalPeriodLabel,
} from '@/lib/operational-period-utils'
import { formatCheckInStatusLabel } from '@/lib/roster-check-in-status'
import type { AccessibleWorkspace } from '@/lib/workspace-types'

export const UNASSIGNED_WORKSPACE_FIELD = '—'

export type ActiveWorkspaceAssetDisplayContext = {
  workspaceId: string
  operationalPeriodsEnabled: boolean
  startedOperationalPeriodCount: number
  workingOperationalPeriodNumber: number
  workingIcs204Forms: Ics204FormState[]
  currentOpIcs204Forms: Ics204FormState[]
  ics204AssigneeOptions: Ics204AssignedUnitOption[]
}

export function workspaceHasOperationalPeriods(workspace: AccessibleWorkspace): boolean {
  return (
    workspace.workspaceFormat === 'uscg-ics' && workspace.incidentComplexity === 'planning-p'
  )
}

function formIncludesAsset(form: Ics204FormState, assetKey: string): boolean {
  return form.resourcesAssigned.some(
    (row) => getIcs204ResourceRowAssetKey(row) === assetKey
  )
}

export function findIcs204AssignedUnitForAsset(
  forms: Ics204FormState[],
  assetKey: string,
  assigneeOptions: Ics204AssignedUnitOption[],
  preferredDocumentId?: string | null
): string | null {
  if (preferredDocumentId) {
    const preferredForm = forms.find((form) => form.id === preferredDocumentId)
    if (preferredForm && formIncludesAsset(preferredForm, assetKey)) {
      return resolveIcs204AssignedUnitDisplayLabel(
        preferredForm.assignedUnit,
        assigneeOptions
      )
    }
  }

  for (const form of forms) {
    if (formIncludesAsset(form, assetKey)) {
      return resolveIcs204AssignedUnitDisplayLabel(form.assignedUnit, assigneeOptions)
    }
  }

  return null
}

export function resolveAssetWorkspaceAssignmentDisplay(
  asset: ResourceListItemData,
  workspace: AccessibleWorkspace | undefined,
  activeContext: ActiveWorkspaceAssetDisplayContext | null
): Pick<
  ResourceListItemData,
  'currentOpPeriod' | 'nextOpPeriod' | 'currentOpPeriodAssignment' | 'nextOpPeriodAssignment' | 'checkInStatus'
> {
  if (!asset.assignedWorkspaceId || !workspace) {
    return {
      currentOpPeriod: UNASSIGNED_WORKSPACE_FIELD,
      nextOpPeriod: UNASSIGNED_WORKSPACE_FIELD,
      currentOpPeriodAssignment: UNASSIGNED_WORKSPACE_FIELD,
      nextOpPeriodAssignment: UNASSIGNED_WORKSPACE_FIELD,
      checkInStatus: UNASSIGNED_WORKSPACE_FIELD,
    }
  }

  const checkInStatus = formatCheckInStatusLabel(asset.assetCheckInStatus ?? 'not_arrived')

  if (!workspaceHasOperationalPeriods(workspace)) {
    return {
      currentOpPeriod: UNASSIGNED_WORKSPACE_FIELD,
      nextOpPeriod: UNASSIGNED_WORKSPACE_FIELD,
      currentOpPeriodAssignment: UNASSIGNED_WORKSPACE_FIELD,
      nextOpPeriodAssignment: UNASSIGNED_WORKSPACE_FIELD,
      checkInStatus,
    }
  }

  const currentOpPeriod =
    workspace.startedOperationalPeriodCount > 0
      ? formatOperationalPeriodLabel(workspace.startedOperationalPeriodCount)
      : UNASSIGNED_WORKSPACE_FIELD
  const nextOpPeriod = formatOperationalPeriodLabel(workspace.workingOperationalPeriodNumber)

  const canResolveIcs204 =
    activeContext !== null &&
    activeContext.workspaceId === asset.assignedWorkspaceId &&
    activeContext.operationalPeriodsEnabled

  const currentOpPeriodAssignment =
    canResolveIcs204 && workspace.startedOperationalPeriodCount > 0
      ? findIcs204AssignedUnitForAsset(
          activeContext.currentOpIcs204Forms,
          asset.assetKey,
          activeContext.ics204AssigneeOptions
        ) ?? UNASSIGNED_WORKSPACE_FIELD
      : UNASSIGNED_WORKSPACE_FIELD

  const nextOpPeriodAssignment = canResolveIcs204
    ? findIcs204AssignedUnitForAsset(
        activeContext.workingIcs204Forms,
        asset.assetKey,
        activeContext.ics204AssigneeOptions,
        asset.ics204DocumentId
      ) ?? UNASSIGNED_WORKSPACE_FIELD
    : UNASSIGNED_WORKSPACE_FIELD

  return {
    currentOpPeriod,
    nextOpPeriod,
    currentOpPeriodAssignment,
    nextOpPeriodAssignment,
    checkInStatus,
  }
}

export function enrichAssetsWithWorkspaceAssignmentDisplay(
  assets: ResourceListItemData[],
  workspacesById: Record<string, AccessibleWorkspace>,
  activeContext: ActiveWorkspaceAssetDisplayContext | null
): ResourceListItemData[] {
  return assets.map((asset) => {
    const workspace = asset.assignedWorkspaceId
      ? workspacesById[asset.assignedWorkspaceId]
      : undefined
    return {
      ...asset,
      ...resolveAssetWorkspaceAssignmentDisplay(asset, workspace, activeContext),
    }
  })
}
