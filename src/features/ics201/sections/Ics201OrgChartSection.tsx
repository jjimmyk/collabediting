import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Item, ItemContent } from '@/components/ui/item'
import { Label } from '@/components/ui/label'
import { Ics201FieldFocusIndicators } from '@/features/ics201/Ics201FieldFocusIndicators'
import {
  Ics201RemoteFieldCarets,
  Ics201RemoteFieldCaretsView,
} from '@/features/ics201/Ics201RemoteFieldCarets'
import { Ics201SectionEditorBadges } from '@/features/ics201/Ics201SectionEditorBadges'
import { ICS201_BOX_LABELS } from '../field-labels'
import type { Ics201CollaboratorPresence, Ics201FormState } from '../types'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import type { Ics201SectionCursorApi } from '@/hooks/useIcs201AllSectionCursors'
import { cn } from '@/lib/utils'
import { Ics201BoxHeader } from './Ics201BoxHeader'
import { Ics201SectionEditActions } from './Ics201SectionEditActions'

type Ics201OrgChart = Ics201FormState['orgChart']

type Ics201OrgChartSectionProps = {
  className?: string
  canEdit: boolean
  isEditing: boolean
  onBeginEdit: () => void
  onCancel: () => void
  onSave: () => void
  onGenerate?: () => void
  orgChart: Ics201OrgChart
  draft: Ics201OrgChart
  onDraftChange: (draft: Ics201OrgChart) => void
  editors?: Ics201CollaboratorPresence[]
  cursor: Ics201SectionCursorApi
  sectionAriaLabel?: string
}

const OFFICER_FIELDS = [
  { field: 'safetyOfficer' as const, label: 'Safety Officer' },
  { field: 'liaisonOfficer' as const, label: 'Liaison Officer' },
  { field: 'publicInformationOfficer' as const, label: 'Public Information Officer' },
]

const SECTION_CHIEF_FIELDS = [
  { field: 'operationsSectionChief' as const, label: 'Operations Section Chief' },
  { field: 'planningSectionChief' as const, label: 'Planning Section Chief' },
  { field: 'logisticsSectionChief' as const, label: 'Logistics Section Chief' },
  { field: 'financeSectionChief' as const, label: 'Finance Section Chief' },
  { field: 'intelInvestSectionChief' as const, label: 'Intel / Invest Section Chief' },
]

const COMMAND_LINE_LABELS = [
  'Incident Commander (Line 1)',
  'Command (Line 2)',
  'Command (Line 3)',
  'Command (Line 4)',
  'Command (Line 5)',
]

export function Ics201OrgChartSection({
  className,
  canEdit,
  isEditing,
  onBeginEdit,
  onCancel,
  onSave,
  onGenerate,
  orgChart,
  draft,
  onDraftChange,
  editors = [],
  cursor,
  sectionAriaLabel = ICS201_BOX_LABELS.orgChart,
}: Ics201OrgChartSectionProps) {
  const data = isEditing ? draft : orgChart

  const updateCommandName = (index: number, value: string) => {
    const commandNames = [...draft.commandNames]
    commandNames[index] = value
    onDraftChange({ ...draft, commandNames })
  }

  const updateField = <K extends keyof Ics201OrgChart>(field: K, value: Ics201OrgChart[K]) => {
    onDraftChange({ ...draft, [field]: value })
  }

  const renderTextField = (
    fieldKey: string,
    value: string,
    placeholder: string,
    editing: boolean,
    onChange?: (value: string) => void
  ) => {
    if (editing && onChange) {
      return (
        <Ics201RemoteFieldCarets
          fieldKey={fieldKey}
          value={value}
          cursors={cursor.remoteCursors}
          publish={cursor.publishCursor}
          clear={cursor.clearCursor}
          placeholder={placeholder}
          inputClassName="h-7"
          onChange={(event) => onChange(event.target.value)}
        />
      )
    }

    return (
      <Ics201RemoteFieldCaretsView
        fieldKey={fieldKey}
        value={value}
        cursors={cursor.remoteCursors}
      />
    )
  }

  const body = (
    <div className="space-y-4">
      <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">Command</Label>
        <div className="space-y-2">
          {COMMAND_LINE_LABELS.map((label, index) => (
            <div key={`command-${index}`} className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
              {renderTextField(
                `orgChart.commandNames.${index}`,
                data.commandNames[index] ?? '',
                label,
                isEditing,
                isEditing ? (value) => updateCommandName(index, value) : undefined
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">Staff Officers</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {OFFICER_FIELDS.map(({ field, label }) => (
            <div key={field} className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
              {renderTextField(
                `orgChart.${field}`,
                data[field],
                label,
                isEditing,
                isEditing ? (value) => updateField(field, value) : undefined
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">Section Chiefs</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SECTION_CHIEF_FIELDS.map(({ field, label }) => (
            <div key={field} className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
              {renderTextField(
                `orgChart.${field}`,
                data[field],
                label,
                isEditing,
                isEditing ? (value) => updateField(field, value) : undefined
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <Item variant="outline" className={cn('flex-col items-stretch p-0', className)}>
      <div className="px-3 py-2.5">
        <ItemContent className="space-y-2">
          <Ics201BoxHeader
            title={ICS201_BOX_LABELS.orgChart}
            editors={<Ics201SectionEditorBadges editors={editors} />}
            actions={
              canEdit && !isEditing ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Edit organization chart"
                  onClick={onBeginEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ) : null
            }
          />

          {isEditing ? (
            <>
              {body}
              <Ics201SectionEditActions
                isEditing={isEditing}
                onGenerate={onGenerate}
                onCancel={onCancel}
                onSave={onSave}
              />
            </>
          ) : (
            <IcsEditableSectionContent
              enabled={canEdit && !isEditing}
              ariaLabel={`Edit ${sectionAriaLabel} section`}
              onStartEdit={onBeginEdit}
            >
              {body}
            </IcsEditableSectionContent>
          )}
        </ItemContent>
      </div>
    </Item>
  )
}
