import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  buildAssetOrgChartReportsToOptions,
  orgChartSelectValue,
  orgChartValueToReportsTo,
} from '@/features/roster/workspace-asset-org-chart'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'

type AssetOrgChartPlacementSelectProps = {
  value: string | null
  catalog: WorkspacePositionCatalog
  disabled?: boolean
  onChange: (reportsTo: string | null) => void
}

export function AssetOrgChartPlacementSelect({
  value,
  catalog,
  disabled = false,
  onChange,
}: AssetOrgChartPlacementSelectProps) {
  const options = buildAssetOrgChartReportsToOptions(catalog).map((option) => ({
    value: option.value,
    label: option.label,
  }))

  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">Org chart placement</Label>
      <SearchableSelect
        value={orgChartSelectValue(value)}
        onValueChange={(nextValue) => {
          onChange(orgChartValueToReportsTo(nextValue))
        }}
        options={options}
        placeholder="Not on org chart"
        searchPlaceholder="Search positions…"
        emptyMessage="No positions found."
        disabled={disabled}
        triggerClassName="h-8 text-xs"
      />
    </div>
  )
}
