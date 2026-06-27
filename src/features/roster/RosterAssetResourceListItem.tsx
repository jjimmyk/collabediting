import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ResourceListItemData } from '@/features/resources/types'
import { ResourceListItemCard } from '@/features/resources/ResourceListItemCard'
import {
  AssetPointOfContactSelect,
  PositionAssetRow,
} from '@/features/roster/PositionRosterAssetSections'
import { PositionRosterItemActions } from '@/features/roster/PositionRosterItemActions'
import { CompetencyFunctionSelect } from '@/features/roster/CompetencyFunctionSelect'
import { AssetOrgChartPlacementSelect } from '@/features/resources/AssetOrgChartPlacementSelect'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { PositionAssetRosterEntry } from '@/lib/workspace-position-asset-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { Ics215HaveLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import { RosterHaveLinkIndicator } from '@/features/roster/RosterHaveLinkIndicator'
import { cn } from '@/lib/utils'

type RosterAssetResourceListItemProps = {
  asset: PositionAssetRosterEntry
  resource?: ResourceListItemData
  glassItemBorderClasses: string
  badgeLabel: string
  secondaryBadgeLabel?: string
  showPoc?: boolean
  pocMembers?: WorkspaceRosterMember[]
  canManage: boolean
  canEditPoc?: boolean
  isBusy: boolean
  removeLabel: string
  onRemove?: () => void
  showAlsoScheduleForNextOp?: boolean
  onAlsoScheduleForNextOp?: () => void
  onUpdateAssetPointOfContact?: (assetKey: string, memberId: string | null) => void
  competencyOptions?: string[]
  canEditCompetencyFunction?: boolean
  isUpdatingCompetency?: boolean
  onUpdateAssetCompetencyFunction?: (assetKey: string, value: string | null) => void
  onFocusMap?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: 'default' | 'orgChart'
  orgChartReportsTo?: string | null
  positionCatalog?: WorkspacePositionCatalog
  isSavingOrgChartPlacement?: boolean
  onOrgChartPlacementChange?: (reportsTo: string | null) => void
}

export function RosterAssetResourceListItem({
  asset,
  resource,
  glassItemBorderClasses,
  badgeLabel,
  secondaryBadgeLabel,
  showPoc = true,
  pocMembers = [],
  canManage,
  canEditPoc = false,
  isBusy,
  removeLabel,
  onRemove,
  showAlsoScheduleForNextOp = false,
  onAlsoScheduleForNextOp,
  onUpdateAssetPointOfContact,
  competencyOptions = [],
  canEditCompetencyFunction = false,
  isUpdatingCompetency = false,
  onUpdateAssetCompetencyFunction,
  onFocusMap,
  open,
  onOpenChange,
  variant = 'default',
  orgChartReportsTo = null,
  positionCatalog,
  isSavingOrgChartPlacement = false,
  onOrgChartPlacementChange,
  haveLinkLocation,
  activeHaveCell,
  highlightedHaveRef,
  assetHaveRef,
}: RosterAssetResourceListItemProps & {
  haveLinkLocation?: Ics215HaveLinkLocation | null
  activeHaveCell?: { rowId: number; columnId: string } | null
  highlightedHaveRef?: string | null
  assetHaveRef?: string
}) {
  const isHighlighted = Boolean(assetHaveRef && highlightedHaveRef === assetHaveRef)
  if (!resource) {
    if (!onUpdateAssetPointOfContact) {
      return null
    }

    return (
      <PositionAssetRow
        asset={asset}
        badgeLabel={badgeLabel}
        pocMembers={pocMembers}
        canManage={canManage}
        canEditPoc={canEditPoc}
        isBusy={isBusy}
        removeLabel={removeLabel}
        onRemove={onRemove}
        onUpdateAssetPointOfContact={onUpdateAssetPointOfContact}
        canEditCompetencyFunction={canEditCompetencyFunction}
        competencyOptions={competencyOptions}
        isUpdatingCompetency={isUpdatingCompetency}
        onUpdateAssetCompetencyFunction={onUpdateAssetCompetencyFunction}
      />
    )
  }

  return (
    <div className={cn(isHighlighted && 'rounded-md ring-2 ring-primary/40 ring-offset-1')}>
    <ResourceListItemCard
      resource={resource}
      variant={variant}
      glassItemBorderClasses={glassItemBorderClasses}
      editable={false}
      showEditButton={false}
      showMapAction={Boolean(onFocusMap)}
      open={open}
      onOpenChange={onOpenChange}
      onFocusMap={onFocusMap}
      headerAddon={
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
            Asset
          </Badge>
          <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
            {badgeLabel}
          </Badge>
          {secondaryBadgeLabel ? (
            <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
              {secondaryBadgeLabel}
            </Badge>
          ) : null}
          <RosterHaveLinkIndicator
            location={haveLinkLocation}
            activeHaveCell={activeHaveCell}
            compact
          />
          {showPoc && !asset.pointOfContactMemberId && !asset.pointOfContactEmail ? (
            <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
              POC required
            </Badge>
          ) : null}
        </div>
      }
      headerActions={
        canManage && (onRemove || showAlsoScheduleForNextOp) ? (
          <PositionRosterItemActions
            disabled={isBusy}
            showScheduleForNextOp={showAlsoScheduleForNextOp}
            onScheduleForNextOp={onAlsoScheduleForNextOp}
            showRemove={Boolean(onRemove)}
            onRemove={onRemove}
            removeLabel={removeLabel}
            stopActionPropagation
          />
        ) : null
      }
      footerAddon={
        <>
          {variant === 'orgChart' && positionCatalog && onOrgChartPlacementChange ? (
            <div className="border-t px-3 py-2" onClick={(event) => event.stopPropagation()}>
              <AssetOrgChartPlacementSelect
                value={orgChartReportsTo}
                catalog={positionCatalog}
                disabled={!canManage || isBusy || isSavingOrgChartPlacement}
                onChange={onOrgChartPlacementChange}
              />
            </div>
          ) : null}
          {showPoc && onUpdateAssetPointOfContact ? (
            <div className="border-t px-3 py-2" onClick={(event) => event.stopPropagation()}>
              <AssetPointOfContactSelect
                assetKey={asset.assetKey}
                value={asset.pointOfContactMemberId}
                members={pocMembers}
                disabled={!canEditPoc || isBusy}
                compact
                onChange={(memberId) => onUpdateAssetPointOfContact(asset.assetKey, memberId)}
              />
            </div>
          ) : null}
          {onUpdateAssetCompetencyFunction ? (
            <div className="border-t px-3 py-2" onClick={(event) => event.stopPropagation()}>
              <CompetencyFunctionSelect
                value={asset.competencyFunction}
                options={competencyOptions}
                disabled={!canEditCompetencyFunction || isBusy}
                compact
                isUpdating={isUpdatingCompetency}
                onChange={(value) => onUpdateAssetCompetencyFunction(asset.assetKey, value)}
              />
            </div>
          ) : null}
        </>
      }
    />
    </div>
  )
}
