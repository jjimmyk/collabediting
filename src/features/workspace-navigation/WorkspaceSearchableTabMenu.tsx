import type { ReactNode } from 'react'
import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type WorkspaceSearchableTabMenuItem = {
  id: string
  value: string
  label: string
  icon?: ReactNode
  isSelected: boolean
  onSelect: () => void
}

export type WorkspaceSearchableTabMenuGroup = {
  heading: string
  items: WorkspaceSearchableTabMenuItem[]
}

type WorkspaceSearchableTabMenuProps = {
  triggerLabel: string
  triggerAriaLabel: string
  isTriggerActive: boolean
  searchPlaceholder: string
  emptyMessage: string
  groups: WorkspaceSearchableTabMenuGroup[]
  triggerClassName?: string
  glassIconButtonClasses?: string
  selectedGlassTabClasses: (isSelected: boolean) => string
  isGlassMode: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  'data-ics201-tutorial'?: string
  'data-hub-tutorial'?: string
  'data-pratus-context-id'?: string
  'data-pratus-context-label'?: string
}

export function WorkspaceSearchableTabMenu({
  triggerLabel,
  triggerAriaLabel,
  isTriggerActive,
  searchPlaceholder,
  emptyMessage,
  groups,
  triggerClassName,
  glassIconButtonClasses,
  selectedGlassTabClasses,
  isGlassMode,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  'data-ics201-tutorial': dataIcs201Tutorial,
  'data-hub-tutorial': dataHubTutorial,
  'data-pratus-context-id': dataPratusContextId,
  'data-pratus-context-label': dataPratusContextLabel,
}: WorkspaceSearchableTabMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }
    controlledOnOpenChange?.(nextOpen)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={isGlassMode ? 'outline' : isTriggerActive ? 'default' : 'outline'}
          className={cn(
            'h-8 gap-1',
            glassIconButtonClasses,
            selectedGlassTabClasses(isTriggerActive),
            triggerClassName
          )}
          aria-label={triggerAriaLabel}
          data-ics201-tutorial={dataIcs201Tutorial}
          data-hub-tutorial={dataHubTutorial}
          data-pratus-context-id={dataPratusContextId}
          data-pratus-context-label={dataPratusContextLabel}
        >
          <span className="max-w-[12rem] truncate">{triggerLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(92vw,28rem)] p-0">
        <Command key={open ? 'open' : 'closed'}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-80">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {groups.map((group, groupIndex) =>
              group.items.length === 0 ? null : (
                <div key={group.heading}>
                  {groupIndex > 0 ? <CommandSeparator /> : null}
                  <CommandGroup heading={group.heading}>
                    {group.items.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.value}
                        onSelect={() => {
                          item.onSelect()
                          setOpen(false)
                        }}
                        className={cn('gap-2 whitespace-normal', item.isSelected && 'bg-accent')}
                      >
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            item.isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="shrink-0">{item.icon ?? <span className="inline-block w-4" />}</span>
                        <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              )
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
