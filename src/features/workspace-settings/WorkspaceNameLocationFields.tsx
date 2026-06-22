import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Item, ItemDescription } from '@/components/ui/item'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  INCIDENT_CATEGORY_OPTIONS,
  INCIDENT_TEMPLATE_OPTIONS,
  INCIDENT_WORKFLOW_OPTIONS,
} from '@/features/workspace-settings/constants'
import type { WorkspaceNameLocationDraft } from '@/features/workspace-settings/types'
import {
  DEFAULT_INCIDENT_COMPLEXITY,
  getIncidentComplexityOptionsForWorkflow,
  normalizeIncidentComplexityForWorkflow,
} from '@/lib/workspace-format'

type FemaAorOption = {
  id: string
  name: string
}

type EventListOption = {
  id: number
  name: string
}

type WorkspaceNameLocationFieldsProps = {
  kind: 'incident' | 'exercise'
  draft: WorkspaceNameLocationDraft
  onDraftChange: (draft: WorkspaceNameLocationDraft) => void
  eventList: EventListOption[]
  femaAors: FemaAorOption[]
  canEdit: boolean
  isDrawingOnPrimaryMap?: boolean
  onRestartMapDraw?: () => void
}

export function WorkspaceNameLocationFields({
  kind,
  draft,
  onDraftChange,
  eventList,
  femaAors,
  canEdit,
  isDrawingOnPrimaryMap = false,
  onRestartMapDraw,
}: WorkspaceNameLocationFieldsProps) {
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null)

  const complexityOptions = useMemo(
    () => getIncidentComplexityOptionsForWorkflow(draft.workflow),
    [draft.workflow]
  )

  const patchDraft = (patch: Partial<WorkspaceNameLocationDraft>) => {
    onDraftChange({ ...draft, ...patch })
  }

  const handleWorkflowChange = (workflow: string) => {
    patchDraft({
      workflow,
      incidentComplexity: normalizeIncidentComplexityForWorkflow(
        workflow,
        draft.incidentComplexity || DEFAULT_INCIDENT_COMPLEXITY
      ),
    })
  }

  const isMapDrawMethod =
    draft.locationMethod === 'draw-point' || draft.locationMethod === 'draw-polygon'

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="workspace-settings-name">Name</Label>
        <Input
          id="workspace-settings-name"
          value={draft.name}
          disabled={!canEdit}
          onChange={(event) => patchDraft({ name: event.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="workspace-settings-category">Category</Label>
        <NativeSelect
          id="workspace-settings-category"
          value={draft.category}
          disabled={!canEdit}
          onChange={(event) => patchDraft({ category: event.target.value })}
          className="w-full"
        >
          <NativeSelectOption value="">Select category</NativeSelectOption>
          {INCIDENT_CATEGORY_OPTIONS.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {option}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {kind === 'incident' && (
        <div className="grid gap-2">
          <Label htmlFor="workspace-settings-related-events">Related Events</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id="workspace-settings-related-events"
                type="button"
                variant="outline"
                disabled={!canEdit}
                className="w-full justify-between font-normal"
              >
                <span className="truncate text-left">
                  {draft.relatedEventIds.length > 0
                    ? eventList
                        .filter((event) => draft.relatedEventIds.includes(event.id))
                        .map((event) => event.name)
                        .join(', ')
                    : 'Select related events'}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              {eventList.map((event) => (
                <DropdownMenuItem
                  key={event.id}
                  className="pr-2"
                  onSelect={(selectEvent) => {
                    selectEvent.preventDefault()
                    if (!canEdit) return
                    patchDraft({
                      relatedEventIds: draft.relatedEventIds.includes(event.id)
                        ? draft.relatedEventIds.filter((id) => id !== event.id)
                        : [...draft.relatedEventIds, event.id],
                    })
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={draft.relatedEventIds.includes(event.id)}
                      className="pointer-events-none"
                      aria-hidden="true"
                    />
                    <span>{event.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="workspace-settings-workflow">Workspace Format</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id="workspace-settings-workflow"
              type="button"
              variant="outline"
              disabled={!canEdit}
              className="w-full justify-between font-normal"
            >
              <span className="truncate text-left">
                {INCIDENT_WORKFLOW_OPTIONS.find((option) => option.value === draft.workflow)
                  ?.label ?? 'Select workspace format'}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {INCIDENT_WORKFLOW_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => handleWorkflowChange(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="workspace-settings-complexity">Incident Complexity</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id="workspace-settings-complexity"
              type="button"
              variant="outline"
              disabled={!canEdit}
              className="w-full justify-between font-normal"
              data-uscg-tutorial="incident-complexity"
            >
              <span className="truncate text-left">
                {complexityOptions.find((option) => option.value === draft.incidentComplexity)
                  ?.label ?? 'Select complexity'}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {complexityOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => patchDraft({ incidentComplexity: option.value })}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="workspace-settings-template">Select Template</Label>
        <RadioGroup
          id="workspace-settings-template"
          value={draft.templateId}
          disabled={!canEdit}
          onValueChange={(value) => patchDraft({ templateId: value })}
          className="gap-2"
        >
          {INCIDENT_TEMPLATE_OPTIONS.map((template) => {
            const isPreviewOpen = previewTemplateId === template.id
            return (
              <div key={template.id} className="rounded-md border p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      id={`workspace-settings-template-${template.id}`}
                      value={template.id}
                      disabled={!canEdit}
                    />
                    <Label
                      htmlFor={`workspace-settings-template-${template.id}`}
                      className="cursor-pointer"
                    >
                      {template.label}
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPreviewTemplateId((previous) =>
                        previous === template.id ? null : template.id
                      )
                    }
                  >
                    {isPreviewOpen ? 'Hide Preview' : 'Preview Template'}
                  </Button>
                </div>
                {isPreviewOpen && (
                  <div className="mt-2 space-y-1">
                    {template.previewItems.map((previewItem) => (
                      <Item key={`${template.id}-${previewItem}`} variant="muted" size="sm">
                        <ItemDescription className="text-xs text-foreground">
                          {previewItem}
                        </ItemDescription>
                      </Item>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </RadioGroup>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="workspace-settings-start-time">Start Time</Label>
        <Input
          id="workspace-settings-start-time"
          type="datetime-local"
          value={draft.startTime}
          disabled={!canEdit}
          onChange={(event) => patchDraft({ startTime: event.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="workspace-settings-location-method">Location</Label>
        <NativeSelect
          id="workspace-settings-location-method"
          value={draft.locationMethod}
          disabled={!canEdit}
          onChange={(event) =>
            patchDraft({
              locationMethod: event.target.value as WorkspaceNameLocationDraft['locationMethod'],
            })
          }
          className="w-full"
        >
          <NativeSelectOption value="">Select location method</NativeSelectOption>
          <NativeSelectOption value="draw-point">Draw Point</NativeSelectOption>
          <NativeSelectOption value="draw-polygon">Draw Polygon</NativeSelectOption>
          <NativeSelectOption value="enter-coordinates">Enter Coordinates</NativeSelectOption>
          <NativeSelectOption value="enter-address">Enter Address</NativeSelectOption>
        </NativeSelect>

        {isMapDrawMethod && (
          <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            {isDrawingOnPrimaryMap ? (
              draft.locationMethod === 'draw-point' ? (
                <span>Click on the main map to place a point.</span>
              ) : (
                <span>Click on the main map to start a polygon and double-click to finish.</span>
              )
            ) : (
              <span>Select a draw method to update location on the main map.</span>
            )}
          </div>
        )}

        {draft.locationMethod === 'enter-coordinates' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label htmlFor="workspace-settings-latitude" className="text-xs">
                Latitude
              </Label>
              <Input
                id="workspace-settings-latitude"
                type="number"
                step="any"
                disabled={!canEdit}
                value={draft.latitude}
                onChange={(event) => patchDraft({ latitude: event.target.value })}
                placeholder="39.8283"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="workspace-settings-longitude" className="text-xs">
                Longitude
              </Label>
              <Input
                id="workspace-settings-longitude"
                type="number"
                step="any"
                disabled={!canEdit}
                value={draft.longitude}
                onChange={(event) => patchDraft({ longitude: event.target.value })}
                placeholder="-98.5795"
              />
            </div>
          </div>
        )}

        {draft.locationMethod === 'enter-address' && (
          <Input
            value={draft.address}
            disabled={!canEdit}
            onChange={(event) => patchDraft({ address: event.target.value })}
            placeholder="Street address, city, state"
          />
        )}

        {draft.geometrySummary && isMapDrawMethod && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{draft.geometrySummary}</p>
            {canEdit && onRestartMapDraw && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={onRestartMapDraw}
              >
                Edit on map
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="workspace-settings-aors">AORs</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id="workspace-settings-aors"
              type="button"
              variant="outline"
              disabled={!canEdit}
              className="w-full justify-between font-normal"
            >
              <span className="truncate text-left">
                {draft.aors.length > 0 ? draft.aors.join(', ') : 'Select AORs'}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
            {femaAors.map((aor) => (
              <DropdownMenuItem
                key={aor.id}
                className="pr-2"
                onSelect={(event) => {
                  event.preventDefault()
                  if (!canEdit) return
                  patchDraft({
                    aors: draft.aors.includes(aor.name)
                      ? draft.aors.filter((item) => item !== aor.name)
                      : [...draft.aors, aor.name],
                  })
                }}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={draft.aors.includes(aor.name)}
                    className="pointer-events-none"
                    aria-hidden="true"
                  />
                  <span>{aor.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
