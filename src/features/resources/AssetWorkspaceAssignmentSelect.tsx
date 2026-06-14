import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AssetWorkspaceOption } from '@/features/resources/types'
import { cn } from '@/lib/utils'

const UNASSIGNED_VALUE = '__unassigned__'

type AssetWorkspaceAssignmentSelectProps = {
  value: string | null
  options: AssetWorkspaceOption[]
  disabled?: boolean
  className?: string
  onChange: (workspaceId: string | null) => void
}

export function AssetWorkspaceAssignmentSelect({
  value,
  options,
  disabled = false,
  className,
  onChange,
}: AssetWorkspaceAssignmentSelectProps) {
  const incidentOptions = options.filter((option) => option.kind === 'incident')
  const exerciseOptions = options.filter((option) => option.kind === 'exercise')

  return (
    <Select
      value={value ?? UNASSIGNED_VALUE}
      disabled={disabled}
      onValueChange={(nextValue) => {
        onChange(nextValue === UNASSIGNED_VALUE ? null : nextValue)
      }}
    >
      <SelectTrigger className={cn('h-8 w-full text-xs', className)}>
        <SelectValue placeholder="Select workspace" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
        {incidentOptions.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Incidents</SelectLabel>
            {incidentOptions.map((option) => (
              <SelectItem key={option.workspaceId} value={option.workspaceId}>
                {option.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
        {exerciseOptions.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Exercises</SelectLabel>
            {exerciseOptions.map((option) => (
              <SelectItem key={option.workspaceId} value={option.workspaceId}>
                {option.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
      </SelectContent>
    </Select>
  )
}

export function getAssetWorkspaceAssignmentLabel(
  value: string | null,
  options: AssetWorkspaceOption[]
): string {
  if (!value) return 'Unassigned'
  return options.find((option) => option.workspaceId === value)?.name ?? 'Unknown workspace'
}
