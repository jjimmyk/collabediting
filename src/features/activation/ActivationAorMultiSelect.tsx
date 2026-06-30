import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ActivationAorOptionList } from '@/features/activation/ActivationAorOptionList'
import {
  buildHubAorProfileOptions,
  filterHubAorProfileOptions,
} from '@/features/hub/aor/hub-aor-profile-options'
import { formatActivationAorLabels } from '@/lib/activation-aor-location'
import { CREATE_ACTIVATION_PORTAL_Z_CLASS } from '@/lib/create-activation-navigation'
import { cn } from '@/lib/utils'

type ActivationAorMultiSelectProps = {
  id?: string
  value: string[]
  onChange: (next: string[]) => void
  onUserEdit?: () => void
}

export function ActivationAorMultiSelect({
  id = 'incident-aors',
  value,
  onChange,
  onUserEdit,
}: ActivationAorMultiSelectProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const aorOptions = useMemo(() => buildHubAorProfileOptions(), [])
  const filteredOptions = useMemo(
    () => filterHubAorProfileOptions(aorOptions, searchQuery),
    [aorOptions, searchQuery]
  )
  const displayLabel =
    value.length > 0 ? formatActivationAorLabels(value).join(', ') : 'Select AORs'

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) {
          setSearchQuery('')
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
        >
          <span className="truncate text-left">{displayLabel}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn('w-[var(--radix-dropdown-menu-trigger-width)] p-2', CREATE_ACTIVATION_PORTAL_Z_CLASS)}
      >
        <Input
          value={searchQuery}
          placeholder="Search AORs"
          className="mb-2 h-8 text-xs"
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={(event) => event.stopPropagation()}
        />
        <div className="max-h-64 overflow-y-auto">
          <ActivationAorOptionList
            options={filteredOptions}
            selectedIds={value}
            emptyMessage="No matching AORs."
            onToggle={(nodeId) => {
              onUserEdit?.()
              const isSelected = value.includes(nodeId)
              onChange(
                isSelected ? value.filter((item) => item !== nodeId) : [...value, nodeId]
              )
            }}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
