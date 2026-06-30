import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Network, Table2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import { defaultAllowWorkAssignment } from '@/lib/workspace-position-settings'
import {
  applyTemplateToBuildTeamDraft,
  hasNonCreatorBuildTeamDraftEdits,
  updateDraftCustomPosition,
} from '@/features/roster/roster-draft-state'
import { ROSTER_TEMPLATE_CATALOG } from '@/features/roster/roster-template-catalog'
import type { BuildTeamRosterDraft } from '@/features/roster/roster-template-types'
import { RosterAddMemberToolbar } from '@/features/roster/RosterAddMemberToolbar'
import { RosterDisplayFiltersMenu } from '@/features/roster/RosterDisplayFiltersMenu'
import { RosterZoomContainer } from '@/features/roster/RosterZoomContainer'
import { RosterZoomControls } from '@/features/roster/RosterZoomControls'
import {
  DEFAULT_ROSTER_DISPLAY_FILTERS,
  resolveVisibleRosterPositions,
  type RosterDisplayFilters,
} from '@/features/roster/roster-display-filters'
import { DEFAULT_ROSTER_ZOOM, computeFitToScreenZoom } from '@/features/roster/roster-zoom'
import { HWCG_SOURCE_CONTROL_TEMPLATE_SLUG } from '@/features/roster/hwcg-source-control-roster-template'
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
import { CREATE_ACTIVATION_PORTAL_Z_CLASS } from '@/lib/create-activation-navigation'
import { cn } from '@/lib/utils'

type BuildTeamRosterStepProps = {
  workspaceLabel: string
  draft: BuildTeamRosterDraft
  onDraftChange: (draft: BuildTeamRosterDraft) => void
  glassItemBorderClasses?: string
  layout?: 'page' | 'compact'
}

export function BuildTeamRosterStep({
  workspaceLabel,
  draft,
  onDraftChange,
  glassItemBorderClasses = 'border-border/60',
  layout = 'page',
}: BuildTeamRosterStepProps) {
  const isPageLayout = layout === 'page'
  const [rosterViewMode, setRosterViewMode] = useState<'table' | 'org-chart'>('table')
  const [rosterDisplayFilters, setRosterDisplayFilters] = useState<RosterDisplayFilters>(
    DEFAULT_ROSTER_DISPLAY_FILTERS
  )
  const [rosterZoomLevel, setRosterZoomLevel] = useState(DEFAULT_ROSTER_ZOOM)
  const [rosterRecenterToken, setRosterRecenterToken] = useState(0)
  const zoomContainerRef = useRef<HTMLDivElement>(null)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false)
  const [memberPositionPreset, setMemberPositionPreset] = useState<string | null>(null)
  const [draftCompetencyOptions, setDraftCompetencyOptions] = useState<string[]>([])

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
    () => buildDynamicOrgChart(catalog, [], rosterMembers, { templateSlug: draft.templateSlug }),
    [catalog, rosterMembers, draft.templateSlug]
  )

  const fitOrgChartToScreen = useCallback(() => {
    const container = zoomContainerRef.current
    if (!container) return

    const content =
      container.querySelector<HTMLElement>('[data-org-chart-wide-root]') ??
      container.querySelector<HTMLElement>('[data-roster-zoom-content]')
    if (!content) return

    setRosterZoomLevel(computeFitToScreenZoom(container, content))
    setRosterRecenterToken((token) => token + 1)
  }, [])

  const showHwcgOrgChartFit =
    rosterViewMode === 'org-chart' && draft.templateSlug === HWCG_SOURCE_CONTROL_TEMPLATE_SLUG

  useLayoutEffect(() => {
    if (!showHwcgOrgChartFit) return

    let cancelled = false
    const runFit = () => {
      if (!cancelled) fitOrgChartToScreen()
    }
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(runFit)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [showHwcgOrgChartFit, fitOrgChartToScreen, orgChartLayout])

  const handleTemplateChange = useCallback(
    (templateSlug: string) => {
      const preserveUserEdits = hasNonCreatorBuildTeamDraftEdits(draft)
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
            competencyFunction: null,
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
      const allowWorkAssignment = defaultAllowWorkAssignment(name.trim(), buildDraftPositionCatalog(draft), {
        reportsTo,
      })
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
            allowWorkAssignment,
          },
        },
      })
    },
    [draft, onDraftChange]
  )

  const handleSaveCustomPosition = useCallback(
    async (input: {
      positionId: string
      currentName: string
      name?: string
      reportsTo?: string
    }) => {
      onDraftChange(updateDraftCustomPosition(draft, input.positionId, input))
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
            allowWorkAssignment:
              draft.positionSettings[position]?.allowWorkAssignment ??
              defaultAllowWorkAssignment(position, buildDraftPositionCatalog(draft)),
            positionType,
            customTypeLabel,
          },
        },
      })
    },
    [draft, onDraftChange]
  )

  const updateDraftMemberCompetency = useCallback(
    (memberId: string, value: string | null) => {
      onDraftChange({
        ...draft,
        draftMembers: draft.draftMembers.map((member) =>
          member.id === memberId ? { ...member, competencyFunction: value } : member
        ),
      })
      if (value) {
        setDraftCompetencyOptions((previous) =>
          [...new Set([...previous, value])].sort((a, b) => a.localeCompare(b))
        )
      }
    },
    [draft, onDraftChange]
  )

  const handleMemberCompetencyFunctionChange = useCallback(
    (input: { memberId: string; value: string | null }) => {
      updateDraftMemberCompetency(input.memberId, input.value)
    },
    [updateDraftMemberCompetency]
  )

  const handleSingleResourceCompetencyFunctionChange = useCallback(
    (memberId: string, value: string | null) => {
      updateDraftMemberCompetency(memberId, value)
    },
    [updateDraftMemberCompetency]
  )

  return (
    <div className={cn('gap-4', isPageLayout ? 'flex min-h-0 flex-1 flex-col' : 'grid')}>
      <div className="grid gap-2">
        <Label htmlFor="build-team-roster-template">Roster template</Label>
        <Select value={draft.templateSlug} onValueChange={handleTemplateChange}>
          <SelectTrigger id="build-team-roster-template" className="w-full">
            <SelectValue placeholder="Select roster template" />
          </SelectTrigger>
          <SelectContent className={CREATE_ACTIVATION_PORTAL_Z_CLASS} position="popper">
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="outline" className="text-[10px] font-normal">
          {draft.draftMembers.length} draft invite{draft.draftMembers.length === 1 ? '' : 's'}
        </Badge>
        <div className="flex flex-wrap items-center gap-2">
          <RosterDisplayFiltersMenu
            filters={rosterDisplayFilters}
            onChange={setRosterDisplayFilters}
            operationalPeriodsEnabled={false}
          />
          <RosterZoomControls
            zoom={rosterZoomLevel}
            onZoomChange={setRosterZoomLevel}
            onFit={rosterViewMode === 'org-chart' ? fitOrgChartToScreen : undefined}
          />
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
        ref={zoomContainerRef}
        zoom={rosterZoomLevel}
        onZoomChange={setRosterZoomLevel}
        centerScroll={rosterViewMode === 'org-chart'}
        recenterToken={rosterRecenterToken}
        className={cn(
          'rounded-md border',
          isPageLayout ? 'min-h-0 flex-1' : 'max-h-[28rem] min-h-[20rem]'
        )}
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
            layoutMode={isPageLayout ? 'wide' : 'compact'}
            orgChartTemplateSlug={draft.templateSlug}
            zoom={rosterZoomLevel}
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
            positionCatalog={catalog}
            onSaveCustomPosition={handleSaveCustomPosition}
            competencyOptions={draftCompetencyOptions}
            canEditCompetencyFunction
            onSingleResourceCompetencyFunctionChange={handleSingleResourceCompetencyFunctionChange}
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
            isUpdatingPositionIdentity={null}
            onSaveCustomPosition={handleSaveCustomPosition}
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
            competencyOptions={draftCompetencyOptions}
            canEditCompetencyFunction
            onMemberCompetencyFunctionChange={handleMemberCompetencyFunctionChange}
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
