import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  buildHaveLinkPositionTree,
  filterHaveLinkPositionTree,
} from '@/features/ics215/build-have-link-position-tree'
import {
  Ics215HaveLinkFlatRefSection,
  Ics215HaveLinkPositionSection,
} from '@/features/ics215/Ics215HaveLinkPositionSection'
import { Ics215HaveAssetPickCard } from '@/features/ics215/Ics215HaveAssetPickCard'
import { Ics215HaveRosterRefPickRow, isRosterHaveLinkOption } from '@/features/ics215/Ics215HaveRosterRefPickRow'
import type { Ics215HaveLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import {
  assetKeyToHaveRef,
  resolveAssetKeyFromHaveRef,
} from '@/features/ics215/ics215-have-asset-link'
import type { ResourceListItemData } from '@/features/resources/types'
import type { ScoredWorkspaceAsset } from '@/features/resources/workspace-asset-relevance'
import { rankWorkspaceAssetsForResourceQuery } from '@/features/resources/workspace-asset-relevance'
import {
  mergeSuggestedSelection,
  useHaveLinkSelection,
} from '@/features/ics215/Ics215HaveCell'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { HaveLinkRosterActions } from '@/features/ics215/have-link-roster-actions'
import { toast } from 'sonner'

export type Ics215HaveRosterLinkDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  columnLabel: string
  workAssignmentContext?: string
  workspaceAssets: ResourceListItemData[]
  haveLinkTargetOptions: WorkAssignmentTargetOption[]
  positionRosterEntries?: PositionRosterEntry[]
  roster?: WorkspaceRosterMember[]
  initialSelectedRefs: string[]
  suggestedRefs?: string[]
  staleLinkedRefs?: string[]
  linkedRefLocations?: Map<string, Ics215HaveLinkLocation>
  mode: 'create' | 'review'
  isLoading?: boolean
  rankingEngine?: 'lexical' | 'openai'
  onConfirm: (selectedRefs: string[]) => void
  onUnlinkFromOtherCell?: (location: Ics215HaveLinkLocation, ref: string) => void
  createHaveLinkRosterActions?: (
    onAssignmentAdded?: (ref: string) => void
  ) => HaveLinkRosterActions | undefined
  showPositionAssets?: boolean
}

export function Ics215HaveRosterLinkDialog({
  open,
  onOpenChange,
  columnLabel,
  workAssignmentContext,
  workspaceAssets,
  haveLinkTargetOptions,
  positionRosterEntries = [],
  roster = [],
  initialSelectedRefs,
  suggestedRefs = [],
  staleLinkedRefs = [],
  linkedRefLocations = new Map(),
  mode,
  isLoading = false,
  rankingEngine,
  onConfirm,
  onUnlinkFromOtherCell,
  createHaveLinkRosterActions,
  showPositionAssets = true,
}: Ics215HaveRosterLinkDialogProps) {
  const [filterQuery, setFilterQuery] = useState('')
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set())
  const linkedToThisCellRefs = useMemo(() => new Set(initialSelectedRefs), [initialSelectedRefs])

  const assetsByKey = useMemo(
    () => Object.fromEntries(workspaceAssets.map((asset) => [asset.assetKey, asset])),
    [workspaceAssets]
  )

  const positionEntriesByPosition = useMemo(
    () => Object.fromEntries(positionRosterEntries.map((entry) => [entry.position, entry])),
    [positionRosterEntries]
  )

  const positionTree = useMemo(() => {
    const built = buildHaveLinkPositionTree({
      positionEntries: positionRosterEntries,
      roster,
      assetsByKey,
      showPositionAssets,
    })
    return filterHaveLinkPositionTree(built, filterQuery)
  }, [assetsByKey, filterQuery, positionRosterEntries, roster, showPositionAssets])

  const ranked = useMemo(
    () => rankWorkspaceAssetsForResourceQuery(workspaceAssets, columnLabel),
    [workspaceAssets, columnLabel]
  )

  const effectiveSuggestedRefs =
    suggestedRefs.length > 0
      ? suggestedRefs
      : ranked.suggested.map((entry) =>
          assetKeyToHaveRef(entry.asset.assetKey, haveLinkTargetOptions)
        )

  const startingSelection = mergeSuggestedSelection(
    effectiveSuggestedRefs,
    initialSelectedRefs,
    mode
  )

  const [selectedRefs, toggleRef, setRefs] = useHaveLinkSelection(
    effectiveSuggestedRefs,
    startingSelection
  )

  useEffect(() => {
    if (!open) {
      setFilterQuery('')
      setExpandedPositions(new Set())
      return
    }
    setRefs(startingSelection)
    const nextExpanded = new Set<string>()
    for (const node of positionTree.positions) {
      const hasLinkedHere = [...initialSelectedRefs, ...startingSelection].some(
        (ref) =>
          node.selectableRefs.includes(ref) ||
          node.children.some((child) => child.ref === ref)
      )
      if (hasLinkedHere || filterQuery.trim().length > 0) {
        nextExpanded.add(node.position)
      }
    }
    setExpandedPositions(nextExpanded)
  }, [open, startingSelection.join('|'), filterQuery, initialSelectedRefs.join('|'), positionTree.positions.map((node) => node.position).join('|')])

  const optionByValue = useMemo(
    () => new Map(haveLinkTargetOptions.map((option) => [option.value, option])),
    [haveLinkTargetOptions]
  )

  const linkedToThisCellRosterOptions = initialSelectedRefs
    .map((ref) => optionByValue.get(ref))
    .filter((option): option is WorkAssignmentTargetOption => Boolean(option && isRosterHaveLinkOption(option)))

  const linkedToThisCellAssetEntries = useMemo(() => {
    const byKey = new Map(
      [...ranked.suggested, ...ranked.other].map((entry) => [entry.asset.assetKey, entry])
    )
    return initialSelectedRefs
      .map((ref) => resolveAssetKeyFromHaveRef(ref))
      .filter((key): key is string => Boolean(key))
      .map((key) => byKey.get(key))
      .filter((entry): entry is ScoredWorkspaceAsset => entry !== undefined)
  }, [ranked.suggested, ranked.other, initialSelectedRefs])

  const handleToggleRef = (ref: string) => {
    if (linkedRefLocations.has(ref) && !selectedRefs.has(ref)) {
      toast.error('Already linked to another Have cell', {
        description: 'Use Unlink there on that item, or open that Have cell.',
      })
      return
    }
    toggleRef(ref)
  }

  const handleAssignmentAdded = useCallback(
    (ref: string) => {
      if (linkedRefLocations.has(ref) && !linkedToThisCellRefs.has(ref)) {
        return
      }
      if (!selectedRefs.has(ref)) {
        toggleRef(ref)
      }
    },
    [linkedRefLocations, linkedToThisCellRefs, selectedRefs, toggleRef]
  )

  const rosterActions = useMemo(
    () => createHaveLinkRosterActions?.(handleAssignmentAdded),
    [createHaveLinkRosterActions, handleAssignmentAdded]
  )

  const handleTogglePositionRefs = (refs: string[], select: boolean) => {
    if (select) {
      for (const ref of refs) {
        if (selectedRefs.has(ref)) continue
        if (linkedRefLocations.has(ref) && !linkedToThisCellRefs.has(ref)) continue
        toggleRef(ref)
      }
      return
    }
    for (const ref of refs) {
      if (selectedRefs.has(ref)) toggleRef(ref)
    }
  }

  const renderAssetPickCard = (entry: ScoredWorkspaceAsset) => {
    const assetKey = entry.asset.assetKey
    const ref = assetKeyToHaveRef(assetKey, haveLinkTargetOptions)
    const linkedElsewhere = linkedRefLocations.get(ref)
    const linkedToThisCell = linkedToThisCellRefs.has(ref)
    return (
      <Ics215HaveAssetPickCard
        key={ref}
        entry={entry}
        checked={selectedRefs.has(ref)}
        linkedToThisCell={linkedToThisCell}
        linkedElsewhere={linkedElsewhere}
        onToggle={() => handleToggleRef(ref)}
        onUnlinkFromElsewhere={
          linkedElsewhere && onUnlinkFromOtherCell
            ? () => onUnlinkFromOtherCell(linkedElsewhere, ref)
            : undefined
        }
      />
    )
  }

  const renderRosterOption = (option: WorkAssignmentTargetOption) => {
    const linkedElsewhere = linkedRefLocations.get(option.value)
    const linkedToThisCell = linkedToThisCellRefs.has(option.value)
    return (
      <Ics215HaveRosterRefPickRow
        key={option.value}
        option={option}
        checked={selectedRefs.has(option.value)}
        linkedToThisCell={linkedToThisCell}
        linkedElsewhere={linkedElsewhere}
        onToggle={() => handleToggleRef(option.value)}
        onUnlinkFromElsewhere={
          linkedElsewhere && onUnlinkFromOtherCell
            ? () => onUnlinkFromOtherCell(linkedElsewhere, option.value)
            : undefined
        }
      />
    )
  }

  const suggestedAssetEntries = ranked.suggested.filter((entry) => {
    const ref = assetKeyToHaveRef(entry.asset.assetKey, haveLinkTargetOptions)
    return !linkedToThisCellRefs.has(ref)
  })
  const otherAssetEntries = ranked.other.filter((entry) => {
    const ref = assetKeyToHaveRef(entry.asset.assetKey, haveLinkTargetOptions)
    return !linkedToThisCellRefs.has(ref)
  })

  const filterAssetEntries = (entries: ScoredWorkspaceAsset[]) => {
    const filterText = filterQuery.trim().toLowerCase()
    if (!filterText) return entries
    return entries.filter((entry) => {
      const haystack = [
        entry.asset.name,
        entry.asset.type,
        entry.asset.unitName,
        entry.asset.unitType,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(filterText)
    })
  }

  const filteredSuggestedAssets = filterAssetEntries(suggestedAssetEntries)
  const filteredOtherAssets = filterAssetEntries(otherAssetEntries)

  const staleEntries = staleLinkedRefs.map((ref) => ({
    ref,
    label: optionByValue.get(ref)?.label ?? ref,
  }))

  const hadInitialLinks = initialSelectedRefs.length > 0
  const clearingAllLinks = hadInitialLinks && selectedRefs.size === 0
  const confirmLabel = clearingAllLinks
    ? 'Clear Have link'
    : selectedRefs.size === 0
      ? 'Confirm'
      : 'Confirm Have link'

  const hasPositionTree =
    positionTree.positions.length > 0 ||
    positionTree.singleResources.length > 0 ||
    positionTree.orgChartAssets.length > 0
  const hasAssetItems =
    linkedToThisCellAssetEntries.length > 0 ||
    filteredSuggestedAssets.length > 0 ||
    filteredOtherAssets.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(85vh,48rem)] max-h-[min(85vh,48rem)] !w-[64rem] !max-w-[min(64rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:!max-w-[min(64rem,calc(100%-2rem))]">
        <DialogHeader className="shrink-0 space-y-2 border-b px-6 py-4">
          <DialogTitle>Link roster resources to Have — {columnLabel.trim() || 'Resource'}</DialogTitle>
          <DialogDescription>
            {workAssignmentContext
              ? `Work assignment: ${workAssignmentContext}`
              : 'Expand a position to link items scheduled for next OP, or add assignees for next OP.'}
            {rankingEngine ? ` Asset suggestions ranked via ${rankingEngine}.` : ''}
            {' Only next-OP scheduled roster items can be linked. Use "Also schedule for next OP" on current assignees to link them.'}
            {' Each item can only be linked to one Have cell.'}
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 space-y-2 px-6 py-3">
          <Input
            value={filterQuery}
            onChange={(event) => setFilterQuery(event.target.value)}
            placeholder="Filter roster items and assets…"
            aria-label="Filter roster items and assets"
          />
          {hadInitialLinks ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setRefs([])}
              >
                Clear all links from this cell
              </Button>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Finding likely asset matches…</p>
          ) : haveLinkTargetOptions.length === 0 && workspaceAssets.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No roster or asset items are available for this workspace.
            </div>
          ) : (
            <div className="space-y-4">
              {linkedToThisCellRosterOptions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Linked roster items
                  </p>
                  <div className="space-y-2">
                    {linkedToThisCellRosterOptions.map((option) => renderRosterOption(option))}
                  </div>
                </div>
              ) : null}

              {linkedToThisCellAssetEntries.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Linked assets
                  </p>
                  <div className="space-y-2">
                    {linkedToThisCellAssetEntries.map((entry) => renderAssetPickCard(entry))}
                  </div>
                </div>
              ) : null}

              {staleEntries.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Previously linked (no longer eligible)
                  </p>
                  {staleEntries.map((entry) => (
                    <div
                      key={entry.ref}
                      className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground"
                    >
                      {entry.label}
                    </div>
                  ))}
                </div>
              ) : null}

              {hasPositionTree ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Roster by position
                  </p>
                  <div className="space-y-2">
                    {positionTree.positions.map((node) => (
                      <Ics215HaveLinkPositionSection
                        key={node.position}
                        node={node}
                        positionEntry={positionEntriesByPosition[node.position] ?? null}
                        expanded={expandedPositions.has(node.position)}
                        onExpandedChange={(nextExpanded) => {
                          setExpandedPositions((previous) => {
                            const next = new Set(previous)
                            if (nextExpanded) next.add(node.position)
                            else next.delete(node.position)
                            return next
                          })
                        }}
                        selectedRefs={selectedRefs}
                        linkedToThisCellRefs={linkedToThisCellRefs}
                        linkedRefLocations={linkedRefLocations}
                        onToggleRef={handleToggleRef}
                        onTogglePositionRefs={handleTogglePositionRefs}
                        onUnlinkFromElsewhere={onUnlinkFromOtherCell}
                        rosterActions={rosterActions}
                      />
                    ))}
                  </div>
                  <Ics215HaveLinkFlatRefSection
                    title="Single resources"
                    description="Org-chart single resources not tied to a position row."
                    selectedRefs={selectedRefs}
                    linkedToThisCellRefs={linkedToThisCellRefs}
                    linkedRefLocations={linkedRefLocations}
                    onToggleRef={handleToggleRef}
                    onUnlinkFromElsewhere={onUnlinkFromOtherCell}
                  >
                    {positionTree.singleResources.filter(
                      (child) => !linkedToThisCellRefs.has(child.ref)
                    )}
                  </Ics215HaveLinkFlatRefSection>
                  <Ics215HaveLinkFlatRefSection
                    title="Org chart assets"
                    description="Assets on the org chart not already listed under a position."
                    selectedRefs={selectedRefs}
                    linkedToThisCellRefs={linkedToThisCellRefs}
                    linkedRefLocations={linkedRefLocations}
                    onToggleRef={handleToggleRef}
                    onUnlinkFromElsewhere={onUnlinkFromOtherCell}
                  >
                    {positionTree.orgChartAssets.filter(
                      (child) => !linkedToThisCellRefs.has(child.ref)
                    )}
                  </Ics215HaveLinkFlatRefSection>
                </div>
              ) : null}

              {filteredSuggestedAssets.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Suggested asset matches
                  </p>
                  <div className="space-y-2">
                    {filteredSuggestedAssets.map((entry) => renderAssetPickCard(entry))}
                  </div>
                </div>
              ) : null}

              {filteredOtherAssets.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Other assets assigned to this incident
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Not on the org-chart roster; available because the asset is assigned to this
                    incident.
                  </p>
                  <div className="space-y-2">
                    {filteredOtherAssets.map((entry) => renderAssetPickCard(entry))}
                  </div>
                </div>
              ) : null}

              {!hasPositionTree && !hasAssetItems && staleEntries.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No matching roster items for this filter.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t bg-background px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {clearingAllLinks
              ? 'Have will be cleared and roster links removed.'
              : `Selected: ${selectedRefs.size} item${selectedRefs.size === 1 ? '' : 's'}`}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              data-testid="ics215-have-link-confirm"
              variant={clearingAllLinks ? 'destructive' : 'default'}
              onClick={() => onConfirm([...selectedRefs])}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** @deprecated Use Ics215HaveRosterLinkDialog */
export const Ics215HaveAssetLinkDialog = Ics215HaveRosterLinkDialog

export type Ics215HaveAssetLinkDialogProps = Ics215HaveRosterLinkDialogProps
