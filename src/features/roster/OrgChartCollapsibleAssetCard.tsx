import type { ResourceListItemData } from '@/features/resources/types'
import { RosterAssetResourceListItem } from '@/features/roster/RosterAssetResourceListItem'
import {
  orgChartColorClasses,
  type OrgChartColor,
} from '@/features/roster/ics-org-chart-structure'
import { ORG_CHART_ASSET_CARD_WIDTH } from '@/features/roster/org-chart-layout-tokens'
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
  onOpenDetail?: () => void
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
  onOpenDetail,
  onRemove,
  onFocusMap,
  onUpdateAssetPointOfContact,
}: OrgChartCollapsibleAssetCardProps) {
  return (
    <button
      type="button"
      className={cn(
        'block w-full min-w-0 text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        ORG_CHART_ASSET_CARD_WIDTH
      )}
      onClick={onOpenDetail}
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
        showPoc={false}
        pocMembers={pocMembers}
        canManage={canManage}
        canEditPoc={false}
        isBusy={false}
        removeLabel={removeLabel}
        onRemove={onRemove}
        onUpdateAssetPointOfContact={onUpdateAssetPointOfContact}
        onFocusMap={onFocusMap}
      />
    </button>
  )
}
