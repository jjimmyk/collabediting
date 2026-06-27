import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { Ics215HaveLinkPositionSection } from '@/features/ics215/Ics215HaveLinkPositionSection'
import { Ics215HaveRosterRefPickRow } from '@/features/ics215/Ics215HaveRosterRefPickRow'
import { buildHaveLinkPositionNodeForEntry } from '@/features/ics215/build-have-link-position-tree'
import type { HaveLinkPickMode } from '@/features/ics215/have-link-pick-mode'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { cn } from '@/lib/utils'

export function HaveLinkDetailPickShell({
  columnLabel,
  children,
  className,
}: {
  columnLabel: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-4 rounded-md border border-primary/30 bg-primary/5 p-3 space-y-2',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Link2 className="size-4 shrink-0 text-primary" aria-hidden />
        <span>Link to Have — {columnLabel}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Select this item and any nested resources to link to the active Have cell.
      </p>
      {children}
    </div>
  )
}

export function HaveLinkPositionDetailPick({
  pickMode,
  entry,
}: {
  pickMode: HaveLinkPickMode
  entry: PositionRosterEntry
}) {
  const [expanded, setExpanded] = useState(true)
  const positionNode = buildHaveLinkPositionNodeForEntry({
    entry,
    positionEntries: pickMode.positionRosterEntries,
    roster: pickMode.roster,
    assetsByKey: pickMode.assetsByKey,
    showPositionAssets: pickMode.showPositionAssets,
  })

  if (!positionNode) return null

  return (
    <HaveLinkDetailPickShell columnLabel={pickMode.columnLabel}>
      <Ics215HaveLinkPositionSection
        node={positionNode}
        positionEntry={entry}
        expanded={expanded}
        onExpandedChange={setExpanded}
        selectedRefs={pickMode.selectedRefs}
        linkedToThisCellRefs={pickMode.linkedToThisCellRefs}
        linkedRefLocations={pickMode.linkedRefLocations}
        onToggleRef={pickMode.onToggleRef}
        onTogglePositionRefs={pickMode.onTogglePositionRefs}
        onUnlinkFromElsewhere={pickMode.onUnlinkFromOtherCell}
        rosterActions={pickMode.rosterActions}
      />
    </HaveLinkDetailPickShell>
  )
}

export function HaveLinkSingleRefDetailPick({
  pickMode,
  ref,
  label,
}: {
  pickMode: HaveLinkPickMode
  ref: string
  label: string
}) {
  const option = pickMode.optionByValue.get(ref)
  if (!option) return null

  const linkedElsewhere = pickMode.linkedRefLocations.get(ref)
  const linkedToThisCell = pickMode.linkedToThisCellRefs.has(ref)

  return (
    <HaveLinkDetailPickShell columnLabel={pickMode.columnLabel}>
      <Ics215HaveRosterRefPickRow
        option={option}
        checked={pickMode.selectedRefs.has(ref)}
        linkedToThisCell={linkedToThisCell}
        linkedElsewhere={linkedElsewhere}
        onToggle={() => pickMode.onToggleRef(ref)}
        onUnlinkFromElsewhere={
          linkedElsewhere && pickMode.onUnlinkFromOtherCell
            ? () => pickMode.onUnlinkFromOtherCell?.(linkedElsewhere, ref)
            : undefined
        }
      />
    </HaveLinkDetailPickShell>
  )
}
