import { useState } from 'react'
import type { ResourceListItemData } from '@/features/resources/types'
import { RosterAssetResourceListItem } from '@/features/roster/RosterAssetResourceListItem'
import {
  orgChartColorClasses,
  type OrgChartColor,
} from '@/features/roster/ics-org-chart-structure'
import {
  ORG_CHART_ASSET_CARD_EXPANDED_MAX_WIDTH,
  ORG_CHART_ASSET_CARD_WIDTH,
} from '@/features/roster/org-chart-layout-tokens'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { cn } from '@/lib/utils'

type OrgChartCollapsibleAssetCardProps = {
  asset: ResourceListItemData
  color?: OrgChartColor
  scheduled?: boolean
  glassItemBorderClasses: string
  canManage?: boolean
  pocMembers?: WorkspaceRosterMember[]
  removeLabel: string
  onRemove?: () => void
  onFocusMap?: () => void
  onUpdateAssetPointOfContact?: (assetKey: string, memberId: string | null) => void
}

export function OrgChartCollapsibleAssetCard({
  asset,
  color,
  scheduled = false,
  glassItemBorderClasses,
  canManage = false,
  pocMembers = [],
  removeLabel,
  onRemove,
  onFocusMap,
  onUpdateAssetPointOfContact,
}: OrgChartCollapsibleAssetCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={cn(
        'w-full min-w-0 transition-[max-width]',
        ORG_CHART_ASSET_CARD_WIDTH,
        open && ORG_CHART_ASSET_CARD_EXPANDED_MAX_WIDTH
      )}
    >
      <RosterAssetResourceListItem
        asset={{
          assetKey: asset.assetKey,
          name: asset.name,
          type: asset.type,
          pointOfContactMemberId: asset.pointOfContactMemberId,
          pointOfContactEmail: null,
        }}
        resource={asset}
        variant="orgChart"
        glassItemBorderClasses={cn(
          glassItemBorderClasses,
          'border-dashed',
          orgChartColorClasses(color)
        )}
        badgeLabel={scheduled ? 'Org chart · Next OP' : 'Org chart'}
        showPoc={Boolean(onUpdateAssetPointOfContact)}
        pocMembers={pocMembers}
        canManage={canManage}
        canEditPoc={canManage}
        isBusy={false}
        removeLabel={removeLabel}
        onRemove={onRemove}
        onUpdateAssetPointOfContact={onUpdateAssetPointOfContact}
        onFocusMap={onFocusMap}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  )
}
