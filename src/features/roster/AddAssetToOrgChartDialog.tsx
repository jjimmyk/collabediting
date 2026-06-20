import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ResourceListItemData } from '@/features/resources/types'
import { ICS_ORG_CHART_ROOT_POSITION } from '@/features/roster/ics-org-chart-structure'
import {
  assetEffectiveWhenSummary,
  validateAssetEffectiveWhen,
} from '@/features/roster/roster-asset-effective-when'
import { validateAssetOrgChartReportsTo } from '@/features/roster/workspace-asset-org-chart'
import { buildReportsToOptions, type WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { AddAssetToOrgChartSubmitInput, AssetAssignmentKind } from '@/lib/roster-asset-assignment'
import type { RosterMemberEffectiveWhen } from '@/lib/roster-member-assignment'
import { assetsAssignableToPosition } from '@/lib/workspace-position-asset-roster'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { cn } from '@/lib/utils'

type AddAssetToOrgChartDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSupabaseEnabled: boolean
  operationalPeriodsEnabled: boolean
  assets: ResourceListItemData[]
  workspaceAssignedAssets: ResourceListItemData[]
  assetSchedulesByPosition: Record<string, { assignAssetKeys: string[]; unassignAssetKeys: string[] }>
  positionAssetsByPosition: Record<string, { assetKey: string }[]>
  catalog: WorkspacePositionCatalog
  pocMembers: WorkspaceRosterMember[]
  isSaving?: boolean
  onSubmit: (input: AddAssetToOrgChartSubmitInput) => Promise<void>
}

export function AddAssetToOrgChartDialog({
  open,
  onOpenChange,
  isSupabaseEnabled,
  operationalPeriodsEnabled,
  assets,
  workspaceAssignedAssets,
  assetSchedulesByPosition,
  positionAssetsByPosition,
  catalog,
  pocMembers,
  isSaving = false,
  onSubmit,
}: AddAssetToOrgChartDialogProps) {
  const [assignmentKind, setAssignmentKind] = useState<AssetAssignmentKind>('single_resource')
  const [effectiveWhen, setEffectiveWhen] = useState<RosterMemberEffectiveWhen>('now')
  const [assetKeyDraft, setAssetKeyDraft] = useState('')
  const [icsPositionDraft, setIcsPositionDraft] = useState<string>('Incident Commander')
  const [orgChartReportsToDraft, setOrgChartReportsToDraft] = useState<string>(
    ICS_ORG_CHART_ROOT_POSITION
  )
  const [pointOfContactMemberIdDraft, setPointOfContactMemberIdDraft] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const reportsToOptions = useMemo(() => buildReportsToOptions(catalog), [catalog])
  const positionOptions = useMemo(() => catalog.rosterPositionNames, [catalog])
  const showEffectiveWhen = operationalPeriodsEnabled && isSupabaseEnabled

  const selectableAssets = useMemo(() => {
    if (assignmentKind === 'single_resource') {
      return assets.filter(
        (asset) => !asset.orgChartReportsTo && !asset.pendingOrgChartReportsTo
      )
    }

    const activeKeys = (positionAssetsByPosition[icsPositionDraft] ?? []).map((entry) => entry.assetKey)
    const schedule = assetSchedulesByPosition[icsPositionDraft] ?? {
      assignAssetKeys: [],
      unassignAssetKeys: [],
    }

    return assetsAssignableToPosition(
      workspaceAssignedAssets.filter((asset) => !asset.orgChartReportsTo && !asset.pendingOrgChartReportsTo),
      icsPositionDraft,
      activeKeys,
      schedule.assignAssetKeys
    )
  }, [
    assetSchedulesByPosition,
    assets,
    assignmentKind,
    icsPositionDraft,
    positionAssetsByPosition,
    workspaceAssignedAssets,
  ])

  const resetDraft = () => {
    setAssignmentKind('single_resource')
    setEffectiveWhen('now')
    setAssetKeyDraft(selectableAssets[0]?.assetKey ?? assets[0]?.assetKey ?? '')
    setIcsPositionDraft(catalog.rosterPositionNames[0] ?? 'Incident Commander')
    setOrgChartReportsToDraft(ICS_ORG_CHART_ROOT_POSITION)
    setPointOfContactMemberIdDraft(pocMembers[0]?.id ?? '')
    setError(null)
  }

  useEffect(() => {
    if (!open) return
    resetDraft()
  }, [open, assets, catalog.rosterPositionNames, pocMembers])

  useEffect(() => {
    if (!selectableAssets.some((asset) => asset.assetKey === assetKeyDraft)) {
      setAssetKeyDraft(selectableAssets[0]?.assetKey ?? '')
    }
  }, [assetKeyDraft, selectableAssets])

  const orgChartValidationError =
    assignmentKind === 'single_resource'
      ? validateAssetOrgChartReportsTo(orgChartReportsToDraft, catalog)
      : null

  const effectiveWhenValidationError = validateAssetEffectiveWhen({
    effectiveWhen,
    assignmentKind,
    icsPosition: icsPositionDraft,
    orgChartReportsTo: orgChartReportsToDraft,
    pointOfContactMemberId: pointOfContactMemberIdDraft || null,
    catalog,
    operationalPeriodsEnabled: showEffectiveWhen,
  })

  const canSubmit =
    !isSaving &&
    assetKeyDraft.length > 0 &&
    !orgChartValidationError &&
    !effectiveWhenValidationError &&
    selectableAssets.length > 0 &&
    (assignmentKind === 'single_resource' || Boolean(pointOfContactMemberIdDraft))

  const handleSubmit = async () => {
    if (!assetKeyDraft) {
      setError('Select an asset.')
      return
    }
    if (effectiveWhenValidationError) {
      setError(effectiveWhenValidationError)
      return
    }
    if (orgChartValidationError) {
      setError(orgChartValidationError)
      return
    }

    setError(null)
    try {
      await onSubmit({
        assetKey: assetKeyDraft,
        assignmentKind,
        effectiveWhen,
        icsPosition: icsPositionDraft,
        orgChartReportsTo: orgChartReportsToDraft,
        pointOfContactMemberId:
          assignmentKind === 'ics_position' ? pointOfContactMemberIdDraft : null,
      })
      resetDraft()
      onOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not add asset.')
    }
  }

  const submitLabel = isSaving
    ? 'Adding…'
    : effectiveWhen === 'next_op_advance'
      ? 'Add asset (next OP)'
      : 'Add asset'

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (nextOpen) {
          resetDraft()
        } else {
          resetDraft()
        }
      }}
    >
      <DialogContent className="!w-[64rem] !max-w-[64rem] sm:!max-w-[64rem] flex max-h-[min(75vh,32rem)] flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add asset to org chart</DialogTitle>
          <DialogDescription>
            Choose an assigned asset, how it should be placed, and when the assignment takes effect.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="org-chart-asset-select">Asset</Label>
              <Select value={assetKeyDraft} onValueChange={setAssetKeyDraft}>
                <SelectTrigger id="org-chart-asset-select">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {selectableAssets.map((asset) => (
                    <SelectItem key={asset.assetKey} value={asset.assetKey}>
                      {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectableAssets.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  No eligible assets for this assignment type.
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label>Assignment</Label>
              <RadioGroup
                value={assignmentKind}
                onValueChange={(value) =>
                  setAssignmentKind(value === 'ics_position' ? 'ics_position' : 'single_resource')
                }
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm',
                    assignmentKind === 'ics_position' && 'border-primary bg-primary/5'
                  )}
                >
                  <RadioGroupItem value="ics_position" />
                  Assign ICS position
                </label>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm',
                    assignmentKind === 'single_resource' && 'border-primary bg-primary/5'
                  )}
                >
                  <RadioGroupItem value="single_resource" />
                  Add as single resource on org chart
                </label>
              </RadioGroup>
            </div>

            {showEffectiveWhen ? (
              <div className="grid gap-2">
                <Label>Effective when</Label>
                <RadioGroup
                  value={effectiveWhen}
                  onValueChange={(value) =>
                    setEffectiveWhen(value === 'next_op_advance' ? 'next_op_advance' : 'now')
                  }
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm',
                      effectiveWhen === 'now' && 'border-primary bg-primary/5'
                    )}
                  >
                    <RadioGroupItem value="now" className="mt-0.5" />
                    <span>
                      <span className="font-medium">Now</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        Assignment is active in this operational period.
                      </span>
                    </span>
                  </label>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm',
                      effectiveWhen === 'next_op_advance' && 'border-primary bg-primary/5'
                    )}
                  >
                    <RadioGroupItem value="next_op_advance" className="mt-0.5" />
                    <span>
                      <span className="font-medium">Next operational period</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        Asset stays in the workspace; assignment applies when the next OP starts.
                      </span>
                    </span>
                  </label>
                </RadioGroup>
                <p className="text-[11px] text-muted-foreground">
                  {assetEffectiveWhenSummary({
                    effectiveWhen,
                    assignmentKind,
                    icsPosition: icsPositionDraft,
                    orgChartReportsTo: orgChartReportsToDraft,
                  })}
                </p>
                {effectiveWhenValidationError ? (
                  <p className="text-xs text-destructive">{effectiveWhenValidationError}</p>
                ) : null}
              </div>
            ) : null}

            {assignmentKind === 'ics_position' ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="asset-ics-position">ICS position</Label>
                  <Select value={icsPositionDraft} onValueChange={setIcsPositionDraft}>
                    <SelectTrigger id="asset-ics-position">
                      <SelectValue placeholder="Select a position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positionOptions.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="asset-point-of-contact">Point of Contact</Label>
                  <Select
                    value={pointOfContactMemberIdDraft}
                    onValueChange={setPointOfContactMemberIdDraft}
                  >
                    <SelectTrigger id="asset-point-of-contact">
                      <SelectValue placeholder="Select a roster member" />
                    </SelectTrigger>
                    <SelectContent>
                      {pocMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="org-chart-asset-reports-to">Reports to on org chart</Label>
                <Select value={orgChartReportsToDraft} onValueChange={setOrgChartReportsToDraft}>
                  <SelectTrigger id="org-chart-asset-reports-to">
                    <SelectValue placeholder="Select a position" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportsToOptions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {orgChartValidationError ? (
                  <p className="text-xs text-destructive">{orgChartValidationError}</p>
                ) : null}
              </div>
            )}

            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={() => void handleSubmit()}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { AddAssetToOrgChartSubmitInput }
