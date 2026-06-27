import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  filterHaveLinkTargetOptions,
  groupHaveLinkTargetOptions,
  Ics215HaveRosterRefPickRow,
  isAssetHaveLinkOption,
  isRosterHaveLinkOption,
} from '@/features/ics215/Ics215HaveRosterRefPickRow'
import { useHaveLinkSelection } from '@/features/ics215/Ics215HaveCell'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'

export type Ics204RosterResourceAddDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  haveLinkTargetOptions: WorkAssignmentTargetOption[]
  excludedRefKeys: Set<string>
  onConfirm: (selectedRefs: string[]) => void
}

export function Ics204RosterResourceAddDialog({
  open,
  onOpenChange,
  haveLinkTargetOptions,
  excludedRefKeys,
  onConfirm,
}: Ics204RosterResourceAddDialogProps) {
  const [filterQuery, setFilterQuery] = useState('')

  const availableOptions = useMemo(
    () => haveLinkTargetOptions.filter((option) => !excludedRefKeys.has(option.value)),
    [excludedRefKeys, haveLinkTargetOptions]
  )

  const assetOptions = useMemo(
    () => availableOptions.filter(isAssetHaveLinkOption),
    [availableOptions]
  )
  const rosterOptions = useMemo(
    () => availableOptions.filter(isRosterHaveLinkOption),
    [availableOptions]
  )

  const [selectedRefs, toggleRef, setRefs] = useHaveLinkSelection([], [])

  const wasOpenRef = useRef(open)
  useEffect(() => {
    if (wasOpenRef.current && !open) {
      setFilterQuery('')
      setRefs([])
    }
    wasOpenRef.current = open
  }, [open, setRefs])

  const filteredRosterOptions = filterHaveLinkTargetOptions(rosterOptions, filterQuery)
  const filteredAssetOptions = filterHaveLinkTargetOptions(assetOptions, filterQuery)
  const rosterGroups = groupHaveLinkTargetOptions(filteredRosterOptions)
  const assetGroups = groupHaveLinkTargetOptions(filteredAssetOptions)
  const selectedRefList = useMemo(() => [...selectedRefs], [selectedRefs])

  const handleConfirm = () => {
    if (selectedRefList.length === 0) return
    onConfirm(selectedRefList)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add roster resource</DialogTitle>
          <DialogDescription>
            Add positions, members, assets, or resource categories to Resources Assigned. These
            entries are managed on this ICS-204 only and do not update ICS-215 Have links.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={filterQuery}
          onChange={(event) => setFilterQuery(event.target.value)}
          placeholder="Filter roster or assets..."
          className="h-8 text-xs"
        />
        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
          {rosterGroups.map((group) =>
            group.options.length === 0 ? null : (
              <div key={group.group} className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.group}
                </p>
                <div className="space-y-2">
                  {group.options.map((option) => (
                    <Ics215HaveRosterRefPickRow
                      key={option.value}
                      option={option}
                      checked={selectedRefs.has(option.value)}
                      onToggle={() => toggleRef(option.value)}
                    />
                  ))}
                </div>
              </div>
            )
          )}
          {assetGroups.map((group) =>
            group.options.length === 0 ? null : (
              <div key={group.group} className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.group}
                </p>
                <div className="space-y-2">
                  {group.options.map((option) => (
                    <Ics215HaveRosterRefPickRow
                      key={option.value}
                      option={option}
                      checked={selectedRefs.has(option.value)}
                      onToggle={() => toggleRef(option.value)}
                    />
                  ))}
                </div>
              </div>
            )
          )}
          {filteredRosterOptions.length === 0 && filteredAssetOptions.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No matching roster items available.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={selectedRefList.length === 0} onClick={handleConfirm}>
            Add {selectedRefList.length > 0 ? `(${selectedRefList.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
