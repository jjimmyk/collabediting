import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OrgChartReportsToField } from '@/features/roster/OrgChartReportsToField'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import {
  resolvePositionReportsTo,
  validateCustomPositionName,
  validateReportsToPosition,
  type WorkspacePositionCatalog,
  type WorkspacePositionMeta,
} from '@/features/roster/workspace-positions'

type PositionIdentitySectionProps = {
  entry: PositionRosterEntry
  catalog: WorkspacePositionCatalog
  positionMeta?: WorkspacePositionMeta
  canManageRoster: boolean
  isSaving?: boolean
  hideTitle?: boolean
  onSaveCustomPosition?: (input: {
    positionId: string
    currentName: string
    name?: string
    reportsTo?: string
  }) => void | Promise<void>
}

export function PositionIdentitySection({
  entry,
  catalog,
  positionMeta,
  canManageRoster,
  isSaving = false,
  hideTitle = false,
  onSaveCustomPosition,
}: PositionIdentitySectionProps) {
  const isCustom = entry.isCustom ?? positionMeta?.source === 'custom'
  const positionId = positionMeta?.customPositionId
  const reportsTo = resolvePositionReportsTo(entry.position, catalog)
  const canEditName = isCustom && canManageRoster && Boolean(positionId)
  const canEditReportsTo = isCustom && canManageRoster && Boolean(positionId) && Boolean(onSaveCustomPosition)

  const [nameDraft, setNameDraft] = useState(entry.position)
  const [reportsToDraft, setReportsToDraft] = useState(reportsTo ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setNameDraft(entry.position)
    setReportsToDraft(reportsTo ?? '')
    setError(null)
  }, [entry.position, reportsTo])

  const hasChanges = useMemo(() => {
    const nameChanged = nameDraft.trim() !== entry.position
    const reportsToChanged = reportsToDraft !== (reportsTo ?? '')
    return nameChanged || reportsToChanged
  }, [entry.position, nameDraft, reportsTo, reportsToDraft])

  const handleSave = async () => {
    if (!positionId || !onSaveCustomPosition) return

    const trimmedName = nameDraft.trim()
    const nameChanged = trimmedName !== entry.position
    const reportsToChanged = reportsToDraft !== (reportsTo ?? '')

    if (!nameChanged && !reportsToChanged) {
      return
    }

    if (nameChanged) {
      const nameError = validateCustomPositionName(trimmedName, catalog, positionId)
      if (nameError) {
        setError(nameError)
        return
      }
    }

    if (reportsToChanged || nameChanged) {
      const reportsToError = validateReportsToPosition(
        reportsToDraft,
        catalog,
        nameChanged ? trimmedName : entry.position
      )
      if (reportsToError) {
        setError(reportsToError)
        return
      }
    }

    setError(null)
    await onSaveCustomPosition({
      positionId,
      currentName: entry.position,
      ...(nameChanged ? { name: trimmedName } : {}),
      ...(reportsToChanged ? { reportsTo: reportsToDraft } : {}),
    })
  }

  return (
    <div className="space-y-2 rounded-md border bg-muted/20 px-2.5 py-2">
      {!hideTitle ? (
        <div className="space-y-1">
          {canEditName ? (
            <div className="space-y-1">
              <Label htmlFor={`position-name-${entry.position}`} className="text-xs">
                Position name
              </Label>
              <Input
                id={`position-name-${entry.position}`}
                value={nameDraft}
                disabled={isSaving}
                className="h-8 text-sm"
                onChange={(event) => setNameDraft(event.target.value)}
              />
            </div>
          ) : (
            <p className="text-sm font-medium">{entry.position}</p>
          )}
        </div>
      ) : canEditName ? (
        <div className="space-y-1">
          <Label htmlFor={`position-name-panel-${entry.position}`} className="text-xs">
            Position name
          </Label>
          <Input
            id={`position-name-panel-${entry.position}`}
            value={nameDraft}
            disabled={isSaving}
            className="h-8 text-sm"
            onChange={(event) => setNameDraft(event.target.value)}
          />
        </div>
      ) : null}

      <OrgChartReportsToField
        id={`position-reports-to-${entry.position}`}
        value={canEditReportsTo ? reportsToDraft : reportsTo}
        catalog={catalog}
        editable={canEditReportsTo}
        disabled={isSaving}
        onValueChange={canEditReportsTo ? setReportsToDraft : undefined}
      />

      {canEditReportsTo && hasChanges ? (
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            className="h-7 px-2 text-[11px]"
            disabled={isSaving}
            onClick={() => {
              void handleSave()
            }}
          >
            {isSaving ? 'Saving…' : 'Save position changes'}
          </Button>
          {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
        </div>
      ) : error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : null}
    </div>
  )
}
