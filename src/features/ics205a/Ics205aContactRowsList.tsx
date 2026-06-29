import { useState } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Item, ItemActions, ItemContent } from '@/components/ui/item'
import { Ics202ReadOnlyField } from '@/features/ics202/Ics202SectionToolbar'
import {
  Ics205aContactRowFields,
  formatIcs205aContactRowSummary,
} from '@/features/ics205a/Ics205aContactRowFields'
import { resolveIcs205aContactDisplayLabels } from '@/features/ics205a/ics205a-contact-row-options'
import type { Ics205aContactRowOptionsInput } from '@/features/ics205a/ics205a-contact-row-options'
import type { Ics205aContactRow } from '@/features/ics205a/types'
import { cn } from '@/lib/utils'

type Ics205aContactRowsListProps = {
  formId: string
  contactRows: Ics205aContactRow[]
  editingContacts: boolean
  glassItemBorderClasses: string
  optionsInput: Ics205aContactRowOptionsInput
  onPatchRow: (rowId: number, patch: Partial<Ics205aContactRow>) => void
  onDeleteRow: (rowId: number) => void
}

export function Ics205aContactRowsList({
  formId,
  contactRows,
  editingContacts,
  glassItemBorderClasses,
  optionsInput,
  onPatchRow,
  onDeleteRow,
}: Ics205aContactRowsListProps) {
  const [expandedContactKey, setExpandedContactKey] = useState<string | null>(null)

  if (contactRows.length === 0) {
    return <p className="text-xs text-muted-foreground">No contacts recorded.</p>
  }

  return (
    <div className="space-y-2">
      {contactRows.map((row, index) => {
        const contactKey = `${formId}-${row.id}`
        const isOpen = expandedContactKey === contactKey
        const positionLabel = resolveIcs205aContactDisplayLabels(row, optionsInput).assignedPosition

        return (
          <Item
            key={row.id}
            variant="outline"
            className={cn(
              'relative min-w-0 w-full max-w-full flex-col items-stretch overflow-hidden p-0 [contain:layout]',
              glassItemBorderClasses
            )}
          >
            <Collapsible
              open={isOpen}
              onOpenChange={(open) => setExpandedContactKey(open ? contactKey : null)}
            >
              <div className="relative px-3 py-2.5 pr-16">
                <ItemContent className="min-w-0">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Contact {index + 1}
                    {positionLabel.trim() ? ` · ${positionLabel}` : ''}
                  </p>
                  {!isOpen ? (
                    <Ics202ReadOnlyField value={formatIcs205aContactRowSummary(row, optionsInput)} />
                  ) : null}
                </ItemContent>
                <ItemActions className="absolute right-3 top-1/2 flex w-16 -translate-y-1/2 justify-end gap-0">
                  {editingContacts ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete contact"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDeleteRow(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Toggle contact details"
                    >
                      <ChevronDown
                        className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </ItemActions>
              </div>
              <CollapsibleContent>
                <div className="min-w-0 max-w-full border-t px-3 py-2.5 pr-6">
                  <Ics205aContactRowFields
                    row={row}
                    canEdit={editingContacts}
                    optionsInput={optionsInput}
                    onChange={(patch) => onPatchRow(row.id, patch)}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Item>
        )
      })}
    </div>
  )
}
