import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Item, ItemContent } from '@/components/ui/item'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Ics201FieldFocusIndicators } from '@/features/ics201/Ics201FieldFocusIndicators'
import {
  Ics201RemoteFieldCarets,
  Ics201RemoteFieldCaretsView,
  Ics201RemoteTextareaCarets,
  Ics201RemoteTextareaCaretsView,
} from '@/features/ics201/Ics201RemoteFieldCarets'
import { Ics201SectionEditorBadges } from '@/features/ics201/Ics201SectionEditorBadges'
import {
  ICS201_BOX_LABELS,
  ICS201_SAFETY_13_SUBLABELS,
  ICS201_WEATHER_FIELD_LABELS,
} from '../field-labels'
import {
  ICS201_KNOWN_HAZARD_GROUPS,
  ICS201_PPE_OPTIONS,
} from '../form-options'
import type {
  Ics201CollaboratorPresence,
  Ics201KnownHazardId,
  Ics201PpeId,
  Ics201SafetyAnalysisBox13,
  Ics201WeatherConditions,
} from '../types'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import type { Ics201SectionCursorApi } from '@/hooks/useIcs201AllSectionCursors'
import { cn } from '@/lib/utils'
import { Ics201BoxHeader } from './Ics201BoxHeader'
import { Ics201SectionEditActions } from './Ics201SectionEditActions'

type Ics201SafetyAnalysisSectionProps = {
  className?: string
  canEdit: boolean
  isEditing: boolean
  onBeginEdit: () => void
  onCancel: () => void
  onSave: () => void
  onGenerate?: () => void
  safetyAnalysisBox13: Ics201SafetyAnalysisBox13
  draft: Ics201SafetyAnalysisBox13
  onDraftChange: (draft: Ics201SafetyAnalysisBox13) => void
  editors?: Ics201CollaboratorPresence[]
  cursor: Ics201SectionCursorApi
  sectionAriaLabel?: string
}

const WEATHER_FIELDS = Object.keys(ICS201_WEATHER_FIELD_LABELS) as Array<
  keyof Ics201WeatherConditions
>

function formatHazmatAnswer(value: boolean | null) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return 'Not answered'
}

function HazmatRadioGroup({
  value,
  disabled,
  onChange,
}: {
  value: boolean | null
  disabled: boolean
  onChange: (value: boolean | null) => void
}) {
  const options: Array<{ value: boolean | null; label: string }> = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ]

  if (disabled) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs">
        {formatHazmatAnswer(value)}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {options.map((option) => (
        <label key={String(option.value)} className="flex items-center gap-2 text-xs">
          <input
            type="radio"
            name="safetyAnalysisBox13.involvesHazmat"
            checked={value === option.value}
            className="h-3.5 w-3.5"
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

export function Ics201SafetyAnalysisSection({
  className,
  canEdit,
  isEditing,
  onBeginEdit,
  onCancel,
  onSave,
  onGenerate,
  safetyAnalysisBox13,
  draft,
  onDraftChange,
  editors = [],
  cursor,
  sectionAriaLabel = ICS201_BOX_LABELS.safetyAnalysis,
}: Ics201SafetyAnalysisSectionProps) {
  const data = isEditing ? draft : safetyAnalysisBox13

  const updateKnownHazard = (id: Ics201KnownHazardId, checked: boolean) => {
    onDraftChange({
      ...draft,
      knownHazards: { ...draft.knownHazards, [id]: checked },
    })
  }

  const updatePpe = (id: Ics201PpeId, checked: boolean) => {
    onDraftChange({
      ...draft,
      requiredPpe: { ...draft.requiredPpe, [id]: checked },
    })
  }

  const updateWeather = (field: keyof Ics201WeatherConditions, value: string) => {
    onDraftChange({
      ...draft,
      weather: { ...draft.weather, [field]: value },
    })
  }

  const body = (
    <div className="space-y-4">
      <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_SAFETY_13_SUBLABELS.A}
        </Label>
        {isEditing ? (
          <Ics201RemoteFieldCarets
            fieldKey="safetyAnalysisBox13.safetyOfficer"
            value={draft.safetyOfficer}
            cursors={cursor.remoteCursors}
            publish={cursor.publishCursor}
            clear={cursor.clearCursor}
            placeholder="Safety Officer"
            inputClassName="h-7"
            onChange={(event) =>
              onDraftChange({ ...draft, safetyOfficer: event.target.value })
            }
          />
        ) : (
          <Ics201RemoteFieldCaretsView
            fieldKey="safetyAnalysisBox13.safetyOfficer"
            value={data.safetyOfficer}
            cursors={cursor.remoteCursors}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_SAFETY_13_SUBLABELS.B}
        </Label>
        <div className="space-y-3">
          {ICS201_KNOWN_HAZARD_GROUPS.map((group) => (
            <div key={group.group} className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground">{group.group}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {group.options.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      'flex items-start gap-2 rounded-md border border-border/60 px-2.5 py-2 text-xs',
                      isEditing ? 'cursor-pointer bg-background' : 'bg-muted/20'
                    )}
                  >
                    <Checkbox
                      checked={data.knownHazards[option.id]}
                      disabled={!isEditing}
                      className="mt-0.5"
                      onCheckedChange={(checked) =>
                        updateKnownHazard(option.id, checked === true)
                      }
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_SAFETY_13_SUBLABELS.C}
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WEATHER_FIELDS.map((field) => (
            <div key={field} className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                {ICS201_WEATHER_FIELD_LABELS[field]}
              </Label>
              {isEditing ? (
                <Ics201RemoteFieldCarets
                  fieldKey={`safetyAnalysisBox13.weather.${field}`}
                  value={draft.weather[field]}
                  cursors={cursor.remoteCursors}
                  publish={cursor.publishCursor}
                  clear={cursor.clearCursor}
                  placeholder={ICS201_WEATHER_FIELD_LABELS[field]}
                  inputClassName="h-7"
                  onChange={(event) => updateWeather(field, event.target.value)}
                />
              ) : (
                <Ics201RemoteFieldCaretsView
                  fieldKey={`safetyAnalysisBox13.weather.${field}`}
                  value={data.weather[field]}
                  cursors={cursor.remoteCursors}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_SAFETY_13_SUBLABELS.D}
        </Label>
        {isEditing ? (
          <Ics201RemoteTextareaCarets
            fieldKey="safetyAnalysisBox13.safetyNotes"
            value={draft.safetyNotes}
            cursors={cursor.remoteCursors}
            publish={cursor.publishCursor}
            clear={cursor.clearCursor}
            placeholder="Safety notes"
            onChange={(event) =>
              onDraftChange({ ...draft, safetyNotes: event.target.value })
            }
          />
        ) : (
          <Ics201RemoteTextareaCaretsView
            fieldKey="safetyAnalysisBox13.safetyNotes"
            value={data.safetyNotes}
            cursors={cursor.remoteCursors}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_SAFETY_13_SUBLABELS.E}
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ICS201_PPE_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={cn(
                'flex items-start gap-2 rounded-md border border-border/60 px-2.5 py-2 text-xs',
                isEditing ? 'cursor-pointer bg-background' : 'bg-muted/20'
              )}
            >
              <Checkbox
                checked={data.requiredPpe[option.id]}
                disabled={!isEditing}
                className="mt-0.5"
                onCheckedChange={(checked) => updatePpe(option.id, checked === true)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">PPE Notes</Label>
          {isEditing ? (
            <Textarea
              value={draft.ppeNotes}
              className="min-h-16 text-xs"
              placeholder="Additional PPE notes"
              onChange={(event) => onDraftChange({ ...draft, ppeNotes: event.target.value })}
            />
          ) : (
            <div className="min-h-16 whitespace-pre-wrap rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs">
              {data.ppeNotes.trim().length > 0 ? (
                data.ppeNotes
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_SAFETY_13_SUBLABELS.F}
        </Label>
        <HazmatRadioGroup
          value={data.involvesHazmat}
          disabled={!isEditing}
          onChange={(value) => onDraftChange({ ...draft, involvesHazmat: value })}
        />
      </div>
    </div>
  )

  return (
    <Item variant="outline" className={cn('flex-col items-stretch p-0', className)}>
      <div className="px-3 py-2.5">
        <ItemContent className="space-y-3">
          <Ics201BoxHeader
            title={ICS201_BOX_LABELS.safetyAnalysis}
            editors={<Ics201SectionEditorBadges editors={editors} />}
            actions={
              canEdit && !isEditing ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Edit safety analysis"
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
