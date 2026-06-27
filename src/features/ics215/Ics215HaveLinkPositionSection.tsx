import { useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  partitionPositionChildrenByOp,
  type HaveLinkPositionChild,
  type HaveLinkPositionTreeNode,
} from '@/features/ics215/build-have-link-position-tree'
import { HaveLinkPositionOpColumn } from '@/features/ics215/HaveLinkPositionOpColumn'
import {
  canShowHaveLinkRemoveScheduledUnassign,
  invokeHaveLinkRemoveScheduledUnassign,
} from '@/features/ics215/have-link-roster-item-actions'
import type { HaveLinkRosterActions } from '@/features/ics215/have-link-roster-actions'
import { Ics215HaveRosterRefPickRow } from '@/features/ics215/Ics215HaveRosterRefPickRow'
import type { Ics215HaveLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { ROSTER_PRESENCE_LABELS } from '@/lib/work-assignment-roster-eligibility'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'

const SECTION_LABELS: Record<HaveLinkPositionChild['section'], string> = {
  people: 'People',
  assets: 'Assets',
  resource_categories: 'Resource categories',
}

function childToOption(
  child: HaveLinkPositionChild,
  group = SECTION_LABELS[child.section]
): WorkAssignmentTargetOption {
  return {
    value: child.ref,
    label: child.label,
    group,
    disabled: child.disabled,
    disabledReason: child.disabledReason,
    targetType: child.targetType,
    rosterPresence: child.presence ?? undefined,
  }
}

type Ics215HaveLinkPositionSectionProps = {
  node: HaveLinkPositionTreeNode
  positionEntry?: PositionRosterEntry | null
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  selectedRefs: Set<string>
  linkedToThisCellRefs: Set<string>
  linkedRefLocations: Map<string, Ics215HaveLinkLocation>
  onToggleRef: (ref: string) => void
  onTogglePositionRefs: (refs: string[], select: boolean) => void
  onUnlinkFromElsewhere?: (location: Ics215HaveLinkLocation, ref: string) => void
  rosterActions?: HaveLinkRosterActions
}

export function Ics215HaveLinkPositionSection({
  node,
  positionEntry = null,
  expanded,
  onExpandedChange,
  selectedRefs,
  linkedToThisCellRefs,
  linkedRefLocations,
  onToggleRef,
  onTogglePositionRefs,
  onUnlinkFromElsewhere,
  rosterActions,
}: Ics215HaveLinkPositionSectionProps) {
  const selectableRefs = node.selectableRefs
  const selectedSelectableCount = selectableRefs.filter((ref) => selectedRefs.has(ref)).length
  const selectAllChecked: boolean | 'indeterminate' =
    selectableRefs.length === 0
      ? false
      : selectedSelectableCount === 0
        ? false
        : selectedSelectableCount === selectableRefs.length
          ? true
          : 'indeterminate'

  const { currentOp, nextOp, scheduledUnassignCategories } = useMemo(
    () => partitionPositionChildrenByOp(node),
    [node]
  )

  const summaryParts = [
    node.summary.currentOp > 0 ? `${node.summary.currentOp} current OP` : null,
    node.summary.nextOp > 0 ? `${node.summary.nextOp} next OP` : null,
    node.summary.linkableNextOp > 0 ? `${node.summary.linkableNextOp} linkable for Have` : null,
    node.summary.categories > 0 ? `${node.summary.categories} categories` : null,
  ].filter(Boolean)

  return (
    <Collapsible open={expanded} onOpenChange={onExpandedChange}>
      <div className="rounded-md border">
        <div className="flex items-start gap-2 px-3 py-2">
          <Checkbox
            checked={selectAllChecked}
            disabled={selectableRefs.length === 0}
            onCheckedChange={(checked) => {
              onTogglePositionRefs(selectableRefs, checked === true)
            }}
            className="mt-0.5"
            aria-label={`Select all linkable items for ${node.position}`}
          />
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-auto min-w-0 flex-1 justify-start gap-2 px-1 py-0.5 text-left"
              aria-expanded={expanded}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{node.position}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {ROSTER_PRESENCE_LABELS[node.presence]}
                  </Badge>
                  {node.isPlanned ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Planned
                    </Badge>
                  ) : null}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {summaryParts.length > 0 ? summaryParts.join(' · ') : 'No linkable items'}
                </p>
              </div>
            </Button>
          </CollapsibleTrigger>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 shrink-0 px-2 text-[10px]"
            disabled={selectableRefs.length === 0}
            onClick={() =>
              onTogglePositionRefs(
                selectableRefs,
                selectedSelectableCount !== selectableRefs.length
              )
            }
          >
            Select all
          </Button>
        </div>

        <CollapsibleContent className="space-y-3 border-t px-3 py-3">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Assigned to Position
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <HaveLinkPositionOpColumn
                title="Current OP"
                emptyMessage="No one, asset, or category assigned for current OP."
                op="current"
                position={node.position}
                positionEntry={positionEntry}
                memberSchedulePolicy={node.memberSchedulePolicy}
                showPositionAssets={node.showPositionAssets}
                children={currentOp}
                rosterActions={rosterActions}
                selectedRefs={selectedRefs}
                linkedToThisCellRefs={linkedToThisCellRefs}
                linkedRefLocations={linkedRefLocations}
                onToggleRef={onToggleRef}
                onUnlinkFromElsewhere={onUnlinkFromElsewhere}
              />
              <HaveLinkPositionOpColumn
                title="Next OP"
                emptyMessage="No one, asset, or category scheduled for next OP."
                op="next"
                position={node.position}
                positionEntry={positionEntry}
                memberSchedulePolicy={node.memberSchedulePolicy}
                showPositionAssets={node.showPositionAssets}
                children={nextOp}
                rosterActions={rosterActions}
                selectedRefs={selectedRefs}
                linkedToThisCellRefs={linkedToThisCellRefs}
                linkedRefLocations={linkedRefLocations}
                onToggleRef={onToggleRef}
                onUnlinkFromElsewhere={onUnlinkFromElsewhere}
              />
            </div>
          </div>

          {scheduledUnassignCategories.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Scheduled unassign (next OP)
              </p>
              <div className="space-y-2">
                {scheduledUnassignCategories.map((child) => {
                  const showRemove =
                    rosterActions &&
                    canShowHaveLinkRemoveScheduledUnassign(
                      child,
                      rosterActions,
                      node.memberSchedulePolicy
                    )
                  const isBusy = rosterActions?.isPositionBusy(node.position) ?? false

                  return (
                  <Ics215HaveRosterRefPickRow
                    key={child.ref}
                    option={childToOption(child)}
                    checked={selectedRefs.has(child.ref)}
                    disabled={child.disabled}
                    linkSelectable={child.linkableForHave}
                    linkedToThisCell={linkedToThisCellRefs.has(child.ref)}
                    linkedElsewhere={linkedRefLocations.get(child.ref)}
                    onToggle={() => onToggleRef(child.ref)}
                    onUnlinkFromElsewhere={
                      linkedRefLocations.get(child.ref) && onUnlinkFromElsewhere
                        ? () =>
                            onUnlinkFromElsewhere(linkedRefLocations.get(child.ref)!, child.ref)
                        : undefined
                    }
                    showRemove={showRemove}
                    onRemove={
                      rosterActions
                        ? () =>
                            invokeHaveLinkRemoveScheduledUnassign(
                              child,
                              node.position,
                              positionEntry ?? null,
                              rosterActions
                            )
                        : undefined
                    }
                    removeLabel={`Remove ${child.label}`}
                    rosterActionsDisabled={isBusy}
                  />
                  )
                })}
              </div>
            </div>
          ) : null}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export function Ics215HaveLinkFlatRefSection({
  title,
  description,
  children: items,
  selectedRefs,
  linkedToThisCellRefs,
  linkedRefLocations,
  onToggleRef,
  onUnlinkFromElsewhere,
}: {
  title: string
  description?: string
  children: HaveLinkPositionChild[]
  selectedRefs: Set<string>
  linkedToThisCellRefs: Set<string>
  linkedRefLocations: Map<string, Ics215HaveLinkLocation>
  onToggleRef: (ref: string) => void
  onUnlinkFromElsewhere?: (location: Ics215HaveLinkLocation, ref: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        {description ? <p className="text-[11px] text-muted-foreground">{description}</p> : null}
      </div>
      <div className="space-y-2">
        {items.map((child) => (
          <Ics215HaveRosterRefPickRow
            key={child.ref}
            option={childToOption(child)}
            checked={selectedRefs.has(child.ref)}
            disabled={child.disabled}
            linkSelectable={child.linkableForHave}
            linkedToThisCell={linkedToThisCellRefs.has(child.ref)}
            linkedElsewhere={linkedRefLocations.get(child.ref)}
            onToggle={() => onToggleRef(child.ref)}
            onUnlinkFromElsewhere={
              linkedRefLocations.get(child.ref) && onUnlinkFromElsewhere
                ? () => onUnlinkFromElsewhere(linkedRefLocations.get(child.ref)!, child.ref)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}
