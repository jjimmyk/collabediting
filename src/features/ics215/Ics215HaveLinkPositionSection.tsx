import { useMemo } from 'react'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  getAssignedToPositionChildren,
  getAssignedToPositionSelectableRefs,
  type HaveLinkPositionChild,
  type HaveLinkPositionTreeNode,
} from '@/features/ics215/build-have-link-position-tree'
import { Ics215HaveRosterRefPickRow } from '@/features/ics215/Ics215HaveRosterRefPickRow'
import type { Ics215HaveLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import { ROSTER_PRESENCE_LABELS } from '@/lib/work-assignment-roster-eligibility'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'

export const ASSIGNED_TO_POSITION_GROUP = 'Assigned to Position'

const SECTION_LABELS: Record<HaveLinkPositionChild['section'], string> = {
  people: 'People',
  assets: 'Assets',
  resource_categories: 'Resource categories',
}

const ASSIGNED_TO_POSITION_TOOLTIP =
  'When selected, any person or asset directly assigned to this position will count toward this resource need.'

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
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  selectedRefs: Set<string>
  linkedToThisCellRefs: Set<string>
  linkedRefLocations: Map<string, Ics215HaveLinkLocation>
  onToggleRef: (ref: string) => void
  onTogglePositionRefs: (refs: string[], select: boolean) => void
  onUnlinkFromElsewhere?: (location: Ics215HaveLinkLocation, ref: string) => void
}

export function Ics215HaveLinkPositionSection({
  node,
  expanded,
  onExpandedChange,
  selectedRefs,
  linkedToThisCellRefs,
  linkedRefLocations,
  onToggleRef,
  onTogglePositionRefs,
  onUnlinkFromElsewhere,
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

  const assignedChildren = useMemo(() => getAssignedToPositionChildren(node), [node])
  const assignedSelectableRefs = useMemo(
    () => getAssignedToPositionSelectableRefs(node),
    [node]
  )
  const resourceCategoryChildren = useMemo(
    () => node.children.filter((child) => child.section === 'resource_categories'),
    [node.children]
  )

  const positionRefSelected = Boolean(node.positionRef && selectedRefs.has(node.positionRef))
  const hasSelectedAssignedChild = assignedSelectableRefs.some((ref) => selectedRefs.has(ref))

  const summaryParts = [
    node.summary.assigned > 0
      ? `${node.summary.assigned} assigned`
      : null,
    node.summary.categories > 0 ? `${node.summary.categories} categories` : null,
  ].filter(Boolean)

  const handleTogglePositionRef = () => {
    if (!node.positionRef || node.positionDisabled) {
      return
    }

    if (positionRefSelected) {
      onToggleRef(node.positionRef)
      return
    }

    for (const ref of assignedSelectableRefs) {
      if (selectedRefs.has(ref)) {
        onToggleRef(ref)
      }
    }
    onToggleRef(node.positionRef)
  }

  const handleToggleAssignedRef = (ref: string) => {
    if (node.positionRef && positionRefSelected) {
      onToggleRef(node.positionRef)
    }
    onToggleRef(ref)
  }

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
            <div className="flex items-center gap-2">
              {node.positionRef ? (
                <Checkbox
                  checked={positionRefSelected}
                  disabled={
                    node.positionDisabled ||
                    (hasSelectedAssignedChild && !positionRefSelected)
                  }
                  onCheckedChange={handleTogglePositionRef}
                  aria-label={`Select position slot for ${node.position}`}
                />
              ) : null}
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Assigned to Position
                </p>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        aria-label="About assigned to position selection"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      {ASSIGNED_TO_POSITION_TOOLTIP}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {assignedChildren.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                No direct assignees for this position.
              </p>
            ) : (
              <div className="space-y-2 pl-6">
                {assignedChildren.map((child) => {
                  const blockedByPositionRef =
                    positionRefSelected && !linkedToThisCellRefs.has(child.ref)
                  return (
                    <Ics215HaveRosterRefPickRow
                      key={child.ref}
                      option={childToOption(child, ASSIGNED_TO_POSITION_GROUP)}
                      checked={selectedRefs.has(child.ref)}
                      disabled={child.disabled || blockedByPositionRef}
                      linkedToThisCell={linkedToThisCellRefs.has(child.ref)}
                      linkedElsewhere={linkedRefLocations.get(child.ref)}
                      onToggle={() => handleToggleAssignedRef(child.ref)}
                      onUnlinkFromElsewhere={
                        linkedRefLocations.get(child.ref) && onUnlinkFromElsewhere
                          ? () =>
                              onUnlinkFromElsewhere(
                                linkedRefLocations.get(child.ref)!,
                                child.ref
                              )
                          : undefined
                      }
                    />
                  )
                })}
              </div>
            )}
          </div>

          {resourceCategoryChildren.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {SECTION_LABELS.resource_categories}
              </p>
              <div className="space-y-2">
                {resourceCategoryChildren.map((child) => (
                  <Ics215HaveRosterRefPickRow
                    key={child.ref}
                    option={childToOption(child)}
                    checked={selectedRefs.has(child.ref)}
                    disabled={child.disabled}
                    linkedToThisCell={linkedToThisCellRefs.has(child.ref)}
                    linkedElsewhere={linkedRefLocations.get(child.ref)}
                    onToggle={() => onToggleRef(child.ref)}
                    onUnlinkFromElsewhere={
                      linkedRefLocations.get(child.ref) && onUnlinkFromElsewhere
                        ? () =>
                            onUnlinkFromElsewhere(linkedRefLocations.get(child.ref)!, child.ref)
                        : undefined
                    }
                  />
                ))}
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
