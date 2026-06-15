import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  const options = buildAssetOrgChartReportsToOptions(catalog)

  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">Org chart placement</Label>
      <Select
        value={orgChartSelectValue(value)}
        disabled={disabled}
        onValueChange={(nextValue) => {
          onChange(orgChartValueToReportsTo(nextValue))
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Not on org chart" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
