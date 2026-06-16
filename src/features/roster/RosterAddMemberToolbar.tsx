import { Button } from '@/components/ui/button'

type RosterAddMemberToolbarProps = {
  canManageRoster: boolean
  onAddMember: () => void
  onAddPosition?: () => void
  onAddAssetToOrgChart?: () => void
}

export function RosterAddMemberToolbar({
  canManageRoster,
  onAddMember,
  onAddPosition,
  onAddAssetToOrgChart,
}: RosterAddMemberToolbarProps) {
  if (!canManageRoster) return null

  return (
    <>
      <Button type="button" size="sm" onClick={onAddMember}>
        + Add Member
      </Button>
      {onAddAssetToOrgChart ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAddAssetToOrgChart}
        >
          + Add Asset
        </Button>
      ) : null}
      {onAddPosition ? (
        <Button type="button" size="sm" variant="outline" onClick={onAddPosition}>
          + Add Position
        </Button>
      ) : null}
    </>
  )
}
