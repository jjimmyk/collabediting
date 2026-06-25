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
import { Input } from '@/components/ui/input'
import { Ics215HaveAssetPickCard } from '@/features/ics215/Ics215HaveAssetPickCard'
import type { Ics215HaveAssetLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import type { ResourceListItemData } from '@/features/resources/types'
import type { ScoredWorkspaceAsset } from '@/features/resources/workspace-asset-relevance'
import { rankWorkspaceAssetsForResourceQuery } from '@/features/resources/workspace-asset-relevance'
import {
  mergeSuggestedSelection,
  useHaveLinkSelection,
} from '@/features/ics215/Ics215HaveCell'
import { toast } from 'sonner'

export type Ics215HaveAssetLinkDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  columnLabel: string
  workAssignmentContext?: string
  workspaceAssets: ResourceListItemData[]
  initialSelectedKeys: string[]
  suggestedKeys?: string[]
  staleLinkedKeys?: string[]
  linkedAssetLocations?: Map<string, Ics215HaveAssetLinkLocation>
  mode: 'create' | 'review'
  isLoading?: boolean
  rankingEngine?: 'lexical' | 'openai'
  onConfirm: (selectedKeys: string[]) => void
  onUnlinkFromOtherCell?: (location: Ics215HaveAssetLinkLocation, assetKey: string) => void
}

export function Ics215HaveAssetLinkDialog({
  open,
  onOpenChange,
  columnLabel,
  workAssignmentContext,
  workspaceAssets,
  initialSelectedKeys,
  suggestedKeys = [],
  staleLinkedKeys = [],
  linkedAssetLocations = new Map(),
  mode,
  isLoading = false,
  rankingEngine,
  onConfirm,
  onUnlinkFromOtherCell,
}: Ics215HaveAssetLinkDialogProps) {
  const [filterQuery, setFilterQuery] = useState('')
  const linkedToThisCellKeys = useMemo(() => new Set(initialSelectedKeys), [initialSelectedKeys])

  const ranked = useMemo(
    () => rankWorkspaceAssetsForResourceQuery(workspaceAssets, columnLabel),
    [workspaceAssets, columnLabel]
  )

  const effectiveSuggestedKeys =
    suggestedKeys.length > 0 ? suggestedKeys : ranked.suggested.map((entry) => entry.asset.assetKey)

  const startingSelection = mergeSuggestedSelection(
    effectiveSuggestedKeys,
    initialSelectedKeys,
    mode
  )

  const [selectedKeys, toggleKey, setKeys] = useHaveLinkSelection(
    effectiveSuggestedKeys,
    startingSelection
  )

  useEffect(() => {
    if (!open) {
      setFilterQuery('')
      return
    }
    setKeys(startingSelection)
  }, [open, startingSelection.join('|')])

  const filterText = filterQuery.trim().toLowerCase()

  const filterEntries = (entries: ScoredWorkspaceAsset[]) => {
    if (!filterText) return entries
    return entries.filter((entry) => {
      const haystack = [
        entry.asset.name,
        entry.asset.type,
        entry.asset.unitName,
        entry.asset.unitType,
        entry.asset.capabilities,
        entry.asset.owner,
        entry.asset.notes,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(filterText)
    })
  }

  const allRankedEntries = useMemo(
    () => [...ranked.suggested, ...ranked.other],
    [ranked.suggested, ranked.other]
  )

  const linkedToThisCellEntries = useMemo(() => {
    const byKey = new Map(allRankedEntries.map((entry) => [entry.asset.assetKey, entry]))
    return initialSelectedKeys
      .map((key) => byKey.get(key))
      .filter((entry): entry is ScoredWorkspaceAsset => entry !== undefined)
  }, [allRankedEntries, initialSelectedKeys])

  const suggestedEntries = filterEntries(
    ranked.suggested.filter((entry) => !linkedToThisCellKeys.has(entry.asset.assetKey))
  )
  const otherEntries = filterEntries(
    ranked.other.filter((entry) => !linkedToThisCellKeys.has(entry.asset.assetKey))
  )

  const staleEntries = staleLinkedKeys.map((key) => ({
    assetKey: key,
    label: key,
  }))

  const handleToggle = (assetKey: string) => {
    if (linkedAssetLocations.has(assetKey) && !selectedKeys.has(assetKey)) {
      toast.error('Asset already linked to another Have cell', {
        description: 'Use Unlink there on that asset, or open that Have cell.',
      })
      return
    }
    toggleKey(assetKey)
  }

  const renderPickCard = (entry: ScoredWorkspaceAsset) => {
    const assetKey = entry.asset.assetKey
    const linkedElsewhere = linkedAssetLocations.get(assetKey)
    const linkedToThisCell = linkedToThisCellKeys.has(assetKey)
    return (
      <Ics215HaveAssetPickCard
        key={assetKey}
        entry={entry}
        checked={selectedKeys.has(assetKey)}
        linkedToThisCell={linkedToThisCell}
        linkedElsewhere={linkedElsewhere}
        onToggle={() => handleToggle(assetKey)}
        onUnlinkFromElsewhere={
          linkedElsewhere && onUnlinkFromOtherCell
            ? () => onUnlinkFromOtherCell(linkedElsewhere, assetKey)
            : undefined
        }
      />
    )
  }

  const hadInitialLinks = initialSelectedKeys.length > 0
  const clearingAllLinks = hadInitialLinks && selectedKeys.size === 0
  const confirmLabel = clearingAllLinks
    ? 'Clear Have link'
    : selectedKeys.size === 0
      ? 'Confirm'
      : 'Confirm Have link'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,48rem)] !w-[64rem] !max-w-[min(64rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:!max-w-[min(64rem,calc(100%-2rem))]">
        <DialogHeader className="shrink-0 space-y-2 border-b px-6 py-4">
          <DialogTitle>Link assets to Have — {columnLabel.trim() || 'Resource'}</DialogTitle>
          <DialogDescription>
            {workAssignmentContext
              ? `Work assignment: ${workAssignmentContext}`
              : 'Select workspace assets to reference in this Have cell.'}
            {rankingEngine ? ` Ranked via ${rankingEngine}.` : ''}
            {' Uncheck or unlink to remove assets from this cell. Each asset can only be linked to one Have cell.'}
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 space-y-2 px-6 py-3">
          <Input
            value={filterQuery}
            onChange={(event) => setFilterQuery(event.target.value)}
            placeholder="Filter assets…"
            aria-label="Filter assets"
          />
          {hadInitialLinks ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setKeys([])}
              >
                Clear all links from this cell
              </Button>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Finding likely matches…</p>
          ) : workspaceAssets.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No assets are assigned to this workspace.
            </div>
          ) : (
            <div className="space-y-4">
              {linkedToThisCellEntries.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Linked to this Have cell
                  </p>
                  <div className="space-y-2">
                    {linkedToThisCellEntries.map((entry) => renderPickCard(entry))}
                  </div>
                </div>
              ) : null}

              {staleEntries.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Previously linked (no longer assigned)
                  </p>
                  {staleEntries.map((entry) => (
                    <div
                      key={entry.assetKey}
                      className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground"
                    >
                      {entry.label}
                    </div>
                  ))}
                </div>
              ) : null}

              {suggestedEntries.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Suggested matches
                  </p>
                  <div className="space-y-2">{suggestedEntries.map((entry) => renderPickCard(entry))}</div>
                </div>
              ) : null}

              {otherEntries.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Other assigned assets
                  </p>
                  <div className="space-y-2">{otherEntries.map((entry) => renderPickCard(entry))}</div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {clearingAllLinks
              ? 'Have will be cleared and asset links removed.'
              : `Selected: ${selectedKeys.size} asset${selectedKeys.size === 1 ? '' : 's'}`}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              data-testid="ics215-have-link-confirm"
              variant={clearingAllLinks ? 'destructive' : 'default'}
              onClick={() => onConfirm([...selectedKeys])}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
