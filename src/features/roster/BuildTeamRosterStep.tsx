import { useCallback, useMemo, useState } from 'react'
import { Network, Table2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  AddWorkspaceMemberDialog,
  type AddWorkspaceMemberSubmitInput,
} from '@/features/roster/AddWorkspaceMemberDialog'
import { AddWorkspacePositionDialog } from '@/features/roster/AddWorkspacePositionDialog'
import {
  buildDraftPositionCatalog,
  buildDraftPositionSettings,
  buildDraftRosterMembers,
} from '@/features/roster/build-draft-position-catalog'
import {
  applyTemplateToBuildTeamDraft,
  setDraftEffectTiming,
} from '@/features/roster/roster-draft-state'
import { ROSTER_TEMPLATE_CATALOG } from '@/features/roster/roster-template-catalog'
import type {
  BuildTeamRosterDraft,
  RosterTemplateEffectTiming,
} from '@/features/roster/roster-template-types'
import { RosterAddMemberToolbar } from '@/features/roster/RosterAddMemberToolbar'
import { RosterDisplayFiltersMenu } from '@/features/roster/RosterDisplayFiltersMenu'
import { RosterZoomContainer } from '@/features/roster/RosterZoomContainer'
import { RosterZoomControls } from '@/features/roster/RosterZoomControls'
import {
  DEFAULT_ROSTER_DISPLAY_FILTERS,
  resolveVisibleRosterPositions,
  type RosterDisplayFilters,
} from '@/features/roster/roster-display-filters'
import { DEFAULT_ROSTER_ZOOM } from '@/features/roster/roster-zoom'
import { buildDynamicOrgChart } from '@/features/roster/build-dynamic-org-chart'
import { WorkspaceOrgChartRoster } from '@/features/roster/WorkspaceOrgChartRoster'
import { WorkspacePositionRosterTable } from '@/features/roster/WorkspacePositionRosterTable'
import {
  buildDefaultPositionPermissionMap,
  buildPositionRosterEntries,
} from '@/features/roster/workspace-position-roster'
import type { PositionRosterInviteSubmitResult } from '@/features/roster/position-roster-messages'
import type { WorkspacePositionType } from '@/features/roster/workspace-position-type'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'

type BuildTeamRosterStepProps = {
  workspaceLabel: string
  draft: BuildTeamRosterDraft
  onDraftChange: (draft: BuildTeamRosterDraft) => void
  glassItemBorderClasses?: string
}

export function BuildTeamRosterStep({
  workspaceLabel,
  draft,
  onDraftChange,
  glassItemBorderClasses = 'border-border/60',
}: BuildTeamRosterStepProps) {
  const [rosterViewMode, setRosterViewMode] = useState<'table' | 'org-chart'>('table')
  const [rosterDisplayFilters, setRosterDisplayFilters] = useState<RosterDisplayFilters>(
    DEFAULT_ROSTER_DISPLAY_FILTERS
  )
  const [rosterZoomLevel, setRosterZoomLevel] = useState(DEFAULT_ROSTER_ZOOM)
  const [rosterRecenterToken, setRosterRecenterToken] = useState(0)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false)
  const [memberPositionPreset, setMemberPositionPreset] = useState<string | null>(null)

  const catalog = useMemo(() => buildDraftPositionCatalog(draft), [draft])
  const rosterMembers = useMemo(() => buildDraftRosterMembers(draft), [draft])
  const positionSettings = useMemo(() => buildDraftPositionSettings(draft), [draft])
  const permissions = useMemo(() => buildDefaultPositionPermissionMap(catalog), [catalog])

  const positionRosterEntries = useMemo(
    () =>
      buildPositionRosterEntries(
        rosterMembers,
        permissions,
        positionSettings,
        '',
        catalog,
        {},
        {},
        {},
        {},
        {}
      ),
    [catalog, permissions, positionSettings, rosterMembers]
  )

  const visibleRosterPositions = useMemo(
    () => resolveVisibleRosterPositions(positionRosterEntries, rosterDisplayFilters, catalog),
    [catalog, positionRosterEntries, rosterDisplayFilters]
  )

  const positionRosterEntriesByPosition = useMemo(
    () => Object.fromEntries(positionRosterEntries.map((entry) => [entry.position, entry])),
    [positionRosterEntries]
  )

  const orgChartLayout = useMemo(
    () => buildDynamicOrgChart(catalog, [], rosterMembers),
    [catalog, rosterMembers]
  )

  const handleTemplateChange = useCallback(
    (templateSlug: string) => {
      const preserveUserEdits =
        draft.customPositions.length > 0 || draft.draftMembers.length > 0
      if (
        preserveUserEdits &&
        !window.confirm(
          'Changing the roster template will reset structure to the template defaults. Custom positions and draft members will be kept.'
        )
      ) {
        return
      }
      onDraftChange(applyTemplateToBuildTeamDraft(draft, templateSlug, preserveUserEdits))
    },
    [draft, onDraftChange]
  )

  const handleEffectTimingChange = useCallback(
    (value: RosterTemplateEffectTiming) => {
      onDraftChange(setDraftEffectTiming(draft, value))
    },
    [draft, onDraftChange]
  )

  const handleAddMemberSubmit = useCallback(
    async (input: AddWorkspaceMemberSubmitInput): Promise<PositionRosterInviteSubmitResult> => {
      onDraftChange({
        ...draft,
        draftMembers: [
          ...draft.draftMembers,
          {
            id: `draft-member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            email: input.email.trim(),
            assignmentKind: input.assignmentKind,
            icsPositions: input.icsPositions,
            orgChartReportsTo:
              input.assignmentKind === 'single_resource' ? input.orgChartReportsTo : null,
            password: input.password,
            personSource: input.personSource,
            existingUserId: input.existingUserId,
          },
        ],
      })
      return 'success'
    },
    [draft, onDraftChange]
  )

  const handleCreateCustomPosition = useCallback(
    async (
      name: string,
      reportsTo: string,
      _createOnOpAdvance: boolean,
      positionType: WorkspacePositionType,
      customTypeLabel: string | null
    ) => {
      onDraftChange({
        ...draft,
        customPositions: [
          ...draft.customPositions,
          {
            id: `draft-custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: name.trim(),
            reportsTo,
            positionType,
            customTypeLabel,
          },
        ],
        positionSettings: {
          ...draft.positionSettings,
          [name.trim()]: {
            positionType,
            customTypeLabel,
            allowWorkAssignment: false,
          },
        },
      })
    },
    [draft, onDraftChange]
  )

  const handlePositionTypeChange = useCallback(
    (
      position: string,
      positionType: WorkspacePositionType | null,
      customTypeLabel: string | null
    ) => {
      onDraftChange({
        ...draft,
        positionSettings: {
          ...draft.positionSettings,
          [position]: {
            allowWorkAssignment: draft.positionSettings[position]?.allowWorkAssignment ?? true,
            positionType,
            customTypeLabel,
          },
        },
      })
    },
    [draft, onDraftChange]
  )

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="build-team-roster-template">Roster template</Label>
          <Select value={draft.templateSlug} onValueChange={handleTemplateChange}>
            <SelectTrigger id="build-team-roster-template">
              <SelectValue placeholder="Select roster template" />
            </SelectTrigger>
            <SelectContent>
              {ROSTER_TEMPLATE_CATALOG.map((template) => (
                <SelectItem key={template.slug} value={template.slug}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            {
              ROSTER_TEMPLATE_CATALOG.find((template) => template.slug === draft.templateSlug)
                ?.description
            }
          </p>
        </div>
        <div className="grid gap-2">
          <Label>Roster takes effect</Label>
          <RadioGroup
            value={draft.effectTiming}
            onValueChange={(value) =>
              handleEffectTimingChange(value as RosterTemplateEffectTiming)
            }
            className="grid gap-2"
          >
            <label className="flex items-start gap-2 rounded-md border p-2 text-xs">
              <RadioGroupItem value="immediate" className="mt-0.5" />
              <span>
                <span className="font-medium">Immediately when workspace is created</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Roster structure and people added here will be active when the workspace opens.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-md border p-2 text-xs">
              <RadioGroupItem value="op_period_1" className="mt-0.5" />
              <span>
                <span className="font-medium">At start of Operational Period 1</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Workspace opens with Incident Commander only until OP 1 starts; invites are still
                  sent on create.
                </span>
              </span>
            </label>
          </RadioGroup>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="outline" className="text-[10px] font-normal">
          {draft.draftMembers.length} draft invite{draft.draftMembers.length === 1 ? '' : 's'}
        </Badge>
        <div className="flex flex-wrap items-center gap-2">
          <RosterDisplayFiltersMenu filters={rosterDisplayFilters} onChange={setRosterDisplayFilters} />
          <RosterZoomControls zoom={rosterZoomLevel} onZoomChange={setRosterZoomLevel} />
          <ToggleGroup
            type="single"
            value={rosterViewMode}
            onValueChange={(value) => {
              if (value === 'table' || value === 'org-chart') {
                setRosterViewMode(value)
              }
            }}
            variant="outline"
            size="sm"
            aria-label="Roster view"
          >
            <ToggleGroupItem value="table" className="gap-1.5 px-2.5 text-xs">
              <Table2 className="h-3.5 w-3.5" />
              Table
            </ToggleGroupItem>
            <ToggleGroupItem value="org-chart" className="gap-1.5 px-2.5 text-xs">
              <Network className="h-3.5 w-3.5" />
              Org Chart
            </ToggleGroupItem>
          </ToggleGroup>
          <RosterAddMemberToolbar
            canManageRoster
            onAddMember={() => {
              setMemberPositionPreset(null)
              setIsAddMemberOpen(true)
            }}
            onAddPosition={() => setIsAddPositionOpen(true)}
          />
        </div>
      </div>

      <RosterZoomContainer
        zoom={rosterZoomLevel}
        onZoomChange={setRosterZoomLevel}
        centerScroll={rosterViewMode === 'org-chart'}
        recenterToken={rosterRecenterToken}
        className="max-h-[28rem] min-h-[20rem] rounded-md border"
      >
        {rosterViewMode === 'org-chart' ? (
          <WorkspaceOrgChartRoster
            orgChartLayout={orgChartLayout}
            entriesByPosition={positionRosterEntriesByPosition}
            assetsByKey={{}}
            rosterById={Object.fromEntries(rosterMembers.map((member) => [member.id, member]))}
            visiblePositions={visibleRosterPositions}
            displayFilters={rosterDisplayFilters}
            assignableByPosition={{}}
            scheduleAssignableByPosition={{}}
            scheduleUnassignableByPosition={{}}
            canManageRoster
            glassItemBorderClasses={glassItemBorderClasses}
            isUpdatingPermission={null}
            isAssigningPosition={null}
            workspaceLabel={workspaceLabel}
            layoutMode="compact"
            showOpAdvanceLabels={false}
            positionMetaByName={catalog.positionMetaByName}
            onToggleEditIcs201={() => undefined}
            onAssignExistingMember={() => undefined}
            onScheduleAssignMember={() => undefined}
            onScheduleUnassignMember={() => undefined}
            onRemoveScheduledAssign={() => undefined}
            onRemoveScheduledUnassign={() => undefined}
            onInviteToPosition={(position) => {
              setMemberPositionPreset(position)
              setIsAddMemberOpen(true)
            }}
            onUnassignMember={() => undefined}
            onPositionTypeChange={handlePositionTypeChange}
          />
        ) : (
          <WorkspacePositionRosterTable
            entries={positionRosterEntries}
            displayFilters={rosterDisplayFilters}
            positionCatalog={catalog}
            assignableByPosition={{}}
            scheduleAssignableByPosition={{}}
            scheduleUnassignableByPosition={{}}
            canManageRoster
            glassItemBorderClasses={glassItemBorderClasses}
            isUpdatingPermission={null}
            isAssigningPosition={null}
            showOpAdvanceLabels={false}
            positionMetaByName={catalog.positionMetaByName}
            onToggleEditIcs201={() => undefined}
            onPositionTypeChange={handlePositionTypeChange}
            onAssignExistingMember={() => undefined}
            onScheduleAssignMember={() => undefined}
            onScheduleUnassignMember={() => undefined}
            onRemoveScheduledAssign={() => undefined}
            onRemoveScheduledUnassign={() => undefined}
            onInviteToPosition={(position) => {
              setMemberPositionPreset(position)
              setIsAddMemberOpen(true)
            }}
            onUnassignMember={() => undefined}
          />
        )}
      </RosterZoomContainer>

      <AddWorkspaceMemberDialog
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        workspaceLabel={workspaceLabel}
        isSupabaseEnabled={false}
        operationalPeriodsEnabled={false}
        catalog={catalog}
        positionPreset={memberPositionPreset}
        isSubmitting={false}
        onSearchExistingPeople={async (): Promise<OrgMemberSearchResult[]> => []}
        onSubmit={handleAddMemberSubmit}
      />
      <AddWorkspacePositionDialog
        open={isAddPositionOpen}
        onOpenChange={setIsAddPositionOpen}
        catalog={catalog}
        onSubmit={handleCreateCustomPosition}
      />
    </div>
  )
}
