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
  ICS201_HAZMAT_15_SUBLABELS,
  ICS201_HAZMAT_PRODUCT_COLUMN_LABELS,
} from '../field-labels'
import {
  ICS201_HAZMAT_CLASSIFICATION_OPTIONS,
  ICS201_HAZMAT_POTENTIAL_HAZARD_OPTIONS,
  ICS201_HAZMAT_PROCEDURE_OPTIONS,
} from '../form-options'
import type {
  Ics201CollaboratorPresence,
  Ics201HazmatAssessmentBox15,
  Ics201HazmatClassificationId,
  Ics201HazmatPotentialHazardId,
  Ics201HazmatProcedureId,
  Ics201HazmatProductRow,
} from '../types'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import type { Ics201SectionCursorApi } from '@/hooks/useIcs201AllSectionCursors'
import { cn } from '@/lib/utils'
import { Ics201BoxHeader } from './Ics201BoxHeader'
import { Ics201SectionEditActions } from './Ics201SectionEditActions'

type ProductTextField = Exclude<keyof Ics201HazmatProductRow, 'id'>

const PRODUCT_FIELDS = Object.keys(ICS201_HAZMAT_PRODUCT_COLUMN_LABELS) as ProductTextField[]

type Ics201HazmatAssessmentSectionProps = {
  className?: string
  canEdit: boolean
  isEditing: boolean
  onBeginEdit: () => void
  onCancel: () => void
  onSave: () => void
  onGenerate?: () => void
  involvesHazmat: boolean | null
  hazmatAssessmentBox15: Ics201HazmatAssessmentBox15
  draft: Ics201HazmatAssessmentBox15
  onDraftChange: (draft: Ics201HazmatAssessmentBox15) => void
  editors?: Ics201CollaboratorPresence[]
  cursor: Ics201SectionCursorApi
  sectionAriaLabel?: string
}

function formatYesNoNull(value: boolean | null) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return 'Not answered'
}

function YesNoRadioGroup({
  name,
  value,
  disabled,
  onChange,
}: {
  name: string
  value: boolean | null
  disabled: boolean
  onChange: (value: boolean | null) => void
}) {
  if (disabled) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs">
        {formatYesNoNull(value)}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {[
        { value: true, label: 'Yes' },
        { value: false, label: 'No' },
      ].map((option) => (
        <label key={`${name}-${String(option.value)}`} className="flex items-center gap-2 text-xs">
          <input
            type="radio"
            name={name}
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

export function Ics201HazmatAssessmentSection({
  className,
  canEdit,
  isEditing,
  onBeginEdit,
  onCancel,
  onSave,
  onGenerate,
  involvesHazmat,
  hazmatAssessmentBox15,
  draft,
  onDraftChange,
  editors = [],
  cursor,
  sectionAriaLabel = ICS201_BOX_LABELS.hazmatAssessment,
}: Ics201HazmatAssessmentSectionProps) {
  const data = isEditing ? draft : hazmatAssessmentBox15
  const hazmatActive = involvesHazmat === true

  const updateClassification = (id: Ics201HazmatClassificationId, checked: boolean) => {
    onDraftChange({
      ...draft,
      classification: { ...draft.classification, [id]: checked },
    })
  }

  const updatePotentialHazard = (id: Ics201HazmatPotentialHazardId, checked: boolean) => {
    onDraftChange({
      ...draft,
      potentialHazards: { ...draft.potentialHazards, [id]: checked },
    })
  }

  const updateProcedure = (id: Ics201HazmatProcedureId, checked: boolean) => {
    onDraftChange({
      ...draft,
      requiredProcedures: { ...draft.requiredProcedures, [id]: checked },
    })
  }

  const updateProductField = (id: number, field: ProductTextField, value: string) => {
    onDraftChange({
      ...draft,
      products: draft.products.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    })
  }

  const assessmentBody = (
    <div className="space-y-4">
      <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_HAZMAT_15_SUBLABELS.A}
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ICS201_HAZMAT_CLASSIFICATION_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={cn(
                'flex items-start gap-2 rounded-md border border-border/60 px-2.5 py-2 text-xs',
                isEditing ? 'cursor-pointer bg-background' : 'bg-muted/20'
              )}
            >
              <Checkbox
                checked={data.classification[option.id]}
                disabled={!isEditing}
                className="mt-0.5"
                onCheckedChange={(checked) => updateClassification(option.id, checked === true)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_HAZMAT_15_SUBLABELS.B}
        </Label>
        <div className="overflow-x-auto">
          <div className="min-w-[56rem] space-y-2">
            <div className="grid grid-cols-10 gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {PRODUCT_FIELDS.map((field) => (
                <span key={field}>{ICS201_HAZMAT_PRODUCT_COLUMN_LABELS[field]}</span>
              ))}
            </div>
            {data.products.map((product) => (
              <div key={product.id} className="grid grid-cols-10 gap-2">
                {PRODUCT_FIELDS.map((field) =>
                  isEditing ? (
                    <Ics201RemoteFieldCarets
                      key={`${product.id}-${field}`}
                      fieldKey={`hazmatAssessmentBox15.products:${product.id}.${field}`}
                      value={product[field]}
                      cursors={cursor.remoteCursors}
                      publish={cursor.publishCursor}
                      clear={cursor.clearCursor}
                      placeholder={ICS201_HAZMAT_PRODUCT_COLUMN_LABELS[field]}
                      inputClassName="h-7"
                      onChange={(event) =>
                        updateProductField(product.id, field, event.target.value)
                      }
                    />
                  ) : (
                    <Ics201RemoteFieldCaretsView
                      key={`${product.id}-${field}`}
                      fieldKey={`hazmatAssessmentBox15.products:${product.id}.${field}`}
                      value={product[field]}
                      cursors={cursor.remoteCursors}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_HAZMAT_15_SUBLABELS.C}
        </Label>
        <div className="space-y-2">
          {ICS201_HAZMAT_POTENTIAL_HAZARD_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={cn(
                'flex items-start gap-2 rounded-md border border-border/60 px-2.5 py-2 text-xs',
                isEditing ? 'cursor-pointer bg-background' : 'bg-muted/20'
              )}
            >
              <Checkbox
                checked={data.potentialHazards[option.id]}
                disabled={!isEditing}
                className="mt-0.5"
                onCheckedChange={(checked) => updatePotentialHazard(option.id, checked === true)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_HAZMAT_15_SUBLABELS.D}
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ICS201_HAZMAT_PROCEDURE_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={cn(
                'flex items-start gap-2 rounded-md border border-border/60 px-2.5 py-2 text-xs',
                isEditing ? 'cursor-pointer bg-background' : 'bg-muted/20'
              )}
            >
              <Checkbox
                checked={data.requiredProcedures[option.id]}
                disabled={!isEditing}
                className="mt-0.5"
                onCheckedChange={(checked) => updateProcedure(option.id, checked === true)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_HAZMAT_15_SUBLABELS.E}
        </Label>
        <YesNoRadioGroup
          name="hazmatAssessmentBox15.airMonitoringRequired"
          value={data.airMonitoringRequired}
          disabled={!isEditing}
          onChange={(value) => onDraftChange({ ...draft, airMonitoringRequired: value })}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_HAZMAT_15_SUBLABELS.F}
        </Label>
        {isEditing ? (
          <Ics201RemoteTextareaCarets
            fieldKey="hazmatAssessmentBox15.sopAndSafeWorkPractices"
            value={draft.sopAndSafeWorkPractices}
            cursors={cursor.remoteCursors}
            publish={cursor.publishCursor}
            clear={cursor.clearCursor}
            placeholder="SOP and safe work practices"
            onChange={(event) =>
              onDraftChange({ ...draft, sopAndSafeWorkPractices: event.target.value })
            }
          />
        ) : (
          <Ics201RemoteTextareaCaretsView
            fieldKey="hazmatAssessmentBox15.sopAndSafeWorkPractices"
            value={data.sopAndSafeWorkPractices}
            cursors={cursor.remoteCursors}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_HAZMAT_15_SUBLABELS.G}
        </Label>
        {isEditing ? (
          <Ics201RemoteTextareaCarets
            fieldKey="hazmatAssessmentBox15.decontaminationProcedures"
            value={draft.decontaminationProcedures}
            cursors={cursor.remoteCursors}
            publish={cursor.publishCursor}
            clear={cursor.clearCursor}
            placeholder="Decontamination procedures"
            onChange={(event) =>
              onDraftChange({ ...draft, decontaminationProcedures: event.target.value })
            }
          />
        ) : (
          <Ics201RemoteTextareaCaretsView
            fieldKey="hazmatAssessmentBox15.decontaminationProcedures"
            value={data.decontaminationProcedures}
            cursors={cursor.remoteCursors}
          />
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_HAZMAT_15_SUBLABELS.H}
        </Label>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">
              Medical Monitoring Required
            </Label>
            <YesNoRadioGroup
              name="hazmatAssessmentBox15.medicalMonitoringRequired"
              value={data.medicalMonitoringRequired}
              disabled={!isEditing}
              onChange={(value) => onDraftChange({ ...draft, medicalMonitoringRequired: value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">
              Medical Treatment / Transport in Place
            </Label>
            <YesNoRadioGroup
              name="hazmatAssessmentBox15.medicalTreatmentTransportInPlace"
              value={data.medicalTreatmentTransportInPlace}
              disabled={!isEditing}
              onChange={(value) =>
                onDraftChange({ ...draft, medicalTreatmentTransportInPlace: value })
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground">
          {ICS201_HAZMAT_15_SUBLABELS.I}
        </Label>
        {isEditing ? (
          <Ics201RemoteTextareaCarets
            fieldKey="hazmatAssessmentBox15.emergencyProcedures"
            value={draft.emergencyProcedures}
            cursors={cursor.remoteCursors}
            publish={cursor.publishCursor}
            clear={cursor.clearCursor}
            placeholder="Emergency procedures"
            onChange={(event) =>
              onDraftChange({ ...draft, emergencyProcedures: event.target.value })
            }
          />
        ) : (
          <Ics201RemoteTextareaCaretsView
            fieldKey="hazmatAssessmentBox15.emergencyProcedures"
            value={data.emergencyProcedures}
            cursors={cursor.remoteCursors}
          />
        )}
      </div>
    </div>
  )

  return (
    <Item variant="outline" className={cn('flex-col items-stretch p-0', className)}>
      <div className="px-3 py-2.5">
        <ItemContent className="space-y-3">
          <Ics201BoxHeader
            title={ICS201_BOX_LABELS.hazmatAssessment}
            editors={<Ics201SectionEditorBadges editors={editors} />}
            actions={
              canEdit && !isEditing && hazmatActive ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Edit HAZMAT assessment"
                  onClick={onBeginEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ) : null
            }
          />

          {!hazmatActive ? (
            <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-3 text-xs text-muted-foreground">
              {involvesHazmat === false
                ? 'Box 13.F indicates this incident does not involve hazardous materials. Complete Box 13.F as Yes to enable HAZMAT assessment.'
                : 'Complete Box 13.F (Does the Incident involve Hazardous Materials?) as Yes to enable this section.'}
            </div>
          ) : isEditing ? (
            <>
              {assessmentBody}
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
              {assessmentBody}
            </IcsEditableSectionContent>
          )}
        </ItemContent>
      </div>
    </Item>
  )
}
