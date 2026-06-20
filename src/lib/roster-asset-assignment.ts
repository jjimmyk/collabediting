import type { RosterMemberEffectiveWhen } from '@/lib/roster-member-assignment'

export type AssetAssignmentKind = 'ics_position' | 'single_resource'

export type AddAssetToOrgChartSubmitInput = {
  assetKey: string
  assignmentKind: AssetAssignmentKind
  effectiveWhen: RosterMemberEffectiveWhen
  icsPosition: string
  orgChartReportsTo: string
  pointOfContactMemberId: string | null
}
