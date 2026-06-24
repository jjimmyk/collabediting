import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { AssetStatusIndicator } from '@/features/resources/AssetStatusIndicator'
import type { ResourceListItemData } from '@/features/resources/types'
import type { ScoredWorkspaceAsset } from '@/features/resources/workspace-asset-relevance'
import { rankWorkspaceAssetsForResourceQuery } from '@/features/resources/workspace-asset-relevance'
import {
  mergeSuggestedSelection,
  useHaveLinkSelection,
} from '@/features/ics215/Ics215HaveCell'
import { cn } from '@/lib/utils'

export type Ics215HaveAssetLinkDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  columnLabel: string
  workAssignmentContext?: string
  workspaceAssets: ResourceListItemData[]
  initialSelectedKeys: string[]
  suggestedKeys?: string[]
  staleLinkedKeys?: string[]
  linkedElsewhereCounts?: Record<string, number>
  mode: 'create' | 'review'
  isLoading?: boolean
  rankingEngine?: 'lexical' | 'openai'
  onConfirm: (selectedKeys: string[]) => void
}

function AssetPickRow({
  entry,
  checked,
  disabled,
  linkedElsewhereCount,
  onToggle,
}: {
  entry: ScoredWorkspaceAsset
  checked: boolean
  disabled?: boolean
  linkedElsewhereCount?: number
  onToggle: () => void
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 hover:bg-muted/30',
        checked && 'border-primary/40 bg-primary/5',
        disabled && 'opacity-60'
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={onToggle}
        className="mt-0.5"
        aria-label={`Select ${entry.asset.name}`}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <AssetStatusIndicator status={entry.asset.assetStatus} showLabel={false} />
          <span className="text-sm font-medium">{entry.asset.name}</span>
          <Badge variant="outline" className="text-[10px]">
            {entry.asset.type}
          </Badge>
          {linkedElsewhereCount && linkedElsewhereCount > 0 ? (
            <Badge variant="secondary" className="text-[10px]">
              Linked in {linkedElsewhereCount} other cell
              {linkedElsewhereCount === 1 ? '' : 's'}
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {entry.asset.unitName || entry.asset.unitType || entry.asset.owner || 'Assigned asset'}
        </p>
        {entry.matchReason ? (
          <p className="text-[11px] text-muted-foreground">{entry.matchReason}</p>
        ) : null}
      </div>
    </label>
  )
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
  linkedElsewhereCounts = {},
  mode,
  isLoading = false,
  rankingEngine,
  onConfirm,
}: Ics215HaveAssetLinkDialogProps) {
  const [filterQuery, setFilterQuery] = useState('')

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
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(filterText)
    })
  }

  const suggestedEntries = filterEntries(ranked.suggested)
  const otherEntries = filterEntries(ranked.other)

  const staleEntries = staleLinkedKeys.map((key) => ({
    assetKey: key,
    label: key,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link assets to Have — {columnLabel.trim() || 'Resource'}</DialogTitle>
          <DialogDescription>
            {workAssignmentContext
              ? `Work assignment: ${workAssignmentContext}`
              : 'Select workspace assets to reference in this Have cell.'}
            {rankingEngine ? ` Ranked via ${rankingEngine}.` : ''}
          </DialogDescription>
        </DialogHeader>

        <Input
          value={filterQuery}
          onChange={(event) => setFilterQuery(event.target.value)}
          placeholder="Filter assets…"
          aria-label="Filter assets"
        />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Finding likely matches…</p>
        ) : workspaceAssets.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No assets are assigned to this workspace.
          </div>
        ) : (
          <div className="max-h-[26rem] space-y-4 overflow-y-auto pr-1">
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
                {suggestedEntries.map((entry) => (
                  <AssetPickRow
                    key={entry.asset.assetKey}
                    entry={entry}
                    checked={selectedKeys.has(entry.asset.assetKey)}
                    linkedElsewhereCount={linkedElsewhereCounts[entry.asset.assetKey]}
                    onToggle={() => toggleKey(entry.asset.assetKey)}
                  />
                ))}
              </div>
            ) : null}

            {otherEntries.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Other assigned assets
                </p>
                {otherEntries.map((entry) => (
                  <AssetPickRow
                    key={entry.asset.assetKey}
                    entry={entry}
                    checked={selectedKeys.has(entry.asset.assetKey)}
                    linkedElsewhereCount={linkedElsewhereCounts[entry.asset.assetKey]}
                    onToggle={() => toggleKey(entry.asset.assetKey)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Selected: {selectedKeys.size} asset{selectedKeys.size === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              data-testid="ics215-have-link-confirm"
              onClick={() => onConfirm([...selectedKeys])}
            >
              Confirm Have link
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
