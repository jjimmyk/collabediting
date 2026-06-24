import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { buildReportsToOptions, type WorkspacePositionCatalog } from '@/features/roster/workspace-positions'

type OrgChartReportsToFieldProps = {
  id?: string
  value: string | null
  catalog: WorkspacePositionCatalog
  editable?: boolean
  disabled?: boolean
  label?: string
  onValueChange?: (reportsTo: string) => void
}

export function OrgChartReportsToField({
  id,
  value,
  catalog,
  editable = false,
  disabled = false,
  label = 'Reports to',
  onValueChange,
}: OrgChartReportsToFieldProps) {
  const options = useMemo(() => {
    const positions = buildReportsToOptions(catalog)
    return positions.map((position) => ({ value: position, label: position }))
  }, [catalog])

  if (!editable) {
    return (
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">{label}</Label>
        <p className="text-sm text-foreground">{value ?? '—'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] text-muted-foreground">
        {label}
      </Label>
      <SearchableSelect
        id={id}
        value={value ?? ''}
        onValueChange={(nextValue) => onValueChange?.(nextValue)}
        options={options}
        placeholder="Select position"
        searchPlaceholder="Search positions…"
        emptyMessage="No positions found."
        disabled={disabled || !onValueChange}
        triggerClassName="h-8 text-xs"
      />
    </div>
  )
}
